# DevMind — Guía de desarrollo del proyecto

## Objetivo general del proyecto

DevMind es una API inteligente para equipos de desarrollo que permite indexar proyectos software y consultar su código, documentación y estructura mediante lenguaje natural.

El objetivo principal del proyecto es resolver un problema habitual en equipos de desarrollo:

> Los desarrolladores pierden tiempo entendiendo proyectos existentes porque el conocimiento técnico está disperso entre código, documentación incompleta y experiencia de otros miembros del equipo.

DevMind busca ayudar en ese proceso mediante una API backend construida con arquitectura limpia, testing, autenticación, persistencia, RAG e inteligencia artificial.

---

# Metodología de desarrollo

El proyecto se está construyendo siguiendo una estrategia de **TDD pragmático**.

Esto significa:

* En `domain` y `application` se aplica TDD de forma más estricta.
* En `infrastructure` se crean tests unitarios para adapters concretos.
* En `transport/http` se usarán tests de integración para validar el comportamiento completo de los endpoints.
* En la parte de IA/RAG se usarán tests de contrato y evaluación, ya que las respuestas de IA no siempre son deterministas.

## Regla general

```txt
Domain / Application → test unitario primero
Infrastructure → test unitario o de integración según el adapter
Transport HTTP → tests de integración
IA / RAG → tests de contrato y evaluación
```

---

# Arquitectura del proyecto

El proyecto sigue una arquitectura inspirada en **Clean Architecture / Hexagonal Architecture**.

La estructura principal es:

```txt
src/
├── domain/
├── application/
├── infrastructure/
├── transport/
├── container/
└── shared/
```

## Capas

### `domain`

Contiene las entidades, contratos y reglas más puras del negocio.

Ejemplos:

* `User`
* `UserRepository`
* Más adelante: `Project`, `ProjectFile`, `CodeChunk`, etc.

### `application`

Contiene los casos de uso y los puertos que necesita la aplicación.

Ejemplos:

* `RegisterUserUseCase`
* `LoginUserUseCase`
* `GetCurrentUserUseCase`
* `PasswordHasher`
* `TokenService`
* `IdGenerator`

### `infrastructure`

Contiene implementaciones técnicas concretas.

Ejemplos:

* `BcryptPasswordHasher`
* `JwtTokenService`
* `CryptoIdGenerator`
* `InMemoryUserRepository`
* Más adelante: `PrismaUserRepository`, Genkit, filesystem, pgvector, etc.

### `transport`

Contiene la entrada HTTP de la aplicación.

Ejemplos:

* Rutas de Express
* Controllers
* Middlewares
* Schemas de validación con Zod

### `container`

Contiene el montaje de dependencias.

Aquí se conectan los casos de uso con sus implementaciones reales.

Ejemplo:

```txt
RegisterUserUseCase necesita UserRepository, PasswordHasher e IdGenerator.
El container decide qué implementación concreta se usa.
```

### `shared`

Contiene errores, tipos y utilidades comunes.

Ejemplos:

* `AppError`
* `UserAlreadyExistsError`
* `InvalidCredentialsError`
* `UnauthorizedError`
* `UserNotFoundError`

---

# Fase 0 — Inicialización del proyecto

## Objetivo

Crear la base técnica del proyecto.

En esta fase se prepara:

* Proyecto Node.js.
* TypeScript.
* Express.
* Testing con Vitest y Supertest.
* Estructura base de Clean Architecture.
* Endpoint inicial `/health`.
* Primer test de integración.
* Configuración básica del entorno.

---

## Pasos realizados

### 1. Inicializar proyecto

```bash
npm init -y
```

Esto crea el archivo `package.json`.

---

### 2. Instalar dependencias base

Dependencias de ejecución:

```bash
npm install express cors dotenv
```

Dependencias de desarrollo:

```bash
npm install -D typescript tsx @types/node @types/express @types/cors
```

Dependencias de testing:

```bash
npm install -D vitest supertest @types/supertest
```

---

### 3. Crear configuración de TypeScript

Se inicializa el archivo:

```bash
npx tsc --init
```

Se configura `tsconfig.json` para trabajar con:

* `src`
* `tests`
* TypeScript estricto
* salida compilada en `dist`

---

### 4. Crear estructura base

Estructura inicial:

