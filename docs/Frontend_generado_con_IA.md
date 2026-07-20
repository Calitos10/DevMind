# Frontend de DevMind — generado con IA

> **Contexto.** El proyecto construido en este TFM es la **API backend de DevMind** (arquitectura hexagonal, RAG, indexación, tests y decisiones de diseño). Como para **probar y demostrar** la API desde el navegador (subir un ZIP, indexar y preguntar) hace falta una interfaz, el **frontend se generó con IA** a partir del *prompt/brief* que se reproduce íntegro más abajo, tomando el contrato `openapi.yaml` como fuente de verdad.
>
> Este documento deja constancia **honesta y trazable** de cómo se construyó el frontend: **el diseño de producto, los flujos, las páginas y las restricciones son míos** (los del brief); **la implementación la produjo una IA** a partir de esa especificación. Se conserva el prompt exacto por transparencia y reproducibilidad.

---

## Prompt / brief exacto utilizado

A continuación, el documento **tal cual** se entregó a la IA (junto con `openapi.yaml`) para generar el frontend:

---

## Brief / Prompt para generar el Frontend de DevMind

> **Cómo usar este documento:** pásalo COMPLETO a la IA junto con el archivo `openapi.yaml`.
> - El `openapi.yaml` es la **fuente de verdad de la API** (rutas, cuerpos de petición y respuestas exactas). La IA debe usarlo y **no inventar endpoints ni campos**.
> - Este documento define el **producto, los flujos, las páginas y el diseño**, que el OpenAPI no describe.

---

## 1. Qué es DevMind y objetivo del frontend

DevMind es una API que permite subir el código de un proyecto software (en `.zip`), analizarlo e **indexarlo**, y luego **hacerle preguntas en lenguaje natural a una IA** que responde citando las partes del código relevantes (RAG).

Quiero un **frontend web profesional, limpio y multipágina** que consuma esa API y transmita buena sensación del producto. **No** debe ser una sola página con todo amontonado.

## 2. Requisitos de producto (innegociables)

1. **Lo primero que se ve NO es un login/registro**, sino el **producto**: la página para **subir el ZIP**. El registro/login vive en otra parte (un botón en la cabecera).
2. **Multipágina con enrutado** (varias rutas/URLs), no todo en la misma pantalla.
3. **Flujo guiado por estados**:
   - Subir el ZIP → cuando se sube, **mostrar que ya se ha subido** (resumen de archivos) y el **botón "Indexar"**.
   - Al indexar → mostrar el **progreso**; cuando termina, habilitar la opción de **hablar con la IA**.
   - **Hablar con la IA** y **ver el historial de conversaciones** en **páginas separadas**.
4. **Dos modos de uso** (ver sección 5): **invitado** (sin registro, para probar) y **registrado** (con persistencia e historial).
5. Aspecto **profesional**: diseño moderno, responsive, con buenos estados de carga, vacíos y error.

## 3. Stack obligatorio

- **React + Vite + TypeScript**.
- **React Router** para el enrutado (páginas reales con URL propia).
- **TanStack Query (React Query)** para las llamadas a la API, el cacheo, los estados de carga/error y el _polling_ del estado de indexación.
- **Tailwind CSS** para el estilo (opcionalmente **shadcn/ui** para componentes con acabado profesional).
- **Cliente de API tipado generado desde el OpenAPI** (por ejemplo con `openapi-typescript`), para que los tipos coincidan exactamente con el backend. No escribir los tipos a mano ni adivinar la forma de las respuestas.

## 4. Conexión con el backend

- **Base URL:** `http://localhost:3000`, configurable con una variable de entorno `VITE_API_URL` (por defecto ese valor).
- **Autenticación:** JWT por cabecera `Authorization: Bearer <token>` en todas las rutas protegidas.
- **CORS:** el backend ya acepta el origen `http://localhost:5173` (el puerto por defecto de Vite), así que en desarrollo funciona sin configuración extra.
- **Formato de errores:** todas las respuestas de error tienen la forma `{ "message": string, "errors"?: object }`. Mostrar `message` al usuario de forma amable.

## 5. Autenticación y los dos modos (invitado vs registrado)

Este es el punto más importante del producto. **El frontend gestiona una "sesión" que puede ser de invitado o de registrado**, y siempre tiene un token para llamar a la API.

