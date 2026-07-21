from datetime import date, timedelta
from app.extensions import db
from app.core.security import hash_password


def register_commands(app):
    @app.cli.command('seed')
    def seed():
        """Carga datos iniciales. Idempotente: se puede correr varias veces."""
        _seed_roles()
        _seed_especialidades()
        _seed_personal_y_usuarios()
        _seed_pacientes()
        _seed_medicamentos()
        print("Seed completado.")

    return app


# ── Helpers ────────────────────────────────────────────────────────────────────

def _seed_roles():
    from app.modules.auth.models import Rol
    nombres = ['recepcion', 'medico', 'enfermera', 'farmaceutico',
               'administrador', 'direccion', 'paciente']
    for nombre in nombres:
        if not Rol.query.filter_by(nombre=nombre).first():
            db.session.add(Rol(nombre=nombre))
    db.session.commit()
    print('  Roles: OK')


def _seed_especialidades():
    from app.modules.auth.models import Especialidad
    datos = [
        ('Medicina General',  'Atención primaria'),
        ('Cardiología',       'Enfermedades del corazón'),
        ('Pediatría',         'Atención a menores de edad'),
        ('Urgencias',         'Atención de emergencias'),
    ]
    for nombre, desc in datos:
        if not Especialidad.query.filter_by(nombre=nombre).first():
            db.session.add(Especialidad(nombre=nombre, descripcion=desc))
    db.session.commit()
    print('  Especialidades: OK')


def _seed_personal_y_usuarios():
    from app.modules.auth.models import Rol, Especialidad, Personal, Usuario

    med_general = Especialidad.query.filter_by(nombre='Medicina General').first()
    urgencias   = Especialidad.query.filter_by(nombre='Urgencias').first()

    # (ci, nombres, apellidos, matricula, rol, especialidad, username, password, email)
    datos = [
        ('10100001', 'Carlos',  'Mendoza',   'MAT-001', 'medico',        med_general, 'medico01', 'Medico@1234',  'carlos.mendoza@husa.bo'),
        ('10100002', 'Ana',     'Rodriguez',  None,      'recepcion',     None,        'recep01',  'Recep@1234',   'ana.rodriguez@husa.bo'),
        ('10100003', 'Maria',   'Flores',     None,      'enfermera',     urgencias,   'enfer01',  'Enfer@1234',   'maria.flores@husa.bo'),
        ('10100004', 'Jorge',   'Lima',       None,      'farmaceutico',  None,        'farm01',   'Farm@1234',    'jorge.lima@husa.bo'),
        ('10100005', 'Luis',    'Castro',     None,      'administrador', None,        'admin01',  'Admin@1234',   'luis.castro@husa.bo'),
        ('10100006', 'Sofia',   'Vargas',     None,      'direccion',     None,        'dir01',    'Direc@1234',   'sofia.vargas@husa.bo'),
    ]

    for ci, nombres, apellidos, matricula, rol_nombre, especialidad, username, pwd, email in datos:
        if Personal.query.filter_by(ci=ci).first():
            continue

        rol = Rol.query.filter_by(nombre=rol_nombre).first()
        personal = Personal(
            ci=ci,
            nombres=nombres,
            apellidos=apellidos,
            matricula=matricula,
            id_rol=rol.id_rol,
            id_especialidad=especialidad.id_especialidad if especialidad else None,
            estado='ACTIVO',
        )
        db.session.add(personal)
        db.session.flush()

        if not Usuario.query.filter_by(nombre_usuario=username).first():
            db.session.add(Usuario(
                id_personal=personal.id_personal,
                nombre_usuario=username,
                email=email,
                hash_password=hash_password(pwd),
                estado='ACTIVO',
            ))

    db.session.commit()
    print('  Personal y usuarios: OK')


