# TaskFlow

[![CI - TaskFlow](https://github.com/lissennyrodriguez/TaskFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/lissennyrodriguez/TaskFlow/actions/workflows/ci.yml)
[![CD - TaskFlow](https://github.com/lissennyrodriguez/TaskFlow/actions/workflows/cd.yml/badge.svg)](https://github.com/lissennyrodriguez/TaskFlow/actions/workflows/cd.yml)

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

Antes de iniciar el proyecto, es necesario crear el archivo `.env` en la raíz utilizando la plantilla `.env.example`.

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

| Variable | Descripción |
|---|---|
| `PORT` | Puerto utilizado por la API. |
| `MONGO_URI` | Dirección de conexión a MongoDB desde el entorno local. |
| `MONGO_URI_DOCKER` | Dirección de conexión a MongoDB dentro de Docker. |
| `VITE_API_URL` | Dirección de la API utilizada por el frontend. |

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

| Servicio | Dirección |
|---|---|
| Frontend | [http://localhost:8080](http://localhost:8080) |
| API - Estado y conexión | [http://localhost:3000/api/health](http://localhost:3000/api/health) |
| API - Categorías | [http://localhost:3000/api/categories](http://localhost:3000/api/categories) |
| API - Transacciones | [http://localhost:3000/api/transactions](http://localhost:3000/api/transactions) |

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
- Se conecta a MongoDB mediante las variables de entorno configuradas.
- Expone el servicio en el puerto `3000`.

### Frontend

- Desarrollado con React y Vite.
- Utiliza Nginx para servir la aplicación.
- Se comunica con la API mediante la variable `VITE_API_URL`.
- Se ejecuta en el puerto `8080`.

## Integración continua (CI)

El proyecto utiliza GitHub Actions para automatizar la validación del código.

El workflow se encuentra en:

```text
.github/workflows/ci.yml
```

Se ejecuta cuando se realizan cambios mediante `push` a `main` o cuando se abre o actualiza un Pull Request dirigido a esa rama.

El pipeline contiene los siguientes trabajos:

- **api:** instala dependencias y ejecuta las comprobaciones de calidad y pruebas automatizadas.
- **web:** instala dependencias, ejecuta las comprobaciones de calidad, las pruebas y la construcción del frontend.
- **docker:** construye las imágenes de Docker Compose después de que los trabajos de API y frontend hayan finalizado correctamente.

La integración está protegida mediante reglas de rama que requieren un Pull Request y la aprobación de los checks `api`, `web` y `docker` antes de permitir la integración en `main`.

## Entrega continua (CD)

El proyecto utiliza un segundo workflow de GitHub Actions:

```text
.github/workflows/cd.yml
```

Este workflow publica las imágenes de Docker en GitHub Container Registry (GHCR).

Se ejecuta después de los cambios integrados en `main` y cuando se publican etiquetas de versión con el formato `v*.*.*`.

Se publican dos imágenes:

- `taskflow-api`
- `taskflow-web`

Las imágenes se identifican mediante etiquetas como:

- `sha-<commit>`: identifica el commit publicado.
- `latest`: identifica la publicación más reciente.
- `1.0.0` y `1.0`: identifican la versión publicada mediante el tag `v1.0.0`.

La autenticación con GitHub Container Registry utiliza el token automático `GITHUB_TOKEN` de GitHub Actions.

### Imágenes publicadas

- [taskflow-api en GHCR](https://github.com/users/lissennyrodriguez/packages/container/package/taskflow-api)
- [taskflow-web en GHCR](https://github.com/users/lissennyrodriguez/packages/container/package/taskflow-web)

## Variables y seguridad en GitHub Actions

El pipeline utiliza la variable de repositorio:

- `VITE_API_URL`: configura la dirección de la API que utiliza el frontend durante su construcción.

La variable se administra desde:

**Settings → Secrets and variables → Actions → Variables**

Las credenciales y los valores sensibles deben administrarse mediante GitHub Secrets y no deben escribirse directamente en los archivos del workflow.

## Pruebas y validación

El proyecto utiliza pruebas automatizadas para comprobar el funcionamiento del código.

GitHub Actions ejecuta las pruebas como parte del pipeline de integración continua. Si una prueba falla, el trabajo correspondiente se marca como fallido y evita que continúe la construcción dependiente.

## Repositorio

[TaskFlow - GitHub](https://github.com/lissennyrodriguez/TaskFlow)

