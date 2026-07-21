# SIIH — Endpoints de la API

Base URL: `http://localhost:5000/api`

Todos los endpoints (excepto login) requieren header:
```
Authorization: Bearer <access_token>
```

---

## AUTH

### POST /auth/login
Autentica un usuario y devuelve un JWT.
- **Roles:** público
- **Body:** `{ nombre_usuario, password }`
- **Respuesta:** `{ access_token, tipo, nombre_usuario, rol }`
- **Errores:** 400 credenciales inválidas · 403 cuenta bloqueada

### POST /auth/logout
Invalida el token actual (logout server-side).
- **Roles:** todos
- **Errores:** 401 sin token

### GET /usuarios
Lista todos los usuarios del sistema.
- **Roles:** administrador
- **Respuesta:** `[{ id_usuario, nombre_usuario, email, estado, rol, tipo, ultimo_acceso }]`

### POST /pacientes/:id/usuario
Crea cuenta de acceso para un paciente existente (app móvil).
- **Roles:** recepcion · administrador
- **Body:** `{ nombre_usuario, email, password }`
- **Respuesta:** `{ id_usuario, nombre_usuario, email, estado }`
- **Errores:** 404 paciente · 409 usuario/email duplicado · 400 contraseña débil

### POST /personal
Crea un empleado y su cuenta de usuario en una sola transacción.
- **Roles:** administrador
- **Body:** `{ ci, nombres, apellidos, id_rol, id_especialidad?, matricula?, telefono?, nombre_usuario, email, password }`
- **Respuesta:** `{ id_personal, ci, nombres, apellidos, rol, especialidad, nombre_usuario, email, estado }`
- **Errores:** 404 rol/especialidad · 409 CI/usuario/email duplicado · 400 contraseña débil

### GET /personal
Lista todo el personal activo.
- **Roles:** administrador · direccion
- **Respuesta:** `[{ id_personal, ci, nombres, apellidos, rol, especialidad, nombre_usuario, email }]`

### GET /personal/:id
Obtiene un empleado por ID.
- **Roles:** administrador · direccion
- **Errores:** 404 no encontrado

---

## PACIENTES

### POST /pacientes
Registra un nuevo paciente. Genera `id_unico` automáticamente.
- **Roles:** recepcion · administrador
- **Body:** `{ ci, nombres, apellidos, fecha_nacimiento, direccion?, telefono?, email?, id_seguro? }`
- **Respuesta:** `{ id_paciente, ci, id_unico, nombres, apellidos, fecha_nacimiento, ... }`
- **Errores:** 409 CI duplicado

### GET /pacientes
Lista todos los pacientes activos. Acepta búsqueda con `?q=termino`.
- **Roles:** recepcion · medico · enfermera · administrador
- **Query params:** `q` (busca por CI, nombre, apellido o id_unico)

### GET /pacientes/:id
Obtiene un paciente por ID.
- **Roles:** recepcion · medico · enfermera · administrador
- **Errores:** 404 no encontrado

### PATCH /pacientes/:id
Actualiza los campos enviados (PATCH parcial).
- **Roles:** recepcion · administrador
- **Body:** cualquier subconjunto de `{ nombres, apellidos, fecha_nacimiento, direccion, telefono, email, id_seguro }`
- **Errores:** 404 no encontrado

### DELETE /pacientes/:id
Soft delete: marca el paciente como inactivo.
- **Roles:** administrador
- **Errores:** 404 no encontrado

---

## DOCUMENTOS

Archivos: `.pdf .jpg .jpeg .png .dcm` · Máximo 20 MB.
Los bytes se guardan en disco (`uploads/`), en BD solo van los metadatos.
La descarga pasa siempre por el endpoint autenticado (nunca carpeta estática).