def _seed_pacientes():
    from app.modules.auth.models import Usuario
    from app.modules.pacientes.models import Paciente

    # (ci, id_unico, nombres, apellidos, fecha_nac, username, password, email)
    datos = [
        ('20200001', 'HUSA-000001', 'Pedro',  'Gomez',   date(1985,  3, 15), 'pac01', 'Paciente@1234', 'pedro.gomez@gmail.com'),
        ('20200002', 'HUSA-000002', 'Rosa',   'Quispe',  date(1990,  7, 22), 'pac02', 'Paciente@1234', 'rosa.quispe@gmail.com'),
        ('20200003', 'HUSA-000003', 'Juan',   'Mamani',  date(1975, 11,  8), None,    None,            None),
        ('20200004', 'HUSA-000004', 'Elena',  'Torrico', date(2000,  1, 30), None,    None,            None),
        ('20200005', 'HUSA-000005', 'Marco',  'Vidal',   date(1968,  5, 12), None,    None,            None),
    ]

    for ci, id_unico, nombres, apellidos, fecha_nac, username, pwd, email in datos:
        if Paciente.query.filter_by(ci=ci).first():
            continue

        paciente = Paciente(
            ci=ci,
            id_unico=id_unico,
            nombres=nombres,
            apellidos=apellidos,
            fecha_nacimiento=fecha_nac,
            activo=True,
        )
        db.session.add(paciente)
        db.session.flush()

        if username and not Usuario.query.filter_by(nombre_usuario=username).first():
            db.session.add(Usuario(
                id_paciente=paciente.id_paciente,
                nombre_usuario=username,
                email=email,
                hash_password=hash_password(pwd),
                estado='ACTIVO',
            ))

    db.session.commit()
    print('  Pacientes: OK')


def _seed_medicamentos():
    from app.modules.farmacia.models import Medicamento, Lote

    hoy = date.today()

    datos = [
        ('Amoxicilina 500mg',    'amoxicilina',  'Cápsula 500mg',       True,  20),
        ('Ibuprofeno 400mg',     'ibuprofeno',   'Comprimido 400mg',    False, 30),
        ('Paracetamol 500mg',    'paracetamol',  'Comprimido 500mg',    False, 50),
        ('Omeprazol 20mg',       'omeprazol',    'Cápsula 20mg',        True,  15),
        ('Metformina 850mg',     'metformina',   'Comprimido 850mg',    True,  25),
        ('Enalapril 10mg',       'enalapril',    'Comprimido 10mg',     True,  20),
        ('Losartán 50mg',        'losartan',     'Comprimido 50mg',     True,  20),
        ('Azitromicina 500mg',   'azitromicina', 'Comprimido 500mg',    True,  10),
        ('Loratadina 10mg',      'loratadina',   'Comprimido 10mg',     False, 30),
        ('Salbutamol inhalador', 'salbutamol',   'Inhalador 100mcg',    True,   5),
    ]

    for nombre_com, principio, presentacion, req_receta, stock_min in datos:
        if Medicamento.query.filter_by(nombre_comercial=nombre_com).first():
            continue

        med = Medicamento(
            nombre_comercial=nombre_com,
            principio_activo=principio,
            presentacion=presentacion,
            requiere_receta=req_receta,
            stock_minimo=stock_min,
            activo=True,
        )
        db.session.add(med)
        db.session.flush()

        # Lote con stock normal (vence en 1 año)
        db.session.add(Lote(
            id_medicamento=med.id_medicamento,
            numero_lote=f'L-{med.id_medicamento:03d}-A',
            fecha_vencimiento=hoy + timedelta(days=365),
            cantidad_actual=100,
            ubicacion='Estante A',
        ))
        # Lote próximo a vencer — para probar alerta RF-F02
        db.session.add(Lote(
            id_medicamento=med.id_medicamento,
            numero_lote=f'L-{med.id_medicamento:03d}-B',
            fecha_vencimiento=hoy + timedelta(days=25),
            cantidad_actual=20,
            ubicacion='Estante B',
        ))

    db.session.commit()
    print('  Medicamentos y lotes: OK')
