from sqlalchemy import CheckConstraint, Index, UniqueConstraint
from app.extensions import db
from app.core.base_model import BaseModel


class Medicamento(BaseModel):
    __tablename__ = 'medicamento'

    id_medicamento = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    nombre_comercial = db.Column(db.String(150), nullable=False)
    principio_activo = db.Column(db.String(150), nullable=False)
    presentacion = db.Column(db.String(100), nullable=False)
    requiere_receta = db.Column(db.Boolean, nullable=False, default=True)
    stock_minimo = db.Column(db.Integer, nullable=False, default=0)
    activo = db.Column(db.Boolean, nullable=False, default=True)

    __table_args__ = (
        CheckConstraint('stock_minimo >= 0', name='ck_medicamento_stock_min'),
    )


class Lote(BaseModel):
    __tablename__ = 'lote'

    id_lote = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_medicamento = db.Column(db.BigInteger, db.ForeignKey('medicamento.id_medicamento'), nullable=False)
    numero_lote = db.Column(db.String(50), nullable=False)
    fecha_vencimiento = db.Column(db.Date, nullable=False)
    cantidad_actual = db.Column(db.Integer, nullable=False, default=0)
    ubicacion = db.Column(db.String(100))

    medicamento = db.relationship('Medicamento', backref='lotes')

    __table_args__ = (
        CheckConstraint('cantidad_actual >= 0', name='ck_lote_cantidad'),
        UniqueConstraint('id_medicamento', 'numero_lote', name='ux_lote_medicamento_numero'),
        Index('ix_lote_medicamento_venc', 'id_medicamento', 'fecha_vencimiento'),
        Index('ix_lote_vencimiento', 'fecha_vencimiento'),
    )


class Receta(BaseModel):
    __tablename__ = 'receta'

    id_receta = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_consulta = db.Column(db.BigInteger, db.ForeignKey('consulta.id_consulta'), nullable=False)
    id_medico = db.Column(db.BigInteger, db.ForeignKey('personal.id_personal'), nullable=False)
    fecha_emision = db.Column(db.DateTime, nullable=False)
    estado = db.Column(db.String(20), nullable=False, default='EMITIDA')
    fecha_dispensacion = db.Column(db.DateTime)

    consulta = db.relationship('Consulta', backref='recetas')
    medico = db.relationship('Personal', backref='recetas')

    __table_args__ = (
        CheckConstraint(
            "estado IN ('EMITIDA','RESERVADA','DISPENSADA','PARCIAL','EXPIRADA')",
            name='ck_receta_estado'
        ),
        Index('ix_receta_estado', 'estado'),
        Index('ix_receta_consulta', 'id_consulta'),
    )


class DetalleReceta(BaseModel):
    __tablename__ = 'detalle_receta'

    id_detalle_receta = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_receta = db.Column(db.BigInteger, db.ForeignKey('receta.id_receta'), nullable=False)
    id_medicamento = db.Column(db.BigInteger, db.ForeignKey('medicamento.id_medicamento'), nullable=False)
    dosis = db.Column(db.String(100), nullable=False)
    frecuencia = db.Column(db.String(100), nullable=False)
    duracion = db.Column(db.String(50), nullable=False)
    indicaciones = db.Column(db.Text)
    cantidad = db.Column(db.Integer, nullable=False, default=1)
    cantidad_entregada = db.Column(db.Integer, nullable=False, default=0)

    receta = db.relationship('Receta', backref='detalles')
    medicamento = db.relationship('Medicamento', backref='detalles_receta')

    __table_args__ = (
        CheckConstraint('cantidad > 0', name='ck_detalle_receta_cantidad'),
        CheckConstraint(
            'cantidad_entregada >= 0 AND cantidad_entregada <= cantidad',
            name='ck_detalle_receta_entregada'
        ),
    )


class MovimientoInventario(BaseModel):
    __tablename__ = 'movimiento_inventario'

    id_movimiento = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_lote = db.Column(db.BigInteger, db.ForeignKey('lote.id_lote'), nullable=False)
    id_usuario = db.Column(db.BigInteger, db.ForeignKey('usuario.id_usuario'), nullable=False)
    tipo = db.Column(db.String(20), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    fecha_hora = db.Column(db.DateTime, nullable=False)
    referencia = db.Column(db.String(100))

    lote = db.relationship('Lote', backref='movimientos')
    usuario = db.relationship('Usuario', backref='movimientos_inventario')

    __table_args__ = (
        CheckConstraint(
            "tipo IN ('ENTRADA','SALIDA','AJUSTE','RESERVA','MERMA')",
            name='ck_movimiento_tipo'
        ),
        CheckConstraint('cantidad <> 0', name='ck_movimiento_cantidad'),
        Index('ix_movimiento_lote_fecha', 'id_lote', 'fecha_hora'),
    )