### POST /documentos
Sube un archivo adjunto. Usa `multipart/form-data`.
- **Roles:** medico · enfermera · administrador
- **Form fields:** `archivo` (file) · `entidad_tipo` · `entidad_id` · `id_paciente` · `categoria`
- **Categorías:** `EXAMEN_LABORATORIO · IMAGEN_DIAGNOSTICA · CONSENTIMIENTO · RECETA · OTRO`
- **Respuesta:** metadatos del documento (sin storage_key ni ruta física)
- **Errores:** 400 extensión inválida · 400 tamaño > 20 MB

### GET /documentos?entidad_tipo=consulta&entidad_id=1
Lista documentos de una entidad específica.
- **Roles:** medico · enfermera · administrador

### GET /documentos/:id/descargar
Descarga el archivo. Verifica auth antes de servir el binario.
- **Roles:** medico · enfermera · administrador
- **Errores:** 404 no encontrado

### DELETE /documentos/:id
Elimina metadatos de BD y archivo de disco.
- **Roles:** administrador
- **Errores:** 404 no encontrado

---

## CITAS

### POST /citas
Crea una cita. Consulta externa requiere `id_medico`. Emergencia puede llegar sin médico.
- **Roles:** recepcion · administrador · paciente
- **Body:** `{ id_paciente, fecha_hora, tipo_ingreso, canal_solicitud, id_medico?, notas? }`
- **Tipos:** `CONSULTA_EXTERNA · URGENCIA · EMERGENCIA`
- **Canales:** `MOVIL · ADMISION · EMERGENCIA`
- **Errores:** 404 paciente/médico · 409 médico con cita en ese horario · 400 consulta externa sin médico

### GET /citas
Lista citas con filtros opcionales.
- **Roles:** recepcion · medico · enfermera · administrador
- **Query params:** `paciente` (id) · `medico` (id) · `estado` · `fecha` (YYYY-MM-DD)
- **Respuesta:** cita con nombre del paciente y médico incluidos

### GET /citas/:id
Obtiene una cita por ID.
- **Roles:** recepcion · medico · enfermera · administrador
- **Errores:** 404 no encontrada

### PATCH /citas/:id
Actualiza estado, médico asignado o notas.
- **Roles:** recepcion · medico · enfermera · administrador
- **Body:** cualquier subconjunto de `{ estado, id_medico, notas }`
- **Estados:** `PROGRAMADA · CONFIRMADA · EN_TRIAJE · ATENDIDA · CANCELADA · NO_ASISTIO`
- **Errores:** 404 cita/médico

### POST /citas/:id/triaje
Aplica triaje a la cita. El color se deriva automáticamente del nivel (1=rojo … 5=azul).
- **Roles:** enfermera · medico
- **Body:** `{ nivel (1-5), sintomas?, signos_vitales? }`
- **Respuesta:** triaje con evaluador
- **Errores:** 404 cita

### GET /citas/:id/triaje
Obtiene el triaje más reciente de la cita.
- **Roles:** enfermera · medico · administrador
- **Errores:** 404 cita · 404 sin triaje

---

## ATENCIÓN CLÍNICA

### GET /pacientes/:id/historia
Obtiene la historia clínica del paciente.
- **Roles:** medico · enfermera · administrador
- **Errores:** 404 historia no creada aún

### PATCH /pacientes/:id/historia
Actualiza antecedentes, alergias (texto) u observaciones.
- **Roles:** medico · enfermera
- **Body:** cualquier subconjunto de `{ antecedentes, alergias, observaciones }`
- **Errores:** 404

### GET /pacientes/:id/historia/alergias
Lista las alergias estructuradas del paciente.
- **Roles:** medico · enfermera · farmaceutico
- **Errores:** 404

### POST /pacientes/:id/historia/alergias
Registra una alergia. CRITICA bloquea la prescripción de ese principio activo.
- **Roles:** medico
- **Body:** `{ principio_activo, severidad, notas? }`
- **Severidades:** `LEVE · MODERADA · SEVERA · CRITICA`
- **Errores:** 404 historia · 409 alergia ya registrada para ese principio activo

### DELETE /pacientes/:id/historia/alergias/:id_alergia
Elimina una alergia registrada.
- **Roles:** medico
- **Errores:** 404