- **Al cargar la app**, si no hay token guardado, se crea automáticamente una **sesión de invitado** llamando a `POST /auth/guest` **en segundo plano** (sin que el usuario rellene nada). Se guarda el `accessToken` y se marca el modo como `guest`. El visitante entra directo al producto, **nunca ve un login primero**.
- **Registrarse / iniciar sesión** son páginas aparte (`/register`, `/login`), accesibles desde un botón en la cabecera. Al completarlas, se guarda el nuevo token y se marca el modo como `registered`.
- **El frontend SABE en qué modo está** porque él mismo eligió el flujo (llamó a `/auth/guest` o a `/auth/login`). **No** hay que preguntárselo al backend; se guarda un flag `authMode: "guest" | "registered"` junto al token (por ejemplo en `localStorage`).
- **Diferencias de comportamiento entre modos:**
  - **Invitado:** puede subir ZIP, indexar y preguntar a la IA. **Sus datos son temporales** (el backend los caduca y limpia) y **no se le guarda historial de conversaciones**. Por eso a un invitado **no** se le ofrece la página de historial (o se le muestra un aviso "Regístrate para guardar tu historial").
  - **Registrado:** lo mismo, pero sus proyectos **persisten**, puede tener **varios**, y **sí tiene historial** de conversaciones navegable.
- **Manejo del token:** enviarlo en `Authorization` en cada llamada. Si una respuesta devuelve **401** (token ausente/expirado), renovar la sesión de invitado (`POST /auth/guest`) o, si estaba registrado, llevar al login.
- **Importante (sin _upgrade path_):** al registrarse, **el proyecto que el invitado había subido NO se transfiere** a la cuenta nueva (el backend no lo soporta). Presenta el registro como "para conservar tus proyectos e historial a partir de ahora". No intentes construir la migración del proyecto invitado.

## 6. Mapa de páginas (sitemap)

| Ruta | Página | Propósito | Endpoints que usa |
|---|---|---|---|
| `/` | **Inicio / Subir proyecto** | Entrada del producto. Zona para subir el `.zip`. Es lo primero que se ve. | `POST /auth/guest` (si no hay sesión), `POST /projects`, `POST /projects/{id}/upload` |
| `/projects/:id` | **Proyecto** | Muestra el resultado de la subida y el estado de indexación; botón "Indexar"; cuando está indexado, accesos a chat e historial. | `GET /projects/{id}`, `GET /projects/{id}/files`, `POST /projects/{id}/index`, `GET /projects/{id}/indexing-status` |
| `/projects/:id/chat` | **Chat con la IA** | Hacer preguntas y ver respuestas con sus fuentes. | `POST /projects/{id}/ask` |
| `/projects/:id/history` | **Historial** | Lista de preguntas/respuestas guardadas del proyecto. **Solo registrado.** | `GET /projects/{id}/history` |
| `/projects` | **Mis proyectos** | Lista de proyectos del usuario; crear/borrar. **Sobre todo para registrado.** | `GET /projects`, `DELETE /projects/{id}` |
| `/login` | **Iniciar sesión** | Formulario email + contraseña. | `POST /auth/login` |
| `/register` | **Registrarse** | Formulario nombre + email + contraseña. | `POST /auth/register` |

Además, una **cabecera/nav común** en todas las páginas (ver sección 8).

## 7. Flujo principal paso a paso (máquina de estados)

1. **Entrada (`/`):** sesión de invitado creada automáticamente. Se ve una zona tipo _dropzone_: "Sube el código de tu proyecto (.zip) y pregúntale a la IA".
2. **Subida:** el usuario elige/arrastra un `.zip` y pulsa "Subir". El frontend, de forma transparente:
   1. se asegura de tener sesión (token),
   2. crea un proyecto con `POST /projects` (nombre derivado del nombre del ZIP, p. ej. `mi-repo.zip` → "mi-repo"),
   3. sube el ZIP con `POST /projects/{id}/upload` (multipart, campo **`file`**),
   4. navega a `/projects/{id}`.