```txt
src/
├── app.ts
├── main.ts
├── domain/
├── application/
├── infrastructure/
│   └── config/
├── transport/
│   └── http/
└── shared/

tests/
└── integration/
```

---

### 5. Crear endpoint `/health`

El primer endpoint sirve para comprobar que la API está funcionando.

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

### 6. Aplicar primer ciclo TDD

Se crea primero el test:

```txt
tests/integration/health.test.ts
```

El test comprueba que:

* `/health` responde con status `200`.
* La respuesta contiene el JSON esperado.

Después se implementa el endpoint.

---

## Checklist Fase 0

```txt
[x] Proyecto creado con npm
[x] Express instalado
[x] TypeScript instalado
[x] Vitest y Supertest instalados
[x] tsconfig.json configurado
[x] Estructura Clean Architecture creada
[x] Test de /health creado
[x] /health implementado
[x] npm test funciona
[x] npm run typecheck funciona
[x] npm run build funciona
[x] npm run dev funciona
[x] .env.example creado
[x] .gitignore creado
[x] README inicial creado
[x] Primer commit hecho
```

---

# Fase 1 — Autenticación

## Objetivo

Implementar el sistema de autenticación de DevMind.

La fase incluye:

* Registro de usuario.
* Login.
* Hash de contraseñas con bcrypt.
* Generación de JWT.
* Verificación de JWT.
* Middleware de autenticación.
* Endpoint `GET /auth/me`.
* Manejo de errores propios.
* Tests unitarios y de integración.

Endpoints objetivo:

```txt
POST /auth/register
POST /auth/login
GET  /auth/me
```

---

# Fase 1.1 — Casos de uso de autenticación

En esta fase se construyen primero las piezas internas de la aplicación, sin Express, sin PostgreSQL y sin JWT real.

La idea es empezar por el núcleo:

```txt
domain → application → tests
```

---

## 1. RegisterUserUseCase

### Objetivo

Crear el caso de uso para registrar usuarios.

Antes de crear el caso de uso, se crean las piezas base:

```txt
src/domain/users/user.entity.ts
src/domain/users/user.repository.ts
src/application/ports/password-hasher.ts
src/application/ports/id-generator.ts
```

---

## Entidad User

Representa un usuario dentro del dominio.

Contiene:

* `id`
* `name`
* `email`
* `passwordHash`
* `createdAt`

---

## UserRepository

Es un contrato, no una implementación concreta.

Define lo que la aplicación necesita para trabajar con usuarios.

Métodos iniciales:

```ts
findByEmail(email: string): Promise<User | null>;
save(user: User): Promise<User>;
```

Más adelante se añade:

```ts
findById(id: string): Promise<User | null>;
```

---

## PasswordHasher

Puerto de aplicación para hashear contraseñas.

Inicialmente:

```ts
hash(plainPassword: string): Promise<string>;
```

Más adelante se amplía con:

```ts
compare(plainPassword: string, passwordHash: string): Promise<boolean>;
```

---

## IdGenerator

Puerto de aplicación para generar IDs.

```ts
generate(): string;
```

---

## TDD de RegisterUserUseCase

Se crea primero el test unitario:

```txt
tests/unit/application/auth/register-user.use-case.test.ts
```

Casos probados:

```txt
[x] Debe registrar un usuario nuevo
[x] No debe permitir emails duplicados
[x] Debe guardar la contraseña hasheada
```

Después se implementa:

```txt
src/application/auth/register-user.use-case.ts
```

---

## Checklist RegisterUserUseCase

```txt
[x] User entity creada
[x] UserRepository creado
[x] PasswordHasher creado
[x] IdGenerator creado
[x] Test de registro creado
[x] RegisterUserUseCase creado
[x] Test de email duplicado creado
[x] npm test pasa
```

---

# Errores propios

Después del primer caso de uso se mejora el manejo de errores.

En vez de lanzar errores genéricos como:

```ts
throw new Error("User already exists");
```

se crean errores propios.

---

## AppError

Archivo:

```txt
src/shared/errors/app-error.ts
```

Es el error base de la aplicación.

Todos los errores propios heredan de él.

Permite asociar cada error con un código HTTP.

---

## UserAlreadyExistsError

Archivo:

```txt
src/shared/errors/user-already-exists.error.ts
```

Representa el error de intentar registrar un email ya existente.

Código HTTP asociado:

```txt
409 Conflict
```

Esto será útil más adelante para que el middleware global de errores pueda responder correctamente.

