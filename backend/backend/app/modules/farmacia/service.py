from datetime import datetime
from flask import g
from app.extensions import db
from app.modules.farmacia.models import Medicamento, Lote, Receta, DetalleReceta, MovimientoInventario
from app.modules.atencion.models import Consulta, AlergiaPaciente
from app.core.errors import NotFoundError, ConflictError, ValidationError


class MedicamentoService:

    @staticmethod
    def crear(dto) -> Medicamento:
        med = Medicamento(
            nombre_comercial=dto.nombre_comercial,
            principio_activo=dto.principio_activo,
            presentacion=dto.presentacion,
            requiere_receta=dto.requiere_receta,
            stock_minimo=dto.stock_minimo,
            activo=True,
        )
        db.session.add(med)
        db.session.commit()
        return med

    @staticmethod
    def listar(solo_activos: bool = True) -> list[Medicamento]:
        query = db.select(Medicamento)
        if solo_activos:
            query = query.where(Medicamento.activo == True)
        return db.session.execute(query.order_by(Medicamento.nombre_comercial)).scalars().all()

    @staticmethod
    def obtener(id_medicamento: int) -> Medicamento:
        med = db.session.get(Medicamento, id_medicamento)
        if not med:
            raise NotFoundError('Medicamento no encontrado')
        return med

    @staticmethod
    def actualizar(id_medicamento: int, dto) -> Medicamento:
        med = MedicamentoService.obtener(id_medicamento)
        for campo in ('nombre_comercial', 'presentacion', 'stock_minimo', 'requiere_receta', 'activo'):
            valor = getattr(dto, campo)
            if valor is not None:
                setattr(med, campo, valor)
        db.session.commit()
        return med

    @staticmethod
    def stock_bajo() -> list[Medicamento]:
        medicamentos = db.session.execute(
            db.select(Medicamento).where(Medicamento.activo == True)
        ).scalars().all()
        return [m for m in medicamentos if sum(l.cantidad_actual for l in m.lotes) <= m.stock_minimo]


class LoteService:

    @staticmethod
    def crear(id_medicamento: int, dto) -> Lote:
        MedicamentoService.obtener(id_medicamento)
        lote = Lote(
            id_medicamento=id_medicamento,
            numero_lote=dto.numero_lote,
            fecha_vencimiento=dto.fecha_vencimiento,
            cantidad_actual=dto.cantidad_actual,
            ubicacion=dto.ubicacion,
        )
        db.session.add(lote)
        db.session.flush()

        db.session.add(MovimientoInventario(
            id_lote=lote.id_lote,
            id_usuario=g.current_user.id_usuario,
            tipo='ENTRADA',
            cantidad=dto.cantidad_actual,
            fecha_hora=datetime.utcnow(),
            referencia='ingreso_lote',
        ))
        db.session.commit()
        return lote

    @staticmethod
    def listar(id_medicamento: int) -> list[Lote]:
        MedicamentoService.obtener(id_medicamento)
        return db.session.execute(
            db.select(Lote)
            .where(Lote.id_medicamento == id_medicamento)
            .order_by(Lote.fecha_vencimiento)
        ).scalars().all()


