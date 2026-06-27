# DevMind — Documentación del Proyecto

## 1. Resumen del proyecto

**DevMind** es una API inteligente para equipos de desarrollo que permite indexar proyectos software y hacer preguntas en lenguaje natural sobre su código, documentación y estructura.

La idea principal es que un equipo pueda conectar o subir un proyecto, y el sistema sea capaz de responder preguntas como:

- ¿Qué hace esta función?
- ¿Dónde se gestiona la autenticación?
- ¿Qué endpoints existen en el proyecto?
- ¿Cómo está organizada la arquitectura?
- ¿Qué archivos están relacionados con una funcionalidad concreta?
- ¿Qué tests se podrían generar para este endpoint?
- ¿Qué partes del código debería revisar un desarrollador nuevo?

DevMind no debe plantearse como un simple chatbot, sino como una **API backend profesional con IA integrada**, capaz de consultar código y documentación usando **RAG**, agentes y respuestas con fuentes trazables.

---

## 2. Objetivo principal

El objetivo del proyecto es diseñar e implementar una API backend que permita a los equipos de desarrollo comprender, documentar y validar proyectos software mediante inteligencia artificial generativa.

El sistema indexará el código fuente y la documentación de un proyecto, almacenará fragmentos semánticos en una base de datos y permitirá realizar consultas en lenguaje natural sobre el contenido del proyecto.

---

## 3. Frase corta para explicar el proyecto

> DevMind es una API inteligente construida con TypeScript, Node.js, Express, PostgreSQL y Genkit que permite subir o conectar un proyecto software, indexar su código y consultar su estructura, funciones, endpoints y documentación mediante lenguaje natural usando RAG y agentes de IA.

---

## 4. Problema que resuelve

En muchos equipos de desarrollo, entender un proyecto nuevo lleva tiempo. Los desarrolladores suelen tener que revisar carpetas, leer documentación, buscar endpoints, seguir llamadas entre archivos y preguntar a otros compañeros.

Esto ocurre especialmente cuando:

- Entra un nuevo desarrollador al equipo.
- El proyecto tiene poca documentación.
- El código ha crecido mucho.
- Hay funcionalidades repartidas en muchos archivos.
- Se quiere entender rápidamente una parte concreta del sistema.
- Se quieren generar tests iniciales para endpoints o funciones existentes.

DevMind ayuda a reducir ese tiempo permitiendo hacer preguntas directamente al proyecto.

---

## 5. Por qué es una buena idea para TFM y portfolio

Este proyecto es potente porque demuestra varias habilidades muy demandadas:

- Backend real con TypeScript y Node.js.
- Diseño de API REST.
- Autenticación con JWT.
- Base de datos SQL con PostgreSQL.
- Uso de IA generativa en un caso real.
- RAG sobre código y documentación.
- Uso de Genkit para flujos, prompts, tools y agentes.
- Testing con Vitest y Supertest.
- Dockerización del sistema.
- Buenas prácticas de seguridad.
- Arquitectura limpia y modular.
- Proyecto útil y fácil de explicar en entrevistas.

No parece un proyecto de juguete. Parece una herramienta que un equipo real podría usar.

---

## 6. Nombre del proyecto

Nombre principal:

**DevMind**

Posibles subtítulos:

- API inteligente para equipos de desarrollo.
- Asistente inteligente para comprensión de proyectos software.
- API backend para análisis semántico de código mediante IA.
- Plataforma backend para consulta, documentación y validación de proyectos software.

Título posible para el TFM:

> DevMind: API inteligente para análisis, consulta y validación de proyectos software mediante RAG y agentes de IA.

Otra opción más académica:

> Diseño e implementación de un asistente inteligente para equipos de desarrollo basado en recuperación aumentada de información y modelos generativos.

---

## 7. Alcance del MVP

La primera versión del proyecto debe ser pequeña pero sólida.

El MVP debe permitir:

1. Registrar usuarios.
2. Iniciar sesión.
3. Crear proyectos.
4. Subir o cargar archivos de un proyecto.
5. Indexar el código y la documentación.
6. Hacer preguntas sobre el proyecto.
7. Obtener respuestas con fuentes.
8. Guardar historial de conversación.
9. Tener tests básicos.
10. Ejecutarse con Docker.

El objetivo del MVP no es tener todas las funcionalidades posibles, sino demostrar que la arquitectura funciona de principio a fin.

---

## 8. Funcionalidades principales

### 8.1 Autenticación

El sistema debe permitir que cada usuario tenga sus propios proyectos.

Funcionalidades:

- Registro de usuario.
- Login.
- Contraseñas cifradas con bcrypt.
- Generación de JWT.
- Middleware de autenticación.
- Endpoint para obtener el usuario actual.

Endpoints:

```txt
POST /auth/register
POST /auth/login
GET  /auth/me
```

---

### 8.2 Gestión de proyectos

Cada usuario podrá crear y gestionar varios proyectos.

Funcionalidades:

- Crear proyecto.
- Listar proyectos del usuario.
- Consultar detalle de un proyecto.
- Eliminar proyecto.
- Ver archivos asociados al proyecto.

Endpoints:

```txt
POST   /projects
GET    /projects
GET    /projects/:id
DELETE /projects/:id
GET    /projects/:id/files
```

---

### 8.3 Subida o carga de código

Para la primera versión, lo más recomendable es permitir subir un archivo ZIP con el proyecto.

El sistema debe:

1. Recibir el ZIP.
2. Extraer los archivos.
3. Filtrar archivos innecesarios.
4. Guardar rutas y contenido.
5. Preparar los archivos para indexación.

