# Sistema SIIH — Hospital Universitario San Andrés

Sistema Integrado de Información Hospitalaria. Proyecto académico UMSA.

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (incluye Docker Compose)
- Python 3.11+

## Arranque rápido

### 1. Copiar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` y cambiar al menos `SECRET_KEY` y `JWT_SECRET_KEY`.

### 2. Levantar PostgreSQL

```bash
docker compose up -d
```

Verificar que el contenedor esté saludable:

```bash
docker compose ps
```

La columna `STATUS` debe mostrar `healthy`.

### 3. Crear entorno virtual e instalar dependencias

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Configurar la variable de entorno de Flask

```bash
# Windows (PowerShell)
$env:FLASK_APP = "wsgi.py"

# Windows (CMD)
set FLASK_APP=wsgi.py

# Linux / Mac
export FLASK_APP=wsgi.py
```

### 5. Inicializar y aplicar migraciones

```bash
flask db init
flask db migrate -m "esquema inicial"
```

> **Importante:** antes de aplicar, revisar el archivo generado en `migrations/versions/`.
> Verificar que estén los índices, los UNIQUE y el CheckConstraint `ck_usuario_personal_o_paciente`.
> Corregir a mano lo que Alembic no haya detectado.

```bash
flask db upgrade
```

### 6. Cargar datos de prueba

```bash
flask seed
```

Crea roles, especialidades, usuarios por rol y pacientes de demo. Es idempotente.

### 7. Levantar el servidor

```bash
flask run
```

La API queda disponible en `http://localhost:5000`.

---

## Verificación del esquema en PostgreSQL

Conectar al contenedor:

```bash
docker exec -it sistema-siih-db-1 psql -U siih_user -d siih
```

Ejecutar las siguientes comprobaciones:

```sql
-- Debe dar 22
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Debe dar 29
SELECT count(*) FROM pg_constraint WHERE contype = 'c' AND connamespace = 'public'::regnamespace;

-- Debe dar 31
SELECT count(*) FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace;

-- Debe mostrar ck_usuario_personal_o_paciente
\d+ usuario
```

Estos inserts deben **fallar** (probar para confirmar las restricciones):

```sql
-- usuario con ambos FKs a la vez → debe fallar
INSERT INTO usuario (id_personal, id_paciente, nombre_usuario, hash_password)
VALUES (1, 1, 'test', 'hash');

-- lote con stock negativo → debe fallar
INSERT INTO lote (id_medicamento, numero_lote, fecha_vencimiento, cantidad_actual)
VALUES (1, 'L-001', '2025-01-01', -1);

-- movimiento con tipo inválido → debe fallar
INSERT INTO movimiento_inventario (id_lote, id_usuario, tipo, cantidad, fecha_hora)
VALUES (1, 1, 'INVENTADO', 10, NOW());
```

---

## Estructura del proyecto

```
Sistema-SIIH/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── backend/
│   ├── requirements.txt
│   ├── wsgi.py
│   └── app/
│       ├── extensions.py       ← db, jwt, ma, cors (todos importan de aquí)
│       ├── config.py
│       ├── __init__.py         ← create_app()
│       ├── core/
│       │   ├── base_model.py   ← created_at / updated_at
│       │   ├── errors.py       ← excepciones de dominio + handlers
│       │   ├── security.py     ← hash, validar_password, @role_required
│       │   ├── audit.py        ← BitacoraAuditoria + registrar_auditoria()
│       │   └── storage.py      ← StorageService (abstracto) + LocalStorage
│       └── modules/
│           ├── auth/           ← rol, especialidad, personal, usuario
│           ├── pacientes/      ← paciente, seguro
│           ├── citas/          ← cita, triaje
│           ├── atencion/       ← historia_clinica, alergia_paciente,
│           │                      consulta, diagnostico, internacion
│           ├── farmacia/       ← medicamento, lote, receta,
│           │                      detalle_receta, movimiento_inventario
│           ├── documentos/     ← documento (polimórfico)
│           ├── facturacion/    ← factura, detalle_factura (fuera de alcance v1)
│           ├── auditoria/      ← rutas de consulta de bitácora
│           └── reportes/       ← reportes agregados (datos fijos)
└── docs/
    └── schema.sql              ← especificación SQL completa (22 tablas)
```

Cada módulo sigue siempre el mismo patrón:

| Archivo | Responsabilidad |
|---|---|
| `models.py` | Entidad → tabla SQLAlchemy |
| `schemas.py` | DTO → contrato de la API (Marshmallow) |
| `service.py` | Lógica de negocio + ORM. Sin HTTP. |
| `routes.py` | HTTP → llama al service. Sin BD. |

---

## Stack

| Capa | Tecnología |
|---|---|
| API | Flask 3 + Blueprints |
| ORM | SQLAlchemy 2 (Flask-SQLAlchemy) |
| Migraciones | Alembic (Flask-Migrate) |
| DTOs | Marshmallow + flask-marshmallow |
| Auth | Flask-JWT-Extended (JWT 8 h) |
| Base de datos | PostgreSQL 16 (Docker) |
| Frontend | React 18 + Vite + TailwindCSS |
