from sqlalchemy import CheckConstraint, Index
from app.extensions import db
from app.core.base_model import BaseModel


class Factura(BaseModel):
    __tablename__ = 'factura'

    id_factura = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_paciente = db.Column(db.BigInteger, db.ForeignKey('paciente.id_paciente'), nullable=False)
    id_cajero = db.Column(db.BigInteger, db.ForeignKey('personal.id_personal'), nullable=False)
    fecha = db.Column(db.DateTime, nullable=False)
    total = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    estado = db.Column(db.String(20), nullable=False, default='PENDIENTE')
    cuf_sin = db.Column(db.String(100))

    paciente = db.relationship('Paciente', backref='facturas')
    cajero = db.relationship('Personal', backref='facturas')

    __table_args__ = (
        CheckConstraint("estado IN ('PENDIENTE','PAGADA','ANULADA')", name='ck_factura_estado'),
        CheckConstraint('total >= 0', name='ck_factura_total'),
        Index('ix_factura_paciente', 'id_paciente'),
    )


class DetalleFactura(BaseModel):
    __tablename__ = 'detalle_factura'

    id_detalle_factura = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    id_factura = db.Column(db.BigInteger, db.ForeignKey('factura.id_factura'), nullable=False)
    concepto = db.Column(db.String(30), nullable=False)
    descripcion = db.Column(db.String(200), nullable=False)
    referencia_id = db.Column(db.BigInteger)
    cantidad = db.Column(db.Integer, nullable=False, default=1)
    precio_unitario = db.Column(db.Numeric(12, 2), nullable=False)
    subtotal = db.Column(db.Numeric(12, 2), nullable=False)

    factura = db.relationship('Factura', backref='detalles')

    __table_args__ = (
        CheckConstraint(
            "concepto IN ('CONSULTA','MEDICAMENTO','EXAMEN','INTERNACION','OTRO')",
            name='ck_detalle_factura_concepto'
        ),
        CheckConstraint('cantidad > 0', name='ck_detalle_factura_cantidad'),
        CheckConstraint('precio_unitario >= 0 AND subtotal >= 0', name='ck_detalle_factura_montos'),
        Index('ix_detalle_factura', 'id_factura'),
    )
