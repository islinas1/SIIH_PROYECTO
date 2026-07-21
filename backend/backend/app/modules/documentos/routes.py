from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required

from app.modules.documentos.schemas import DocumentoResponse
from app.modules.documentos.service import DocumentoService
from app.core.security import role_required
from app.core.errors import ValidationError

documentos_bp = Blueprint('documentos', __name__)

_res = DocumentoResponse()
_res_many = DocumentoResponse(many=True)


@documentos_bp.post('/documentos')
@jwt_required()
@role_required('medico', 'enfermera', 'administrador')
def subir():
    archivo = request.files.get('archivo')
    if not archivo or archivo.filename == '':
        raise ValidationError('No se envió ningún archivo')

    doc = DocumentoService.subir(
        archivo=archivo,
        entidad_tipo=request.form.get('entidad_tipo', ''),
        entidad_id=int(request.form.get('entidad_id', 0)),
        id_paciente=int(request.form.get('id_paciente', 0)),
        categoria=request.form.get('categoria', 'OTRO'),
    )
    return _res.dump(doc), 201


@documentos_bp.get('/documentos')
@jwt_required()
@role_required('medico', 'enfermera', 'administrador')
def listar():
    entidad_tipo = request.args.get('entidad_tipo', '')
    entidad_id = int(request.args.get('entidad_id', 0))
    return _res_many.dump(DocumentoService.listar(entidad_tipo, entidad_id)), 200


@documentos_bp.get('/documentos/<int:id_documento>/descargar')
@jwt_required()
@role_required('medico', 'enfermera', 'administrador')
def descargar(id_documento):
    ruta, nombre = DocumentoService.ruta_archivo(id_documento)
    return send_file(ruta, download_name=nombre, as_attachment=True)


@documentos_bp.delete('/documentos/<int:id_documento>')
@jwt_required()
@role_required('administrador')
def eliminar(id_documento):
    DocumentoService.eliminar(id_documento)
    return {'mensaje': 'Documento eliminado correctamente.'}, 200
