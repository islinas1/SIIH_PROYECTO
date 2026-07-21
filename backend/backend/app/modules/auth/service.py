from datetime import datetime, timedelta
from flask import current_app
from flask_jwt_extended import create_access_token

from app.extensions import db
from app.modules.auth.models import Rol, Especialidad, Personal, Usuario
from app.core.security import verify_password, hash_password, validar_password
from app.core.errors import ValidationError, ForbiddenError, NotFoundError, ConflictError


class AuthService:

    @staticmethod
    def login(data):
        usuario = Usuario.query.filter_by(nombre_usuario=data.nombre_usuario).first()

        if not usuario:
            raise ValidationError('Credenciales inválidas')

        if usuario.bloqueado_hasta and usuario.bloqueado_hasta > datetime.utcnow():
            raise ForbiddenError('Cuenta bloqueada. Intente de nuevo en 15 minutos.')

        if not verify_password(data.password, usuario.hash_password):
            AuthService._registrar_intento_fallido(usuario)
            raise ValidationError('Credenciales inválidas')

        usuario.intentos_fallidos = 0
        usuario.bloqueado_hasta = None
        usuario.ultimo_acceso = datetime.utcnow()
        db.session.commit()

        token = create_access_token(identity=str(usuario.id_usuario))
        rol = AuthService._obtener_rol(usuario)

        return {
            'access_token': token,
            'tipo': 'Bearer',
            'nombre_usuario': usuario.nombre_usuario,
            'rol': rol,
        }

    @staticmethod
    def logout(user_id):
        usuario = db.session.get(Usuario, int(user_id))
        if not usuario:
            raise ValidationError('Usuario no encontrado')
        usuario.ultimo_logout = datetime.utcnow()
        db.session.commit()

    @staticmethod
    def crear_usuario_paciente(id_paciente: int, dto) -> Usuario:
        from app.modules.pacientes.models import Paciente

        paciente = db.session.get(Paciente, id_paciente)
        if not paciente or not paciente.activo:
            raise NotFoundError('Paciente no encontrado')

        if db.session.execute(
            db.select(Usuario).where(Usuario.id_paciente == id_paciente)
        ).scalar_one_or_none():
            raise ConflictError('Este paciente ya tiene una cuenta de usuario')

        AuthService._validar_usuario_unico(dto.nombre_usuario, dto.email)
        validar_password(dto.password)

        usuario = Usuario(
            id_paciente=id_paciente,
            nombre_usuario=dto.nombre_usuario,
            email=dto.email,
            hash_password=hash_password(dto.password),
            estado='ACTIVO',
        )
        db.session.add(usuario)
        db.session.commit()
        return usuario

    @staticmethod
    def listar_usuarios() -> list[Usuario]:
        return db.session.execute(
            db.select(Usuario).order_by(Usuario.created_at)
        ).scalars().all()

    @staticmethod
    def _validar_usuario_unico(nombre_usuario: str, email: str) -> None:
        if db.session.execute(
            db.select(Usuario).where(Usuario.nombre_usuario == nombre_usuario)
        ).scalar_one_or_none():
            raise ConflictError(f'El nombre de usuario "{nombre_usuario}" ya está en uso')

        if db.session.execute(
            db.select(Usuario).where(Usuario.email == email)
        ).scalar_one_or_none():
            raise ConflictError(f'El email "{email}" ya está en uso')

    @staticmethod
    def _registrar_intento_fallido(usuario):
        max_intentos = current_app.config['MAX_LOGIN_ATTEMPTS']
        minutos = current_app.config['LOCKOUT_MINUTES']

        usuario.intentos_fallidos += 1
        if usuario.intentos_fallidos >= max_intentos:
            usuario.bloqueado_hasta = datetime.utcnow() + timedelta(minutes=minutos)

        db.session.commit()

    @staticmethod
    def _obtener_rol(usuario):
        if usuario.id_personal and usuario.personal:
            return usuario.personal.rol.nombre
        if usuario.id_paciente:
            return 'paciente'
        return None


class PersonalService:

    @staticmethod
    def crear(dto) -> Personal:
        if db.session.execute(
            db.select(Personal).where(Personal.ci == dto.ci)
        ).scalar_one_or_none():
            raise ConflictError(f'Ya existe personal con CI {dto.ci}')

        if not db.session.get(Rol, dto.id_rol):
            raise NotFoundError('Rol no encontrado')

        if dto.id_especialidad and not db.session.get(Especialidad, dto.id_especialidad):
            raise NotFoundError('Especialidad no encontrada')

        AuthService._validar_usuario_unico(dto.nombre_usuario, dto.email)
        validar_password(dto.password)

        personal = Personal(
            ci=dto.ci,
            nombres=dto.nombres,
            apellidos=dto.apellidos,
            id_rol=dto.id_rol,
            id_especialidad=dto.id_especialidad,
            matricula=dto.matricula,
            telefono=dto.telefono,
            estado='ACTIVO',
        )
        db.session.add(personal)
        db.session.flush()

        db.session.add(Usuario(
            id_personal=personal.id_personal,
            nombre_usuario=dto.nombre_usuario,
            email=dto.email,
            hash_password=hash_password(dto.password),
            estado='ACTIVO',
        ))
        db.session.commit()
        return personal

    @staticmethod
    def listar() -> list[Personal]:
        return db.session.execute(
            db.select(Personal)
            .where(Personal.estado == 'ACTIVO')
            .order_by(Personal.apellidos)
        ).scalars().all()

    @staticmethod
    def obtener(id_personal: int) -> Personal:
        personal = db.session.get(Personal, id_personal)
        if not personal:
            raise NotFoundError('Personal no encontrado')
        return personal