Endpoint recomendado:

```txt
POST /projects/:id/upload
```

Carpetas que se deben ignorar:

```txt
node_modules
dist
build
.git
coverage
.cache
.vscode
.idea
```

Archivos que se deben ignorar:

```txt
.env
.env.local
.env.production
package-lock.json
pnpm-lock.yaml
yarn.lock
```

Extensiones recomendadas para indexar:

```txt
.ts
.tsx
.js
.jsx
.md
.json
.sql
.prisma
.yml
.yaml
```

---

### 8.4 Indexación del proyecto

La indexación consiste en convertir el código y la documentación en fragmentos consultables por IA.

Proceso:

1. Leer archivos del proyecto.
2. Dividir contenido en chunks.
3. Generar embeddings.
4. Guardar chunks y embeddings en PostgreSQL con pgvector.
5. Asociar cada chunk a su archivo y proyecto.

Flow recomendado en Genkit:

```txt
indexProjectFlow
```

Este flow debe encargarse de preparar el proyecto para que pueda ser consultado posteriormente.

---

### 8.5 Chat con el proyecto

El usuario podrá hacer preguntas en lenguaje natural sobre el proyecto.

Endpoint:

```txt
POST /projects/:id/chat
```

Ejemplo de request:

```json
{
  "message": "¿Dónde se gestiona la autenticación?"
}
```

Ejemplo de respuesta:

```json
{
  "answer": "La autenticación se gestiona principalmente en auth.controller.ts y auth.middleware.ts. El middleware valida el token JWT y añade el usuario autenticado a la request.",
  "sources": [
    {
      "file": "src/middlewares/auth.middleware.ts",
      "startLine": 10,
      "endLine": 42
    },
    {
      "file": "src/controllers/auth.controller.ts",
      "startLine": 5,
      "endLine": 31
    }
  ]
}
```

Lo importante es que la IA no responda sin más, sino que devuelva fuentes para demostrar de dónde ha sacado la información.

Flow recomendado en Genkit:

```txt
chatWithProjectFlow
```

---

### 8.6 Historial de conversación

Cada conversación debe guardarse para poder revisar preguntas anteriores.

Endpoints:

```txt
GET /projects/:id/history
```

Tablas relacionadas:

- conversations
- messages

---

### 8.7 Resumen de arquitectura

Funcionalidad extra muy útil para portfolio.

Endpoint:

```txt
GET /projects/:id/summary
```

Debe generar un resumen del proyecto:

- Qué tipo de aplicación parece ser.
- Qué tecnologías usa.
- Cómo están organizadas las carpetas.
- Qué módulos principales existen.
- Qué partes parecen encargarse de autenticación, rutas, base de datos, lógica de negocio, etc.

Flow recomendado:

```txt
summarizeProjectFlow
```

---

### 8.8 Listado de endpoints

Funcionalidad muy útil para proyectos Express, Fastify, NestJS o similares.

Endpoint:

```txt
GET /projects/:id/endpoints
```

Debe intentar detectar rutas como:

```txt
GET /users
POST /auth/login
POST /projects/:id/chat
DELETE /projects/:id
```

Esta funcionalidad puede hacerse de dos maneras:

1. Búsqueda heurística sobre archivos de rutas.
2. Uso de IA para interpretar archivos relacionados con endpoints.

---

### 8.9 Generación de tests

Funcionalidad avanzada.

Endpoint:

```txt
POST /projects/:id/generate-tests
```

Ejemplo de request:

```json
{
  "target": "src/controllers/auth.controller.ts",
  "type": "integration"
}
```

Ejemplo de respuesta:

```json
{
  "testFileName": "auth.controller.test.ts",
  "framework": "vitest",
  "content": "..."
}
```

Importante:

Genkit puede generar la propuesta del test, pero los tests reales deben poder ejecutarse con Vitest o Supertest.

Flow recomendado:

```txt
generateTestsFlow
```

---

## 9. Stack tecnológico

### Backend

```txt
TypeScript
Node.js
Express
```

### Base de datos

```txt
PostgreSQL
pgvector
Prisma o Drizzle
```

### Inteligencia artificial

```txt
Genkit
RAG
Embeddings
Tools
Agents
MCP opcional
```

### Seguridad

```txt
JWT
bcrypt
middlewares de autorización
validación con Zod
```

### Testing

```txt
Vitest
Supertest
```

### DevOps

```txt
Docker
Docker Compose
GitHub Actions
```

### Documentación

```txt
README.md
Swagger / OpenAPI
Diagramas de arquitectura
```

---

## 10. Papel de cada tecnología

### Express

Se encarga de construir la API REST.

Recibe peticiones HTTP, define rutas y conecta los controladores con la lógica de negocio.

### TypeScript

Aporta tipado, mejora la mantenibilidad y reduce errores en el backend.

### PostgreSQL

Guarda información persistente:

- usuarios
- proyectos
- archivos
- chunks
- embeddings
- conversaciones
- mensajes

### pgvector

Permite guardar y consultar embeddings dentro de PostgreSQL.

Esto permite hacer búsqueda semántica sobre el código y la documentación.

### Genkit

Es la capa de IA.

Sirve para:

- Definir flows.
- Crear prompts.
- Gestionar RAG.
- Crear tools.
- Orquestar agentes.
- Generar respuestas estructuradas.
- Depurar flujos de IA.

### JWT

Permite autenticar usuarios.

Cada petición protegida debe enviar un token válido.

