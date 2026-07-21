from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.modules.auth.schemas import (
    LoginRequestSchema, TokenResponseSchema,
    UsuarioPacienteCreateSchema, UsuarioResponse,
    PersonalCreateSchema, PersonalResponse,
)
from app.modules.auth.service import AuthService, PersonalService
from app.core.security import role_required

auth_bp = Blueprint('auth', __name__)

_login_req = LoginRequestSchema()
_token_res = TokenResponseSchema()
_usuario_pac_req = UsuarioPacienteCreateSchema()
_usuario_res = UsuarioResponse()
_usuario_res_many = UsuarioResponse(many=True)
_personal_req = PersonalCreateSchema()
_personal_res = PersonalResponse()
_personal_res_many = PersonalResponse(many=True)


# ── Auth ───────────────────────────────────────────────────────────────────────

@auth_bp.post('/auth/login')
def login():
    dto = _login_req.load(request.get_json())
    return _token_res.dump(AuthService.login(dto)), 200


@auth_bp.post('/auth/logout')
@jwt_required()
def logout():
    AuthService.logout(get_jwt_identity())
    return {'mensaje': 'Sesión cerrada correctamente.'}, 200


# ── Usuarios ───────────────────────────────────────────────────────────────────

@auth_bp.get('/usuarios')
@jwt_required()
@role_required('administrador')
def listar_usuarios():
    return _usuario_res_many.dump(AuthService.listar_usuarios()), 200


# ── Usuario para paciente ───────────────────────────────────────────────────────

@auth_bp.post('/pacientes/<int:id_paciente>/usuario')
@jwt_required()
@role_required('recepcion', 'administrador')
def crear_usuario_paciente(id_paciente):
    dto = _usuario_pac_req.load(request.get_json())
    return _usuario_res.dump(AuthService.crear_usuario_paciente(id_paciente, dto)), 201


# ── Personal ───────────────────────────────────────────────────────────────────

@auth_bp.post('/personal')
@jwt_required()
@role_required('administrador')
def crear_personal():
    dto = _personal_req.load(request.get_json())
    return _personal_res.dump(PersonalService.crear(dto)), 201


@auth_bp.get('/personal')
@jwt_required()
@role_required('administrador', 'direccion')
def listar_personal():
    return _personal_res_many.dump(PersonalService.listar()), 200


@auth_bp.get('/personal/<int:id_personal>')
@jwt_required()
@role_required('administrador', 'direccion')
def obtener_personal(id_personal):
    return _personal_res.dump(PersonalService.obtener(id_personal)), 200
