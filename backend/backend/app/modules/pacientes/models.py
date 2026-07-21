from sqlalchemy import CheckConstraint, Index
from app.extensions import db
from app.core.base_model import BaseModel


class Seguro(BaseModel):
    __tablename__ = 'seguro'

    id_seguro = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(100), nullable=False)
    tipo_cobertura = db.Column(db.String(50), nullable=False)
    porcentaje_cobertura = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    activo = db.Column(db.Boolean, nullable=False, default=True)

    __table_args__ = (
        CheckConstraint('porcentaje_cobertura BETWEEN 0 AND 100', name='ck_seguro_porcentaje'),
    )


class Paciente(BaseModel):
    __tablename__ = 'paciente'

    id_paciente = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    ci = db.Column(db.String(20), nullable=False, unique=True)
    id_unico = db.Column(db.String(20), nullable=False, unique=True)
    nombres = db.Column(db.String(100), nullable=False)
    apellidos = db.Column(db.String(100), nullable=False)
    fecha_nacimiento = db.Column(db.Date, nullable=False)
    direccion = db.Column(db.String(200))
    telefono = db.Column(db.String(20))
    email = db.Column(db.String(100))
    id_seguro = db.Column(db.BigInteger, db.ForeignKey('seguro.id_seguro'))
    activo = db.Column(db.Boolean, nullable=False, default=True)

    seguro = db.relationship('Seguro', backref='pacientes')

    __table_args__ = (
        Index('ix_paciente_apellidos', 'apellidos'),
    )
