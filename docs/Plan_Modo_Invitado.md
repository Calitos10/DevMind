# Plan — Modo Invitado (onboarding sin registro)

> **Estado:** listo para implementar **ahora**. La fase previa (Historial de conversaciones, Fase 12) ya está terminada y verificada.
> Este documento es el plan de implementación completo, de principio a fin, que iremos siguiendo.

---

## 1. Contexto y objetivo

El profesor pidió que **lo primero que se vea al abrir DevMind no sea una pantalla de login/registro**, sino el producto listo para probarse.

La solución es un **modo invitado**: cualquiera puede entrar y **usar DevMind al momento** (subir un ZIP, que se analice, y hablar con la IA) sin registrarse. Registrarse pasa a ser el "plus": conservar los proyectos y el historial de forma **permanente**.

## 2. Idea clave (para no rehacer nada)

**Por dentro, un invitado también es un usuario**, solo que **temporal y creado automáticamente** por el sistema, sin que el visitante rellene nada.

Gracias a esto, **se reutiliza toda la API que ya existe** (subida de ZIP, chunks, embeddings, RAG, propiedad por `ownerId`, historial). El invitado tiene un token válido y un `ownerId` real, así que el sistema lo trata como a cualquier usuario. **No hay que tocar los casos de uso del pipeline.**

### Matiz importante sobre "persistencia" (aclarado en el diseño)

La diferencia invitado/registrado **no es "guardar vs no guardar"**. Para que el RAG funcione, el ZIP del invitado **tiene que** trocearse, generar embeddings y **guardarse en PostgreSQL** (la búsqueda semántica consulta esa tabla). Es decir, el invitado **también escribe en las mismas tablas** mientras usa la app.

La diferencia real es:

- **Registrado → permanente y recuperable:** sus datos se quedan para siempre y puede volver a iniciar sesión y verlos.
- **Invitado → temporal y no recuperable:** sus datos se guardan *durante la sesión* (porque hacen falta para el RAG) pero **se descartan** por caducidad, y como no tiene credenciales reales, al volver **empieza de cero**.

## 3. Invitado vs Registrado

| | Invitado | Registrado |
|---|---|---|
| Subir ZIP y analizarlo | ✅ | ✅ |
| Preguntar a la IA (RAG) | ✅ | ✅ |
| ¿Se guardan sus datos? | Sí, pero **temporal** (se limpia por caducidad) | Sí, **permanente** |
| ¿Puede volver y recuperarlos? | No (empieza de cero) | Sí (inicia sesión) |
| Nº de proyectos | (decisión: 1 o sin límite) | varios |
| Historial de conversaciones navegable | No (se limpia con él) | Sí |
| Cómo se crea la cuenta | Automática e invisible | Registro con email/contraseña |
| Qué lo diferencia técnicamente | `is_guest = true` + `expires_at` + sin contraseña usable | usuario permanente con email/contraseña |

## 4. Decisiones (tomadas antes de empezar)

Estas son las decisiones que aplicamos como orquestador antes de delegar la ejecución:

1. **Enfoque: opción B — modo invitado con limpieza diferida.** Implementamos el endpoint de invitado + la lógica de borrado de invitados caducados (con su test), pero **no** montamos ahora un _scheduler_ automático. La limpieza se podrá ejecutar a mano (o programarse más adelante); para el TFM no es crítico que sea automática.
2. **El invitado es un usuario temporal real** (misma tabla `users`), no una entidad aparte.
3. **TTL configurable** por variable de entorno (`GUEST_TTL_HOURS`, por defecto 24 h).
4. **Rate limit por IP** obligatorio en `POST /auth/guest`.
5. **Metodología TDD estricta**, igual que en la Fase 12 (test en rojo → implementación → verde).
6. **Sin límite de número de proyectos para el invitado** (por ahora). Decisión consciente: ver el bloque destacado más abajo. **Debe recalcarse en la documentación de la Fase 13.**

