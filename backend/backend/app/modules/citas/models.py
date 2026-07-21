from sqlalchemy import CheckConstraint, Index
from sqlalchemy.dialects.postgresql import JSONB
from app.extensions import db
from app.core.base_model import BaseModel


class Cita(BaseModel):
    __tablename__ = 'cita'

    id_cita = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_paciente = db.Column(db.BigInteger, db.ForeignKey('paciente.id_paciente'), nullable=False)
    id_medico = db.Column(db.BigInteger, db.ForeignKey('personal.id_personal'))
    fecha_hora = db.Column(db.DateTime, nullable=False)
    estado = db.Column(db.String(20), nullable=False, default='PROGRAMADA')
    tipo_ingreso = db.Column(db.String(30), nullable=False, default='CONSULTA_EXTERNA')
    canal_solicitud = db.Column(db.String(20), nullable=False, default='ADMISION')
    notas = db.Column(db.Text)

    paciente = db.relationship('Paciente', backref='citas')
    medico = db.relationship('Personal', backref='citas', foreign_keys=[id_medico])

    __table_args__ = (
        CheckConstraint(
            "estado IN ('PROGRAMADA','CONFIRMADA','EN_TRIAJE','ATENDIDA','CANCELADA','NO_ASISTIO')",
            name='ck_cita_estado'
        ),
        CheckConstraint(
            "tipo_ingreso IN ('CONSULTA_EXTERNA','URGENCIA','EMERGENCIA')",
            name='ck_cita_tipo_ingreso'
        ),
        CheckConstraint(
            "canal_solicitud IN ('MOVIL','ADMISION','EMERGENCIA')",
            name='ck_cita_canal'
        ),
        CheckConstraint(
            "tipo_ingreso <> 'CONSULTA_EXTERNA' OR id_medico IS NOT NULL",
            name='ck_cita_medico_si_programada'
        ),
        Index('ix_cita_medico_fecha', 'id_medico', 'fecha_hora'),
        Index('ix_cita_paciente', 'id_paciente'),
        Index('ix_cita_tipo_estado', 'tipo_ingreso', 'estado'),
    )


class Triaje(BaseModel):
    __tablename__ = 'triaje'

    id_triaje = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_cita = db.Column(db.BigInteger, db.ForeignKey('cita.id_cita'), nullable=False)
    id_evaluador = db.Column(db.BigInteger, db.ForeignKey('personal.id_personal'), nullable=False)
    nivel = db.Column(db.Integer, nullable=False)
    color = db.Column(db.String(15), nullable=False)
    sintomas = db.Column(db.Text)
    signos_vitales = db.Column(JSONB)
    fecha_hora = db.Column(db.DateTime, nullable=False)

    cita = db.relationship('Cita', backref='triajes')
    evaluador = db.relationship('Personal', backref='triajes')

    __table_args__ = (
        CheckConstraint('nivel BETWEEN 1 AND 5', name='ck_triaje_nivel'),
        CheckConstraint(
            "(nivel = 1 AND color = 'rojo') OR "
            "(nivel = 2 AND color = 'naranja') OR "
            "(nivel = 3 AND color = 'amarillo') OR "
            "(nivel = 4 AND color = 'verde') OR "
            "(nivel = 5 AND color = 'azul')",
            name='ck_triaje_nivel_color'
        ),
        Index('ix_triaje_cita_fecha', 'id_cita', 'fecha_hora'),
        Index('ix_triaje_nivel', 'nivel', 'fecha_hora'),
    )
