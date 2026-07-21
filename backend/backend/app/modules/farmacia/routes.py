from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.modules.farmacia.schemas import (
    MedicamentoCreateSchema, MedicamentoUpdateSchema, MedicamentoResponse,
    LoteCreateSchema, LoteResponse,
    RecetaCreateSchema, RecetaResponse,
    DispensarSchema,
    MovimientoCreateSchema, MovimientoResponse,
)
from app.modules.farmacia.service import MedicamentoService, LoteService, RecetaService, InventarioService
from app.core.security import role_required

farmacia_bp = Blueprint('farmacia', __name__)

_med_crear = MedicamentoCreateSchema()
_med_upd = MedicamentoUpdateSchema()
_med_res = MedicamentoResponse()
_med_res_many = MedicamentoResponse(many=True)
_lote_crear = LoteCreateSchema()
_lote_res = LoteResponse()
_lote_res_many = LoteResponse(many=True)
_receta_crear = RecetaCreateSchema()
_receta_res = RecetaResponse()
_receta_res_many = RecetaResponse(many=True)
_dispensar = DispensarSchema()
_mov_crear = MovimientoCreateSchema()
_mov_res = MovimientoResponse()
_mov_res_many = MovimientoResponse(many=True)


@farmacia_bp.get('/medicamentos')
@jwt_required()
@role_required('medico', 'farmaceutico', 'administrador')
def listar_medicamentos():
    return _med_res_many.dump(MedicamentoService.listar()), 200


@farmacia_bp.get('/medicamentos/stock-bajo')
@jwt_required()
@role_required('farmaceutico', 'administrador')
def stock_bajo():
    return _med_res_many.dump(MedicamentoService.stock_bajo()), 200


@farmacia_bp.get('/medicamentos/<int:id_medicamento>')
@jwt_required()
@role_required('medico', 'farmaceutico', 'administrador')
def obtener_medicamento(id_medicamento):
    return _med_res.dump(MedicamentoService.obtener(id_medicamento)), 200


@farmacia_bp.post('/medicamentos')
@jwt_required()
@role_required('farmaceutico', 'administrador')
def crear_medicamento():
    dto = _med_crear.load(request.get_json())
    return _med_res.dump(MedicamentoService.crear(dto)), 201


@farmacia_bp.patch('/medicamentos/<int:id_medicamento>')
@jwt_required()
@role_required('farmaceutico', 'administrador')
def actualizar_medicamento(id_medicamento):
    dto = _med_upd.load(request.get_json())
    return _med_res.dump(MedicamentoService.actualizar(id_medicamento, dto)), 200


@farmacia_bp.get('/medicamentos/<int:id_medicamento>/lotes')
@jwt_required()
@role_required('farmaceutico', 'administrador')
def listar_lotes(id_medicamento):
    return _lote_res_many.dump(LoteService.listar(id_medicamento)), 200


@farmacia_bp.post('/medicamentos/<int:id_medicamento>/lotes')
@jwt_required()
@role_required('farmaceutico', 'administrador')
def crear_lote(id_medicamento):
    dto = _lote_crear.load(request.get_json())
    return _lote_res.dump(LoteService.crear(id_medicamento, dto)), 201



@farmacia_bp.post('/recetas')
@jwt_required()
@role_required('medico')
def crear_receta():
    dto = _receta_crear.load(request.get_json())
    return _receta_res.dump(RecetaService.crear(dto)), 201

@farmacia_bp.get('/recetas')
@jwt_required()
@role_required('medico', 'farmaceutico', 'administrador')
def listar_recetas():
    estado = request.args.get('estado')
    return _receta_res_many.dump(RecetaService.listar(estado)), 200

@farmacia_bp.get('/recetas/<int:id_receta>')
@jwt_required()
@role_required('medico', 'farmaceutico')
def obtener_receta(id_receta):
    return _receta_res.dump(RecetaService.obtener(id_receta)), 200


@farmacia_bp.post('/recetas/<int:id_receta>/dispensar')
@jwt_required()
@role_required('farmaceutico')
def dispensar(id_receta):
    dto = _dispensar.load(request.get_json())
    return _receta_res.dump(RecetaService.dispensar(id_receta, dto)), 200


@farmacia_bp.post('/inventario/movimientos')
@jwt_required()
@role_required('farmaceutico', 'administrador')
def crear_movimiento():
    dto = _mov_crear.load(request.get_json())
    return _mov_res.dump(InventarioService.crear_movimiento(dto)), 201


@farmacia_bp.get('/inventario/movimientos')
@jwt_required()
@role_required('farmaceutico', 'administrador')
def listar_movimientos():
    return _mov_res_many.dump(InventarioService.listar(
        id_lote=request.args.get('lote', type=int),
        tipo=request.args.get('tipo'),
    )), 200