### bcrypt

Sirve para cifrar contraseñas antes de guardarlas en base de datos.

### Vitest

Sirve para tests unitarios.

### Supertest

Sirve para probar endpoints HTTP.

### Docker

Permite empaquetar la aplicación y ejecutarla de forma reproducible.

### Docker Compose

Permite levantar varios servicios juntos:

- API
- PostgreSQL
- pgAdmin opcional

---

## 11. Arquitectura general

```txt
Cliente / Frontend / Equipo externo
        ↓
API REST Express + TypeScript
        ↓
Auth Middleware JWT
        ↓
Project Controller
        ↓
DevMind Orchestrator — Genkit defineFlow
        ├── Indexing Flow
        │     ├── Lee archivos del proyecto
        │     ├── Limpia contenido innecesario
        │     ├── Divide en chunks
        │     ├── Genera embeddings
        │     └── Guarda en PostgreSQL + pgvector
        │
        ├── RAG Flow
        │     ├── Recibe pregunta del usuario
        │     ├── Busca fragmentos relevantes
        │     ├── Construye prompt con contexto
        │     └── Responde con fuentes
        │
        ├── Code Analysis Flow
        │     ├── Resume arquitectura
        │     ├── Lista endpoints
        │     └── Localiza funciones importantes
        │
        └── Test Generation Flow
              ├── Analiza endpoint/función
              ├── Propone casos de prueba
              └── Genera tests Vitest/Supertest
        ↓
PostgreSQL
        ├── users
        ├── projects
        ├── project_files
        ├── code_chunks
        ├── conversations
        └── messages
```

---

## 12. Arquitectura por carpetas recomendada

