from flask import Flask
from app.extensions import db, migrate, jwt, ma, cors
from app.config import config


def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    ma.init_app(app)
    cors.init_app(app, resources={"/api/*": {"origins": ["http://localhost:5173"]}},
                  supports_credentials=True)

    with app.app_context():
        from app.core import audit  # noqa: F401
        from app.modules.auth import models  # noqa: F401
        from app.modules.pacientes import models  # noqa: F401
        from app.modules.citas import models  # noqa: F401
        from app.modules.atencion import models  # noqa: F401
        from app.modules.farmacia import models  # noqa: F401
        from app.modules.documentos import models  # noqa: F401
        from app.modules.facturacion import models  # noqa: F401

    from app.core.errors import register_error_handlers
    register_error_handlers(app)

    @jwt.token_in_blocklist_loader
    def verificar_token_revocado(jwt_header, jwt_data):
        from datetime import datetime
        from app.modules.auth.models import Usuario
        usuario = db.session.get(Usuario, int(jwt_data['sub']))
        if usuario and usuario.ultimo_logout:
            iat = datetime.utcfromtimestamp(jwt_data['iat'])
            return iat < usuario.ultimo_logout
        return False

    from app.cli import register_commands
    register_commands(app)

    from app.modules.auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api')

    from app.modules.pacientes.routes import pacientes_bp
    app.register_blueprint(pacientes_bp, url_prefix='/api')

    from app.modules.documentos.routes import documentos_bp
    app.register_blueprint(documentos_bp, url_prefix='/api')

    from app.modules.citas.routes import citas_bp
    app.register_blueprint(citas_bp, url_prefix='/api')

    from app.modules.atencion.routes import atencion_bp
    app.register_blueprint(atencion_bp, url_prefix='/api')

    from app.modules.farmacia.routes import farmacia_bp
    app.register_blueprint(farmacia_bp, url_prefix='/api')

    from app.modules.auditoria.routes import auditoria_bp
    app.register_blueprint(auditoria_bp, url_prefix='/api')

    from app.modules.reportes.routes import reportes_bp
    app.register_blueprint(reportes_bp, url_prefix='/api')

    return app
