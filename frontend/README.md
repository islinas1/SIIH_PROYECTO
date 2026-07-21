---

# Frontend (React + Vite)

## Arranque rápido

### 1. Instalar dependencias

````bash
cd frontend
npm install
````

### 2. Configurar variables de entorno

````bash
cp .env.example .env
````

El archivo define la URL del backend:

````
VITE_API_URL=http://localhost:5000/api
````

> Si se modifica el `.env`, reiniciar el servidor de Vite para que tome los cambios.

### 3. Levantar el servidor de desarrollo

````bash
npm run dev
````

La aplicación queda disponible en `http://localhost:5173`.

> **Nota:** el backend debe estar corriendo en `http://localhost:5000` para que el login y los módulos conectados funcionen. Ingresar con los usuarios del seed del backend (tabla de arriba).

## Módulos y estado de integración


|
 Módulo 
|
 Estado 
|
|
---
|
---
|
|
 Login (JWT + roles) 
|
 ✅ Conectado al backend 
|
|
 Gestión de pacientes 
|
 ✅ Conectado al backend 
|
|
 Historia clínica y alergias 
|
 ✅ Conectado al backend 
|
|
 Consulta médica (diagnóstico + receta) 
|
 ✅ Conectado al backend 
|
|
 Farmacia (inventario + dispensación FIFO) 
|
 ✅ Conectado al backend 
|
|
 Administración de usuarios del personal 
|
 ✅ Conectado al backend 
|
|
 Control de camas / internaciones 
|
 ✅ Conectado al backend 
|
|
 Cola de pacientes del día 
|
 🟡 Prototipo (pendiente endpoint en backend) 
|
|
 Citas, Laboratorio, Reportes 
|
 ⬜ Planificados 
|

## Estructura del frontend

````
frontend/
├── .env.example
├── vite.config.js
└── src/
    ├── api/
    │   └── client.js            ← axios + interceptor JWT + manejo de 401
    ├── context/
    │   └── AuthContext.jsx      ← sesión, login/logout contra el backend
    ├── routes/
    │   └── AppRoutes.jsx        ← rutas protegidas por rol
    ├── services/                ← llamadas a la API por dominio
    │   ├── patientService.js
    │   ├── pharmacyService.js
    │   ├── consultationService.js
    │   └── staffService.js
    ├── features/                ← pantallas por dominio
    │   ├── auth/
    │   ├── pacientes/
    │   ├── atencion/
    │   ├── farmacia/
    │   ├── hospitalizacion/
    │   └── administracion/
    ├── components/              ← layout (Sidebar, Navbar) y comunes
    └── layouts/
        └── MainLayout.jsx
````

---
