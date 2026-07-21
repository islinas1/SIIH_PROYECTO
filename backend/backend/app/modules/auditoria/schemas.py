from marshmallow import Schema, fields


class BitacoraResponse(Schema):
    id_bitacora = fields.Int()
    id_usuario = fields.Int()
    accion = fields.Str()
    tabla_afectada = fields.Str()
    id_registro = fields.Int()
    detalle = fields.Dict()
    ip_origen = fields.Str()
    fecha_hora = fields.DateTime()
