from dataclasses import dataclass
from datetime import date

import marshmallow as ma
from marshmallow import fields, validate, post_load


@dataclass(frozen=True)
class PacienteCreateRequest:
    ci: str
    nombres: str
    apellidos: str
    fecha_nacimiento: date
    direccion: str | None = None
    telefono: str | None = None
    email: str | None = None
    id_seguro: int | None = None


@dataclass(frozen=True)
class PacienteUpdateRequest:
    nombres: str | None = None
    apellidos: str | None = None
    fecha_nacimiento: date | None = None
    direccion: str | None = None
    telefono: str | None = None
    email: str | None = None
    id_seguro: int | None = None


class PacienteCreateSchema(ma.Schema):
    ci = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    nombres = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    apellidos = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    fecha_nacimiento = fields.Date(required=True)
    direccion = fields.Str(load_default=None, validate=validate.Length(max=200))
    telefono = fields.Str(load_default=None, validate=validate.Length(max=20))
    email = fields.Email(load_default=None)
    id_seguro = fields.Int(load_default=None)

    @post_load
    def make_dto(self, data, **kwargs):
        return PacienteCreateRequest(**data)


class PacienteUpdateSchema(ma.Schema):
    nombres = fields.Str(load_default=None, validate=validate.Length(min=1, max=100))
    apellidos = fields.Str(load_default=None, validate=validate.Length(min=1, max=100))
    fecha_nacimiento = fields.Date(load_default=None)
    direccion = fields.Str(load_default=None, validate=validate.Length(max=200))
    telefono = fields.Str(load_default=None, validate=validate.Length(max=20))
    email = fields.Email(load_default=None)
    id_seguro = fields.Int(load_default=None)

    @post_load
    def make_dto(self, data, **kwargs):
        return PacienteUpdateRequest(**data)


class PacienteResponse(ma.Schema):
    id_paciente = fields.Int()
    ci = fields.Str()
    id_unico = fields.Str()
    nombres = fields.Str()
    apellidos = fields.Str()
    fecha_nacimiento = fields.Date()
    direccion = fields.Str()
    telefono = fields.Str()
    email = fields.Str()
    id_seguro = fields.Int()
    activo = fields.Bool()
    created_at = fields.DateTime()
