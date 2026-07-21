from dataclasses import dataclass
from marshmallow import Schema, fields, post_load, validate


# ── Login ──────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class LoginRequest:
    nombre_usuario: str
    password: str


class LoginRequestSchema(Schema):
    nombre_usuario = fields.Str(required=True, validate=validate.Length(min=1))
    password = fields.Str(required=True, validate=validate.Length(min=1))

    @post_load
    def make_dto(self, data, **kwargs):
        return LoginRequest(**data)


class TokenResponseSchema(Schema):
    access_token = fields.Str()
    tipo = fields.Str()
    nombre_usuario = fields.Str()
    rol = fields.Str()


# ── Usuario para paciente ───────────────────────────────────────────────────────

@dataclass(frozen=True)
class UsuarioPacienteCreateRequest:
    nombre_usuario: str
    email: str
    password: str


class UsuarioPacienteCreateSchema(Schema):
    nombre_usuario = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))

    @post_load
    def make_dto(self, data, **kwargs):
        return UsuarioPacienteCreateRequest(**data)


class UsuarioResponse(Schema):
    id_usuario = fields.Int()
    nombre_usuario = fields.Str()
    email = fields.Str()
    estado = fields.Str()
    ultimo_acceso = fields.DateTime()
    created_at = fields.DateTime()
    rol = fields.Method('get_rol')
    tipo = fields.Method('get_tipo')

    def get_rol(self, obj):
        if obj.id_personal and obj.personal:
            return obj.personal.rol.nombre
        if obj.id_paciente:
            return 'paciente'
        return None

    def get_tipo(self, obj):
        return 'personal' if obj.id_personal else 'paciente'


# ── Personal ───────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class PersonalCreateRequest:
    ci: str
    nombres: str
    apellidos: str
    id_rol: int
    nombre_usuario: str
    email: str
    password: str
    id_especialidad: int | None = None
    matricula: str | None = None
    telefono: str | None = None


class PersonalCreateSchema(Schema):
    ci = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    nombres = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    apellidos = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    id_rol = fields.Int(required=True)
    nombre_usuario = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))
    id_especialidad = fields.Int(load_default=None)
    matricula = fields.Str(load_default=None, validate=validate.Length(max=50))
    telefono = fields.Str(load_default=None, validate=validate.Length(max=20))

    @post_load
    def make_dto(self, data, **kwargs):
        return PersonalCreateRequest(**data)


class PersonalResponse(Schema):
    id_personal = fields.Int()
    ci = fields.Str()
    nombres = fields.Str()
    apellidos = fields.Str()
    matricula = fields.Str()
    telefono = fields.Str()
    estado = fields.Str()
    rol = fields.Method('get_rol')
    especialidad = fields.Method('get_especialidad')
    nombre_usuario = fields.Method('get_nombre_usuario')
    email = fields.Method('get_email')

    def get_rol(self, obj):
        return obj.rol.nombre if obj.rol else None

    def get_especialidad(self, obj):
        return obj.especialidad.nombre if obj.especialidad else None

    def get_nombre_usuario(self, obj):
        return obj.usuario.nombre_usuario if obj.usuario else None

    def get_email(self, obj):
        return obj.usuario.email if obj.usuario else None
