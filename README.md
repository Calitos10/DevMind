# DevMind

> Sube tu proyecto de código en un ZIP y hazle preguntas en lenguaje natural. DevMind responde usando tu código real como contexto y cita los archivos y líneas exactas de los que ha sacado cada respuesta.

Trabajo Fin de Máster · API backend con RAG (Retrieval-Augmented Generation) sobre código fuente.

---

## Enlaces del proyecto

| Recurso                      | Enlace                     |
| ---------------------------- | -------------------------- |
| **Aplicación desplegada**    | https://devmind-frontend.vercel.app|
| **Presentación (slides)**    | 📊 [docs/DevMind_Slides.pdf](docs/DevMind_Slides.pdf) |
| **Vídeo explicativo**        | 🔗 _Pendiente de publicar_ |
| **Repositorio del frontend** | 🔗 _Pendiente de publicar_ |

---

## Tabla de contenidos

1. [Descripción general](#1-descripción-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Instalación y ejecución](#3-instalación-y-ejecución)
4. [Despliegue](#4-despliegue)
5. [Estructura del proyecto](#5-estructura-del-proyecto)
6. [Funcionalidades principales](#6-funcionalidades-principales)
7. [Usuario de prueba](#7-usuario-de-prueba)
8. [API: referencia de endpoints](#8-api-referencia-de-endpoints)
9. [Cómo funciona el RAG por dentro](#9-cómo-funciona-el-rag-por-dentro)
10. [Modelo de datos](#10-modelo-de-datos)
11. [Seguridad](#11-seguridad)
12. [Tests](#12-tests)
13. [Decisiones de diseño](#13-decisiones-de-diseño)
14. [Limitaciones conocidas y trabajo futuro](#14-limitaciones-conocidas-y-trabajo-futuro)

---

## 1. Descripción general

### El problema

Entender un proyecto software que no has escrito tú es lento. El conocimiento técnico está disperso entre carpetas y archivos, documentación incompleta o desactualizada, convenciones internas que nadie llegó a escribir y decisiones que solo recuerda quien ya no está en el equipo.

Preguntas tan simples como _"¿dónde se gestiona la autenticación?"_ o _"¿qué caso de uso se encarga de subir un ZIP?"_ se formulan en cinco segundos y se responden en dos horas de búsqueda manual.

### Por qué no basta con un LLM generalista

Un modelo de propósito general sabe programar, pero no ha visto nunca **tu** proyecto. Puede describir cómo suele implementarse un login, no dónde está el tuyo. Además, un proyecto real no cabe en una ventana de contexto, y sin el código delante un modelo tiende a rellenar los huecos con lo que le parece plausible: en una respuesta técnica, eso es peor que no responder.

### La solución

DevMind aplica **RAG (Retrieval-Augmented Generation)** sobre el código fuente:

1. **Una vez**, al subir el proyecto: se extrae el ZIP, se filtran los archivos relevantes, se trocean en fragmentos (_chunks_) y se genera un **embedding** por fragmento, que se almacena en PostgreSQL con `pgvector`.
2. **Cada vez** que se pregunta: se genera el embedding de la pregunta, se recuperan por similitud vectorial los fragmentos más cercanos, y se le pasan a un LLM como contexto para que redacte la respuesta.

El resultado es una respuesta construida sobre el código real del proyecto, acompañada siempre de las **fuentes** (archivo + rango de líneas) que la sustentan.

### Qué lo diferencia

- **Responde con el código delante, no de memoria.** El contexto se recupera del proyecto en cada pregunta.
- **Cita siempre sus fuentes.** Cada respuesta devuelve la lista de archivos y líneas usadas, verificables por el usuario.
- **Sabe decir "no lo sé".** Un umbral de distancia (`RAG_MAX_DISTANCE`) descarta los fragmentos irrelevantes. Si no queda ninguno, DevMind responde que no tiene información en lugar de inventar. Ver [§13](#13-decisiones-de-diseño).
- **La indexación no bloquea al usuario.** Se ejecuta en segundo plano y su progreso es consultable.

### Alcance del proyecto

> **El proyecto que he construido en este TFM es la API backend de DevMind**: su arquitectura hexagonal, el pipeline de RAG (indexación, embeddings, búsqueda semántica y respuesta con fuentes), la seguridad, los tests y las decisiones de diseño documentadas.
>
> Como para **probar la API en el despliegue** desde el navegador (subir un ZIP, indexar y preguntar) hace falta una interfaz, he **generado un frontend web (React + Vite) con IA** a partir de un _prompt_ propio y específico, usando el contrato [`docs/openapi.yaml`](docs/openapi.yaml) como fuente de verdad. El diseño de producto y los flujos son míos; la implementación del frontend la produjo la IA. El prompt exacto está documentado en [`docs/Frontend_generado_con_IA.md`](docs/Frontend_generado_con_IA.md).

---

## 2. Stack tecnológico

### Núcleo

| Tecnología                  | Uso                                                                    |
| --------------------------- | ---------------------------------------------------------------------- |
| **Node.js 20+**             | Entorno de ejecución                                                   |
| **TypeScript**              | Lenguaje (modo estricto)                                               |
| **Express 5**               | Framework HTTP                                                         |
| **PostgreSQL 16**           | Base de datos relacional                                               |
| **pgvector**                | Extensión de PostgreSQL para almacenar vectores y buscar por similitud |
| **Docker / Docker Compose** | Levantar PostgreSQL + pgvector en local                                |

### IA

| Tecnología                                       | Uso                                              |
| ------------------------------------------------ | ------------------------------------------------ |
| **Genkit** (`genkit`, `@genkit-ai/google-genai`) | Capa de orquestación con los modelos             |
| **`gemini-embedding-001`**                       | Generación de embeddings (768 dimensiones)       |
| **`gemini-2.5-flash`**                           | Generación de las respuestas en lenguaje natural |

### Seguridad y validación

| Tecnología             | Uso                                           |
| ---------------------- | --------------------------------------------- |
| **jsonwebtoken**       | Autenticación mediante JWT                    |
| **bcryptjs**           | Hashing de contraseñas                        |
| **Zod**                | Validación de los cuerpos de las peticiones   |
| **helmet**             | Cabeceras HTTP de seguridad                   |
| **express-rate-limit** | Limitación de peticiones por IP y por usuario |
| **cors**               | Control de orígenes permitidos                |

### Utilidades

| Tecnología  | Uso                                                   |
| ----------- | ----------------------------------------------------- |
| **multer**  | Recepción del ZIP (`multipart/form-data`, en memoria) |
| **adm-zip** | Extracción del contenido del ZIP                      |
| **dotenv**  | Carga de variables de entorno                         |

### Testing

| Tecnología    | Uso                                                |
| ------------- | -------------------------------------------------- |
| **Vitest**    | Runner de tests unitarios y de integración         |
| **Supertest** | Tests de integración HTTP contra la app de Express |

---

## 3. Instalación y ejecución

### Requisitos previos

```txt
Node.js 20 o superior
Docker y Docker Compose
Una API key de Google Gemini (https://aistudio.google.com/apikey)
```

### Paso 1 — Clonar e instalar dependencias

```bash
git clone <URL_DEL_REPOSITORIO>
cd DevMind
npm install
```

### Paso 2 — Configurar las variables de entorno

```bash
cp .env.example .env
```

Edita el `.env`. Las dos variables **obligatorias** son:

```txt
JWT_SECRET       — la aplicación no arranca sin ella
GEMINI_API_KEY   — necesaria para generar embeddings y respuestas
```

Referencia completa de variables:

| Variable                           | Por defecto             | Descripción                                                       |
| ---------------------------------- | ----------------------- | ----------------------------------------------------------------- |
| `PORT`                             | `3000`                  | Puerto del servidor                                               |
| `NODE_ENV`                         | `development`           | Entorno de ejecución                                              |
| `CORS_ORIGIN`                      | `http://localhost:5173` | Origen permitido (puerto por defecto de Vite)                     |
| `JWT_SECRET`                       | —                       | **Obligatoria.** Secreto de firma de los JWT                      |
| `JWT_EXPIRES_IN`                   | `7d`                    | Caducidad de los tokens                                           |
| `DATABASE_URL`                     | —                       | Cadena de conexión a PostgreSQL                                   |
| `GEMINI_API_KEY`                   | —                       | **Obligatoria.** API key de Google Gemini                         |
| `MAX_ZIP_SIZE_MB`                  | `200`                   | Tamaño máximo del ZIP subido                                      |
| `MAX_ZIP_UNCOMPRESSED_SIZE_MB`     | `1000`                  | Tamaño máximo descomprimido (protección anti _zip bomb_)          |
| `AUTH_RATE_LIMIT_MAX`              | `10`                    | Peticiones permitidas en `/auth/*`                                |
| `AUTH_RATE_LIMIT_WINDOW_MINUTES`   | `15`                    | Ventana del límite anterior                                       |
| `ASK_RATE_LIMIT_MAX`               | `20`                    | Preguntas permitidas por usuario                                  |
| `ASK_RATE_LIMIT_WINDOW_MINUTES`    | `15`                    | Ventana del límite anterior                                       |
| `UPLOAD_RATE_LIMIT_MAX`            | `10`                    | Subidas de ZIP permitidas por usuario                             |
| `UPLOAD_RATE_LIMIT_WINDOW_MINUTES` | `60`                    | Ventana del límite anterior                                       |
| `INDEX_RATE_LIMIT_MAX`             | `5`                     | Indexaciones permitidas por usuario (ruta más cara del sistema)   |
| `INDEX_RATE_LIMIT_WINDOW_MINUTES`  | `60`                    | Ventana del límite anterior                                       |
| `INDEXING_DELAY_BETWEEN_CHUNKS_MS` | `1000`                  | Pausa entre chunks al indexar, para no saturar la cuota de Gemini |
| `GUEST_TTL_HOURS`                  | `24`                    | Horas que vive un usuario invitado antes de ser purgado           |
| `EMBEDDING_MAX_RETRIES`            | `3`                     | Reintentos ante fallos transitorios del proveedor (429/503)       |
| `EMBEDDING_RETRY_BASE_MS`          | `1000`                  | Base del _backoff_ exponencial de los reintentos                  |
| `RAG_MAX_DISTANCE`                 | `1.0`                   | Distancia L2 máxima para considerar un chunk relevante            |

### Paso 3 — Levantar PostgreSQL con pgvector

```bash
docker-compose up -d
```

Esto arranca un contenedor `devmind-postgres` con la imagen `pgvector/pgvector:pg16`, ya con la extensión disponible, en el puerto `5432`.

### Paso 4 — Ejecutar las migraciones

```bash
npm run migrate
```

Crea las tablas (`users`, `projects`, `project_files`, `code_chunks`, `code_chunk_embeddings`, `project_indexing_jobs`, `conversation_entries`) y habilita la extensión `vector`.

### Paso 5 — Arrancar el servidor

```bash
npm run dev
```

La API queda disponible en `http://localhost:3000`. Para comprobarlo:

```bash
curl http://localhost:3000/health
# {"status":"ok","service":"DevMind API","message":"API is running"}
```

### Scripts disponibles

| Script                 | Descripción                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run dev`          | Servidor en modo desarrollo, con recarga automática (`tsx watch`) |
| `npm run build`        | Compila TypeScript a `dist/`                                      |
| `npm start`            | Arranca el build de producción                                    |
| `npm run typecheck`    | Comprueba tipos sin emitir archivos                               |
| `npm test`             | Ejecuta toda la batería de tests                                  |
| `npm run test:watch`   | Tests en modo watch                                               |
| `npm run migrate`      | Aplica las migraciones de base de datos                           |
| `npm run purge-guests` | Elimina los usuarios invitados caducados y sus datos              |

### Comandos útiles (Docker y base de datos)

Gestión del contenedor de PostgreSQL:

```bash
# Levantar la base de datos
docker compose up -d

# Apagar (conservando los datos)
docker compose down

# Apagar borrando todo, incluido el volumen (se pierden los datos)
docker compose down -v
```

Vaciar el contenido de las tablas sin borrar el esquema (útil para empezar de cero en desarrollo):

```bash
docker exec -it devmind-postgres psql -U devmind -d devmind_db \
  -c "TRUNCATE TABLE project_indexing_jobs, conversation_entries, code_chunk_embeddings, code_chunks, project_files, projects, users RESTART IDENTITY CASCADE;"
```

### Prueba rápida de humo

Con el servidor levantado, el flujo mínimo de extremo a extremo:

```bash
# 1. Crear una sesión de invitado (no requiere registro)
TOKEN=$(curl -s -X POST http://localhost:3000/auth/guest | jq -r .accessToken)

# 2. Crear un proyecto
PROJECT=$(curl -s -X POST http://localhost:3000/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"mi-proyecto","description":"prueba"}' | jq -r .id)

# 3. Subir el ZIP del proyecto
curl -X POST "http://localhost:3000/projects/$PROJECT/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./mi-proyecto.zip"

# 4. Lanzar la indexación
curl -X POST "http://localhost:3000/projects/$PROJECT/index" \
  -H "Authorization: Bearer $TOKEN"

# 5. Consultar el progreso (repetir hasta status: completed)
curl "http://localhost:3000/projects/$PROJECT/indexing-status" \
  -H "Authorization: Bearer $TOKEN"

# 6. Preguntar
curl -X POST "http://localhost:3000/projects/$PROJECT/ask" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"¿Cómo funciona el registro de usuarios?"}'
```

---

## 4. Despliegue

> **Estado actual:** el proyecto está preparado para desplegarse, pero el despliegue público todavía no está publicado. La URL se añadirá en la [tabla de enlaces](#enlaces-del-proyecto).

### Preparación del build

```bash
npm run build   # compila a dist/
npm start       # ejecuta node dist/src/main.js
```

### Requisitos del entorno de destino

1. **Node.js 20+**.
2. **PostgreSQL 16 con la extensión `pgvector` habilitada.** Es el requisito no negociable: proveedores como Neon, Supabase o Railway la soportan; una instancia de PostgreSQL sin `pgvector` no sirve.
3. **Variables de entorno** configuradas en el proveedor (ver [§3](#paso-2--configurar-las-variables-de-entorno)). Como mínimo: `JWT_SECRET`, `GEMINI_API_KEY`, `DATABASE_URL` y `CORS_ORIGIN` apuntando al dominio real del frontend.
4. **Migraciones aplicadas** contra la base de datos de producción: `npm run migrate`.

### Pasos del despliegue

```bash
# 1. Provisionar PostgreSQL con pgvector y obtener su DATABASE_URL
# 2. Configurar las variables de entorno en el proveedor
# 3. Ejecutar las migraciones contra la base de datos de producción
npm run migrate
# 4. Desplegar la aplicación (build + start)
npm run build && npm start
```

### Consideraciones de producción

- **`CORS_ORIGIN`** debe apuntar al dominio del frontend desplegado, no a `localhost:5173`.
- **`JWT_SECRET`** debe ser un secreto largo y aleatorio, distinto del usado en desarrollo.
- **Limpieza de invitados:** `npm run purge-guests` no se ejecuta solo. En producción debe programarse externamente (por ejemplo, un cron diario). Ver [§14](#14-limitaciones-conocidas-y-trabajo-futuro).
- **Indexación en el mismo proceso:** la indexación corre en segundo plano dentro del proceso de la API. Con varias instancias o con proyectos muy grandes, lo apropiado sería una cola de trabajos externa. Ver [§14](#14-limitaciones-conocidas-y-trabajo-futuro).
- **Memoria:** los ZIP se procesan en memoria (`multer.memoryStorage`), así que la instancia debe tener RAM suficiente para `MAX_ZIP_SIZE_MB`.

---

## 5. Estructura del proyecto

DevMind sigue una arquitectura **Clean / Hexagonal**. La regla que la gobierna es que las dependencias apuntan siempre hacia dentro:

```txt
transport  →  application  →  domain
                  ↑
           infrastructure
```

El dominio y los casos de uso no conocen Express, PostgreSQL, Genkit, JWT ni bcrypt. La capa de aplicación depende de **puertos** (interfaces), y la infraestructura proporciona los **adaptadores** que los implementan.

```txt
DevMind/
├── src/
│   ├── app.ts                      # Construcción de la app Express (helmet, cors, router)
│   ├── main.ts                     # Punto de entrada: levanta el servidor
│   │
│   ├── container/
│   │   └── container.ts            # Composition root: inyecta adaptadores en casos de uso
│   │
│   ├── domain/                     # Núcleo. No depende de nada externo.
│   │   ├── entities/               # User, Project, ProjectFile, CodeChunk...
│   │   ├── repositories/           # Interfaces de persistencia
│   │   └── services/
│   │       └── projectFileClassifier.ts   # Reglas de qué archivos analizar y en qué lenguaje
│   │
│   ├── application/                # Casos de uso. Orquestan el dominio a través de puertos.
│   │   ├── auth/                   # register, login, getCurrentUser, createGuest
│   │   ├── projects/               # create, list, getById, delete
│   │   ├── projectFiles/           # list, getById, delete
│   │   ├── uploadZip/              # uploadProjectZipUseCase (extracción + sincronización)
│   │   ├── codeChunk/              # Troceado de archivos + lineCodeChunker
│   │   ├── codeChunkEmbeddings/    # Generación de embeddings por chunk
│   │   ├── indexing/               # indexProjectEmbeddings, getProjectIndexingStatus
│   │   ├── projectQuestions/       # askProjectQuestion (el RAG), getConversationHistory
│   │   └── ports/                  # Interfaces: EmbeddingGenerator, AnswerGenerator,
│   │                               # TokenService, PasswordHasher, ZipExtractor, IdGenerator...
│   │
│   ├── infrastructure/             # Adaptadores concretos. Aquí vive lo intercambiable.
│   │   ├── database/
│   │   │   ├── postgresPool.ts
│   │   │   └── migrations/         # 001..009, SQL versionado
│   │   ├── repositoryAdapter/
│   │   │   ├── postgres/           # Implementaciones reales
│   │   │   └── inMemory/           # Implementaciones para tests
│   │   ├── genkit/                 # ai.ts, generadores de embeddings y respuestas
│   │   │   └── testing/            # Dobles de test de los generadores
│   │   ├── authAdapter/            # jwtTokenService, bcryptPasswordHasher, cryptoIdGenerator
│   │   ├── uploadZipAdapter/       # admZipExtractor
│   │   ├── timeDelayAdapter/       # timeoutDelay
│   │   ├── retry/                  # retryWithBackoff
│   │   └── config/env.ts           # Lectura y validación de variables de entorno
│   │
│   ├── transport/                  # Entrada HTTP
│   │   └── http/
│   │       ├── route.ts            # Router raíz + /health
│   │       ├── auth/               # routes, controller, schemas
│   │       ├── project/            # routes, controller, schemas
│   │       ├── projectFile/        # routes, controller
│   │       └── middleware/         # auth, validateBody, rateLimit, asyncHandler, errors
│   │
│   └── shared/
│       └── errors/                 # AppError y errores de dominio tipados
│
├── tests/
│   ├── unit/                       # Casos de uso y adaptadores aislados
│   └── integration/                # Tests HTTP extremo a extremo con Supertest
│
├── scripts/
│   ├── run-migrations.ts
│   └── purge-guests.ts
│
├── docs/                           # Documentación técnica ampliada
├── docker-compose.yml              # PostgreSQL + pgvector para desarrollo
└── package.json
```

### Responsabilidad de cada capa

| Capa               | Responsabilidad                                                | Ejemplos                                                                     |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **domain**         | Entidades e interfaces del negocio. Sin dependencias externas. | `User`, `Project`, `ProjectRepository`, `ProjectFileClassifier`              |
| **application**    | Casos de uso. Coordinan el negocio usando puertos.             | `AskProjectQuestionUseCase`, `UploadProjectZipUseCase`                       |
| **infrastructure** | Implementaciones técnicas concretas.                           | `PostgresProjectRepository`, `GenkitAnswerGenerator`, `BcryptPasswordHasher` |
| **transport**      | Entrada HTTP: rutas, controladores, middlewares, validación.   | `authController`, `authMiddleware`, `validateBodyMiddleware`                 |
| **container**      | Composition root: conecta puertos con adaptadores.             | `container.ts`                                                               |
| **shared**         | Errores y utilidades transversales.                            | `AppError`, `ProjectNotFoundError`                                           |

**Por qué importa esta separación:** permite sustituir PostgreSQL o Gemini creando un nuevo adaptador sin tocar los casos de uso, y permite testear la lógica de negocio con dobles en memoria sin levantar base de datos ni llamar a APIs externas.

---

## 6. Funcionalidades principales

### 6.1 Autenticación con dos modos

DevMind soporta dos modos de uso deliberadamente distintos:

|                               | **Invitado**                                                                 | **Registrado**                          |
| ----------------------------- | ---------------------------------------------------------------------------- | --------------------------------------- |
| Cómo se entra                 | Automático, sin formulario (`POST /auth/guest`)                              | Registro y login con email y contraseña |
| Subir ZIP, indexar, preguntar | ✅                                                                           | ✅                                      |
| Historial de conversaciones   | ❌ No se guarda                                                              | ✅ Persistente                          |
| Persistencia de los proyectos | ❌ Caducan a las `GUEST_TTL_HOURS` (24 h por defecto) y se borran en cascada | ✅ Permanente                           |
| Propósito                     | Probar la herramienta sin dar datos                                          | Uso continuado                          |

El invitado recibe un JWT normal, con el hash de un valor aleatorio inservible como contraseña, de forma que nadie pueda autenticarse como él por la vía habitual. El script `purge-guests` elimina a los invitados caducados; las cascadas de la base de datos arrastran sus proyectos, archivos, chunks, embeddings, jobs e historial.

### 6.2 Gestión de proyectos

Crear, listar, consultar y borrar proyectos. Cada proyecto pertenece a un usuario mediante `ownerId`, que **nunca llega desde el cliente**: se extrae del JWT en `authMiddleware`.

### 6.3 Subida de proyectos en ZIP con sincronización incremental

`POST /projects/:id/upload` acepta un ZIP y **sincroniza** su contenido con lo ya almacenado, en lugar de borrar y reinsertar todo:

| Situación                                | Resultado                |
| ---------------------------------------- | ------------------------ |
| Archivo nuevo (path no existía)          | `created`                |
| Mismo path, hash distinto                | `updated`                |
| Mismo path, mismo hash                   | `unchanged` (no se toca) |
| Existía en BD pero ya no viene en el ZIP | `deleted`                |

Durante la extracción se descartan:

- **Carpetas ignoradas:** `node_modules`, `.git`, `dist`, `build`, `coverage`, `.next`, `docs`
- **Archivos binarios:** imágenes, vídeos, audio, fuentes, PDF, ZIP anidados, ejecutables, bases de datos...
- **Archivos con bytes nulos** (señal de contenido binario incompatible con las columnas de texto de PostgreSQL)
- **Markdown** (`.md`, `.mdx`), para que las respuestas se apoyen en código fuente real y no en documentación

### 6.4 Troceado en chunks

Cada archivo creado o actualizado se trocea automáticamente en `CodeChunk` mediante `LineCodeChunker`: ventanas de **80 líneas con 10 líneas de solapamiento**. El solapamiento evita que una función quede partida justo en el límite entre dos chunks y pierda su contexto.

### 6.5 Indexación asíncrona con progreso consultable

`POST /projects/:id/index` lanza la generación de embeddings **en segundo plano** y responde de inmediato. `GET /projects/:id/indexing-status` permite hacer _polling_ del progreso:

```json
{
  "status": "processing",
  "progress": 65,
  "totalChunks": 940,
  "processedChunks": 612,
  "failedChunks": 0
}
```

Estados posibles: `pending` → `processing` → `completed` | `failed`.

### 6.6 Preguntas en lenguaje natural (RAG)

`POST /projects/:id/ask` recibe una pregunta y devuelve la respuesta junto con sus fuentes:

```json
{
  "answer": "El registro se gestiona en RegisterUserUseCase. Comprueba primero si...",
  "sources": [
    {
      "path": "src/application/auth/registerUserUseCase.ts",
      "startLine": 13,
      "endLine": 37
    },
    {
      "path": "src/transport/http/auth/authController.ts",
      "startLine": 18,
      "endLine": 34
    }
  ]
}
```

### 6.7 Historial de conversaciones

Cada intercambio pregunta/respuesta de un usuario registrado se persiste con sus fuentes y su fecha, y es consultable en `GET /projects/:id/history`. A los invitados se les responde igual, pero no se les guarda historial.

### 6.8 Resiliencia frente al proveedor de IA

Las llamadas a Gemini se reintentan con _backoff_ exponencial ante errores transitorios (429 rate limit, 503 servicio no disponible). Si tras los reintentos el fallo persiste, se traduce a un error de dominio tipado que el middleware convierte en un `503` con mensaje claro. Los errores no transitorios se propagan sin reintentar, porque reintentarlos no los arreglaría.

---

## 7. Usuario de prueba

La API **no incluye usuarios precargados**: la base de datos arranca vacía tras las migraciones. Hay dos formas de probarla.

### Opción A (recomendada) — Modo invitado, sin registro

Es el flujo por defecto del producto: no hace falta ninguna credencial.

```bash
curl -X POST http://localhost:3000/auth/guest
```

Devuelve un `accessToken` listo para usar en el resto de endpoints. El frontend lo hace automáticamente al cargar, así que **basta con abrir la aplicación**.

### Opción B — Crear un usuario registrado

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Usuario Demo","email":"demo@devmind.com","password":"demo1234"}'
```

Y a partir de ahí, iniciar sesión con esas credenciales:

```txt
Email:      demo@devmind.com
Contraseña: demo1234
```

> **Nota para la corrección:** estas credenciales son las que hay que crear con el comando de arriba (o desde `/register` en el frontend), no unas preexistentes. Requisitos de validación: nombre ≥ 2 caracteres, email válido, contraseña ≥ 6 caracteres.

---

## 8. API: referencia de endpoints

Todos los endpoints salvo `/health`, `/auth/register`, `/auth/login` y `/auth/guest` requieren la cabecera:

```txt
Authorization: Bearer <accessToken>
```

### Salud

| Método | Ruta      | Descripción                         |
| ------ | --------- | ----------------------------------- |
| `GET`  | `/health` | Comprobación de que la API responde |

### Autenticación

| Método | Ruta             | Body                        | Descripción                                           |
| ------ | ---------------- | --------------------------- | ----------------------------------------------------- |
| `POST` | `/auth/register` | `{ name, email, password }` | Registra un usuario · `201` / `400` / `409`           |
| `POST` | `/auth/login`    | `{ email, password }`       | Devuelve `accessToken` · `200` / `400` / `401`        |
| `POST` | `/auth/guest`    | —                           | Crea una sesión de invitado temporal · `201`          |
| `GET`  | `/auth/me`       | —                           | Datos del usuario autenticado · `200` / `401` / `404` |

### Proyectos

| Método   | Ruta            | Body                     | Descripción                                     |
| -------- | --------------- | ------------------------ | ----------------------------------------------- |
| `POST`   | `/projects`     | `{ name, description? }` | Crea un proyecto · `201` / `400` / `401`        |
| `GET`    | `/projects`     | —                        | Lista los proyectos del usuario · `200` / `401` |
| `GET`    | `/projects/:id` | —                        | Consulta un proyecto · `200` / `401` / `404`    |
| `DELETE` | `/projects/:id` | —                        | Borra un proyecto · `204` / `401` / `404`       |

### Subida e indexación

| Método | Ruta                            | Body                                | Descripción                                                          |
| ------ | ------------------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| `POST` | `/projects/:id/upload`          | `multipart/form-data`, campo `file` | Sube y sincroniza el ZIP · `200` / `400` / `401` / `404`             |
| `POST` | `/projects/:id/index`           | —                                   | Lanza la indexación en segundo plano · `202` / `401` / `404` / `409` |
| `GET`  | `/projects/:id/indexing-status` | —                                   | Progreso de la indexación · `200` / `401` / `404`                    |

### Preguntas

| Método | Ruta                    | Body           | Descripción                                                        |
| ------ | ----------------------- | -------------- | ------------------------------------------------------------------ |
| `POST` | `/projects/:id/ask`     | `{ question }` | Pregunta sobre el proyecto · `200` / `400` / `401` / `404` / `503` |
| `GET`  | `/projects/:id/history` | —              | Historial de conversaciones · `200` / `401` / `404`                |

### Archivos de proyecto

| Método   | Ruta                                 | Descripción                                             |
| -------- | ------------------------------------ | ------------------------------------------------------- |
| `GET`    | `/projects/:projectId/files`         | Lista los archivos del proyecto · `200` / `401` / `404` |
| `GET`    | `/projects/:projectId/files/:fileId` | Consulta un archivo · `200` / `401` / `404`             |
| `DELETE` | `/projects/:projectId/files/:fileId` | Borra un archivo · `204` / `401` / `404`                |

### Formato de errores

Todas las respuestas de error comparten forma:

```json
{ "message": "Descripción del error", "errors": {} }
```

| Código | Significado                                                             |
| ------ | ----------------------------------------------------------------------- |
| `400`  | Body inválido, ZIP ausente, ZIP sin archivos válidos o demasiado grande |
| `401`  | Token ausente, inválido o credenciales incorrectas                      |
| `404`  | El recurso no existe **o no pertenece al usuario autenticado**          |
| `409`  | Conflicto: email ya registrado, o indexación ya en curso                |
| `429`  | Se ha superado el límite de peticiones                                  |
| `503`  | El proveedor de IA no está disponible tras los reintentos               |

---

## 9. Cómo funciona el RAG por dentro

### Fase 1 — Indexación (una vez por proyecto)

```txt
ZIP subido
   ↓
AdmZipExtractor extrae los archivos
   ↓
ProjectFileClassifier filtra (carpetas ignoradas, binarios, markdown, bytes nulos)
   ↓
Sincronización por path + hash → created / updated / unchanged / deleted
   ↓
ProjectFile guardado en PostgreSQL
   ↓
LineCodeChunker trocea (80 líneas, 10 de solapamiento)
   ↓
CodeChunk guardado en PostgreSQL
   ↓
[segundo plano] gemini-embedding-001 genera un vector de 768 dimensiones por chunk
   ↓
code_chunk_embeddings (columna vector(768) de pgvector)
```

La subida y la indexación están **separadas** a propósito: el endpoint de upload responde en cuanto los archivos y los chunks están guardados, y el trabajo caro (una llamada al modelo por chunk) se hace después, con `INDEXING_DELAY_BETWEEN_CHUNKS_MS` de pausa entre llamadas para no agotar la cuota.

### Fase 2 — Pregunta (cada vez)

```txt
Pregunta del usuario
   ↓
Verificación de propiedad: findByIdAndOwnerId(projectId, ownerId)
   ↓
gemini-embedding-001 genera el embedding de la pregunta
   ↓
pgvector busca los 5 chunks más cercanos (operador <->, distancia L2)
   ↓
Filtro por umbral: se descartan los chunks con distance > RAG_MAX_DISTANCE
   ↓
   ├── ¿No queda ninguno? → "No tengo suficiente información del proyecto
   │                          para responder a esa pregunta." (sin fuentes)
   │
   └── ¿Quedan chunks? → gemini-2.5-flash redacta la respuesta con esos
                          fragmentos como único contexto
   ↓
Se construyen las fuentes (path + startLine + endLine), deduplicadas
   ↓
Si el usuario NO es invitado → se guarda el intercambio en el historial
   ↓
{ answer, sources }
```

El prompt instruye explícitamente al modelo a responder en español, a no inventar información fuera del contexto y a admitir cuando el contexto no contiene la respuesta.

---

## 10. Modelo de datos

```txt
users
 ├── id, name, email, password_hash, created_at
 └── is_guest, expires_at            (modo invitado)
      │
      └── projects                    (ON DELETE CASCADE)
           ├── id, owner_id, name, description, created_at
           │
           ├── project_files          (ON DELETE CASCADE)
           │    ├── id, project_id, path, language, content, size, hash, created_at
           │    │
           │    └── code_chunks       (ON DELETE CASCADE)
           │         ├── id, project_id, project_file_id, content,
           │         │   start_line, end_line, chunk_index, created_at
           │         │
           │         └── code_chunk_embeddings   (ON DELETE CASCADE)
           │              └── id, project_id, code_chunk_id,
           │                  embedding vector(768), created_at
           │
           ├── project_indexing_jobs  (ON DELETE CASCADE, UNIQUE por project_id)
           │    └── id, project_id, status, total_chunks, processed_chunks,
           │        failed_chunks, error_message, created_at, updated_at
           │
           └── conversation_entries   (ON DELETE CASCADE)
                └── id, project_id, question, answer, sources (JSONB), created_at
```

Las cascadas hacen que borrar un usuario invitado caducado arrastre automáticamente todos sus datos derivados, sin lógica de limpieza manual.

---

## 11. Seguridad

### Aislamiento entre usuarios

La regla central del sistema:

> **Un usuario nunca puede ver, modificar ni borrar recursos de otro usuario.**

Se aplica así:

1. **El `ownerId` nunca viene del cliente.** No se acepta en el body ni en la URL: se extrae del JWT en `authMiddleware`.
2. **Las consultas van siempre por par de claves.** Se usa `findByIdAndOwnerId(projectId, ownerId)` y `deleteByIdAndOwnerId(...)`, no `findById(projectId)`. Un proyecto solo se encuentra si además pertenece a quien pregunta.
3. **Los `ProjectFile` heredan la seguridad de su proyecto.** No tienen `ownerId` propio: antes de tocar un archivo, el caso de uso verifica la propiedad del proyecto padre.
4. **404 en lugar de 403.** Cuando un recurso pertenece a otro usuario se responde `404 Not Found`, no `403 Forbidden`, para no revelar que ese identificador existe.

### Contraseñas

Nunca se almacenan en claro. Se guarda un hash bcrypt. Si la base de datos se filtrara, las contraseñas no serían legibles ni reutilizables en otros servicios.

### Rate limiting escalonado

Los límites reflejan el coste real de cada ruta:

| Ruta                   | Límite por defecto      | Motivo                                         |
| ---------------------- | ----------------------- | ---------------------------------------------- |
| `/auth/*`              | 10 / 15 min             | Frenar fuerza bruta sobre credenciales         |
| `/projects/:id/ask`    | 20 / 15 min por usuario | Cada pregunta = 1 embedding + 1 llamada al LLM |
| `/projects/:id/upload` | 10 / 60 min por usuario | Consume CPU y memoria, dispara indexación      |
| `/projects/:id/index`  | 5 / 60 min por usuario  | Ruta más cara: una llamada al modelo por chunk |

### Protección de la subida

- Tamaño máximo del ZIP (`MAX_ZIP_SIZE_MB`), aplicado también en `multer`.
- Tamaño máximo descomprimido (`MAX_ZIP_UNCOMPRESSED_SIZE_MB`) como defensa frente a _zip bombs_.
- Filtrado de binarios y de archivos con bytes nulos antes de tocar la base de datos.

### Otras medidas

- `helmet` para cabeceras HTTP de seguridad.
- CORS restringido a `CORS_ORIGIN`.
- Validación de todos los bodies con Zod antes de llegar al controlador.
- Errores de dominio tipados: los fallos internos no filtran trazas al cliente.

---

## 12. Tests

El proyecto tiene **176 casos de test repartidos en 44 archivos**, ejecutados con Vitest y Supertest.

```bash
npm test              # Ejecuta toda la batería
npm run test:watch    # Modo watch
```

Los tests de integración usan **su propia base de datos** (`devmind_test_db`, definida en el script `test` de `package.json`) y limpian las tablas antes y después de cada ejecución, de modo que no afectan a los datos de desarrollo.

### Estrategia

| Nivel           | Qué cubre                                                          | Cómo                                                                                                                                              |
| --------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unitario**    | Casos de uso y adaptadores                                         | Con dobles en memoria (`inMemoryUserRepository`, `testEmbeddingGenerator`, `testAnswerGenerator`). Sin base de datos ni llamadas a APIs externas. |
| **Integración** | Rutas, middlewares, controladores y casos de uso trabajando juntos | Peticiones HTTP reales con Supertest contra la app de Express y PostgreSQL de test.                                                               |

Áreas cubiertas: `auth`, `projects`, `projectFile`, `uploadZip`, `projectQuestions`, `rateLimit`.

### TDD aplicado

El proyecto se desarrolló con TDD pragmático por capas:

```txt
1. Test unitario del caso de uso
2. Implementación mínima del caso de uso
3. Test de integración HTTP del endpoint
4. Implementación de controller, routes, schemas y middlewares
5. Refactor
```

Que los adaptadores sean intercambiables (gracias a los puertos) es lo que hace posible testear la lógica de negocio sin infraestructura: es la razón práctica de la arquitectura hexagonal, no un adorno.

### Comprobación antes de cerrar una fase

```bash
npm test
npm run typecheck
npm run build
```

Si los tres pasan, la fase se considera estable.

---

## 13. Decisiones de diseño

### Por qué arquitectura hexagonal

Un proyecto con IA tiene piezas que envejecen a ritmos muy distintos: las reglas de negocio son estables, pero el modelo de embeddings, el LLM o la base de datos vectorial cambian constantemente. Aislar el núcleo tras puertos permite sustituir Gemini por otro proveedor, o PostgreSQL por otra base de datos, escribiendo un adaptador nuevo sin tocar los casos de uso. El beneficio inmediato y verificable es el testing: los 176 tests corren sin depender del proveedor de IA.

### Por qué pgvector y no una base de datos vectorial dedicada

`pgvector` es una extensión de PostgreSQL, no un servicio aparte. Permite guardar los embeddings **en la misma base de datos** que usuarios, proyectos, archivos y chunks. Esto aporta:

- **Integridad referencial real:** un embedding tiene `FOREIGN KEY` a su chunk, y las cascadas de borrado funcionan solas.
- **Una sola infraestructura:** un contenedor en desarrollo, una base de datos en producción, un único backup.
- **Consultas mixtas:** filtrar por `project_id` y ordenar por similitud vectorial en la misma sentencia SQL.

A la escala de este proyecto, el coste operativo de mantener un Pinecone o un Qdrant aparte no compensa la ganancia en rendimiento.

### Por qué se separó la indexación de la subida del ZIP

En las primeras versiones, la generación de embeddings ocurría dentro del flujo de subida. En un proyecto con muchos archivos eso significaba cientos de llamadas seguidas al modelo, con el resultado de que la petición HTTP tardaba minutos, el usuario se quedaba mirando una pantalla congelada y aparecían errores de cuota.

La solución fue partir el flujo: la subida guarda archivos y chunks y responde de inmediato; la indexación se lanza aparte, corre en segundo plano y su progreso es consultable. El scheduler (`AsyncProjectIndexingScheduler`) devuelve `void` a propósito y captura sus errores, para que un fallo de indexación no rompa la petición HTTP original.

### Por qué existe un umbral de distancia (`RAG_MAX_DISTANCE`)

Es la decisión más importante del sistema en términos de confianza.

Una búsqueda vectorial **siempre** devuelve los _k_ vecinos más cercanos, exista o no una respuesta real. Sin filtro, preguntar "¿cuál es la receta de la tortilla?" sobre un proyecto de código devolvía igualmente cinco fragmentos y el modelo redactaba algo con ellos: "más cercano" no significa "relevante".

El umbral descarta los chunks cuya distancia L2 supera `RAG_MAX_DISTANCE`. Si no sobrevive ninguno, DevMind responde explícitamente que no tiene información, sin llamar siquiera al LLM. Prefiere admitir ignorancia a inventar, que es exactamente lo que se le pide a una herramienta de consulta técnica.

> El valor por defecto (`1.0`) es un punto de partida razonable, no un óptimo medido. Calibrarlo con un conjunto de preguntas reales es trabajo pendiente ([§14](#14-limitaciones-conocidas-y-trabajo-futuro)).

### Por qué troceado por líneas (80/10) y no por funciones

`LineCodeChunker` divide por ventanas de líneas con solapamiento. Es una estrategia **agnóstica del lenguaje**: funciona igual con TypeScript, Python o YAML, sin necesitar un parser por cada uno. El solapamiento de 10 líneas mitiga el principal inconveniente, que una función quede cortada en la frontera entre dos chunks.

Trocear por unidades sintácticas (funciones, clases) daría chunks semánticamente más limpios, pero exige un parser por lenguaje. Es una mejora identificada, no un descuido ([§14](#14-limitaciones-conocidas-y-trabajo-futuro)).

### Por qué se ignoran los archivos Markdown

Se descartan `.md` y `.mdx` en la subida deliberadamente. El objetivo de DevMind es responder a partir del **código fuente real**, que es la única fuente que no miente sobre lo que el sistema hace. La documentación puede estar desactualizada; si entrase en el índice, las respuestas podrían apoyarse en ella en lugar de en el código, que es justo el problema que el proyecto intenta resolver.

### Por qué existe el modo invitado

Pedir un registro antes de dejar probar el producto es fricción que impide evaluar la herramienta. El modo invitado permite el flujo completo (subir, indexar, preguntar) sin dar ningún dato, a cambio de que todo sea temporal. El registro deja entonces de ser un peaje de entrada y pasa a ser una propuesta clara: conservar tus proyectos y tu historial.

### Por qué 404 y no 403

Responder `403 Forbidden` a un recurso ajeno confirma que ese identificador existe. Responder `404 Not Found` no revela nada: para un usuario, un proyecto que no le pertenece es indistinguible de uno que no existe.

---

## 14. Limitaciones conocidas y trabajo futuro

Reconocidas de forma explícita, con su motivo:

| Limitación                                                                                                                  | Estado                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **La purga de invitados no es automática.** `purge-guests` existe y funciona, pero debe lanzarse a mano o por cron externo. | Un scheduler interno queda como mejora (ver la Fase 13 en `docs/Memoria_Tecnica.md`).            |
| **El proyecto de un invitado no se transfiere al registrarse.** Al crear cuenta, lo subido como invitado no migra.          | Decisión consciente: la migración añade complejidad que no aportaba al alcance del TFM.         |
| **La indexación vive en el proceso de la API.** Corre en segundo plano, pero dentro del mismo proceso.                      | Con varias instancias o proyectos muy grandes, correspondería una cola externa (BullMQ, Redis). |
| **`RAG_MAX_DISTANCE` no está calibrado empíricamente.** El valor por defecto es un punto de partida.                        | Requiere un conjunto de preguntas de evaluación con respuestas esperadas.                       |
| **El troceado es por líneas, no por unidades sintácticas.**                                                                 | Trocear por funciones/clases mejoraría la precisión; exige un parser por lenguaje.              |
| **No hay métricas de calidad de las respuestas.** No se mide precisión ni relevancia de forma sistemática.                  | Es la mejora de mayor valor: convertiría el sistema en algo evaluable objetivamente.            |
| **Los ZIP se procesan en memoria.** Limita el tamaño manejable a la RAM de la instancia.                                    | Streaming a disco para proyectos grandes.                                                       |

### Próximos pasos previstos

1. **Medir la calidad de las respuestas** con un conjunto de preguntas de evaluación y sus respuestas esperadas.
2. **Troceado por unidades sintácticas** (funciones, clases) en los lenguajes principales.
3. **Integración directa con GitHub**, para indexar un repositorio por URL sin ZIP intermedio.
4. **Respuestas en streaming**, para que el usuario vea el texto según se genera.
5. **Cola de trabajos externa** para la indexación, de cara a escalar horizontalmente.

---

## Documentación adicional

En la carpeta `docs/` hay material técnico ampliado:

| Documento                      | Contenido                                             |
| ------------------------------ | ----------------------------------------------------- |
| `docs/Memoria_Tecnica.md`      | **Memoria técnica**: recorrido paso a paso del desarrollo, desde la idea inicial hasta la construcción final del proyecto (requisitos, casos de uso, decisiones de diseño y todas las fases) |
| `docs/Defensa_del_Proyecto.md` | Recorrido técnico detallado de cada flujo del sistema |
| `docs/openapi.yaml`            | Contrato OpenAPI de la API (endpoints y esquemas)     |
| `docs/Frontend_generado_con_IA.md` | Cómo se generó el frontend con IA y el _prompt_ exacto utilizado |

---

## Licencia

ISC
