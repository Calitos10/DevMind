# DevMind API

DevMind es una API backend inteligente para equipos de desarrollo.

Su objetivo es permitir que un usuario pueda registrar sus proyectos software, indexar su código y documentación, y más adelante hacer preguntas en lenguaje natural sobre su estructura, funcionalidades, endpoints, casos de uso, tests y posibles mejoras.

En fases futuras, DevMind usará técnicas de RAG para responder usando el código real del proyecto como contexto.

---

## Problema que resuelve

Entender un proyecto software existente puede ser lento porque el conocimiento técnico suele estar disperso entre:

* carpetas y archivos de código,
* documentación incompleta,
* convenciones internas del equipo,
* historial técnico no documentado,
* experiencia de otros desarrolladores.

DevMind busca reducir ese tiempo convirtiendo un proyecto software en una fuente de conocimiento consultable mediante lenguaje natural.

Ejemplos de preguntas futuras:

```txt
¿Dónde se gestiona la autenticación?
¿Qué endpoints tiene este proyecto?
Explícame la arquitectura de carpetas.
¿Qué hace LoginUserUseCase?
¿Qué tests existen para auth?
¿Qué partes debería mejorar?
```

---

## Estado actual del proyecto

Actualmente el proyecto tiene implementadas las siguientes fases:

```txt
Fase 0 — Base técnica de la API ✅
Fase 1 — Autenticación de usuarios ✅
Fase 2 — Gestión de proyectos ✅
```

Todavía no está implementada la subida de archivos, indexación de código, embeddings ni RAG. Eso vendrá en fases posteriores.

---

## Arquitectura

El proyecto sigue una arquitectura inspirada en Clean Architecture / Hexagonal Architecture.

La idea principal es separar la lógica del negocio de los detalles técnicos como Express, JWT, bcrypt, bases de datos o herramientas de IA.

Estructura conceptual:

```txt
src/
├── app.ts
├── main.ts
├── container/
├── domain/
├── application/
├── infrastructure/
├── transport/
└── shared/
```

Responsabilidad de cada capa:

### `domain`

Contiene entidades puras e interfaces del negocio.

Ejemplos:

```txt
User
Project
UserRepository
ProjectRepository
```

Esta capa no conoce Express, JWT, PostgreSQL, Genkit ni ninguna herramienta externa.

### `application`

Contiene los casos de uso de la aplicación.

Ejemplos:

```txt
RegisterUserUseCase
LoginUserUseCase
GetCurrentUserUseCase
CreateProjectUseCase
ListUserProjectsUseCase
GetProjectByIdUseCase
DeleteProjectUseCase
```

Los casos de uso coordinan la lógica de aplicación usando interfaces/puertos, no implementaciones concretas.

### `infrastructure`

Contiene implementaciones técnicas.

Ejemplos:

```txt
BcryptPasswordHasher
JwtTokenService
CryptoIdGenerator
InMemoryUserRepository
InMemoryProjectRepository
```

Actualmente los datos se guardan en memoria. Esto significa que al reiniciar el servidor se pierden los usuarios y proyectos creados.

Más adelante se sustituirá por PostgreSQL.

### `transport`

Contiene la entrada HTTP con Express.

Aquí viven:

```txt
controllers
routes
middlewares
schemas de validación
```

Ejemplos:

```txt
authController
authRoutes
projectController
projectRoutes
authMiddleware
validateBodyMiddleware
errorMiddleware
```

### `container`

Es el composition root de la aplicación.

Se encarga de conectar casos de uso con sus implementaciones reales.

Ejemplo:

```txt
RegisterUserUseCase → InMemoryUserRepository + BcryptPasswordHasher + CryptoIdGenerator
CreateProjectUseCase → InMemoryProjectRepository + CryptoIdGenerator
```

### `shared`

Contiene errores, tipos y utilidades comunes.

Ejemplos:

```txt
AppError
UserAlreadyExistsError
InvalidCredentialsError
UnauthorizedError
ProjectNotFoundError
```

---

## Stack actual

El proyecto usa actualmente:

```txt
Node.js
TypeScript
Express
Vitest
Supertest
Zod
JWT
bcryptjs
```

Stack previsto para fases futuras:

```txt
PostgreSQL
pgvector
Genkit
Docker
RAG
Embeddings
```

---

## Scripts disponibles

```bash
npm run dev
npm run build
npm start
npm run typecheck
npm test
npm run test:watch
```