### POST /consultas
Crea una consulta médica. Auto-crea la historia clínica si el paciente no tiene una.
- **Roles:** medico
- **Body:** `{ id_paciente, motivo, id_cita?, tratamiento?, evolucion? }`
- **Errores:** 404 paciente

### GET /consultas/:id
Obtiene una consulta con datos del médico.
- **Roles:** medico · enfermera
- **Errores:** 404

### PATCH /consultas/:id
Actualiza motivo, tratamiento o evolución.
- **Roles:** medico
- **Body:** cualquier subconjunto de `{ motivo, tratamiento, evolucion }`
- **Errores:** 404

### POST /consultas/:id/diagnosticos
Agrega un diagnóstico CIE-10 a la consulta.
- **Roles:** medico
- **Body:** `{ codigo_cie10, descripcion, tipo }`
- **Tipos:** `PRINCIPAL · SECUNDARIO · PRESUNTIVO`
- **Errores:** 404 consulta

### GET /consultas/:id/diagnosticos
Lista los diagnósticos de una consulta.
- **Roles:** medico · enfermera
- **Errores:** 404

### POST /internaciones
Interna a un paciente. Valida que no esté ya internado y que la cama esté libre.
- **Roles:** medico · administrador
- **Body:** `{ id_paciente, habitacion, cama, motivo_ingreso, id_consulta_origen? }`
- **Errores:** 404 paciente · 409 paciente ya internado · 409 cama ocupada

### PATCH /internaciones/:id/alta
Da de alta al paciente internado.
- **Roles:** medico · enfermera
- **Body:** `{ motivo_alta }`
- **Errores:** 404 · 409 ya dado de alta

### GET /internaciones
Lista internaciones. Por defecto solo las activas (`fecha_alta IS NULL`).
- **Roles:** medico · enfermera · administrador
- **Query params:** `activas=true|false`

---

## FARMACIA

### GET /medicamentos
Lista medicamentos activos.
- **Roles:** medico · farmaceutico · administrador

### GET /medicamentos/stock-bajo
Lista medicamentos cuyo stock total ≤ stock_minimo.
- **Roles:** farmaceutico · administrador

### GET /medicamentos/:id
Obtiene un medicamento con stock total calculado.
- **Roles:** medico · farmaceutico · administrador
- **Errores:** 404

### POST /medicamentos
Crea un medicamento nuevo.
- **Roles:** farmaceutico · administrador
- **Body:** `{ nombre_comercial, principio_activo, presentacion, stock_minimo, requiere_receta? }`

### PATCH /medicamentos/:id
Actualiza campos del medicamento.
- **Roles:** farmaceutico · administrador
- **Body:** cualquier subconjunto de `{ nombre_comercial, presentacion, stock_minimo, requiere_receta, activo }`
- **Errores:** 404

### GET /medicamentos/:id/lotes
Lista los lotes de un medicamento ordenados por fecha de vencimiento (FIFO).
- **Roles:** farmaceutico · administrador
- **Errores:** 404 medicamento

### POST /medicamentos/:id/lotes
Agrega un lote y registra automáticamente un movimiento ENTRADA.
- **Roles:** farmaceutico · administrador
- **Body:** `{ numero_lote, fecha_vencimiento, cantidad_actual, ubicacion? }`
- **Errores:** 404 medicamento · 409 número de lote duplicado para ese medicamento

### POST /recetas
Emite una receta. Bloquea si el paciente tiene alergia CRITICA a algún principio activo recetado.
- **Roles:** medico
- **Body:** `{ id_consulta, detalles: [{ id_medicamento, dosis, frecuencia, duracion, cantidad, indicaciones? }] }`
- **Errores:** 404 consulta/medicamento · 400 alergia CRÍTICA detectada

### GET /recetas/:id
Obtiene una receta con sus detalles y estado de dispensación.
- **Roles:** medico · farmaceutico
- **Errores:** 404