### Decisión consciente a recalcar en la Fase 13: NO limitar el número de proyectos del invitado

Se valoró limitar al invitado a **un solo proyecto** como diferenciador frente al registrado. **Se decidió no hacerlo (por ahora)**, y esta decisión debe quedar explicada en el documento de diseño de la Fase 13, con el siguiente razonamiento:

- **Podríamos haberlo hecho**, pero **implicaba bastante más** y del tipo "malo": era el **primer punto donde la lógica de invitado se cuela en el pipeline compartido**. El modo invitado, sin el límite, es **100 % aditivo** (endpoint, caso de uso y columnas nuevas; no toca ningún caso de uso existente). El límite rompe esa propiedad.
- En concreto habría obligado a: (1) **tocar `CreateProjectUseCase`** (una pieza ya funcionando y testeada), (2) darle una forma de **saber si el usuario es invitado** —o cargar el usuario desde el repositorio (dependencia + consulta extra), o meter `is_guest` en el JWT (cambiar el contrato del token, el `authMiddleware` y los tipos—, (3) **un error nuevo** (`403`) con su mapeo, y (4) **tests del nuevo comportamiento**.
- **No aporta valor imprescindible:** el objetivo (probar sin registrarse) se cumple igual; la temporalidad de los datos ya la da el **TTL + limpieza**; y el abuso caro (Gemini) ya está frenado por los **rate limits** existentes. Crear proyectos de más solo genera filas vacías baratas que además se limpian por caducidad.
- **Queda como mejora futura contenida:** si se quisiera el diferenciador, se añade después (idealmente metiendo `is_guest` en el JWT, que además le sirve al frontend para saber si mostrar el aviso de "regístrate para guardar").

### Decisiones aún abiertas (a confirmar al implementar)

- **B) ¿El invitado ve sus datos si recarga la página?** Es una decisión de **frontend** (reutilizar el token guardado vs. pedir uno nuevo cada visita); **no bloquea el backend**. Se decide al hacer el frontend.
- **C) `password_hash` del invitado:** guardar el hash de un valor **aleatorio e inservible** (el invitado nunca hace login), para que nadie pueda entrar como él. ← *recomendado*

## 5. Alcance del backend (lo que vamos a construir)

### 5.1. Migración: columnas de invitado en `users`

`009_add_guest_columns_to_users.sql`:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL;

