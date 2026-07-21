from datetime import datetime, date
from flask import g
from app.extensions import db
from app.modules.atencion.models import HistoriaClinica, AlergiaPaciente, Consulta, Diagnostico, Internacion
from app.modules.pacientes.models import Paciente
from app.core.errors import NotFoundError, ConflictError


class HistoriaService:

    @staticmethod
    def obtener_o_crear(id_paciente: int) -> HistoriaClinica:
        paciente = db.session.get(Paciente, id_paciente)
        if not paciente or not paciente.activo:
            raise NotFoundError('Paciente no encontrado')

        historia = db.session.execute(
            db.select(HistoriaClinica).where(HistoriaClinica.id_paciente == id_paciente)
        ).scalar_one_or_none()

        if not historia:
            historia = HistoriaClinica(
                id_paciente=id_paciente,
                fecha_apertura=date.today(),
            )
            db.session.add(historia)
            db.session.flush()

        return historia

    @staticmethod
    def obtener(id_paciente: int) -> HistoriaClinica:
        historia = db.session.execute(
            db.select(HistoriaClinica).where(HistoriaClinica.id_paciente == id_paciente)
        ).scalar_one_or_none()
        if not historia:
            raise NotFoundError('Historia clínica no encontrada')
        return historia

    @staticmethod
    def actualizar(id_paciente: int, dto) -> HistoriaClinica:
        historia = HistoriaService.obtener(id_paciente)
        for campo in ('antecedentes', 'alergias', 'observaciones'):
            valor = getattr(dto, campo)
            if valor is not None:
                setattr(historia, campo, valor)
        db.session.commit()
        return historia


class AlergiaService:

    @staticmethod
    def listar(id_paciente: int) -> list[AlergiaPaciente]:
        historia = HistoriaService.obtener(id_paciente)
        return historia.alergias_registradas

    @staticmethod
    def crear(id_paciente: int, dto) -> AlergiaPaciente:
        historia = HistoriaService.obtener(id_paciente)

        existing = db.session.execute(
            db.select(AlergiaPaciente).where(
                AlergiaPaciente.id_historia == historia.id_historia,
                AlergiaPaciente.principio_activo == dto.principio_activo,
            )
        ).scalar_one_or_none()
        if existing:
            raise ConflictError(f'Ya existe alergia registrada para "{dto.principio_activo}"')

        alergia = AlergiaPaciente(
            id_historia=historia.id_historia,
            principio_activo=dto.principio_activo,
            severidad=dto.severidad,
            notas=dto.notas,
        )
        db.session.add(alergia)
        db.session.commit()
        return alergia

    @staticmethod
    def eliminar(id_paciente: int, id_alergia: int) -> None:
        historia = HistoriaService.obtener(id_paciente)
        alergia = db.session.get(AlergiaPaciente, id_alergia)
        if not alergia or alergia.id_historia != historia.id_historia:
            raise NotFoundError('Alergia no encontrada')
        db.session.delete(alergia)
        db.session.commit()


class ConsultaService:

    @staticmethod
    def crear(dto) -> Consulta:
        historia = HistoriaService.obtener_o_crear(dto.id_paciente)

        consulta = Consulta(
            id_historia=historia.id_historia,
            id_medico=g.current_user.id_personal,
            id_cita=dto.id_cita,
            fecha_hora=datetime.utcnow(),
            motivo=dto.motivo,
            tratamiento=dto.tratamiento,
            evolucion=dto.evolucion,
        )
        db.session.add(consulta)
        db.session.commit()
        return consulta

    @staticmethod
    def obtener(id_consulta: int) -> Consulta:
        consulta = db.session.get(Consulta, id_consulta)
        if not consulta:
            raise NotFoundError('Consulta no encontrada')
        return consulta

    @staticmethod
    def actualizar(id_consulta: int, dto) -> Consulta:
        consulta = ConsultaService.obtener(id_consulta)
        for campo in ('motivo', 'tratamiento', 'evolucion'):
            valor = getattr(dto, campo)
            if valor is not None:
                setattr(consulta, campo, valor)
        db.session.commit()
        return consulta


class DiagnosticoService:

    @staticmethod
    def crear(id_consulta: int, dto) -> Diagnostico:
        ConsultaService.obtener(id_consulta)
        diagnostico = Diagnostico(
            id_consulta=id_consulta,
            codigo_cie10=dto.codigo_cie10,
            descripcion=dto.descripcion,
            tipo=dto.tipo,
        )
        db.session.add(diagnostico)
        db.session.commit()
        return diagnostico

    @staticmethod
    def listar(id_consulta: int) -> list[Diagnostico]:
        ConsultaService.obtener(id_consulta)
        return db.session.execute(
            db.select(Diagnostico).where(Diagnostico.id_consulta == id_consulta)
        ).scalars().all()


class InternacionService:

    @staticmethod
    def crear(dto) -> Internacion:
        paciente = db.session.get(Paciente, dto.id_paciente)
        if not paciente or not paciente.activo:
            raise NotFoundError('Paciente no encontrado')

        if db.session.execute(
            db.select(Internacion).where(
                Internacion.id_paciente == dto.id_paciente,
                Internacion.fecha_alta.is_(None),
            )
        ).scalar_one_or_none():
            raise ConflictError('El paciente ya se encuentra internado')

        if db.session.execute(
            db.select(Internacion).where(
                Internacion.habitacion == dto.habitacion,
                Internacion.cama == dto.cama,
                Internacion.fecha_alta.is_(None),
            )
        ).scalar_one_or_none():
            raise ConflictError(f'La cama {dto.cama} en habitación {dto.habitacion} ya está ocupada')

        internacion = Internacion(
            id_paciente=dto.id_paciente,
            id_medico_tratante=g.current_user.id_personal,
            id_consulta_origen=dto.id_consulta_origen,
            fecha_ingreso=datetime.utcnow(),
            habitacion=dto.habitacion,
            cama=dto.cama,
            motivo_ingreso=dto.motivo_ingreso,
        )
        db.session.add(internacion)
        db.session.commit()
        return internacion

    @staticmethod
    def obtener(id_internacion: int) -> Internacion:
        internacion = db.session.get(Internacion, id_internacion)
        if not internacion:
            raise NotFoundError('Internación no encontrada')
        return internacion

    @staticmethod
    def dar_alta(id_internacion: int, dto) -> Internacion:
        internacion = InternacionService.obtener(id_internacion)
        if internacion.fecha_alta:
            raise ConflictError('El paciente ya fue dado de alta')
        internacion.fecha_alta = datetime.utcnow()
        internacion.motivo_alta = dto.motivo_alta
        db.session.commit()
        return internacion

    @staticmethod
    def listar(solo_activas: bool = True) -> list[Internacion]:
        query = db.select(Internacion)
        if solo_activas:
            query = query.where(Internacion.fecha_alta.is_(None))
        return db.session.execute(query.order_by(Internacion.fecha_ingreso.desc())).scalars().all()