3. **Subido (`/projects/:id`):** se muestra el **resumen de la subida** (p. ej. "12 archivos añadidos") y un botón grande **"Indexar proyecto"**, con una explicación breve ("La indexación prepara tu proyecto para poder preguntarle a la IA").
4. **Indexación:** al pulsar "Indexar", se llama a `POST /projects/{id}/index` (operación que puede tardar) y **en paralelo se hace _polling_** de `GET /projects/{id}/indexing-status` cada ~1,5 s para mostrar una **barra de progreso** con el `progress` (0–100) y el estado (`pending` → `processing` → `completed`/`failed`).
5. **Indexado (`completed`):** se muestra de forma prominente el CTA **"Hablar con la IA"** (→ `/projects/:id/chat`) y, si el usuario está registrado, un enlace **"Ver historial"** (→ `/projects/:id/history`).
6. **Chat (`/projects/:id/chat`):** el usuario escribe preguntas; cada respuesta muestra el texto y sus **fuentes** (archivo + líneas).
7. **Historial (`/projects/:id/history`):** solo registrado; lista las conversaciones guardadas.

## 8. Detalle por pantalla

### Cabecera / navegación (común)
- Logo/nombre "DevMind" (enlace a `/`).
- A la derecha:
  - **Modo invitado:** un botón **"Iniciar sesión / Registrarse"**. Opcionalmente una etiqueta discreta "Estás como invitado".
  - **Modo registrado:** el email del usuario, enlace **"Mis proyectos"** y **"Cerrar sesión"**.

### `/` — Inicio / Subir proyecto
- Titular claro del producto + _dropzone_ para el `.zip` (con validación de que sea `.zip`).
- Estado de "subiendo…" mientras se crean el proyecto y se sube el ZIP.
- Si falla la subida, mostrar el `message` del error (p. ej. "El ZIP no contiene archivos válidos", "El ZIP es demasiado grande").

### `/projects/:id` — Proyecto
- Resumen de archivos (del resultado del upload y/o `GET /projects/{id}/files`).
- **Estado de indexación** con estas variantes:
  - **No indexado** (`pending` o sin job): botón "Indexar proyecto".
  - **Indexando** (`processing`): barra de progreso con `progress`% y "X de Y fragmentos".
  - **Indexado** (`completed`): check verde + CTA "Hablar con la IA" (+ "Ver historial" si registrado).
  - **Fallido** (`failed`): mensaje de error + botón "Reintentar indexación".

### `/projects/:id/chat` — Chat con la IA
- Lista de mensajes (pregunta del usuario / respuesta de la IA).
- Cada respuesta muestra sus **fuentes**: por cada fuente, `path` y `líneas startLine–endLine` (p. ej. `src/auth/registerUserUseCase.ts (líneas 10–45)`).
- Si la respuesta no tiene fuentes (el backend no encontró información relevante), mostrar el texto igualmente.
- **Invitado:** un aviso discreto "Regístrate para guardar tu historial de conversaciones". (Sus mensajes se ven en la sesión actual pero no se guardan; al recargar se pierden.)

### `/projects/:id/history` — Historial (solo registrado)
- Lista cronológica de entradas: pregunta, respuesta y fuentes, con fecha (`createdAt`).
- Estado vacío: "Aún no has hecho preguntas en este proyecto".
- Si el usuario es invitado y llega aquí: mostrar "Regístrate para guardar y consultar tu historial".

### `/projects` — Mis proyectos (registrado)
- _Grid_/lista de proyectos (`GET /projects`), cada tarjeta enlaza a `/projects/:id`.
- Acción "Nuevo proyecto" (lleva al flujo de subida) y "Borrar" (`DELETE /projects/{id}`, con confirmación).

### `/login` y `/register`
- Formularios sencillos y validados (email válido, contraseña mínima 6, nombre mínimo 2 en registro).
- Tras login correcto: guardar token, `authMode="registered"`, ir a `/projects` o `/`.
- Tras registro correcto: iniciar sesión automáticamente (o redirigir a `/login`).

## 9. Mapeo acción → endpoint (resumen)

| Acción del usuario | Llamada |
|---|---|
| Entrar por primera vez (sin token) | `POST /auth/guest` → `{ accessToken, user }` |
| Registrarse | `POST /auth/register` (name, email, password) |
| Iniciar sesión | `POST /auth/login` → `{ accessToken, user }` |
| Crear proyecto | `POST /projects` (name, description?) → proyecto |
| Subir ZIP | `POST /projects/{id}/upload` (multipart, campo `file`) → `{ summary, files }` |
| Indexar | `POST /projects/{id}/index` |
| Ver progreso de indexación | `GET /projects/{id}/indexing-status` → `{ status, progress, totalChunks, processedChunks, failedChunks }` |
| Preguntar a la IA | `POST /projects/{id}/ask` (question) → `{ answer, sources[] }` |
| Ver historial | `GET /projects/{id}/history` → `ConversationEntry[]` |
| Listar proyectos | `GET /projects` |
| Borrar proyecto | `DELETE /projects/{id}` |

