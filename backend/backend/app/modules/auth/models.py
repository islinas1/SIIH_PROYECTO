from sqlalchemy import CheckConstraint, Index, text
from app.extensions import db
from app.core.base_model import BaseModel


class Rol(BaseModel):
    __tablename__ = 'rol'

    id_rol = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(50), nullable=False, unique=True)
    descripcion = db.Column(db.Text)

    __table_args__ = (
        CheckConstraint(
            "nombre IN ('recepcion','medico','enfermera','farmaceutico','cajero',"
            "'administrador','direccion','paciente')",
            name='ck_rol_nombre'
        ),
    )


class Especialidad(BaseModel):
    __tablename__ = 'especialidad'

    id_especialidad = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)
    descripcion = db.Column(db.String(200))


class Personal(BaseModel):
    __tablename__ = 'personal'

    id_personal = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_rol = db.Column(db.BigInteger, db.ForeignKey('rol.id_rol'), nullable=False)
    id_especialidad = db.Column(db.BigInteger, db.ForeignKey('especialidad.id_especialidad'))
    ci = db.Column(db.String(20), nullable=False, unique=True)
    nombres = db.Column(db.String(100), nullable=False)
    apellidos = db.Column(db.String(100), nullable=False)
    matricula = db.Column(db.String(50))
    telefono = db.Column(db.String(20))
    estado = db.Column(db.String(20), nullable=False, default='ACTIVO')

    rol = db.relationship('Rol', backref='personal_list')
    especialidad = db.relationship('Especialidad', backref='personal_list')

    __table_args__ = (
        CheckConstraint("estado IN ('ACTIVO','INACTIVO')", name='ck_personal_estado'),
    )


class Usuario(BaseModel):
    __tablename__ = 'usuario'

    id_usuario = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_personal = db.Column(db.BigInteger, db.ForeignKey('personal.id_personal'))
    id_paciente = db.Column(db.BigInteger, db.ForeignKey('paciente.id_paciente'))
    nombre_usuario = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(100), nullable=False, unique=True)
    hash_password = db.Column(db.String(255), nullable=False)
    mfa_habilitado = db.Column(db.Boolean, nullable=False, default=False)
    estado = db.Column(db.String(20), nullable=False, default='ACTIVO')
    ultimo_acceso = db.Column(db.DateTime)
    ultimo_logout = db.Column(db.DateTime)
    intentos_fallidos = db.Column(db.Integer, nullable=False, default=0)
    bloqueado_hasta = db.Column(db.DateTime)

    personal = db.relationship('Personal', backref=db.backref('usuario', uselist=False))

    __table_args__ = (
        CheckConstraint("estado IN ('ACTIVO','BLOQUEADO','INACTIVO')", name='ck_usuario_estado'),
        CheckConstraint(
            '(id_personal IS NOT NULL AND id_paciente IS NULL) OR '
            '(id_personal IS NULL AND id_paciente IS NOT NULL)',
            name='ck_usuario_personal_o_paciente'
        ),
        Index('ux_usuario_personal', 'id_personal', unique=True,
              postgresql_where=text('id_personal IS NOT NULL')),
        Index('ux_usuario_paciente', 'id_paciente', unique=True,
              postgresql_where=text('id_paciente IS NOT NULL')),
    )
