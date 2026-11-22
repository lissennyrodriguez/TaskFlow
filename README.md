# TaskFlow

Aplicación web para la gestión y organización de tareas, desarrollada con React, Node.js, Express y MongoDB. El proyecto está contenerizado con Docker y Docker Compose para facilitar su instalación, ejecución y despliegue en diferentes entornos.

## Tecnologías utilizadas

- **Frontend:** React y Vite.
- **Backend:** Node.js y Express.
- **Base de datos:** MongoDB 7.
- **Servidor web:** Nginx.
- **Contenerización:** Docker y Docker Compose.
- **Comunicación:** Red interna de Docker Compose.
- **Almacenamiento:** Volumen persistente de Docker.

## Requisitos previos

Antes de ejecutar el proyecto, es necesario tener instalado:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/).
- Docker Compose (incluido en Docker Desktop).
- Git (para clonar el repositorio).

Se recomienda utilizar Docker Desktop con el motor de contenedores en ejecución.

## Estructura del proyecto

```text
taskflow/
├── api/
│   ├── src/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── package-lock.json
├── web/
│   ├── src/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   ├── package.json
│   └── package-lock.json
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

**Nota:** El archivo `.env` se crea localmente y no se incluye en el repositorio por razones de seguridad.

## Configuración del entorno

Antes de iniciar el proyecto, es necesario crear el archivo `.env` en la raíz del proyecto utilizando la plantilla `.env.example`.

Desde PowerShell, ejecutar:

```powershell
Copy-Item .env.example .env
```

Después, configurar las siguientes variables en el archivo `.env`:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/taskflow
MONGO_URI_DOCKER=mongodb://mongo:27017/taskflow
VITE_API_URL=http://localhost:3000
```

### Descripción de las variables

| Variable             | Descripción |
|
| `PORT`               | Puerto utilizado por la API. |
| `MONGO_URI`          | Dirección de conexión a MongoDB desde el entorno local. |
| `MONGO_URI_DOCKER`   | Dirección de conexión a MongoDB dentro de Docker. |
| `VITE_API_URL`       | Dirección de la API utilizada por el frontend. |

**Importante:**
- El archivo `.env` contiene la configuración local y no debe subirse a GitHub.
- El archivo `.env.example` funciona como plantilla para otros desarrolladores.
- No se deben incluir contraseñas ni credenciales reales en el repositorio.

## Instalación y ejecución

Desde la carpeta raíz del proyecto, seguir estos pasos:

### 1. Construir las imágenes

```bash
docker compose build
```

También se puede construir e iniciar todo el proyecto en un solo comando:

```bash
docker compose up -d --build
```

### 2. Iniciar los servicios

Si las imágenes ya están construidas:

```bash
docker compose up -d
```

### 3. Verificar los contenedores

```bash
docker compose ps
```

Los servicios deben aparecer en estado `Up`. MongoDB debe aparecer como `healthy` cuando su comprobación de salud haya terminado correctamente.

### 4. Consultar los registros

Para visualizar los registros de todos los servicios:

```bash
docker compose logs -f
```

Para consultar un servicio específico:

```bash
docker compose logs -f api
docker compose logs -f web
docker compose logs -f mongo
```

## Acceso a la aplicación

Una vez iniciados los servicios, se puede acceder a través de las siguientes direcciones:



| Frontend - http://localhost:8080 |
| API - Estado y conexión - http://localhost:3000/api/health |
| API - Categorías - http://localhost:3000/api/categories |
| API - Transacciones - http://localhost:3000/api/transactions |

MongoDB se ejecuta internamente en el contenedor y no publica su puerto al equipo anfitrión.

## Arquitectura de Docker

El proyecto está compuesto por tres servicios principales:

### MongoDB

- Utiliza la imagen oficial `mongo:7`.
- Almacena la información de la aplicación.
- Utiliza un volumen persistente llamado `mongo_data`.
- Incluye una comprobación de salud (`healthcheck`).
- No publica el puerto de MongoDB al equipo anfitrión.

### API

- Ejecuta el servidor Node.js con Express.
- Utiliza un Dockerfile multi-stage.
- Se conecta a MongoDB