```txt
devmind-api/
├── src/
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   └── db.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.schemas.ts
│   │   │   └── auth.test.ts
│   │   │
│   │   ├── projects/
│   │   │   ├── project.routes.ts
│   │   │   ├── project.controller.ts
│   │   │   ├── project.service.ts
│   │   │   └── project.schemas.ts
│   │   │
│   │   ├── files/
│   │   │   ├── file.service.ts
│   │   │   ├── file-filter.ts
│   │   │   └── zip.service.ts
│   │   │
│   │   ├── chat/
│   │   │   ├── chat.routes.ts
│   │   │   ├── chat.controller.ts
│   │   │   └── chat.service.ts
│   │   │
│   │   └── ai/
│   │       ├── genkit.ts
│   │       ├── flows/
│   │       │   ├── index-project.flow.ts
│   │       │   ├── chat-with-project.flow.ts
│   │       │   ├── summarize-project.flow.ts
│   │       │   └── generate-tests.flow.ts
│   │       ├── tools/
│   │       │   ├── search-code.tool.ts
│   │       │   ├── get-file-content.tool.ts
│   │       │   └── list-endpoints.tool.ts
│   │       └── prompts/
│   │           ├── chat.prompt.ts
│   │           └── generate-tests.prompt.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   │
│   ├── shared/
│   │   ├── errors/
│   │   ├── utils/
│   │   └── types/
│   │
│   └── tests/
│       ├── setup.ts
│       └── helpers.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## 13. Modelo de base de datos inicial

Tablas recomendadas:

### users

```txt
id
name
email
password_hash
created_at
updated_at
```

### projects

```txt
id
user_id
name
description
created_at
updated_at
```

### project_files

```txt
id
project_id
path
language
content
content_hash
created_at
updated_at
```

### code_chunks

```txt
id
project_id
file_id
content
embedding
start_line
end_line
created_at
```

### conversations

```txt
id
project_id
user_id
title
created_at
updated_at
```

### messages

```txt
id
conversation_id
role
content
sources
created_at
```

---

## 14. Flows de Genkit

### 14.1 indexProjectFlow

Responsabilidad:

Preparar el proyecto para ser consultado por IA.

Entrada:

```json
{
  "projectId": "..."
}
```

Pasos:

1. Buscar archivos del proyecto en base de datos.
2. Filtrar archivos válidos.
3. Dividir cada archivo en chunks.
4. Generar embeddings.
5. Guardar chunks y embeddings.
6. Marcar proyecto como indexado.

Salida:

```json
{
  "projectId": "...",
  "indexedFiles": 25,
  "createdChunks": 140
}
```

---

### 14.2 chatWithProjectFlow

Responsabilidad:

Responder preguntas del usuario usando RAG.

Entrada:

```json
{
  "projectId": "...",
  "userId": "...",
  "message": "¿Dónde se gestiona la autenticación?"
}
```

Pasos:

1. Generar embedding de la pregunta.
2. Buscar chunks similares en PostgreSQL + pgvector.
3. Construir prompt con contexto.
4. Llamar al modelo.
5. Devolver respuesta con fuentes.
6. Guardar mensaje del usuario y respuesta del asistente.

Salida:

```json
{
  "answer": "...",
  "sources": [...]
}
```

---

### 14.3 summarizeProjectFlow

Responsabilidad:

Generar una explicación general del proyecto.

Debe devolver:

- Tecnologías detectadas.
- Carpetas principales.
- Módulos importantes.
- Resumen de arquitectura.
- Posibles mejoras.
- Archivos clave.

---

### 14.4 generateTestsFlow

Responsabilidad:

Generar tests sugeridos para un endpoint, archivo o función.

Debe devolver:

- Nombre de archivo de test.
- Framework recomendado.
- Casos cubiertos.
- Código del test.
- Explicación.

---

## 15. Tools de Genkit recomendadas

### searchCodeTool

Busca fragmentos relevantes del código usando embeddings.

Uso:

```txt
Cuando el usuario pregunta algo general sobre el proyecto.
```

Ejemplo:

```txt
¿Dónde se valida el JWT?
```

---

### getFileContentTool

Obtiene el contenido exacto de un archivo concreto.

Uso:

```txt
Cuando el usuario pregunta por un archivo específico.
```

Ejemplo:

```txt
Explícame src/middlewares/auth.middleware.ts
```

---

### listEndpointsTool

Intenta detectar endpoints del proyecto.

Uso:

```txt
Cuando el usuario pregunta por rutas o API.
```

Ejemplo:

```txt
¿Qué endpoints tiene este proyecto?
```

---

### saveConversationTool

Guarda mensajes del usuario y respuestas de la IA.

---

## 16. RAG explicado de forma sencilla

RAG significa **Retrieval Augmented Generation**.

En español:

> Generación aumentada con recuperación de información.

La idea es que la IA no responde solo con lo que sabe de fábrica. Antes de responder, el sistema busca información relevante en tus propios datos.

En DevMind:

1. El usuario pregunta algo.
2. El sistema busca partes relevantes del código.
3. La IA recibe esas partes como contexto.
4. La IA responde basándose en esos fragmentos.
5. La respuesta incluye fuentes.

Ejemplo:

Pregunta:

```txt
¿Dónde se gestiona la autenticación?
```

El sistema busca fragmentos relacionados con:

```txt
auth
jwt
middleware
login
verify
token
```

Luego responde usando esos archivos como fuente.

---

## 17. MCP en DevMind

MCP significa **Model Context Protocol**.

Puede permitir que un modelo o agente use herramientas externas, por ejemplo un filesystem.

En DevMind se podría usar MCP filesystem para leer archivos reales del proyecto bajo demanda.

Pero no debería ser obligatorio para el MVP.

Recomendación:

- Usar RAG como base principal.
- Añadir MCP filesystem como mejora futura.
- No permitir acceso libre al sistema de archivos.
- Limitarlo siempre a una carpeta concreta del proyecto.
- No permitir leer archivos sensibles como `.env`.

Frase para el TFM:

> DevMind utiliza RAG como mecanismo principal de consulta sobre proyectos indexados y contempla la integración con MCP filesystem como herramienta opcional para lectura controlada de archivos en entornos locales.

---

## 18. Seguridad

Puntos básicos de seguridad:

- No guardar contraseñas en texto plano.
- Usar bcrypt.
- Usar JWT con expiración.
- Validar entradas con Zod.
- No indexar archivos `.env`.
- No indexar secretos.
- No permitir rutas fuera del proyecto.
- Limitar tamaño de archivos.
- Limitar tamaño de ZIP.
- Ignorar `node_modules`.
- Controlar qué usuario puede acceder a qué proyecto.
- No devolver contenido sensible en respuestas.
- Configurar CORS correctamente.
- Usar variables de entorno.

Archivos sensibles a ignorar:

```txt
.env
.env.local
.env.production
*.pem
*.key
id_rsa
id_rsa.pub
```

---

## 19. Testing

### Tests unitarios

Probar funciones pequeñas:

- validación de email
- generación de JWT
- filtrado de archivos
- división en chunks
- detección de extensión
- normalización de rutas

Herramienta:

```txt
Vitest
```

---

### Tests de integración

Probar endpoints reales de la API:

- registro
- login
- crear proyecto
- listar proyectos
- subir archivos
- chatear con proyecto

Herramienta:

```txt
Supertest
```

---

### Tests recomendados para el MVP

```txt
POST /auth/register crea un usuario
POST /auth/login devuelve token
GET /auth/me falla sin token
GET /auth/me funciona con token
POST /projects crea proyecto autenticado
GET /projects devuelve solo proyectos del usuario
DELETE /projects/:id elimina proyecto propio
POST /projects/:id/chat falla si proyecto no pertenece al usuario
```

---

## 20. Docker

El proyecto debería incluir:

```txt
Dockerfile
docker-compose.yml
.env.example
```

Servicios recomendados en Docker Compose:

```txt
api
postgres
```

Opcional:

```txt
pgadmin
```

Objetivo:

Poder levantar el proyecto con:

```bash
docker compose up --build
```

---

## 21. Variables de entorno

Archivo `.env.example`:

```env
PORT=3000

DATABASE_URL=postgresql://devmind:devmind@localhost:5432/devmind

JWT_SECRET=change_me
JWT_EXPIRES_IN=7d

GENKIT_ENV=dev
GOOGLE_API_KEY=your_google_api_key_here

MAX_UPLOAD_SIZE_MB=10
```

Nunca subir el `.env` real a GitHub.

---

## 22. Endpoints finales recomendados

```txt
GET    /health

POST   /auth/register
POST   /auth/login
GET    /auth/me

POST   /projects
GET    /projects
GET    /projects/:id
DELETE /projects/:id

POST   /projects/:id/upload
POST   /projects/:id/index
GET    /projects/:id/files

POST   /projects/:id/chat
GET    /projects/:id/history

