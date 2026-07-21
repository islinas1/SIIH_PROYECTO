from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.modules.citas.schemas import (
    CitaCreateSchema, CitaUpdateSchema, CitaResponse,
    TriajeCreateSchema, TriajeResponse,
)
from app.modules.citas.service import CitaService, TriajeService
from app.core.security import role_required

citas_bp = Blueprint('citas', __name__)

_crear = CitaCreateSchema()
_actualizar = CitaUpdateSchema()
_uno = CitaResponse()
_muchos = CitaResponse(many=True)
_triaje_crear = TriajeCreateSchema()
_triaje_res = TriajeResponse()


@citas_bp.post('/citas')
@jwt_required()
@role_required('recepcion', 'administrador', 'paciente')
def crear():
    dto = _crear.load(request.get_json())
    return _uno.dump(CitaService.crear(dto)), 201


@citas_bp.get('/citas')
@jwt_required()
@role_required('recepcion', 'medico', 'enfermera', 'administrador')
def listar():
    return _muchos.dump(CitaService.listar(
        id_paciente=request.args.get('paciente', type=int),
        id_medico=request.args.get('medico', type=int),
        estado=request.args.get('estado'),
        fecha=request.args.get('fecha'),
    )), 200


@citas_bp.get('/citas/<int:id_cita>')
@jwt_required()
@role_required('recepcion', 'medico', 'enfermera', 'administrador')
def obtener(id_cita):
    return _uno.dump(CitaService.obtener(id_cita)), 200


@citas_bp.patch('/citas/<int:id_cita>')
@jwt_required()
@role_required('recepcion', 'medico', 'enfermera', 'administrador')
def actualizar(id_cita):
    dto = _actualizar.load(request.get_json())
    return _uno.dump(CitaService.actualizar(id_cita, dto)), 200


@citas_bp.post('/citas/<int:id_cita>/triaje')
@jwt_required()
@role_required('enfermera', 'medico')
def crear_triaje(id_cita):
    dto = _triaje_crear.load(request.get_json())
    return _triaje_res.dump(TriajeService.crear(id_cita, dto)), 201


@citas_bp.get('/citas/<int:id_cita>/triaje')
@jwt_required()
@role_required('enfermera', 'medico', 'administrador')
def obtener_triaje(id_cita):
    return _triaje_res.dump(TriajeService.obtener_ultimo(id_cita)), 200
