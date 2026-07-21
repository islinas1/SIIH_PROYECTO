from marshmallow import Schema, fields


class OcupacionResponse(Schema):
    internaciones_activas = fields.Int()
    camas_ocupadas = fields.Int()
    porcentaje_ocupacion = fields.Float()


class CitasResumenResponse(Schema):
    total = fields.Int()
    por_estado = fields.Dict(keys=fields.Str(), values=fields.Int())
    por_tipo = fields.Dict(keys=fields.Str(), values=fields.Int())


class MedicamentoStockBajoResponse(Schema):
    id_medicamento = fields.Int()
    nombre_comercial = fields.Str()
    principio_activo = fields.Str()
    stock_total = fields.Int()
    stock_minimo = fields.Int()


class ActividadResponse(Schema):
    consultas = fields.Int()
    internaciones_nuevas = fields.Int()
    altas = fields.Int()
    triajes = fields.Int()
