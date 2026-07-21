from dataclasses import dataclass
from datetime import date

import marshmallow as ma
from marshmallow import fields, validate, post_load


# ── Medicamento ─────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class MedicamentoCreateRequest:
    nombre_comercial: str
    principio_activo: str
    presentacion: str
    stock_minimo: int
    requiere_receta: bool = True


@dataclass(frozen=True)
class MedicamentoUpdateRequest:
    nombre_comercial: str | None = None
    presentacion: str | None = None
    stock_minimo: int | None = None
    requiere_receta: bool | None = None
    activo: bool | None = None


class MedicamentoCreateSchema(ma.Schema):
    nombre_comercial = fields.Str(required=True, validate=validate.Length(min=1, max=150))
    principio_activo = fields.Str(required=True, validate=validate.Length(min=1, max=150))
    presentacion = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    stock_minimo = fields.Int(required=True, validate=validate.Range(min=0))
    requiere_receta = fields.Bool(load_default=True)

    @post_load
    def make_dto(self, data, **kwargs):
        return MedicamentoCreateRequest(**data)


class MedicamentoUpdateSchema(ma.Schema):
    nombre_comercial = fields.Str(load_default=None, validate=validate.Length(min=1, max=150))
    presentacion = fields.Str(load_default=None)
    stock_minimo = fields.Int(load_default=None, validate=validate.Range(min=0))
    requiere_receta = fields.Bool(load_default=None)
    activo = fields.Bool(load_default=None)

    @post_load
    def make_dto(self, data, **kwargs):
        return MedicamentoUpdateRequest(**data)


class MedicamentoResponse(ma.Schema):
    id_medicamento = fields.Int()
    nombre_comercial = fields.Str()
    principio_activo = fields.Str()
    presentacion = fields.Str()
    requiere_receta = fields.Bool()
    stock_minimo = fields.Int()
    activo = fields.Bool()
    stock_total = fields.Method('get_stock_total')

    def get_stock_total(self, obj):
        return sum(l.cantidad_actual for l in obj.lotes) if obj.lotes else 0


# ── Lote ────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class LoteCreateRequest:
    numero_lote: str
    fecha_vencimiento: date
    cantidad_actual: int
    ubicacion: str | None = None


class LoteCreateSchema(ma.Schema):
    numero_lote = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    fecha_vencimiento = fields.Date(required=True)
    cantidad_actual = fields.Int(required=True, validate=validate.Range(min=0))
    ubicacion = fields.Str(load_default=None)

    @post_load
    def make_dto(self, data, **kwargs):
        return LoteCreateRequest(**data)


class LoteResponse(ma.Schema):
    id_lote = fields.Int()
    id_medicamento = fields.Int()
    numero_lote = fields.Str()
    fecha_vencimiento = fields.Date()
    cantidad_actual = fields.Int()
    ubicacion = fields.Str()


# ── Receta ──────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class DetalleRecetaInput:
    id_medicamento: int
    dosis: str
    frecuencia: str
    duracion: str
    cantidad: int
    indicaciones: str | None = None


@dataclass(frozen=True)
class RecetaCreateRequest:
    id_consulta: int
    detalles: tuple


class DetalleRecetaInputSchema(ma.Schema):
    id_medicamento = fields.Int(required=True)
    dosis = fields.Str(required=True)
    frecuencia = fields.Str(required=True)
    duracion = fields.Str(required=True)
    cantidad = fields.Int(required=True, validate=validate.Range(min=1))
    indicaciones = fields.Str(load_default=None)

    @post_load
    def make_dto(self, data, **kwargs):
        return DetalleRecetaInput(**data)


class RecetaCreateSchema(ma.Schema):
    id_consulta = fields.Int(required=True)
    detalles = fields.List(fields.Nested(DetalleRecetaInputSchema), required=True, validate=validate.Length(min=1))

    @post_load
    def make_dto(self, data, **kwargs):
        return RecetaCreateRequest(
            id_consulta=data['id_consulta'],
            detalles=tuple(data['detalles']),
        )


@dataclass(frozen=True)
class DispensarItemRequest:
    id_detalle_receta: int
    cantidad_a_entregar: int


@dataclass(frozen=True)
class DispensarRequest:
    items: tuple


class DispensarItemSchema(ma.Schema):
    id_detalle_receta = fields.Int(required=True)
    cantidad_a_entregar = fields.Int(required=True, validate=validate.Range(min=1))

    @post_load
    def make_dto(self, data, **kwargs):
        return DispensarItemRequest(**data)


class DispensarSchema(ma.Schema):
    items = fields.List(fields.Nested(DispensarItemSchema), required=True, validate=validate.Length(min=1))

    @post_load
    def make_dto(self, data, **kwargs):
        return DispensarRequest(items=tuple(data['items']))


class DetalleRecetaResponse(ma.Schema):
    id_detalle_receta = fields.Int()
    id_medicamento = fields.Int()
    dosis = fields.Str()
    frecuencia = fields.Str()
    duracion = fields.Str()
    indicaciones = fields.Str()
    cantidad = fields.Int()
    cantidad_entregada = fields.Int()
    medicamento_nombre = fields.Method('get_nombre')

    def get_nombre(self, obj):
        return obj.medicamento.nombre_comercial if obj.medicamento else None


class RecetaResponse(ma.Schema):
    id_receta = fields.Int()
    id_consulta = fields.Int()
    fecha_emision = fields.DateTime()
    estado = fields.Str()
    fecha_dispensacion = fields.DateTime()
    detalles = fields.List(fields.Nested(DetalleRecetaResponse))
    medico = fields.Method('get_medico')

    def get_medico(self, obj):
        if obj.medico:
            return {
                'id_personal': obj.medico.id_personal,
                'nombres': obj.medico.nombres,
                'apellidos': obj.medico.apellidos,
            }
        return None


# ── Movimiento ──────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class MovimientoCreateRequest:
    id_lote: int
    tipo: str
    cantidad: int
    referencia: str | None = None


class MovimientoCreateSchema(ma.Schema):
    id_lote = fields.Int(required=True)
    tipo = fields.Str(required=True, validate=validate.OneOf(['ENTRADA', 'AJUSTE', 'MERMA']))
    cantidad = fields.Int(required=True, validate=validate.Range(min=1))
    referencia = fields.Str(load_default=None)

    @post_load
    def make_dto(self, data, **kwargs):
        return MovimientoCreateRequest(**data)


class MovimientoResponse(ma.Schema):
    id_movimiento = fields.Int()
    id_lote = fields.Int()
    tipo = fields.Str()
    cantidad = fields.Int()
    fecha_hora = fields.DateTime()
    referencia = fields.Str()
    medicamento_nombre = fields.Method('get_nombre')

    def get_nombre(self, obj):
        return obj.lote.medicamento.nombre_comercial if obj.lote and obj.lote.medicamento else None