---

## Ventaja de usar errores propios

Permite que más adelante el `errorMiddleware` haga esto:

```txt
Si el error es AppError → responde con su statusCode
Si es otro error desconocido → responde 500 Internal Server Error
```

---

# 2. LoginUserUseCase

## Objetivo

Crear el caso de uso para iniciar sesión.

El login debe:

```txt
1. Buscar usuario por email.
2. Comparar la contraseña recibida con la contraseña guardada.
3. Generar un token JWT.
4. Devolver usuario público + accessToken.
```

---

## Cambios necesarios

### Ampliar PasswordHasher

Se añade:

```ts
compare(plainPassword: string, passwordHash: string): Promise<boolean>;
```

Esto rompe temporalmente los tests donde se usaba un fake de `PasswordHasher`, porque ahora el fake debe implementar también `compare`.

---

### Crear TokenService

Archivo:

```txt
src/application/ports/token-service.ts
```

Este puerto representa algo que sabe firmar y verificar tokens.

Inicialmente se crea para firmar tokens:

```ts
sign(payload: TokenPayload): Promise<string>;
```

Más adelante se amplía con:

```ts
verify(token: string): Promise<TokenPayload>;
```

---

### Crear InvalidCredentialsError

Archivo:

```txt
src/shared/errors/invalid-credentials.error.ts
```

Se usa tanto cuando:

* El email no existe.
* La contraseña es incorrecta.

Es mejor no dar pistas específicas por seguridad.

Código HTTP asociado:

```txt
401 Unauthorized
```

---

## TDD de LoginUserUseCase

Se crea primero el test:

```txt
tests/unit/application/auth/login-user.use-case.test.ts
```

Casos probados:

```txt
[x] Debe hacer login con credenciales válidas
[x] Debe fallar si el email no existe
[x] Debe fallar si la contraseña no es válida
[x] Debe devolver accessToken
[x] Debe devolver usuario público
```

Después se implementa:

```txt
src/application/auth/login-user.use-case.ts
```

---

# 3. GetCurrentUserUseCase

## Objetivo

Crear el caso de uso que devolverá el usuario actual.

Este caso de uso servirá más adelante para:

```txt
GET /auth/me
```

---

## Idea del flujo

```txt
Si el token es válido → el middleware extrae el userId
GET /auth/me → busca ese usuario por id
Devuelve sus datos públicos
```

---

## Cambios necesarios

### Ampliar UserRepository

Se añade:

```ts
findById(id: string): Promise<User | null>;
```

Esto puede romper temporalmente los repositorios en memoria usados en tests, porque ahora deben implementar también `findById`.

---

### Crear UserNotFoundError

Archivo:

```txt
src/shared/errors/user-not-found.error.ts
```

Se usa cuando se intenta obtener un usuario que no existe.

Código HTTP asociado:

```txt
404 Not Found
```

---

## TDD de GetCurrentUserUseCase

Se crea primero el test:

```txt
tests/unit/application/auth/get-current-user.use-case.test.ts
```

Casos probados:

```txt
[x] Debe devolver el usuario actual
[x] Debe lanzar error si el usuario no existe
```

Después se implementa:

```txt
src/application/auth/get-current-user.use-case.ts
```

---

## Estado tras Fase 1.1

```txt
[x] User entity
[x] UserRepository
[x] RegisterUserUseCase
[x] LoginUserUseCase
[x] GetCurrentUserUseCase
[x] PasswordHasher
[x] TokenService
[x] IdGenerator
[x] UserAlreadyExistsError
[x] InvalidCredentialsError
[x] UserNotFoundError
[x] Tests unitarios de registro
[x] Tests unitarios de login
[x] Tests unitarios de usuario actual
```

---

# Fase 1.2 — Infraestructura real de autenticación

## Objetivo

Crear implementaciones reales de los puertos definidos en `application`.

Hasta ahora solo existían interfaces:

```txt
PasswordHasher
TokenService
IdGenerator
```

Ahora se crean adapters reales en infraestructura:

```txt
BcryptPasswordHasher
JwtTokenService
CryptoIdGenerator
```

---

## Dependencias instaladas

```bash
npm install bcryptjs jsonwebtoken
npm install -D @types/jsonwebtoken
```

---

## Para qué sirve cada dependencia

### bcryptjs

Sirve para:

```txt
cifrar contraseñas
comparar contraseñas
```

