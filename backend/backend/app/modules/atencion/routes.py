from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.modules.atencion.schemas import (
    HistoriaUpdateSchema, HistoriaResponse,
    AlergiaCreateSchema, AlergiaResponse,
    ConsultaCreateSchema, ConsultaUpdateSchema, ConsultaResponse,
    DiagnosticoCreateSchema, DiagnosticoResponse,
    InternacionCreateSchema, InternacionAltaSchema, InternacionResponse,
)
from app.modules.atencion.service import (
    HistoriaService, AlergiaService, ConsultaService,
    DiagnosticoService, InternacionService,
)
from app.core.security import role_required

atencion_bp = Blueprint('atencion', __name__)

_historia_upd = HistoriaUpdateSchema()
_historia_res = HistoriaResponse()
_alergia_crear = AlergiaCreateSchema()
_alergia_res = AlergiaResponse()
_alergia_res_many = AlergiaResponse(many=True)
_consulta_crear = ConsultaCreateSchema()
_consulta_upd = ConsultaUpdateSchema()
_consulta_res = ConsultaResponse()
_diag_crear = DiagnosticoCreateSchema()
_diag_res = DiagnosticoResponse()
_diag_res_many = DiagnosticoResponse(many=True)
_intern_crear = InternacionCreateSchema()
_intern_alta = InternacionAltaSchema()
_intern_res = InternacionResponse()
_intern_res_many = InternacionResponse(many=True)


@atencion_bp.get('/pacientes/<int:id_paciente>/historia')
@jwt_required()
@role_required('medico', 'enfermera', 'administrador')
def obtener_historia(id_paciente):
    return _historia_res.dump(HistoriaService.obtener(id_paciente)), 200


@atencion_bp.patch('/pacientes/<int:id_paciente>/historia')
@jwt_required()
@role_required('medico', 'enfermera')
def actualizar_historia(id_paciente):
    dto = _historia_upd.load(request.get_json())
    return _historia_res.dump(HistoriaService.actualizar(id_paciente, dto)), 200


@atencion_bp.get('/pacientes/<int:id_paciente>/historia/alergias')
@jwt_required()
@role_required('medico', 'enfermera', 'farmaceutico')
def listar_alergias(id_paciente):
    return _alergia_res_many.dump(AlergiaService.listar(id_paciente)), 200


@atencion_bp.post('/pacientes/<int:id_paciente>/historia/alergias')
@jwt_required()
@role_required('medico')
def crear_alergia(id_paciente):
    dto = _alergia_crear.load(request.get_json())
    return _alergia_res.dump(AlergiaService.crear(id_paciente, dto)), 201


@atencion_bp.delete('/pacientes/<int:id_paciente>/historia/alergias/<int:id_alergia>')
@jwt_required()
@role_required('medico')
def eliminar_alergia(id_paciente, id_alergia):
    AlergiaService.eliminar(id_paciente, id_alergia)
    return {'mensaje': 'Alergia eliminada correctamente.'}, 200


@atencion_bp.post('/consultas')
@jwt_required()
@role_required('medico')
def crear_consulta():
    dto = _consulta_crear.load(request.get_json())
    return _consulta_res.dump(ConsultaService.crear(dto)), 201


@atencion_bp.get('/consultas/<int:id_consulta>')
@jwt_required()
@role_required('medico', 'enfermera')
def obtener_consulta(id_consulta):
    return _consulta_res.dump(ConsultaService.obtener(id_consulta)), 200


@atencion_bp.patch('/consultas/<int:id_consulta>')
@jwt_required()
@role_required('medico')
def actualizar_consulta(id_consulta):
    dto = _consulta_upd.load(request.get_json())
    return _consulta_res.dump(ConsultaService.actualizar(id_consulta, dto)), 200


@atencion_bp.post('/consultas/<int:id_consulta>/diagnosticos')
@jwt_required()
@role_required('medico')
def crear_diagnostico(id_consulta):
    dto = _diag_crear.load(request.get_json())
    return _diag_res.dump(DiagnosticoService.crear(id_consulta, dto)), 201


@atencion_bp.get('/consultas/<int:id_consulta>/diagnosticos')
@jwt_required()
@role_required('medico', 'enfermera')
def listar_diagnosticos(id_consulta):
    return _diag_res_many.dump(DiagnosticoService.listar(id_consulta)), 200


@atencion_bp.post('/internaciones')
@jwt_required()
@role_required('medico', 'administrador')
def crear_internacion():
    dto = _intern_crear.load(request.get_json())
    return _intern_res.dump(InternacionService.crear(dto)), 201


@atencion_bp.patch('/internaciones/<int:id_internacion>/alta')
@jwt_required()
@role_required('medico', 'enfermera')
def dar_alta(id_internacion):
    dto = _intern_alta.load(request.get_json())
    return _intern_res.dump(InternacionService.dar_alta(id_internacion, dto)), 200


@atencion_bp.get('/internaciones')
@jwt_required()
@role_required('medico', 'enfermera', 'administrador')
def listar_internaciones():
    solo_activas = request.args.get('activas', 'true').lower() == 'true'
    return _intern_res_many.dump(InternacionService.listar(solo_activas)), 200
