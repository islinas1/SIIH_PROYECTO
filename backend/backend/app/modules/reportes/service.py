from datetime import datetime, timedelta
from sqlalchemy import func
from app.extensions import db

TOTAL_CAMAS = 50


class ReportesService:

    @staticmethod
    def ocupacion():
        from app.modules.atencion.models import Internacion

        activas = db.session.execute(
            db.select(func.count()).select_from(Internacion)
            .where(Internacion.fecha_alta.is_(None))
        ).scalar()

        porcentaje = round((activas / TOTAL_CAMAS) * 100, 1) if TOTAL_CAMAS else 0.0

        return {
            'internaciones_activas': activas,
            'camas_ocupadas': activas,
            'porcentaje_ocupacion': porcentaje,
        }

    @staticmethod
    def citas(fecha_desde=None, fecha_hasta=None):
        from app.modules.citas.models import Cita

        if not fecha_desde:
            fecha_desde = datetime.utcnow() - timedelta(days=30)
        if not fecha_hasta:
            fecha_hasta = datetime.utcnow()

        registros = db.session.execute(
            db.select(Cita).where(
                Cita.fecha_hora >= fecha_desde,
                Cita.fecha_hora <= fecha_hasta,
            )
        ).scalars().all()

        por_estado = {}
        por_tipo = {}
        for c in registros:
            por_estado[c.estado] = por_estado.get(c.estado, 0) + 1
            por_tipo[c.tipo_ingreso] = por_tipo.get(c.tipo_ingreso, 0) + 1

        return {
            'total': len(registros),
            'por_estado': por_estado,
            'por_tipo': por_tipo,
        }

    @staticmethod
    def medicamentos_stock_bajo():
        from app.modules.farmacia.models import Medicamento

        medicamentos = db.session.execute(
            db.select(Medicamento).where(Medicamento.activo == True)
        ).scalars().all()

        return [
            {
                'id_medicamento': m.id_medicamento,
                'nombre_comercial': m.nombre_comercial,
                'principio_activo': m.principio_activo,
                'stock_total': sum(l.cantidad_actual for l in m.lotes),
                'stock_minimo': m.stock_minimo,
            }
            for m in medicamentos
            if sum(l.cantidad_actual for l in m.lotes) <= m.stock_minimo
        ]

    @staticmethod
    def actividad(fecha_desde=None, fecha_hasta=None):
        from app.modules.atencion.models import Consulta, Internacion
        from app.modules.citas.models import Triaje

        if not fecha_desde:
            fecha_desde = datetime.utcnow() - timedelta(days=30)
        if not fecha_hasta:
            fecha_hasta = datetime.utcnow()

        consultas = db.session.execute(
            db.select(func.count()).select_from(Consulta)
            .where(Consulta.fecha_hora >= fecha_desde, Consulta.fecha_hora <= fecha_hasta)
        ).scalar()

        internaciones_nuevas = db.session.execute(
            db.select(func.count()).select_from(Internacion)
            .where(Internacion.fecha_ingreso >= fecha_desde, Internacion.fecha_ingreso <= fecha_hasta)
        ).scalar()

        altas = db.session.execute(
            db.select(func.count()).select_from(Internacion)
            .where(Internacion.fecha_alta >= fecha_desde, Internacion.fecha_alta <= fecha_hasta)
        ).scalar()

        triajes = db.session.execute(
            db.select(func.count()).select_from(Triaje)
            .where(Triaje.fecha_hora >= fecha_desde, Triaje.fecha_hora <= fecha_hasta)
        ).scalar()

        return {
            'consultas': consultas,
            'internaciones_nuevas': internaciones_nuevas,
            'altas': altas,
            'triajes': triajes,
        }
