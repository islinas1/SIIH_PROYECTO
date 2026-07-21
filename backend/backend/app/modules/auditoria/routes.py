from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.modules.auditoria.schemas import BitacoraResponse
from app.modules.auditoria.service import AuditoriaService
from app.core.security import role_required

auditoria_bp = Blueprint('auditoria', __name__)

_bitacora_res_many = BitacoraResponse(many=True)


@auditoria_bp.get('/auditoria')
@jwt_required()
@role_required('administrador')
def listar_auditoria():
    args = request.args

    fecha_desde = args.get('fecha_desde')
    fecha_hasta = args.get('fecha_hasta')
    if fecha_desde:
        fecha_desde = datetime.strptime(fecha_desde, '%Y-%m-%d')
    if fecha_hasta:
        fecha_hasta = datetime.strptime(fecha_hasta, '%Y-%m-%d')

    entradas = AuditoriaService.listar(
        id_usuario=args.get('usuario', type=int),
        tabla=args.get('tabla'),
        accion=args.get('accion'),
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
    )
    return _bitacora_res_many.dump(entradas), 200
