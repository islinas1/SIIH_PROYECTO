import marshmallow as ma
from marshmallow import fields


class DocumentoResponse(ma.Schema):
    id_documento = fields.Int()
    nombre_original = fields.Str()
    mime_type = fields.Str()
    tamano_bytes = fields.Int()
    entidad_tipo = fields.Str()
    entidad_id = fields.Int()
    id_paciente = fields.Int()
    id_usuario_subio = fields.Int()
    categoria = fields.Str()
    created_at = fields.DateTime()