### `npm run dev`

Levanta el servidor en modo desarrollo.

### `npm test`

Ejecuta los tests con Vitest.

### `npm run typecheck`

Ejecuta el comprobador de tipos de TypeScript sin generar archivos.

### `npm run build`

Compila el proyecto para producción.

---

## Endpoints implementados

### Health check

```txt
GET /health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "DevMind API",
  "message": "API is running"
}
```

---

## Autenticación

La Fase 1 implementa registro, login y consulta del usuario autenticado.

La autenticación responde a la pregunta:

```txt
¿Quién está usando DevMind?
```

Esto es necesario porque cada usuario tendrá sus propios proyectos.

---

### Registrar usuario

```txt
POST /auth/register
```

Body:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

Respuesta esperada:

```json
{
  "user": {
    "id": "user-id",
    "name": "Test User",
    "email": "test@example.com"
  }
}
```

Posibles errores:

```txt
400 Bad Request — body inválido
409 Conflict — el usuario ya existe
```

---

### Login

```txt
POST /auth/login
```

Body:

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

Respuesta esperada:

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "user-id",
    "name": "Test User",
    "email": "test@example.com"
  }
}
```

Posibles errores:

```txt
400 Bad Request — body inválido
401 Unauthorized — credenciales inválidas
```

---

### Obtener usuario autenticado

```txt
GET /auth/me
```

Header requerido:

```txt
Authorization: Bearer ACCESS_TOKEN
```

Respuesta esperada:

```json
{
  "id": "user-id",
  "name": "Test User",
  "email": "test@example.com"
}
```

Posibles errores:

```txt
401 Unauthorized — token ausente o inválido
404 Not Found — usuario no encontrado
```

---

## Projects

La Fase 2 implementa la gestión básica de proyectos.

Esta fase responde a la pregunta:

```txt
¿Qué proyectos tiene cada usuario?
```

Cada proyecto pertenece a un usuario mediante `ownerId`.

Relación actual:

```txt
User
 └── Project
```

Relación futura:

```txt
User
 └── Project
      └── ProjectFile
           └── CodeChunk
                └── Embedding
