from dataclasses import dataclass
from datetime import datetime

import marshmallow as ma
from marshmallow import fields, validate, post_load


@dataclass(frozen=True)
class CitaCreateRequest:
    id_paciente: int
    fecha_hora: datetime
    tipo_ingreso: str
    canal_solicitud: str
    id_medico: int | None = None
    notas: str | None = None


@dataclass(frozen=True)
class CitaUpdateRequest:
    estado: str | None = None
    id_medico: int | None = None
    notas: str | None = None


@dataclass(frozen=True)
class TriajeCreateRequest:
    nivel: int
    sintomas: str | None = None
    signos_vitales: dict | None = None


class CitaCreateSchema(ma.Schema):
    id_paciente = fields.Int(required=True)
    fecha_hora = fields.DateTime(required=True)
    tipo_ingreso = fields.Str(required=True, validate=validate.OneOf(['CONSULTA_EXTERNA', 'URGENCIA', 'EMERGENCIA']))
    canal_solicitud = fields.Str(required=True, validate=validate.OneOf(['MOVIL', 'ADMISION', 'EMERGENCIA']))
    id_medico = fields.Int(load_default=None)
    notas = fields.Str(load_default=None)

    @post_load
    def make_dto(self, data, **kwargs):
        return CitaCreateRequest(**data)


class CitaUpdateSchema(ma.Schema):
    estado = fields.Str(load_default=None, validate=validate.OneOf(
        ['PROGRAMADA', 'CONFIRMADA', 'EN_TRIAJE', 'ATENDIDA', 'CANCELADA', 'NO_ASISTIO']
    ))
    id_medico = fields.Int(load_default=None)
    notas = fields.Str(load_default=None)

    @post_load
    def make_dto(self, data, **kwargs):
        return CitaUpdateRequest(**data)


class TriajeCreateSchema(ma.Schema):
    nivel = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    sintomas = fields.Str(load_default=None)
    signos_vitales = fields.Dict(load_default=None)

    @post_load
    def make_dto(self, data, **kwargs):
        return TriajeCreateRequest(**data)


class CitaResponse(ma.Schema):
    id_cita = fields.Int()
    fecha_hora = fields.DateTime()
    estado = fields.Str()
    tipo_ingreso = fields.Str()
    canal_solicitud = fields.Str()
    notas = fields.Str()
    created_at = fields.DateTime()
    paciente = fields.Method('get_paciente')
    medico = fields.Method('get_medico')

    def get_paciente(self, obj):
        if obj.paciente:
            return {
                'id_paciente': obj.paciente.id_paciente,
                'nombres': obj.paciente.nombres,
                'apellidos': obj.paciente.apellidos,
                'id_unico': obj.paciente.id_unico,
            }
        return None

    def get_medico(self, obj):
        if obj.medico:
            return {
                'id_personal': obj.medico.id_personal,
                'nombres': obj.medico.nombres,
                'apellidos': obj.medico.apellidos,
            }
        return None


class TriajeResponse(ma.Schema):
    id_triaje = fields.Int()
    id_cita = fields.Int()
    nivel = fields.Int()
    color = fields.Str()
    sintomas = fields.Str()
    signos_vitales = fields.Dict()
    fecha_hora = fields.DateTime()
    evaluador = fields.Method('get_evaluador')

    def get_evaluador(self, obj):
        if obj.evaluador:
            return {
                'id_personal': obj.evaluador.id_personal,
                'nombres': obj.evaluador.nombres,
                'apellidos': obj.evaluador.apellidos,
            }
        return None