GET    /projects/:id/summary
GET    /projects/:id/endpoints
POST   /projects/:id/generate-tests
```

---

## 23. Fases de desarrollo

## Fase 0 — Preparación del proyecto

Objetivo:

Crear la base del repositorio y dejar preparado el entorno.

Tareas:

- Crear repositorio en GitHub.
- Crear proyecto Node + TypeScript.
- Configurar Express.
- Configurar ESLint y Prettier.
- Configurar variables de entorno.
- Crear endpoint `/health`.
- Preparar estructura de carpetas.
- Crear README inicial.
- Crear `.env.example`.

Resultado esperado:

Una API básica que arranca correctamente y responde en `/health`.

Checklist:

```txt
[ ] Repositorio creado
[ ] TypeScript configurado
[ ] Express funcionando
[ ] /health funcionando
[ ] ESLint configurado
[ ] Prettier configurado
[ ] .env.example creado
[ ] README inicial creado
```

---

## Fase 1 — Base de datos y autenticación

Objetivo:

Permitir que los usuarios se registren, inicien sesión y accedan a rutas protegidas.

Tareas:

- Levantar PostgreSQL con Docker Compose.
- Configurar Prisma o Drizzle.
- Crear tabla de usuarios.
- Implementar registro.
- Implementar login.
- Cifrar contraseñas con bcrypt.
- Generar JWT.
- Crear middleware de autenticación.
- Crear endpoint `/auth/me`.
- Añadir tests de auth.

Resultado esperado:

Un usuario puede registrarse, iniciar sesión y acceder a rutas protegidas con JWT.

Checklist:

```txt
[ ] PostgreSQL funcionando
[ ] ORM configurado
[ ] Modelo User creado
[ ] Registro funcionando
[ ] Login funcionando
[ ] bcrypt integrado
[ ] JWT integrado
[ ] Middleware de auth funcionando
[ ] /auth/me funcionando
[ ] Tests de auth creados
```

---

## Fase 2 — CRUD de proyectos

Objetivo:

Permitir que cada usuario gestione sus propios proyectos.

Tareas:

- Crear modelo Project.
- Crear endpoint para crear proyecto.
- Crear endpoint para listar proyectos.
- Crear endpoint para ver detalle.
- Crear endpoint para eliminar proyecto.
- Asegurar que un usuario solo vea sus proyectos.
- Añadir tests de proyectos.

Resultado esperado:

Cada usuario puede crear y gestionar sus propios proyectos de forma segura.

Checklist:

```txt
[ ] Modelo Project creado
[ ] POST /projects funcionando
[ ] GET /projects funcionando
[ ] GET /projects/:id funcionando
[ ] DELETE /projects/:id funcionando
[ ] Control de ownership implementado
[ ] Tests de proyectos creados
```

---

## Fase 3 — Subida y procesamiento de archivos

Objetivo:

Permitir subir un proyecto en formato ZIP y extraer los archivos relevantes.

Tareas:

- Añadir endpoint de subida.
- Procesar ZIP.
- Extraer archivos.
- Ignorar carpetas innecesarias.
- Ignorar archivos sensibles.
- Guardar archivos en base de datos.
- Calcular hash de contenido.
- Detectar lenguaje por extensión.
- Añadir tests para filtrado de archivos.

Resultado esperado:

El sistema puede recibir un ZIP, extraer archivos válidos y guardarlos asociados a un proyecto.

Checklist:

```txt
[ ] Endpoint de upload creado
[ ] Procesamiento ZIP funcionando
[ ] node_modules ignorado
[ ] .env ignorado
[ ] Archivos válidos guardados
[ ] Hash de contenido calculado
[ ] Lenguaje detectado
[ ] Tests de filtrado creados
```

---

## Fase 4 — Chunking e indexación

Objetivo:

Dividir el código en fragmentos y prepararlo para búsqueda semántica.

Tareas:

- Crear modelo ProjectFile.
- Crear modelo CodeChunk.
- Implementar función de chunking.
- Guardar startLine y endLine.
- Configurar pgvector.
- Crear columna de embedding.
- Generar embeddings con Genkit.
- Guardar embeddings.
- Crear `indexProjectFlow`.

Resultado esperado:

Los archivos del proyecto quedan convertidos en chunks con embeddings guardados en PostgreSQL.

Checklist:

```txt
[ ] Modelo ProjectFile creado
[ ] Modelo CodeChunk creado
[ ] Chunking funcionando
[ ] startLine y endLine guardados
[ ] pgvector configurado
[ ] Embeddings generados
[ ] Embeddings guardados
[ ] indexProjectFlow creado
```

---

## Fase 5 — Chat RAG

Objetivo:

Permitir preguntas en lenguaje natural sobre el proyecto.

Tareas:

- Crear endpoint `/projects/:id/chat`.
- Crear `chatWithProjectFlow`.
- Generar embedding de la pregunta.
- Buscar chunks relevantes.
- Construir prompt con contexto.
- Generar respuesta con Genkit.
- Devolver fuentes.
- Guardar mensajes en historial.

Resultado esperado:

El usuario puede preguntar por el proyecto y recibir respuestas basadas en archivos reales.

Checklist:

```txt
[ ] Endpoint de chat creado
[ ] chatWithProjectFlow creado
[ ] Búsqueda semántica funcionando
[ ] Prompt con contexto funcionando
[ ] Respuestas generadas
[ ] Fuentes devueltas
[ ] Historial guardado
[ ] Tests básicos de chat creados
```

---

## Fase 6 — Historial de conversaciones

Objetivo:

Guardar y consultar conversaciones anteriores.

Tareas:

- Crear modelo Conversation.
- Crear modelo Message.
- Guardar pregunta del usuario.
- Guardar respuesta de la IA.
- Guardar fuentes.
- Crear endpoint de historial.
- Añadir tests.

Resultado esperado:

Cada proyecto mantiene un historial de conversaciones consultable.

Checklist:

```txt
[ ] Modelo Conversation creado
[ ] Modelo Message creado
[ ] Preguntas guardadas
[ ] Respuestas guardadas
[ ] Fuentes guardadas
[ ] GET /projects/:id/history funcionando
[ ] Tests de historial creados
```

---

## Fase 7 — Resumen de arquitectura

Objetivo:

Generar un resumen automático del proyecto.

Tareas:

- Crear endpoint `/projects/:id/summary`.
- Crear `summarizeProjectFlow`.
- Recuperar chunks representativos.
- Generar resumen de carpetas, módulos y tecnologías.
- Guardar o cachear resumen si interesa.

Resultado esperado:

El sistema puede explicar de forma general cómo está organizado un proyecto.

Checklist:

```txt
[ ] Endpoint de summary creado
[ ] summarizeProjectFlow creado
[ ] Resumen de arquitectura generado
[ ] Tecnologías detectadas
[ ] Carpetas principales explicadas
[ ] Archivos clave listados
```

---

## Fase 8 — Listado de endpoints

Objetivo:

Detectar endpoints disponibles en el proyecto indexado.

Tareas:

- Crear endpoint `/projects/:id/endpoints`.
- Buscar archivos relacionados con rutas.
- Detectar métodos HTTP.
- Detectar paths.
- Devolver lista estructurada.
- Añadir explicación opcional con IA.

Resultado esperado:

El sistema puede listar endpoints encontrados en el proyecto.

Checklist:

```txt
[ ] Endpoint creado
[ ] Archivos de rutas detectados
[ ] Métodos HTTP detectados
[ ] Paths detectados
[ ] Lista estructurada devuelta
[ ] Tests básicos creados
```

---

## Fase 9 — Generación de tests

Objetivo:

Permitir que la IA proponga tests para funciones o endpoints.

Tareas:

- Crear endpoint `/projects/:id/generate-tests`.
- Crear `generateTestsFlow`.
- Recuperar archivo o chunks relevantes.
- Generar casos de prueba.
- Generar código de test con Vitest/Supertest.
- Devolver explicación.
- Opcional: permitir descargar el archivo de test.

Resultado esperado:

El usuario puede pedir tests para una parte del proyecto y obtener una propuesta útil.

Checklist:

```txt
[ ] Endpoint creado
[ ] generateTestsFlow creado
[ ] Contexto recuperado
[ ] Casos de prueba generados
[ ] Código de test generado
[ ] Explicación generada
```

---

## Fase 10 — Documentación y presentación

Objetivo:

Dejar el proyecto listo para TFM, GitHub y entrevistas.

Tareas:

- Completar README.
- Añadir capturas o ejemplos.
- Documentar endpoints con Swagger/OpenAPI.
- Añadir diagrama de arquitectura.
- Añadir explicación de RAG.
- Añadir instrucciones de instalación.
- Añadir instrucciones Docker.
- Añadir ejemplos de uso.
- Añadir sección de decisiones técnicas.
- Añadir limitaciones.
- Añadir mejoras futuras.
- Preparar demo.

Resultado esperado:

El proyecto se entiende bien sin tener que explicarlo oralmente.

Checklist:

```txt
[ ] README completo
[ ] Swagger/OpenAPI añadido
[ ] Diagrama de arquitectura añadido
[ ] Ejemplos de uso añadidos
[ ] Instrucciones Docker añadidas
[ ] Decisiones técnicas documentadas
[ ] Limitaciones documentadas
[ ] Mejoras futuras documentadas
[ ] Demo preparada
```

---

## 24. Roadmap resumido

```txt
Semana 1:
- Preparar proyecto
- Express + TypeScript
- Docker Compose
- PostgreSQL
- /health

