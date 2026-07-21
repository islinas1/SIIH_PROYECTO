# SIIH — Frontend

Interfaz web del **Sistema Integrado de Información Hospitalaria (SIIH)** del Hospital Universitario San Andrés. Este frontend consume la API REST del backend Flask del proyecto y cubre el flujo hospitalario central: gestión de pacientes, historia clínica, consulta médica con receta electrónica, farmacia con dispensación e inventario, hospitalización y administración de usuarios del personal.

> Proyecto académico — INF-266 Taller de Sistemas de Información, Carrera de Informática, UMSA. Grupo 9.

## Tecnologías

| Tecnología | Versión | Rol |
|---|---|---|
| React | 19 | Biblioteca de interfaz de usuario |
| Vite | 8 | Empaquetador y servidor de desarrollo |
| React Router DOM | 7 | Ruteo y protección de rutas por rol |
| Axios | 1.x | Cliente HTTP hacia la API del backend |
| Bootstrap | 5.3 | Base de estilos (complementada con CSS propio) |
| SweetAlert2 | 11 | Diálogos y confirmaciones |
| React Icons (Feather) | — | Iconografía |

## Requisitos previos

- **Node.js 20.19+ o 22.12+** (recomendado: LTS actual)
- El **backend del SIIH corriendo** en `http://localhost:5000` (ver el README de la carpeta `backend/`)

## Instalación

```bash
cd frontend
npm install
```

## Configuración

Crear un archivo `.env` en la raíz del frontend a partir de la plantilla:

```bash
copy .env.example .env
```

Contenido esperado:
