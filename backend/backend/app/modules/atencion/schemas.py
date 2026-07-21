from dataclasses import dataclass
from datetime import date

import marshmallow as ma
from marshmallow import fields, validate, post_load


# ── Historia Clínica ────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class HistoriaUpdateRequest:
    antecedentes: str | None = None
    alergias: str | None = None
    observaciones: str | None = None


class HistoriaUpdateSchema(ma.Schema):
    antecedentes = fields.Str(load_default=None)
    alergias = fields.Str(load_default=None)
    observaciones = fields.Str(load_default=None)

    @post_load
    def make_dto(self, data, **kwargs):
        return HistoriaUpdateRequest(**data)


class HistoriaResponse(ma.Schema):
    id_historia = fields.Int()
    id_paciente = fields.Int()
    fecha_apertura = fields.Date()
    antecedentes = fields.Str()
    alergias = fields.Str()
    observaciones = fields.Str()


# ── Alergias ────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class AlergiaCreateRequest:
    principio_activo: str
    severidad: str
    notas: str | None = None


class AlergiaCreateSchema(ma.Schema):
    principio_activo = fields.Str(required=True, validate=validate.Length(min=1, max=150))
    severidad = fields.Str(required=True, validate=validate.OneOf(['LEVE', 'MODERADA', 'SEVERA', 'CRITICA']))
    notas = fields.Str(load_default=None)

    @post_load
    def make_dto(self, data, **kwargs):
        return AlergiaCreateRequest(**data)


class AlergiaResponse(ma.Schema):
    id_alergia = fields.Int()
    id_historia = fields.Int()
    principio_activo = fields.Str()
    severidad = fields.Str()
    notas = fields.Str()


# ── Consultas ───────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class ConsultaCreateRequest:
    id_paciente: int
    motivo: str
    id_cita: int | None = None
    tratamiento: str | None = None
    evolucion: str | None = None


@dataclass(frozen=True)
class ConsultaUpdateRequest:
    motivo: str | None = None
    tratamiento: str | None = None
    evolucion: str | None = None


class ConsultaCreateSchema(ma.Schema):
    id_paciente = fields.Int(required=True)
    motivo = fields.Str(required=True, validate=validate.Length(min=1))
    id_cita = fields.Int(load_default=None)
    tratamiento = fields.Str(load_default=None)
    evolucion = fields.Str(load_default=None)

    @post_load
    def make_dto(self, data, **kwargs):
        return ConsultaCreateRequest(**data)


class ConsultaUpdateSchema(ma.Schema):
    motivo = fields.Str(load_default=None, validate=validate.Length(min=1))
    tratamiento = fields.Str(load_default=None)
    evolucion = fields.Str(load_default=None)

    @post_load
    def make_dto(self, data, **kwargs):
        return ConsultaUpdateRequest(**data)


class ConsultaResponse(ma.Schema):
    id_consulta = fields.Int()
    id_historia = fields.Int()
    id_cita = fields.Int()
    fecha_hora = fields.DateTime()
    motivo = fields.Str()
    tratamiento = fields.Str()
    evolucion = fields.Str()
    medico = fields.Method('get_medico')

    def get_medico(self, obj):
        if obj.medico:
            return {
                'id_personal': obj.medico.id_personal,
                'nombres': obj.medico.nombres,
                'apellidos': obj.medico.apellidos,
            }
        return None


# ── Diagnósticos ────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class DiagnosticoCreateRequest:
    codigo_cie10: str
    descripcion: str
    tipo: str = 'PRINCIPAL'


class DiagnosticoCreateSchema(ma.Schema):
    codigo_cie10 = fields.Str(required=True, validate=validate.Length(min=1, max=10))
    descripcion = fields.Str(required=True, validate=validate.Length(min=1))
    tipo = fields.Str(load_default='PRINCIPAL', validate=validate.OneOf(['PRINCIPAL', 'SECUNDARIO', 'PRESUNTIVO']))

    @post_load
    def make_dto(self, data, **kwargs):
        return DiagnosticoCreateRequest(**data)


class DiagnosticoResponse(ma.Schema):
    id_diagnostico = fields.Int()
    id_consulta = fields.Int()
    codigo_cie10 = fields.Str()
    descripcion = fields.Str()
    tipo = fields.Str()


# ── Internación ─────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class InternacionCreateRequest:
    id_paciente: int
    habitacion: str
    cama: str
    motivo_ingreso: str
    id_consulta_origen: int | None = None


@dataclass(frozen=True)
class InternacionAltaRequest:
    motivo_alta: str


class InternacionCreateSchema(ma.Schema):
    id_paciente = fields.Int(required=True)
    habitacion = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    cama = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    motivo_ingreso = fields.Str(required=True, validate=validate.Length(min=1))
    id_consulta_origen = fields.Int(load_default=None)

    @post_load
    def make_dto(self, data, **kwargs):
        return InternacionCreateRequest(**data)


class InternacionAltaSchema(ma.Schema):
    motivo_alta = fields.Str(required=True, validate=validate.Length(min=1))

    @post_load
    def make_dto(self, data, **kwargs):
        return InternacionAltaRequest(**data)


class InternacionResponse(ma.Schema):
    id_internacion = fields.Int()
    id_paciente = fields.Int()
    id_consulta_origen = fields.Int()
    fecha_ingreso = fields.DateTime()
    fecha_alta = fields.DateTime()
    habitacion = fields.Str()
    cama = fields.Str()
    motivo_ingreso = fields.Str()
    motivo_alta = fields.Str()
    medico_tratante = fields.Method('get_medico')

    def get_medico(self, obj):
        if obj.medico_tratante:
            return {
                'id_personal': obj.medico_tratante.id_personal,
                'nombres': obj.medico_tratante.nombres,
                'apellidos': obj.medico_tratante.apellidos,
            }
        return None
