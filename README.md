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
- **CI/CD:** GitHub Actions.
- **Registro de imágenes:** GitHub Container Registry (GHCR).

## Requisitos previos

Antes de ejecutar el proyecto, es necesario tener instalado:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/).
- Docker Compose (incluido en Docker Desktop).
- Git (para clonar el repositorio).

Se recomienda utilizar Docker Desktop con el motor de contenedores en ejecución.

## Estructura del proyecto

```text
taskflow/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── api/
│   ├── src/
│   ├── tests/
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
- Se conecta a MongoDB mediante la red interna de Docker Compose.

### Frontend

- Desarrollado con React y Vite.
- Utiliza Nginx para servir la aplicación compilada.
- Se comunica con la API mediante la variable `VITE_API_URL`.

## Pipeline CI/CD con GitHub Actions

TaskFlow utiliza GitHub Actions para automatizar la integración continua (CI) y el despliegue continuo (CD).

### Estado de los pipelines

[![CI - TaskFlow](https://github.com/lissennyrodriguez/TaskFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/lissennyrodriguez/TaskFlow/actions/workflows/ci.yml)

[![CD - TaskFlow](https://github.com/lissennyrodriguez/TaskFlow/actions/workflows/cd.yml/badge.svg)](https://github.com/lissennyrodriguez/TaskFlow/actions/workflows/cd.yml)

### 1. Integración continua (CI)

El workflow `ci.yml` se ejecuta automáticamente cuando se abre o actualiza un Pull Request hacia `main`, y cuando se realizan cambios en dicha rama.

El pipeline contiene tres trabajos:

- **API:** instala las dependencias con `npm ci`, ejecuta ESLint mediante `npm run lint` y las pruebas automatizadas mediante `npm test`.
- **Web:** instala las dependencias, ejecuta ESLint, las pruebas automatizadas y la compilación de producción mediante `npm run build`.
- **Docker:** construye las imágenes utilizando `docker compose build`, únicamente cuando los trabajos de API y Web terminan correctamente.

Los cambios deben superar las validaciones obligatorias antes de poder integrarse en `main`.

El pipeline utiliza Node.js 22 y caché de npm para optimizar las ejecuciones.

### 2. Protección de la rama main

La rama principal `main` cuenta con reglas de protección que:

- Exigen la creación de un Pull Request antes de integrar cambios.
- Requieren que los checks `api`, `web` y `docker` finalicen correctamente.
- Bloquean los force pushes.
- Protegen la estabilidad y calidad del código antes de su integración.

### 3. Despliegue continuo (CD)

El workflow `cd.yml` se ejecuta cuando se realizan cambios en `main` o se publica una versión mediante un tag de Git.

El proceso construye y publica automáticamente dos imágenes en GitHub Container Registry (GHCR):

**Imagen de la API:**

```text
ghcr.io/lissennyrodriguez/taskflow-api
```

**Imagen del frontend:**

```text
ghcr.io/lissennyrodriguez/taskflow-web
```

Las imágenes utilizan las siguientes etiquetas:

- `sha-<commit>`: identifica el commit publicado.
- `latest`: identifica la última versión publicada desde `main`.
- `1.0.0` y `1.0`: identifican la versión publicada mediante el tag `v1.0.0`.

### 4. Seguridad y configuración mediante secrets y variables

El pipeline utiliza los mecanismos de seguridad de GitHub Actions para gestionar las credenciales y la configuración.

- `secrets.GITHUB_TOKEN`: permite autenticarse en GitHub Container Registry y publicar las imágenes sin utilizar tokens personales.
- `vars.VITE_API_URL`: variable de repositorio utilizada durante la construcción del frontend.

La variable `VITE_API_URL` se configura desde:

**Settings → Secrets and variables → Actions → Repository variables.**

Los valores sensibles no deben escribirse directamente en los workflows ni almacenarse en el repositorio.

El archivo `.env` permanece excluido del control de versiones.

### 5. Publicación de versiones

TaskFlow utiliza una estrategia de etiquetado para identificar las imágenes publicadas.

- Cada publicación desde `main` genera una etiqueta basada en el SHA del commit y `latest`.
- La publicación del tag `v1.0.0` genera las etiquetas `1.0.0` y `1.0`.

Las imágenes publicadas pueden consultarse desde la sección Packages del repositorio de GitHub.

- [taskflow-api en GHCR](https://github.com/lissennyrodriguez/TaskFlow/pkgs/container/taskflow-api).
- [taskflow-web en GHCR](https://github.com/lissennyrodriguez/TaskFlow/pkgs/container/taskflow-web).

## Pruebas automatizadas

El proyecto utiliza Vitest para ejecutar pruebas automatizadas.

Los tests permiten comprobar el funcionamiento de los componentes y servicios antes de integrar cambios en la rama principal.

Para ejecutar las pruebas localmente, ingresar a cada carpeta:

**API:**

```bash
cd api
npm ci
npm run lint
npm test
```

**Frontend:**

```bash
cd web
npm ci
npm run lint
npm test
npm run build
```

## Licencia

Proyecto desarrollado con fines académicos como parte de la Tarea 2: Pipeline CI/CD de TaskFlow con secrets.