Se usa en:

```txt
BcryptPasswordHasher
```

---

### jsonwebtoken

Sirve para:

```txt
crear tokens JWT
verificar tokens JWT
```

Se usa en:

```txt
JwtTokenService
```

---

### crypto.randomUUID

Viene incluido con Node.js.

Sirve para generar IDs reales.

Se usa en:

```txt
CryptoIdGenerator
```

---

## Variables de entorno

Se añaden variables al `.env` y `.env.example`:

```env
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
```

También se actualiza:

```txt
src/infrastructure/config/env.ts
```

para poder acceder a estas variables desde infraestructura.

---

## Ampliar TokenService

Se añade el método:

```ts
verify(token: string): Promise<TokenPayload>;
```

Motivo:

Más adelante el middleware de autenticación necesitará:

```txt
1. Recibir token.
2. Verificar token.
3. Extraer userId.
4. Permitir acceso a rutas protegidas.
```

Al añadir `verify`, el fake usado en tests también debe actualizarse.

---

## Crear UnauthorizedError

Archivo:

```txt
src/shared/errors/unauthorized.error.ts
```

Se usa cuando:

* No hay token.
* El token es inválido.
* El token ha expirado.
* El formato del token no es correcto.

Código HTTP asociado:

```txt
401 Unauthorized
```

---

## Adapters creados

### BcryptPasswordHasher

Ubicación recomendada:

```txt
src/infrastructure/auth/bcrypt-password-hasher.ts
```

Implementa:

```txt
PasswordHasher
```

Responsabilidades:

```txt
hash password
compare password
```

---

### JwtTokenService

Ubicación recomendada:

```txt
src/infrastructure/auth/jwt-token.service.ts
```

Implementa:

```txt
TokenService
```

Responsabilidades:

```txt
sign token
verify token
```

---

### CryptoIdGenerator

Ubicación recomendada:

```txt
src/infrastructure/crypto/crypto-id-generator.ts
```

Implementa:

```txt
IdGenerator
```

Responsabilidad:

```txt
generate UUID
```

---

## Tests unitarios de infraestructura

Se crean tests para comprobar que los adapters reales funcionan.

Archivos:

```txt
tests/unit/infrastructure/auth/bcrypt-password-hasher.test.ts
tests/unit/infrastructure/auth/jwt-token.service.test.ts
tests/unit/infrastructure/crypto/crypto-id-generator.test.ts
```

Casos probados:

```txt
[x] BcryptPasswordHasher genera hash
[x] BcryptPasswordHasher compara contraseña válida
[x] BcryptPasswordHasher rechaza contraseña inválida
[x] JwtTokenService firma y verifica token
[x] JwtTokenService rechaza token inválido
[x] CryptoIdGenerator genera UUID
[x] CryptoIdGenerator genera IDs diferentes
```

---

## Estado tras Fase 1.2

```txt
[x] BcryptPasswordHasher
[x] JwtTokenService
[x] CryptoIdGenerator
[x] UnauthorizedError
[x] Tests unitarios de infraestructura
[x] npm test pasa
[x] npm run typecheck pasa
```

---

# Resumen hasta aquí

Hasta este punto se ha construido:

```txt
1. Setup inicial del proyecto.
2. Estructura Clean Architecture.
3. Endpoint /health.
4. Tests iniciales.
5. Dominio de usuario.
6. Puertos de aplicación.
7. Casos de uso de autenticación.
8. Errores propios.
9. Adapters reales de infraestructura.
10. Configuración de variables de entorno.
```

La lógica interna de autenticación ya está preparada.

Todavía falta conectar esa lógica con HTTP.

---

# Fase 1.3 — Capa HTTP de autenticación

## Objetivo

Crear los endpoints reales de autenticación:

```txt
POST /auth/register
POST /auth/login
GET  /auth/me
```

En esta fase se conecta Express con los casos de uso ya creados.

---

## Nota sobre TDD en esta fase

En los casos de uso se aplicó TDD estricto.

En la capa HTTP se implementaron varias piezas de conexión antes de escribir los tests de integración.

Por tanto, esta parte no se puede considerar TDD puro.

Para corregir el rumbo, antes de cerrar la fase se crearán tests de integración HTTP para validar todos los endpoints.

A partir de la Fase 2, para nuevos endpoints se seguirá este orden:

