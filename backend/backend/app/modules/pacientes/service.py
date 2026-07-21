from app.extensions import db
from app.modules.pacientes.models import Paciente
from app.core.errors import NotFoundError, ConflictError


class PacienteService:

    @staticmethod
    def crear(dto) -> Paciente:
        if db.session.execute(
            db.select(Paciente).where(Paciente.ci == dto.ci)
        ).scalar_one_or_none():
            raise ConflictError(f'Ya existe un paciente con CI {dto.ci}')

        paciente = Paciente(
            ci=dto.ci,
            id_unico=PacienteService._generar_id_unico(),
            nombres=dto.nombres,
            apellidos=dto.apellidos,
            fecha_nacimiento=dto.fecha_nacimiento,
            direccion=dto.direccion,
            telefono=dto.telefono,
            email=dto.email,
            id_seguro=dto.id_seguro,
            activo=True,
        )
        db.session.add(paciente)
        db.session.commit()
        return paciente

    @staticmethod
    def obtener(id_paciente: int) -> Paciente:
        paciente = db.session.get(Paciente, id_paciente)
        if not paciente or not paciente.activo:
            raise NotFoundError('Paciente no encontrado')
        return paciente

    @staticmethod
    def listar(termino: str | None = None) -> list[Paciente]:
        query = db.select(Paciente).where(Paciente.activo == True)
        if termino:
            like = f'%{termino}%'
            query = query.where(
                db.or_(
                    Paciente.ci.ilike(like),
                    Paciente.nombres.ilike(like),
                    Paciente.apellidos.ilike(like),
                    Paciente.id_unico.ilike(like),
                )
            )
        query = query.order_by(Paciente.apellidos)
        return db.session.execute(query).scalars().all()

    @staticmethod
    def actualizar(id_paciente: int, dto) -> Paciente:
        paciente = PacienteService.obtener(id_paciente)

        for campo in ('nombres', 'apellidos', 'fecha_nacimiento',
                      'direccion', 'telefono', 'email', 'id_seguro'):
            valor = getattr(dto, campo)
            if valor is not None:
                setattr(paciente, campo, valor)

        db.session.commit()
        return paciente

    @staticmethod
    def eliminar(id_paciente: int) -> None:
        paciente = PacienteService.obtener(id_paciente)
        paciente.activo = False
        db.session.commit()

    @staticmethod
    def _generar_id_unico() -> str:
        ultimo = db.session.execute(
            db.select(db.func.max(Paciente.id_unico))
        ).scalar()
        numero = int(ultimo.split('-')[1]) + 1 if ultimo else 1
        return f'HUSA-{numero:06d}'
