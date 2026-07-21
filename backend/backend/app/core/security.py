import re
from functools import wraps
from flask import g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from app.core.errors import ValidationError, ForbiddenError


def hash_password(password):
    return generate_password_hash(password)


def verify_password(password, hashed):
    return check_password_hash(hashed, password)


def validar_password(pwd):
    if len(pwd) < 8:
        raise ValidationError('La contraseña debe tener al menos 8 caracteres.')
    if not re.search(r'[A-Z]', pwd):
        raise ValidationError('La contraseña debe tener al menos una mayúscula.')
    if not re.search(r'[a-z]', pwd):
        raise ValidationError('La contraseña debe tener al menos una minúscula.')
    if not re.search(r'\d', pwd):
        raise ValidationError('La contraseña debe tener al menos un número.')
    if not re.search(r'[^A-Za-z0-9]', pwd):
        raise ValidationError('La contraseña debe tener al menos un carácter especial.')


def current_user():
    from app.modules.auth.models import Usuario
    user_id = get_jwt_identity()
    return db.session.get(Usuario, user_id)


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            from app.modules.auth.models import Usuario
            from app.extensions import db
            user_id = int(get_jwt_identity())
            user = db.session.get(Usuario, user_id)
            g.current_user = user

            user_role = None
            if user.id_personal and user.personal:
                user_role = user.personal.rol.nombre
            elif user.id_paciente:
                user_role = 'paciente'

            if user_role not in roles:
                from app.core.audit import registrar_auditoria
                try:
                    registrar_auditoria('ACCESO_DENEGADO')
                except Exception:
                    pass
                raise ForbiddenError('No autorizado para acceder a este recurso.')

            return fn(*args, **kwargs)
        return wrapper
    return decorator
