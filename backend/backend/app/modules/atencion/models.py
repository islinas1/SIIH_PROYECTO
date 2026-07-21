from sqlalchemy import CheckConstraint, Index, UniqueConstraint, text
from app.extensions import db
from app.core.base_model import BaseModel


class HistoriaClinica(BaseModel):
    __tablename__ = 'historia_clinica'

    id_historia = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_paciente = db.Column(db.BigInteger, db.ForeignKey('paciente.id_paciente'), nullable=False, unique=True)
    fecha_apertura = db.Column(db.Date, nullable=False)
    antecedentes = db.Column(db.Text)
    alergias = db.Column(db.Text)
    observaciones = db.Column(db.Text)

    paciente = db.relationship('Paciente', backref=db.backref('historia_clinica', uselist=False))


class AlergiaPaciente(BaseModel):
    __tablename__ = 'alergia_paciente'

    id_alergia = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_historia = db.Column(db.BigInteger, db.ForeignKey('historia_clinica.id_historia'), nullable=False)
    principio_activo = db.Column(db.String(150), nullable=False)
    severidad = db.Column(db.String(20), nullable=False, default='MODERADA')
    notas = db.Column(db.Text)

    historia = db.relationship('HistoriaClinica', backref='alergias_registradas')

    __table_args__ = (
        CheckConstraint("severidad IN ('LEVE','MODERADA','SEVERA','CRITICA')", name='ck_alergia_severidad'),
        UniqueConstraint('id_historia', 'principio_activo', name='ux_alergia_historia_principio'),
        Index('ix_alergia_principio', 'principio_activo'),
    )


class Consulta(BaseModel):
    __tablename__ = 'consulta'

    id_consulta = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_historia = db.Column(db.BigInteger, db.ForeignKey('historia_clinica.id_historia'), nullable=False)
    id_medico = db.Column(db.BigInteger, db.ForeignKey('personal.id_personal'), nullable=False)
    id_cita = db.Column(db.BigInteger, db.ForeignKey('cita.id_cita'))
    fecha_hora = db.Column(db.DateTime, nullable=False)
    motivo = db.Column(db.Text, nullable=False)
    tratamiento = db.Column(db.Text)
    evolucion = db.Column(db.Text)

    historia = db.relationship('HistoriaClinica', backref='consultas')
    medico = db.relationship('Personal', backref='consultas')

    __table_args__ = (
        Index('ix_consulta_historia_fecha', 'id_historia', 'fecha_hora'),
    )


class Diagnostico(BaseModel):
    __tablename__ = 'diagnostico'

    id_diagnostico = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_consulta = db.Column(db.BigInteger, db.ForeignKey('consulta.id_consulta'), nullable=False)
    codigo_cie10 = db.Column(db.String(10), nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    tipo = db.Column(db.String(30), nullable=False, default='PRINCIPAL')

    consulta = db.relationship('Consulta', backref='diagnosticos')

    __table_args__ = (
        CheckConstraint("tipo IN ('PRINCIPAL','SECUNDARIO','PRESUNTIVO')", name='ck_diagnostico_tipo'),
    )


class Internacion(BaseModel):
    __tablename__ = 'internacion'

    id_internacion = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_paciente = db.Column(db.BigInteger, db.ForeignKey('paciente.id_paciente'), nullable=False)
    id_medico_tratante = db.Column(db.BigInteger, db.ForeignKey('personal.id_personal'), nullable=False)
    id_consulta_origen = db.Column(db.BigInteger, db.ForeignKey('consulta.id_consulta'))
    fecha_ingreso = db.Column(db.DateTime, nullable=False)
    fecha_alta = db.Column(db.DateTime)
    habitacion = db.Column(db.String(20), nullable=False)
    cama = db.Column(db.String(20), nullable=False)
    motivo_ingreso = db.Column(db.Text, nullable=False)
    motivo_alta = db.Column(db.Text)

    paciente = db.relationship('Paciente', backref='internaciones')
    medico_tratante = db.relationship('Personal', backref='internaciones')

    __table_args__ = (
        CheckConstraint('fecha_alta IS NULL OR fecha_alta >= fecha_ingreso', name='ck_internacion_fechas'),
        CheckConstraint(
            '(fecha_alta IS NULL AND motivo_alta IS NULL) OR fecha_alta IS NOT NULL',
            name='ck_internacion_motivo_alta'
        ),
        Index('ux_internacion_paciente_activa', 'id_paciente', unique=True,
              postgresql_where=text('fecha_alta IS NULL')),
        Index('ux_internacion_cama_activa', 'habitacion', 'cama', unique=True,
              postgresql_where=text('fecha_alta IS NULL')),
        Index('ix_internacion_activa', 'fecha_ingreso',
              postgresql_where=text('fecha_alta IS NULL')),
        Index('ix_internacion_paciente', 'id_paciente'),
    )
