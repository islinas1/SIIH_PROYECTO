from datetime import datetime
from flask import g, request
from sqlalchemy import Index
from sqlalchemy.dialects.postgresql import JSONB
from app.extensions import db
from app.core.base_model import BaseModel


class BitacoraAuditoria(BaseModel):
    __tablename__ = 'bitacora_auditoria'

    id_bitacora = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.BigInteger, db.ForeignKey('usuario.id_usuario'), nullable=False)
    accion = db.Column(db.String(50), nullable=False)
    tabla_afectada = db.Column(db.String(100))
    id_registro = db.Column(db.BigInteger)
    fecha_hora = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    ip_origen = db.Column(db.String(45))
    detalle = db.Column(JSONB)

    usuario = db.relationship('Usuario', backref='bitacora')

    __table_args__ = (
        Index('ix_bitacora_usuario_fecha', 'id_usuario', 'fecha_hora'),
        Index('ix_bitacora_accion', 'accion'),
    )


def registrar_auditoria(accion, tabla_afectada=None, id_registro=None, old=None, new=None):
    detalle = None
    if old is not None or new is not None:
        detalle = {'anterior': old, 'nuevo': new}

    entrada = BitacoraAuditoria(
        id_usuario=g.current_user.id_usuario,
        accion=accion,
        tabla_afectada=tabla_afectada,
        id_registro=id_registro,
        fecha_hora=datetime.utcnow(),
        ip_origen=request.remote_addr if request else None,
        detalle=detalle,
    )
    db.session.add(entrada)
    db.session.flush()
