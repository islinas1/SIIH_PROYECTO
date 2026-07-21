from sqlalchemy import CheckConstraint, Index
from app.extensions import db
from app.core.base_model import BaseModel


class Documento(BaseModel):
    __tablename__ = 'documento'

    id_documento = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    storage_key = db.Column(db.String(255), nullable=False, unique=True)
    nombre_original = db.Column(db.String(255), nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    tamano_bytes = db.Column(db.BigInteger, nullable=False)
    hash_sha256 = db.Column(db.String(64))
    entidad_tipo = db.Column(db.String(50), nullable=False)
    entidad_id = db.Column(db.BigInteger, nullable=False)
    id_paciente = db.Column(db.BigInteger, db.ForeignKey('paciente.id_paciente'), nullable=False)
    id_usuario_subio = db.Column(db.BigInteger, db.ForeignKey('usuario.id_usuario'), nullable=False)
    categoria = db.Column(db.String(50), nullable=False)

    paciente = db.relationship('Paciente', backref='documentos')
    usuario_subio = db.relationship('Usuario', backref='documentos_subidos')

    __table_args__ = (
        CheckConstraint(
            "categoria IN ('EXAMEN_LABORATORIO','IMAGEN_DIAGNOSTICA','CONSENTIMIENTO','RECETA','OTRO')",
            name='ck_documento_categoria'
        ),
        CheckConstraint(
            'tamano_bytes > 0 AND tamano_bytes <= 20971520',
            name='ck_documento_tamano'
        ),
        Index('ix_documento_entidad', 'entidad_tipo', 'entidad_id'),
        Index('ix_documento_paciente', 'id_paciente'),
    )