-- Índice para que la limpieza de invitados caducados sea eficiente.
CREATE INDEX IF NOT EXISTS users_is_guest_expires_at_idx
ON users(is_guest, expires_at);
```

Los valores por defecto (`is_guest = false`, `expires_at = NULL`) hacen que **los usuarios registrados actuales sigan funcionando sin cambios**.

### 5.2. Dominio: extender la entidad `User` y el puerto `UserRepository`

- **`User` (entidad):** añadir dos campos **con valor por defecto** para no romper los sitios que ya hacen `new User(...)`:
  - `isGuest = false`
  - `expiresAt: Date | null = null`

  Al ser parámetros opcionales del constructor, `RegisterUserUseCase` y el resto **no necesitan cambios**.
- **`UserRepository` (puerto):** añadir un método `deleteExpiredGuests(now: Date): Promise<number>` (devuelve cuántos borró) para la limpieza.

### 5.3. Aplicación: nuevo caso de uso `CreateGuestUserUseCase`

Crea un invitado y devuelve su token. Reutiliza los puertos ya existentes (`IdGenerator`, `TokenService`, `PasswordHasher`, `UserRepository`).

Lógica:
1. `id = idGenerator.generate()`.
2. `email = guest-${id}@devmind.local` (único).
3. `passwordHash = passwordHasher.hash(<valor aleatorio inservible>)`.
4. `now = new Date()`, `expiresAt = now + GUEST_TTL_HOURS`.
5. Crear `User(id, "Invitado", email, passwordHash, now, isGuest=true, expiresAt)` y guardarlo.
6. `accessToken = tokenService.sign({ userId: id, email })`.
7. Devolver `{ accessToken, user: { id, name, email } }` (misma forma que login/register, sin `passwordHash`).

> **Detalle testeable sin reloj:** como `createdAt` y `expiresAt` se calculan del mismo `now`, el test puede afirmar de forma **determinista** que `expiresAt - createdAt === TTL`, sin necesidad de inyectar un reloj.

### 5.4. Transporte HTTP: endpoint `POST /auth/guest`

- **Público** (sin `authMiddleware`, sin body).
- Protegido con **rate limit por IP** (reutilizar `authRateLimitMiddleware` o uno análogo).
- Método en `AuthController` (`guest`) + ruta en `authRoutes.ts`.
- Devuelve `201` con `{ accessToken, user }`.

### 5.5. Infraestructura: repositorio y limpieza

- **`PostgresUserRepository`:**
  - `save`: incluir `is_guest` y `expires_at` en el `INSERT` y en `toDomain`.
  - `deleteExpiredGuests(now)`: `DELETE FROM users WHERE is_guest = true AND expires_at < $1`. La cascada borra proyectos, archivos, chunks, embeddings, jobs e historial del invitado automáticamente.
- **Script de limpieza** `scripts/purge-guests.ts` (al estilo de `scripts/run-migrations.ts`), ejecutable con `npm run purge-guests`. **El scheduler automático queda diferido** (opción B).

### 5.6. Configuración (`env.ts`)

- `guest.ttlHours = Number(process.env.GUEST_TTL_HOURS) || 24`.
- (Si se decide) límites de rate limit propios del invitado; si no, se reutiliza el de auth.
- Añadir las nuevas variables a `.env.example`.

## 6. Tests (TDD, en este orden)

1. **Unit** `createGuestUserUseCase.test.ts` (con fakes): crea un usuario con `isGuest=true`, `expiresAt = createdAt + TTL`, lo guarda y devuelve un token. Se apoya en `FakeUserRepository`, `FakeIdGenerator`, `FakeTokenService`, `FakePasswordHasher`.
2. **Unit/DB** ampliar/crear test de `PostgresUserRepository` para `deleteExpiredGuests`: borra invitados caducados (y por cascada sus proyectos), **conserva** invitados no caducados y usuarios registrados.
3. **Integración** `authGuestEndpoint.test.ts`: `POST /auth/guest` → `201` con `accessToken`; y con ese token, `POST /projects` funciona (`201`) → **demuestra que el invitado usa el pipeline real**. Opcional: preguntar (`/ask`) y ver que responde.
4. **(Opcional)** añadir `/auth/guest` al test de rate limiting.

## 7. Documentación (al terminar)

- **OpenAPI:** documentar `POST /auth/guest` y su respuesta.
- **`.env.example`:** añadir `GUEST_TTL_HOURS` (y variables de rate limit si se crean).
- **Documento de diseño:** nueva **Fase 13 — Modo invitado**, redactada paso a paso al estilo de la Fase 12 (primero el test, en rojo, luego la implementación y el porqué), y **reconciliar el índice de fases** (punto 2): marcar la Fase 12 como implementada e insertar la 13.
  - **Recalcar como decisión consciente** el punto de **no limitar el número de proyectos del invitado** (ver el bloque destacado de la sección 4): explicar que se podría haber hecho, pero que implicaba tocar `CreateProjectUseCase`, saber `is_guest`, un error nuevo y sus tests, rompiendo el carácter puramente aditivo de la feature; y que no aportaba valor imprescindible. Queda como mejora futura.

## 8. Seguridad (tener en cuenta)

- **No se pueden falsificar tokens:** el `authMiddleware` verifica la **firma** del JWT con `JWT_SECRET` (que solo conoce el servidor) y con el algoritmo fijado a `HS256`. Un token inventado o manipulado no pasa la verificación → `401`. El invitado recibe un token **legítimo emitido por el servidor** en `/auth/guest`, no uno que él fabrique.
- **El riesgo real del invitado no es la falsificación, sino el abuso del endpoint público:** alguien podría pedir muchos tokens de invitado (crear usuarios en masa, gastar cuota de Gemini). Se mitiga con: **rate limit por IP** en `/auth/guest`, el **TTL + limpieza**, y los **límites de tamaño de ZIP** ya existentes.
- **Aislamiento:** cada invitado es su propio usuario; la autorización por `ownerId` (tomado del token) + `findByIdAndOwnerId` garantiza que **un invitado no ve datos de otros**.
- **`JWT_SECRET`** debe ser fuerte y secreto (ya es obligatorio y está fuera del repo); en el despliegue, un valor largo y aleatorio de verdad.

## 9. Relación con lo ya hecho (Historial, Fase 12)

El historial ya está implementado y su tabla `conversation_entries` se enlaza a `projects(id)` con `ON DELETE CASCADE`. Como `projects.owner_id → users(id)` también es `ON DELETE CASCADE`, **al borrar un invitado caducado se borran en cascada sus proyectos y, con ellos, su historial**, sin lógica adicional. La cadena de limpieza ya está completa; solo falta la palanca que la dispara (`deleteExpiredGuests`).

## 10. Orden de implementación

1. Migración `009` (`is_guest` + `expires_at`).
2. Extender entidad `User` (campos opcionales) y puerto `UserRepository` (`deleteExpiredGuests`) + `FakeUserRepository`.
3. **TDD** `CreateGuestUserUseCase` (test rojo → implementación → verde).
4. `PostgresUserRepository`: `save`/`toDomain` con las columnas nuevas + `deleteExpiredGuests` (+ test de BD).
5. Endpoint `POST /auth/guest` (+ rate limit) + controller + ruta + wiring en el container.
6. Test de integración (invitado obtiene token y usa el pipeline).
7. Script `purge-guests` + configuración `env`/`.env.example`.
8. OpenAPI + Fase 13 en el documento de diseño + índice de fases.
9. **(Opcional / decisión A)** límite de proyectos del invitado.
10. **(Fase siguiente)** Frontend: entrada directa al producto + auto-`POST /auth/guest` + registro como "plus".

## 11. Qué mantener fuera del alcance (para no complicarse)

- **No** rehacer el modelo de usuarios ni hacer `ownerId` _nullable_: el invitado es un usuario normal.
- **No** crear tablas separadas para invitados: se reutilizan las mismas.
- **No** montar un scheduler automático de limpieza ahora (opción B: se difiere).
- **No** implementar el _upgrade path_ (convertir invitado en registrado conservando su proyecto): es un extra / mejora futura.

## 12. El único cambio sobre código existente (aprobado por este plan)

Para respetar la regla de "no cambios significativos sin avisar", se deja constancia de que la **única** modificación sobre código ya escrito es:

- **`User` (entidad):** dos campos opcionales nuevos (`isGuest`, `expiresAt`) con valor por defecto → **no rompe** ningún `new User(...)` existente.
- **`PostgresUserRepository` + su test:** el `INSERT`/`toDomain` pasan a incluir las dos columnas nuevas; hay que actualizar las aserciones del test del repo para reflejar los dos campos.
- **`UserRepository` + `FakeUserRepository`:** añadir el método `deleteExpiredGuests`.

Todo lo demás es **código nuevo aditivo**; el pipeline (upload, chunks, embeddings, RAG, historial) **no se toca**.

---

### Resumen en una frase

Un invitado es **un usuario temporal que el sistema crea solo** (`POST /auth/guest`), reutiliza **toda la API existente**, y sus datos se limpian por **caducidad** (`is_guest` + `expires_at` + `deleteExpiredGuests`) apoyándose en las cascadas que ya tiene la base de datos. Lo nuevo: dos columnas, un caso de uso, un endpoint y una función de limpieza.
