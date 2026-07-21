from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.modules.reportes.schemas import (
    OcupacionResponse, CitasResumenResponse,
    MedicamentoStockBajoResponse, ActividadResponse,
)
from app.modules.reportes.service import ReportesService
from app.core.security import role_required

reportes_bp = Blueprint('reportes', __name__)

_ocupacion_res = OcupacionResponse()
_citas_res = CitasResumenResponse()
_med_res_many = MedicamentoStockBajoResponse(many=True)
_actividad_res = ActividadResponse()


def _parse_fecha(valor):
    return datetime.strptime(valor, '%Y-%m-%d') if valor else None


@reportes_bp.get('/reportes/ocupacion')
@jwt_required()
@role_required('administrador', 'direccion')
def reporte_ocupacion():
    return _ocupacion_res.dump(ReportesService.ocupacion()), 200


@reportes_bp.get('/reportes/citas')
@jwt_required()
@role_required('administrador', 'direccion')
def reporte_citas():
    args = request.args
    return _citas_res.dump(
        ReportesService.citas(
            fecha_desde=_parse_fecha(args.get('fecha_desde')),
            fecha_hasta=_parse_fecha(args.get('fecha_hasta')),
        )
    ), 200


@reportes_bp.get('/reportes/medicamentos')
@jwt_required()
@role_required('administrador', 'direccion', 'farmaceutico')
def reporte_medicamentos():
    return _med_res_many.dump(ReportesService.medicamentos_stock_bajo()), 200


@reportes_bp.get('/reportes/actividad')
@jwt_required()
@role_required('administrador', 'direccion')
def reporte_actividad():
    args = request.args
    return _actividad_res.dump(
        ReportesService.actividad(
            fecha_desde=_parse_fecha(args.get('fecha_desde')),
            fecha_hasta=_parse_fecha(args.get('fecha_hasta')),
        )
    ), 200
