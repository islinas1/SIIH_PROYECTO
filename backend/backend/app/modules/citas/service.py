from datetime import datetime, timedelta
from flask import g
from app.extensions import db
from app.modules.citas.models import Cita, Triaje
from app.modules.auth.models import Personal
from app.modules.pacientes.models import Paciente
from app.core.errors import NotFoundError, ValidationError, ConflictError

NIVEL_COLOR = {1: 'rojo', 2: 'naranja', 3: 'amarillo', 4: 'verde', 5: 'azul'}


class CitaService:

    @staticmethod
    def crear(dto) -> Cita:
        if not db.session.get(Paciente, dto.id_paciente):
            raise NotFoundError('Paciente no encontrado')

        if dto.tipo_ingreso == 'CONSULTA_EXTERNA' and not dto.id_medico:
            raise ValidationError('La consulta externa requiere médico asignado')

        if dto.id_medico:
            if not db.session.get(Personal, dto.id_medico):
                raise NotFoundError('Médico no encontrado')
            CitaService._validar_disponibilidad(dto.id_medico, dto.fecha_hora)

        cita = Cita(
            id_paciente=dto.id_paciente,
            id_medico=dto.id_medico,
            fecha_hora=dto.fecha_hora,
            tipo_ingreso=dto.tipo_ingreso,
            canal_solicitud=dto.canal_solicitud,
            notas=dto.notas,
            estado='PROGRAMADA',
        )
        db.session.add(cita)
        db.session.commit()
        return cita

    @staticmethod
    def listar(id_paciente=None, id_medico=None, estado=None, fecha=None) -> list[Cita]:
        query = db.select(Cita)
        if id_paciente:
            query = query.where(Cita.id_paciente == id_paciente)
        if id_medico:
            query = query.where(Cita.id_medico == id_medico)
        if estado:
            query = query.where(Cita.estado == estado)
        if fecha:
            query = query.where(db.func.date(Cita.fecha_hora) == fecha)
        return db.session.execute(query.order_by(Cita.fecha_hora)).scalars().all()

    @staticmethod
    def obtener(id_cita: int) -> Cita:
        cita = db.session.get(Cita, id_cita)
        if not cita:
            raise NotFoundError('Cita no encontrada')
        return cita

    @staticmethod
    def actualizar(id_cita: int, dto) -> Cita:
        cita = CitaService.obtener(id_cita)
        if dto.estado is not None:
            cita.estado = dto.estado
        if dto.id_medico is not None:
            if not db.session.get(Personal, dto.id_medico):
                raise NotFoundError('Médico no encontrado')
            cita.id_medico = dto.id_medico
        if dto.notas is not None:
            cita.notas = dto.notas
        db.session.commit()
        return cita

    @staticmethod
    def _validar_disponibilidad(id_medico: int, fecha_hora: datetime) -> None:
        inicio = fecha_hora - timedelta(minutes=29)
        fin = fecha_hora + timedelta(minutes=29)
        conflicto = db.session.execute(
            db.select(Cita).where(
                Cita.id_medico == id_medico,
                Cita.fecha_hora.between(inicio, fin),
                Cita.estado.in_(['PROGRAMADA', 'CONFIRMADA']),
            )
        ).scalar_one_or_none()
        if conflicto:
            raise ConflictError('El médico ya tiene una cita en ese horario')


class TriajeService:

    @staticmethod
    def crear(id_cita: int, dto) -> Triaje:
        cita = CitaService.obtener(id_cita)
        triaje = Triaje(
            id_cita=id_cita,
            id_evaluador=g.current_user.id_personal,
            nivel=dto.nivel,
            color=NIVEL_COLOR[dto.nivel],
            sintomas=dto.sintomas,
            signos_vitales=dto.signos_vitales,
            fecha_hora=datetime.utcnow(),
        )
        db.session.add(triaje)
        cita.estado = 'EN_TRIAJE'
        db.session.commit()
        return triaje

    @staticmethod
    def obtener_ultimo(id_cita: int) -> Triaje:
        CitaService.obtener(id_cita)
        triaje = db.session.execute(
            db.select(Triaje)
            .where(Triaje.id_cita == id_cita)
            .order_by(Triaje.fecha_hora.desc())
        ).scalar_one_or_none()
        if not triaje:
            raise NotFoundError('No hay triaje registrado para esta cita')
        return triaje