Semana 2:
- Auth
- JWT
- bcrypt
- tests de auth

Semana 3:
- CRUD de proyectos
- control de permisos
- tests de proyectos

Semana 4:
- Upload ZIP
- extracción de archivos
- filtrado de archivos

Semana 5:
- Chunking
- pgvector
- embeddings
- indexProjectFlow

Semana 6:
- Chat RAG
- respuestas con fuentes
- historial

Semana 7:
- Summary
- listado de endpoints
- generación básica de tests

Semana 8:
- Testing general
- Docker final
- documentación
- demo
```

---

## 25. Criterios de éxito del proyecto

El proyecto se considera exitoso si:

- Un usuario puede registrarse e iniciar sesión.
- Un usuario puede crear un proyecto.
- Un usuario puede subir código.
- El sistema puede indexar archivos.
- El sistema puede responder preguntas usando RAG.
- Las respuestas incluyen fuentes.
- El historial de conversación se guarda.
- Hay tests automatizados.
- El proyecto puede ejecutarse con Docker.
- La documentación permite entender y ejecutar el sistema.

---

## 26. Métricas posibles para el TFM

Para que el TFM no sea solo “he construido una app”, puedes incluir evaluación.

Métricas posibles:

- Número de archivos indexados.
- Número de chunks generados.
- Tiempo medio de indexación.
- Tiempo medio de respuesta.
- Porcentaje de respuestas con fuentes correctas.
- Precisión de búsqueda semántica.
- Número de preguntas respondidas correctamente.
- Comparación entre búsqueda por palabras clave y búsqueda semántica.
- Utilidad percibida por usuarios de prueba.
- Cobertura de tests del backend.

---

## 27. Pregunta de investigación posible

> ¿Cómo puede integrarse la inteligencia artificial generativa en una API backend para facilitar la comprensión, documentación y validación de proyectos software mediante recuperación aumentada de información y agentes?

---

## 28. Objetivos del TFM

### Objetivo general

Diseñar e implementar una API inteligente que permita consultar proyectos software mediante lenguaje natural usando RAG, agentes y modelos generativos.

### Objetivos específicos

1. Diseñar una arquitectura backend modular basada en TypeScript, Node.js y Express.
2. Implementar autenticación y autorización mediante JWT.
3. Modelar una base de datos PostgreSQL para usuarios, proyectos, archivos, chunks y conversaciones.
4. Implementar un sistema de indexación de código y documentación.
5. Integrar Genkit para orquestar flujos de IA.
6. Implementar recuperación semántica mediante embeddings y pgvector.
7. Crear un chat RAG con respuestas trazables.
8. Generar resúmenes de arquitectura y tests sugeridos.
9. Validar el sistema mediante tests automatizados.
10. Dockerizar la solución para facilitar su despliegue.

---

## 29. Limitaciones del MVP

Limitaciones aceptables:

- No integración inicial con GitHub.
- No ejecución automática de tests generados.
- No soporte para todos los lenguajes de programación.
- No análisis perfecto de arquitectura.
- No detección avanzada de vulnerabilidades.
- No conexión inicial con Jira/Trello.
- No frontend completo obligatorio.
- MCP solo como mejora futura.

Estas limitaciones no son malas. Sirven para demostrar que el proyecto está bien acotado.

---

## 30. Mejoras futuras

Posibles mejoras:

- Integración con GitHub.
- Lectura de commits.
- Resumen de cambios del último sprint.
- Integración con Jira o Trello.
- MCP filesystem controlado.
- Ejecución automática de tests en sandbox.
- Detección de vulnerabilidades con Semgrep o CodeQL.
- Dashboard frontend con React.
- Comparación entre modelos de IA.
- Roles de equipo.
- Organización por empresas.
- Sistema de permisos avanzado.
- Soporte para más lenguajes.
- Modo SaaS multiusuario.
- Plugin para VS Code.

---

## 31. Cómo explicarlo en una entrevista

Explicación corta:

> He creado DevMind, una API backend en TypeScript y Express que permite subir un proyecto software, indexar su código y hacer preguntas en lenguaje natural sobre funciones, endpoints, autenticación o arquitectura. Usa PostgreSQL con pgvector para búsqueda semántica, Genkit para orquestar flujos de IA, JWT para autenticación, Vitest y Supertest para testing, y Docker para despliegue.

Explicación más técnica:

> El sistema divide el código en chunks, genera embeddings, los almacena en PostgreSQL usando pgvector y, cuando el usuario hace una pregunta, recupera los fragmentos más relevantes para construir un prompt contextual. La respuesta generada por el modelo incluye fuentes, lo que permite reducir alucinaciones y mejorar la trazabilidad.

---

## 32. Descripción para CV o LinkedIn

```txt
DevMind — API inteligente para equipos de desarrollo