class RecetaService:

    @staticmethod
    def crear(dto) -> Receta:
        consulta = db.session.get(Consulta, dto.id_consulta)
        if not consulta:
            raise NotFoundError('Consulta no encontrada')

        RecetaService._verificar_alergias(consulta, dto.detalles)

        receta = Receta(
            id_consulta=dto.id_consulta,
            id_medico=g.current_user.id_personal,
            fecha_emision=datetime.utcnow(),
            estado='EMITIDA',
        )
        db.session.add(receta)
        db.session.flush()

        for d in dto.detalles:
            if not db.session.get(Medicamento, d.id_medicamento):
                raise NotFoundError(f'Medicamento {d.id_medicamento} no encontrado')
            db.session.add(DetalleReceta(
                id_receta=receta.id_receta,
                id_medicamento=d.id_medicamento,
                dosis=d.dosis,
                frecuencia=d.frecuencia,
                duracion=d.duracion,
                indicaciones=d.indicaciones,
                cantidad=d.cantidad,
            ))

        db.session.commit()
        return receta

    @staticmethod
    def obtener(id_receta: int) -> Receta:
        receta = db.session.get(Receta, id_receta)
        if not receta:
            raise NotFoundError('Receta no encontrada')
        return receta
    
    @staticmethod
    def listar(estado=None):
        from app.modules.farmacia.models import Receta
        query = Receta.query
        if estado:
            query = query.filter_by(estado=estado)
        return query.order_by(Receta.fecha_emision.desc()).all()

    @staticmethod
    def dispensar(id_receta: int, dto) -> Receta:
        receta = RecetaService.obtener(id_receta)

        if receta.estado in ('DISPENSADA', 'EXPIRADA'):
            raise ValidationError(f'La receta está en estado {receta.estado} y no puede dispensarse')

        for item in dto.items:
            detalle = db.session.get(DetalleReceta, item.id_detalle_receta)
            if not detalle or detalle.id_receta != id_receta:
                raise NotFoundError(f'Detalle {item.id_detalle_receta} no pertenece a esta receta')

            pendiente = detalle.cantidad - detalle.cantidad_entregada
            if item.cantidad_a_entregar > pendiente:
                raise ValidationError(
                    f'Cantidad solicitada ({item.cantidad_a_entregar}) supera el pendiente ({pendiente})'
                )

            lotes = db.session.execute(
                db.select(Lote).where(
                    Lote.id_medicamento == detalle.id_medicamento,
                    Lote.cantidad_actual > 0,
                    Lote.fecha_vencimiento >= datetime.utcnow().date(),
                ).order_by(Lote.fecha_vencimiento)
            ).scalars().all()

            disponible = sum(l.cantidad_actual for l in lotes)
            if disponible < item.cantidad_a_entregar:
                raise ConflictError(f'Stock insuficiente. Disponible: {disponible}')

            restante = item.cantidad_a_entregar
            for lote in lotes:
                if restante <= 0:
                    break
                a_tomar = min(lote.cantidad_actual, restante)
                lote.cantidad_actual -= a_tomar
                restante -= a_tomar
                db.session.add(MovimientoInventario(
                    id_lote=lote.id_lote,
                    id_usuario=g.current_user.id_usuario,
                    tipo='SALIDA',
                    cantidad=a_tomar,
                    fecha_hora=datetime.utcnow(),
                    referencia=f'receta:{id_receta}',
                ))

            detalle.cantidad_entregada += item.cantidad_a_entregar

        todo_entregado = all(d.cantidad_entregada >= d.cantidad for d in receta.detalles)
        receta.estado = 'DISPENSADA' if todo_entregado else 'PARCIAL'
        if todo_entregado:
            receta.fecha_dispensacion = datetime.utcnow()

        db.session.commit()
        return receta

    @staticmethod
    def _verificar_alergias(consulta, detalles) -> None:
        historia = consulta.historia
        if not historia:
            return

        principios = {
            db.session.get(Medicamento, d.id_medicamento).principio_activo.lower()
            for d in detalles
            if db.session.get(Medicamento, d.id_medicamento)
        }

        alergias_criticas = db.session.execute(
            db.select(AlergiaPaciente).where(
                AlergiaPaciente.id_historia == historia.id_historia,
                AlergiaPaciente.severidad == 'CRITICA',
            )
        ).scalars().all()

        for alergia in alergias_criticas:
            if alergia.principio_activo.lower() in principios:
                raise ValidationError(
                    f'ALERTA: El paciente tiene alergia CRÍTICA a "{alergia.principio_activo}". Receta bloqueada.'
                )


class InventarioService:

    @staticmethod
    def crear_movimiento(dto) -> MovimientoInventario:
        lote = db.session.get(Lote, dto.id_lote)
        if not lote:
            raise NotFoundError('Lote no encontrado')

        if dto.tipo == 'ENTRADA':
            lote.cantidad_actual += dto.cantidad
        elif dto.tipo in ('MERMA', 'AJUSTE'):
            if lote.cantidad_actual < dto.cantidad:
                raise ConflictError(f'Stock insuficiente. Disponible: {lote.cantidad_actual}')
            lote.cantidad_actual -= dto.cantidad

        mov = MovimientoInventario(
            id_lote=dto.id_lote,
            id_usuario=g.current_user.id_usuario,
            tipo=dto.tipo,
            cantidad=dto.cantidad,
            fecha_hora=datetime.utcnow(),
            referencia=dto.referencia,
        )
        db.session.add(mov)
        db.session.commit()
        return mov

    @staticmethod
    def listar(id_lote=None, tipo=None) -> list[MovimientoInventario]:
        query = db.select(MovimientoInventario)
        if id_lote:
            query = query.where(MovimientoInventario.id_lote == id_lote)
        if tipo:
            query = query.where(MovimientoInventario.tipo == tipo)
        return db.session.execute(query.order_by(MovimientoInventario.fecha_hora.desc())).scalars().all()
