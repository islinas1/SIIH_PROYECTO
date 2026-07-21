from flask import jsonify
import marshmallow


class AppError(Exception):
    status_code = 500
    codigo = 'ERROR_INTERNO'

    def __init__(self, mensaje, codigo=None):
        self.mensaje = mensaje
        if codigo:
            self.codigo = codigo
        super().__init__(mensaje)


class ValidationError(AppError):
    status_code = 400
    codigo = 'VALIDACION'


class ForbiddenError(AppError):
    status_code = 403
    codigo = 'PROHIBIDO'


class NotFoundError(AppError):
    status_code = 404
    codigo = 'NO_ENCONTRADO'


class ConflictError(AppError):
    status_code = 409
    codigo = 'CONFLICTO'


def register_error_handlers(app):
    @app.errorhandler(AppError)
    def handle_app_error(e):
        return jsonify({'error': e.mensaje, 'codigo': e.codigo}), e.status_code

    @app.errorhandler(marshmallow.ValidationError)
    def handle_marshmallow_error(e):
        return jsonify({'error': 'Datos inválidos', 'codigo': 'VALIDACION', 'campos': e.messages}), 400

    @app.errorhandler(404)
    def handle_404(e):
        return jsonify({'error': 'Recurso no encontrado', 'codigo': 'NO_ENCONTRADO'}), 404

    @app.errorhandler(405)
    def handle_405(e):
        return jsonify({'error': 'Método no permitido', 'codigo': 'METODO_NO_PERMITIDO'}), 405

    @app.errorhandler(500)
    def handle_500(e):
        return jsonify({'error': 'Error interno del servidor', 'codigo': 'ERROR_INTERNO'}), 500