Desarrollo de una API backend con TypeScript, Node.js, Express, PostgreSQL y Genkit que permite indexar proyectos software y consultar su código en lenguaje natural mediante RAG. El sistema incluye autenticación JWT, gestión de proyectos, almacenamiento de embeddings con pgvector, historial de conversaciones, generación de documentación y tests sugeridos, testing automatizado con Vitest/Supertest y despliegue mediante Docker.
```

---

## 33. Descripción para GitHub

```txt
DevMind is an AI-powered backend API that helps development teams understand their codebase through natural language queries.

It allows users to upload and index software projects, ask questions about architecture, authentication, endpoints and functions, and receive AI-generated answers grounded in the project's actual files using RAG and source citations.
```

---

## 34. README ideal del repositorio

El README debería tener:

1. Nombre del proyecto.
2. Descripción corta.
3. Problema que resuelve.
4. Tecnologías usadas.
5. Arquitectura.
6. Funcionalidades.
7. Instalación local.
8. Ejecución con Docker.
9. Variables de entorno.
10. Endpoints principales.
11. Ejemplos de uso.
12. Tests.
13. Decisiones técnicas.
14. Limitaciones.
15. Mejoras futuras.
16. Capturas o demo.
17. Autor.

---

## 35. Prioridad de construcción

Orden de prioridad:

```txt
1. Backend base
2. Auth
3. Proyectos
4. Upload de archivos
5. Indexación
6. Chat RAG
7. Respuestas con fuentes
8. Historial
9. Tests
10. Docker
11. Summary
12. Endpoints
13. Generate tests
14. Swagger
15. GitHub integration
16. MCP
```

No intentar hacer todo a la vez.

---

## 36. Decisión final recomendada

DevMind es una idea muy buena para TFM porque combina una necesidad real de los equipos de desarrollo con tecnologías actuales y demandadas.

La clave será mantener el proyecto bien acotado:

Primero construir una API sólida.

Después añadir IA con RAG.

Después añadir funciones avanzadas.

La versión mínima debe demostrar claramente:

> Soy capaz de construir una API backend profesional que integra inteligencia artificial de forma útil, controlada y trazable.

---

## 37. Checklist final del MVP

```txt
[ ] API Express + TypeScript
[ ] PostgreSQL funcionando
[ ] Docker Compose funcionando
[ ] Registro de usuarios
[ ] Login con JWT
[ ] Middleware de autenticación
[ ] CRUD de proyectos
[ ] Subida de ZIP
[ ] Filtrado de archivos
[ ] Guardado de archivos
[ ] Chunking de código
[ ] Embeddings generados
[ ] pgvector configurado
[ ] indexProjectFlow
[ ] chatWithProjectFlow
[ ] Endpoint de chat
[ ] Respuestas con fuentes
[ ] Historial de conversación
[ ] Tests unitarios
[ ] Tests de integración
[ ] Dockerfile
[ ] README completo
[ ] .env.example
[ ] Demo preparada
```

---

## 38. Idea central que debes recordar

DevMind no es un chatbot.

DevMind es:

> Una API backend inteligente para consultar, comprender, documentar y validar proyectos software mediante IA, RAG, agentes y trazabilidad de fuentes.

## . ARQUITECTURA FINAL

```txt
devmind-api/
├── src/
│ ├── main.ts
│ ├── app.ts
│ │
│ ├── domain/
│ │ ├── users/
│ │ │ ├── user.entity.ts
│ │ │ └── user.repository.ts
│ │ │
│ │ ├── projects/
│ │ │ ├── project.entity.ts
│ │ │ └── project.repository.ts
│ │ │
│ │ ├── files/
│ │ │ ├── project-file.entity.ts
│ │ │ └── file-policy.ts
│ │ │
│ │ ├── chunks/
│ │ │ ├── code-chunk.entity.ts
│ │ │ └── code-chunk.repository.ts
│ │ │
│ │ └── conversations/
│ │ ├── conversation.entity.ts
│ │ ├── message.entity.ts
│ │ └── conversation.repository.ts
│ │
│ ├── application/
│ │ ├── auth/
│ │ │ ├── register-user.use-case.ts
│ │ │ ├── login-user.use-case.ts
│ │ │ └── get-current-user.use-case.ts
│ │ │
│ │ ├── projects/
│ │ │ ├── create-project.use-case.ts
│ │ │ ├── get-user-projects.use-case.ts
│ │ │ ├── get-project-detail.use-case.ts
│ │ │ └── delete-project.use-case.ts
│ │ │
│ │ ├── files/
│ │ │ └── upload-project-files.use-case.ts
│ │ │
│ │ ├── indexing/
│ │ │ └── index-project.use-case.ts
│ │ │
│ │ └── chat/
│ │ ├── chat-with-project.use-case.ts
│ │ ├── summarize-project.use-case.ts
│ │ └── generate-tests.use-case.ts
│ │
│ ├── infrastructure/
│ │ ├── database/
│ │ │ ├── prisma/
│ │ │ │ ├── prisma-client.ts
│ │ │ │ └── repositories/
│ │ │ │ ├── prisma-user.repository.ts
│ │ │ │ ├── prisma-project.repository.ts
│ │ │ │ ├── prisma-project-file.repository.ts
│ │ │ │ └── prisma-conversation.repository.ts
│ │ │ │
│ │ │ └── migrations/
│ │ │
│ │ ├── auth/
│ │ │ ├── bcrypt-password-hasher.ts
│ │ │ └── jwt-token.service.ts
│ │ │
│ │ ├── ai/
│ │ │ ├── genkit.ts
│ │ │ ├── flows/
│ │ │ │ ├── index-project.flow.ts
│ │ │ │ ├── chat-with-project.flow.ts
│ │ │ │ ├── summarize-project.flow.ts
│ │ │ │ └── generate-tests.flow.ts
│ │ │ └── tools/
│ │ │ ├── search-code.tool.ts
│ │ │ ├── get-file-content.tool.ts
│ │ │ └── list-endpoints.tool.ts
│ │ │
│ │ ├── filesystem/
│ │ │ ├── zip-extractor.service.ts
│ │ │ ├── file-reader.service.ts
│ │ │ └── file-filter.service.ts
│ │ │
│ │ └── config/
│ │ └── env.ts
│ │
│ ├── transport/
│ │ └── http/
│ │ ├── routes.ts
│ │ ├── middlewares/
│ │ │ ├── auth.middleware.ts
│ │ │ ├── error.middleware.ts
│ │ │ └── validate.middleware.ts
│ │ │
│ │ ├── auth/
│ │ │ ├── auth.routes.ts
│ │ │ ├── auth.controller.ts
│ │ │ └── auth.schemas.ts
│ │ │
│ │ ├── projects/
│ │ │ ├── project.routes.ts
│ │ │ ├── project.controller.ts
│ │ │ └── project.schemas.ts
│ │ │
│ │ └── chat/
│ │ ├── chat.routes.ts
│ │ ├── chat.controller.ts
│ │ └── chat.schemas.ts
│ │
│ └── shared/
│ ├── errors/
│ │ ├── app-error.ts
│ │ └── not-found-error.ts
│ ├── types/
│ └── utils/
│
├── prisma/
│ └── schema.prisma
│
├── tests/
│ ├── unit/
│ └── integration/
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
├── tsconfig.json
└── README.md

```

## . METODOLOGIA

Para lógica importante → test primero
Para endpoints clave → test primero
Para IA / Genkit / RAG → pruebas controladas y evaluación, no TDD puro

Clean Architecture + TDD en domain/application + tests de integración en transport

Fase 0:

- Test de /health

Fase 1:

- TDD para auth
- tests de register, login, me

Fase 2:

- TDD para projects
- tests de ownership

Fase 3:

- TDD para file policy
- tests de archivos ignorados y permitidos

Fase 4:

- TDD para chunking
- tests de división de código

Fase 5:

- tests de contrato para chat RAG
- comprobar answer + sources

Fase 6:

- tests de historial

Fase 7 en adelante:

- pruebas de evaluación IA