```

---

## Seguridad en Projects

Todos los endpoints de `/projects` están protegidos con JWT.

El usuario no manda el `ownerId` en el body.

El `ownerId` se obtiene desde el token mediante `authMiddleware`.

Esto evita que un usuario pueda crear, ver o borrar proyectos en nombre de otro usuario.

Regla principal:

```txt
Un usuario nunca puede ver ni borrar proyectos de otro usuario.
```

Para consultar o borrar proyectos concretos se usa una búsqueda por:

```txt
projectId + ownerId
```

En vez de buscar solo por:

```txt
projectId
```

Así se comprueba que el proyecto existe y además pertenece al usuario autenticado.

---

### Crear proyecto

```txt
POST /projects
```

Header requerido:

```txt
Authorization: Bearer ACCESS_TOKEN
```

Body:

```json
{
  "name": "DevMind API",
  "description": "Backend con IA para consultar proyectos software"
}
```

Respuesta esperada:

```json
{
  "id": "project-id",
  "ownerId": "user-id",
  "name": "DevMind API",
  "description": "Backend con IA para consultar proyectos software",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

Posibles errores:

```txt
400 Bad Request — body inválido
401 Unauthorized — token ausente o inválido
```

---

### Listar proyectos del usuario autenticado

```txt
GET /projects
```

Header requerido:

```txt
Authorization: Bearer ACCESS_TOKEN
```

Respuesta esperada:

```json
[
  {
    "id": "project-id",
    "ownerId": "user-id",
    "name": "DevMind API",
    "description": "Backend con IA para consultar proyectos software",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
]
```

Si el usuario no tiene proyectos, la respuesta será:

```json
[]
```

Posibles errores:

```txt
401 Unauthorized — token ausente o inválido
```

---

### Obtener un proyecto concreto

```txt
GET /projects/:id
```

Header requerido:

```txt
Authorization: Bearer ACCESS_TOKEN
```

Respuesta esperada:

```json
{
  "id": "project-id",
  "ownerId": "user-id",
  "name": "DevMind API",
  "description": "Backend con IA para consultar proyectos software",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

Posibles errores:

```txt
401 Unauthorized — token ausente o inválido
404 Not Found — el proyecto no existe o no pertenece al usuario autenticado
```

Cuando un proyecto pertenece a otro usuario, también se devuelve `404 Not Found` para no revelar si ese proyecto existe.

---

### Borrar un proyecto

```txt
DELETE /projects/:id
```

Header requerido:

```txt
Authorization: Bearer ACCESS_TOKEN
```

Respuesta esperada:

```txt
204 No Content
```

Posibles errores:

```txt
401 Unauthorized — token ausente o inválido
404 Not Found — el proyecto no existe o no pertenece al usuario autenticado
```

Cuando un proyecto pertenece a otro usuario, también se devuelve `404 Not Found` para evitar filtrar información.

---

## Tests

El proyecto usa Vitest y Supertest.

Hay tests unitarios para casos de uso y adaptadores de infraestructura.

También hay tests de integración HTTP para validar rutas, middlewares, controllers y casos de uso trabajando juntos.

---

## Tests de autenticación

Casos cubiertos:

```txt
POST /auth/register con datos válidos → 201
POST /auth/register con body inválido → 400
POST /auth/register con email duplicado → 409

POST /auth/login con credenciales válidas → 200
POST /auth/login con credenciales inválidas → 401

GET /auth/me sin token → 401
GET /auth/me con token válido → 200
```

---

## Tests de Projects

Casos cubiertos:

```txt
POST /projects con token y body válido → 201
POST /projects sin token → 401
POST /projects con body inválido → 400

GET /projects con token válido → 200
GET /projects sin token → 401
GET /projects devuelve solo proyectos del usuario autenticado

GET /projects/:id con proyecto propio → 200
GET /projects/:id sin token → 401
GET /projects/:id con proyecto inexistente → 404
GET /projects/:id con proyecto de otro usuario → 404

DELETE /projects/:id con proyecto propio → 204
DELETE /projects/:id sin token → 401
DELETE /projects/:id con proyecto inexistente → 404
DELETE /projects/:id con proyecto de otro usuario → 404
```

---

## TDD aplicado

El proyecto aplica TDD pragmático por capas.

Primero se prueban los casos de uso mediante tests unitarios, ya que contienen la lógica principal de negocio.

Después se prueban los endpoints mediante tests de integración HTTP para validar el comportamiento completo de rutas, middlewares, controllers y casos de uso.

Flujo usado:

```txt
1. Test unitario del caso de uso.
2. Implementación mínima del caso de uso.
3. Test de integración HTTP del endpoint.
4. Implementación de controller, routes, schemas y middlewares necesarios.
5. Refactor si hace falta.
```

---

## Errores controlados

DevMind usa errores propios basados en `AppError`.

Esto permite que los casos de uso lancen errores de negocio y que el `errorMiddleware` los convierta en respuestas HTTP controladas.

Ejemplos:

```txt
UserAlreadyExistsError → 409
InvalidCredentialsError → 401
UnauthorizedError → 401
UserNotFoundError → 404
ProjectNotFoundError → 404
```

Los errores técnicos inesperados se manejan como errores internos del servidor.

---

## Próximas fases previstas

### Fase 3 — Project Files / subida de código

Permitirá subir proyectos reales, probablemente en formato `.zip`.

El sistema deberá:

```txt
1. Recibir un ZIP.
2. Descomprimirlo temporalmente.
3. Recorrer carpetas y subcarpetas.
4. Ignorar archivos y carpetas innecesarias.
5. Guardar archivos útiles asociados a un Project.
```

Archivos y carpetas a ignorar:

```txt
node_modules/
dist/
.git/
coverage/
.env
.env.local
.DS_Store
binarios
imágenes pesadas
vídeos
```

Especialmente `.env`, porque puede contener secretos.

---

### Fase futura — RAG sobre código

Más adelante DevMind permitirá:

```txt
1. Dividir archivos en chunks.
2. Generar embeddings.
3. Guardar embeddings en PostgreSQL con pgvector.
4. Buscar chunks relevantes según la pregunta del usuario.
5. Responder con IA usando el código real como contexto.
```

Ejemplo futuro:

```txt
Usuario pregunta:
¿Dónde se gestiona la autenticación?

DevMind busca en los chunks relevantes y responde usando el código real del proyecto.
```

---

## Comprobación antes de cerrar una fase

Antes de dar una fase por terminada, ejecutar:

```bash
npm test
npm run typecheck
npm run build
```

Si los tres comandos pasan, la fase se considera estable.
