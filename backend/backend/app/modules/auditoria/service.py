from datetime import datetime
from app.extensions import db
from app.core.audit import BitacoraAuditoria


class AuditoriaService:

    @staticmethod
    def listar(id_usuario=None, tabla=None, accion=None, fecha_desde=None, fecha_hasta=None):
        q = db.select(BitacoraAuditoria).order_by(BitacoraAuditoria.fecha_hora.desc())

        if id_usuario:
            q = q.where(BitacoraAuditoria.id_usuario == id_usuario)
        if tabla:
            q = q.where(BitacoraAuditoria.tabla_afectada == tabla)
        if accion:
            q = q.where(BitacoraAuditoria.accion == accion)
        if fecha_desde:
            q = q.where(BitacoraAuditoria.fecha_hora >= fecha_desde)
        if fecha_hasta:
            q = q.where(BitacoraAuditoria.fecha_hora <= fecha_hasta)

        return db.session.execute(q).scalars().all()