*(Las formas exactas de cada cuerpo y respuesta están en el `openapi.yaml`; úsalo como referencia.)*

## 10. Estados de carga y error

- **Carga:** _spinners_/_skeletons_ en cada llamada; usar los estados de React Query.
- **Errores HTTP a traducir a mensajes amables:**
  - `400` (subida/validación): mostrar el `message` (ZIP inválido, sin archivos válidos, body incorrecto).
  - `401`: sesión caducada → renovar invitado o ir a login.
  - `404`: recurso no encontrado o no es del usuario → "No encontrado".
  - `409` en indexar: "Ya se está indexando este proyecto" → pasar a mostrar el progreso.
  - `429`: "Demasiadas peticiones, espera un momento e inténtalo de nuevo".
  - `503` (proveedor de IA caído, p. ej. al indexar o preguntar): "El servicio de IA no está disponible ahora mismo, reintenta en unos segundos".
- **Estados vacíos** cuidados (sin proyectos, sin historial, chat sin mensajes).
- **Toasts/notificaciones** para éxitos y errores.

## 11. Diferencias invitado vs registrado en la UI (resumen)

| | Invitado | Registrado |
|---|---|---|
| Subir ZIP + indexar + chat | ✅ | ✅ |
| Historial (página `/history`) | ❌ (aviso "regístrate para guardar") | ✅ |
| "Mis proyectos" en la nav | Oculto o limitado | ✅ |
| Cabecera | Botón "Iniciar sesión / Registrarse" | Email + "Mis proyectos" + "Cerrar sesión" |
| Persistencia | Temporal (se pierde) | Permanente |

## 12. Diseño y UX (que quede profesional)

- Estética **moderna, sobria y limpia**; buena tipografía y espaciado; **responsive** (móvil y escritorio).
- **Onboarding claro**: en `/`, que se entienda en 2 segundos qué hace la app y qué hacer (subir un ZIP).
- **Flujo guiado visual**: que el usuario perciba los pasos (subido → indexar → indexado → chatear), por ejemplo con un pequeño indicador de progreso/pasos en la página del proyecto.
- **Feedback inmediato** en cada acción (subiendo, indexando con %, respondiendo…).
- Coherencia visual entre páginas (mismo header, colores, botones).
- Accesibilidad básica (labels, foco, contraste).

## 13. Qué NO hacer

- **No** poner el login/registro como primera pantalla.
- **No** inventar endpoints, parámetros o campos que no estén en el `openapi.yaml`.
- **No** montarlo todo en una sola página: usar rutas reales.
- **No** intentar transferir el proyecto de invitado a la cuenta al registrarse (no está soportado).
- **No** guardar ni mostrar historial para invitados.

## 14. Entregable esperado

Un proyecto **React + Vite + TypeScript** funcional, con:
- Enrutado (React Router) con las páginas de la sección 6.
- Cliente de API tipado generado del OpenAPI + capa de fetch con el token (Bearer) y manejo de 401.
- Gestión de la sesión invitado/registrado descrita en la sección 5.
- El flujo completo (subir → indexar con progreso → chatear con fuentes → historial).
- Estilo profesional con Tailwind (y opcional shadcn/ui), responsive, con estados de carga/vacío/error.
- Un `README` breve de cómo arrancarlo (`npm install`, `npm run dev`) y la variable `VITE_API_URL`.

---

### Resumen en una frase (para el prompt)

"Genera un frontend profesional en **React + Vite + TypeScript** (con React Router, TanStack Query y Tailwind) para la API **DevMind** descrita en el `openapi.yaml` adjunto, **multipágina**, en el que **lo primero sea subir un ZIP** (no un login), con el flujo **subir → indexar (con progreso) → hablar con la IA → historial** en páginas separadas, una **sesión de invitado automática** (`POST /auth/guest`) y el **registro/login en páginas aparte**, respetando que al **invitado no se le guarda historial**."