```txt
1. Test de integración del endpoint.
2. Ver que falla.
3. Implementación mínima.
4. Ver que pasa.
5. Refactor.
```

---

## Repositorio temporal en memoria

Como todavía no se ha introducido PostgreSQL, se crea un repositorio temporal en memoria.

Ubicación:

```txt
src/infrastructure/repositories/in-memory-user.repository.ts
```

Este repositorio implementa:

```txt
UserRepository
```

Sirve para poder probar los endpoints sin tener todavía base de datos real.

Más adelante será sustituido por:

```txt
PrismaUserRepository
```

---

## Container de dependencias

Se crea un container para montar las dependencias manualmente.

Ubicación recomendada:

```txt
src/container/index.ts
```

El container instancia:

```txt
InMemoryUserRepository
BcryptPasswordHasher
JwtTokenService
CryptoIdGenerator
RegisterUserUseCase
LoginUserUseCase
GetCurrentUserUseCase
```

Esto es una forma simple de inyección de dependencias manual.

No se usa ninguna librería externa.

El container responde a la pregunta:

> ¿Qué implementación concreta usa cada puerto?

---

# Piezas HTTP creadas

Para construir los endpoints se añaden varias piezas.

---

## 1. Zod

Se instala:

```bash
npm install zod
```

Zod sirve para validar los datos que llegan en el body de las peticiones HTTP.

Ejemplo de registro válido:

```json
{
  "name": "Carlos",
  "email": "carlos@example.com",
  "password": "123456"
}
```

Ejemplo inválido:

```json
{
  "name": "",
  "email": "mal",
  "password": "1"
}
```

---

## 2. auth.schemas.ts

Archivo:

```txt
src/transport/http/auth/auth.schemas.ts
```

Define las reglas de entrada para registro y login.

Incluye:

```txt
registerSchema
loginSchema
```

Responsabilidad:

```txt
Definir qué forma debe tener el body de cada endpoint.
```

---

## 3. validateBody

Archivo:

```txt
src/transport/http/middlewares/validate-body.middleware.ts
```

Este middleware aplica un schema de Zod sobre `req.body`.

Flujo:

```txt
Request llega
    ↓
validateBody comprueba el body
    ↓
si está mal → responde 400
si está bien → pasa al controller
```

Ventaja:

El controller no se ensucia con validaciones manuales.

---

## 4. asyncHandler

Archivo:

```txt
src/transport/http/middlewares/async-handler.ts
```

Sirve para capturar errores en controllers async sin tener que escribir `try/catch` en cada ruta.

Sin `asyncHandler`, habría que hacer esto en todos los controllers:

```ts
try {
  // lógica async
} catch (error) {
  next(error);
}
```

Con `asyncHandler`, los errores se envían automáticamente a Express mediante `next(error)`.

---

## 5. errorMiddleware

Archivo:

```txt
src/transport/http/middlewares/error.middleware.ts
```

Es el middleware global de errores.

Convierte errores propios en respuestas HTTP.

Ejemplos:

```txt
UserAlreadyExistsError → 409
InvalidCredentialsError → 401
UserNotFoundError → 404
UnauthorizedError → 401
```

Si el error no es conocido, responde:

```txt
500 Internal Server Error
```

Importante:

```txt
app.use(errorMiddleware)
```

debe ir después de las rutas.

---

## 6. AuthenticatedRequest

Archivo:

```txt
src/transport/http/types/authenticated-request.ts
```

Express no conoce por defecto la propiedad:

```txt
req.user
```

Por eso se crea un tipo propio para rutas autenticadas.

Sirve para poder usar:

```txt
req.user.userId
req.user.email
```

después de que el middleware de autenticación haya validado el token.

---

## 7. AuthController

Archivo:

```txt
src/transport/http/auth/auth.controller.ts
```

El controller conecta HTTP con los casos de uso.

Métodos:

```txt
register
login
me
```

Responsabilidades:

```txt
leer datos de req.body
llamar al caso de uso correspondiente
devolver respuesta HTTP
```

El controller no contiene lógica de negocio.

---

## Flujo de register

```txt
POST /auth/register
    ↓
validateBody(registerSchema)
    ↓
AuthController.register
    ↓
RegisterUserUseCase
    ↓
respuesta 201
```

---

## Flujo de login

```txt
POST /auth/login
    ↓
validateBody(loginSchema)
    ↓
AuthController.login
    ↓
LoginUserUseCase
    ↓
respuesta 200 con accessToken
```