### POST /recetas/:id/dispensar
Dispensa medicamentos de una receta usando FIFO por fecha de vencimiento.
Actualiza el estado a PARCIAL o DISPENSADA según lo entregado.
- **Roles:** farmaceutico
- **Body:** `{ items: [{ id_detalle_receta, cantidad_a_entregar }] }`
- **Errores:** 404 receta/detalle · 400 receta expirada o ya dispensada · 400 cantidad > pendiente · 409 stock insuficiente

### POST /inventario/movimientos
Registra un movimiento manual (ENTRADA, AJUSTE o MERMA). Actualiza el stock del lote.
- **Roles:** farmaceutico · administrador
- **Body:** `{ id_lote, tipo, cantidad, referencia? }`
- **Tipos permitidos en este endpoint:** `ENTRADA · AJUSTE · MERMA` (SALIDA y RESERVA son automáticos)
- **Errores:** 404 lote · 409 stock insuficiente para MERMA/AJUSTE

### GET /inventario/movimientos
Lista movimientos de inventario con filtros opcionales.
- **Roles:** farmaceutico · administrador
- **Query params:** `lote` (id_lote) · `tipo`

---

## AUDITORÍA

### GET /auditoria
Lista entradas de la bitácora de auditoría con filtros opcionales.
- **Roles:** administrador
- **Query params:** `usuario` (id_usuario) · `tabla` (tabla_afectada) · `accion` · `fecha_desde` (YYYY-MM-DD) · `fecha_hasta` (YYYY-MM-DD)
- **Respuesta:** `[{ id_bitacora, id_usuario, accion, tabla_afectada, id_registro, detalle, ip_origen, fecha_hora }]`

---

## REPORTES

### GET /reportes/ocupacion
Retorna la ocupación hospitalaria actual: internaciones activas y porcentaje de camas ocupadas.
- **Roles:** administrador · direccion
- **Respuesta:** `{ internaciones_activas, camas_ocupadas, porcentaje_ocupacion }`

### GET /reportes/citas
Resumen de citas en un período, agrupadas por estado y por tipo de ingreso.
- **Roles:** administrador · direccion
- **Query params:** `fecha_desde` · `fecha_hasta` (YYYY-MM-DD — por defecto últimos 30 días)
- **Respuesta:** `{ total, por_estado: { PROGRAMADA, CONFIRMADA, ATENDIDA, CANCELADA, ... }, por_tipo: { CONSULTA_EXTERNA, URGENCIA, EMERGENCIA } }`

### GET /reportes/medicamentos
Medicamentos cuyo stock total está por debajo del mínimo, con detalle de lotes.
- **Roles:** administrador · direccion · farmaceutico
- **Respuesta:** `[{ id_medicamento, nombre_comercial, principio_activo, stock_total, stock_minimo }]`

### GET /reportes/actividad
Resumen de actividad clínica en un período: consultas realizadas, nuevas internaciones, triajes aplicados y altas.
- **Roles:** administrador · direccion
- **Query params:** `fecha_desde` · `fecha_hasta` (YYYY-MM-DD — por defecto últimos 30 días)
- **Respuesta:** `{ consultas, internaciones_nuevas, altas, triajes }`

---

## Resumen de roles por módulo

| Módulo | recepcion | medico | enfermera | farmaceutico | administrador | direccion | paciente |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Auth / Personal | — | — | — | — | ✅ | 👁 | — |
| Pacientes | ✅ | 👁 | 👁 | — | ✅ | — | — |
| Documentos | — | ✅ | ✅ | — | ✅ | — | — |
| Citas | ✅ | 👁 | 👁 | — | ✅ | — | ✅ |
| Atención | — | ✅ | 🔸 | 👁 aleg. | 👁 | — | — |
| Farmacia | — | 👁 rec. | — | ✅ | ✅ | — | — |
| Auditoría | — | — | — | — | ✅ | — | — |
| Reportes | — | — | — | 👁 med. | ✅ | ✅ | — |

`✅` lectura + escritura · `👁` solo lectura · `🔸` acceso parcial
