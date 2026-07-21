from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.modules.pacientes.schemas import (
    PacienteCreateSchema, PacienteUpdateSchema, PacienteResponse
)
from app.modules.pacientes.service import PacienteService
from app.core.security import role_required

pacientes_bp = Blueprint('pacientes', __name__)

_crear = PacienteCreateSchema()
_actualizar = PacienteUpdateSchema()
_uno = PacienteResponse()
_muchos = PacienteResponse(many=True)


@pacientes_bp.get('/pacientes')
@jwt_required()
@role_required('recepcion', 'medico', 'enfermera', 'administrador')
def listar():
    termino = request.args.get('q', '').strip() or None
    return _muchos.dump(PacienteService.listar(termino)), 200


@pacientes_bp.get('/pacientes/<int:id_paciente>')
@jwt_required()
@role_required('recepcion', 'medico', 'enfermera', 'administrador')
def obtener(id_paciente):
    return _uno.dump(PacienteService.obtener(id_paciente)), 200


@pacientes_bp.post('/pacientes')
@jwt_required()
@role_required('recepcion', 'administrador')
def crear():
    dto = _crear.load(request.get_json())
    return _uno.dump(PacienteService.crear(dto)), 201


@pacientes_bp.patch('/pacientes/<int:id_paciente>')
@jwt_required()
@role_required('recepcion', 'administrador')
def actualizar(id_paciente):
    dto = _actualizar.load(request.get_json())
    return _uno.dump(PacienteService.actualizar(id_paciente, dto)), 200


@pacientes_bp.delete('/pacientes/<int:id_paciente>')
@jwt_required()
@role_required('administrador')
def eliminar(id_paciente):
    PacienteService.eliminar(id_paciente)
    return {'mensaje': 'Paciente desactivado correctamente.'}, 200