---

## Flujo de me

```txt
GET /auth/me
    ↓
authMiddleware
    ↓
AuthController.me
    ↓
GetCurrentUserUseCase
    ↓
respuesta 200 con usuario actual
```

---

# Pendiente en Fase 1.3

Aún falta terminar o validar:

```txt
[ ] AuthMiddleware
[ ] AuthRoutes
[ ] Conectar authRoutes en routes.ts
[ ] Tests de integración HTTP
```

---

# AuthMiddleware

## Objetivo

Proteger rutas que necesitan usuario autenticado.

Ejemplo:

```txt
GET /auth/me
```

Este middleware debe:

```txt
1. Leer la cabecera Authorization.
2. Comprobar que tenga formato Bearer TOKEN.
3. Verificar el token con TokenService.
4. Extraer userId y email.
5. Guardar esos datos en req.user.
6. Pasar al controller.
```

Formato esperado:

```txt
Authorization: Bearer TOKEN_AQUI
```

Si falta el token o es inválido, debe lanzar:

```txt
UnauthorizedError
```

---

# AuthRoutes

## Objetivo

Definir las rutas finales de autenticación.

Archivo:

```txt
src/transport/http/auth/auth.routes.ts
```

Rutas:

```txt
POST /auth/register
POST /auth/login
GET  /auth/me
```

Debe conectar:

```txt
validateBody
authMiddleware
asyncHandler
AuthController
```

---

# Tests de integración HTTP pendientes

Antes de cerrar la Fase 1 se deben crear tests de integración.

Archivo recomendado:

```txt
tests/integration/auth.test.ts
```

Casos a probar:

```txt
[ ] POST /auth/register con datos válidos → 201
[ ] POST /auth/register con body inválido → 400
[ ] POST /auth/register con email duplicado → 409
[ ] POST /auth/login con credenciales válidas → 200 + accessToken
[ ] POST /auth/login con credenciales inválidas → 401
[ ] GET /auth/me sin token → 401
[ ] GET /auth/me con token válido → 200
```

Estos tests validan el flujo completo:

```txt
Request HTTP
    ↓
Routes
    ↓
Middlewares
    ↓
Controller
    ↓
UseCase
    ↓
Response
```

---

# Checklist general de Fase 1

```txt
[x] User entity
[x] UserRepository
[x] PasswordHasher
[x] IdGenerator
[x] TokenService
[x] RegisterUserUseCase
[x] LoginUserUseCase
[x] GetCurrentUserUseCase
[x] AppError
[x] UserAlreadyExistsError
[x] InvalidCredentialsError
[x] UserNotFoundError
[x] UnauthorizedError
[x] BcryptPasswordHasher
[x] JwtTokenService
[x] CryptoIdGenerator
[x] InMemoryUserRepository temporal
[x] Container de dependencias
[x] Schemas de validación con Zod
[x] validateBody
[x] asyncHandler
[x] errorMiddleware
[x] AuthenticatedRequest
[x] AuthController
[ ] AuthMiddleware
[ ] AuthRoutes
[ ] Conexión de authRoutes en routes.ts
[ ] Tests de integración HTTP
[ ] npm test pasa
[ ] npm run typecheck pasa
[ ] npm run build pasa
[ ] Commit de cierre de Fase 1
```

---

# Comandos útiles

Para ejecutar tests:

```bash
npm test
```

Para comprobar TypeScript:

```bash
npm run typecheck
```

Para compilar:

```bash
npm run build
```

Para arrancar en desarrollo:

```bash
npm run dev
```

---

# Estado actual del proyecto

Actualmente el proyecto tiene:

```txt
[x] Fase 0 completada
[x] Casos de uso de auth completados
[x] Infraestructura real de auth creada
[x] Parte de capa HTTP creada
[ ] AuthMiddleware pendiente o en progreso
[ ] AuthRoutes pendiente
[ ] Tests de integración HTTP pendientes
```

---

# Próximo paso

El siguiente paso es crear:

```txt
src/transport/http/middlewares/auth.middleware.ts
```

Este middleware permitirá proteger rutas usando JWT.

Después se creará:

```txt
src/transport/http/auth/auth.routes.ts
```

Y finalmente:

```txt
tests/integration/auth.test.ts
```

para cerrar correctamente la Fase 1.
