# Documentación del proyecto DevMind API

## 1. Objetivo del proyecto

DevMind es una API backend profesional pensada para que usuarios autenticados puedan crear proyectos software, subir e indexar su código y hacer consultas inteligentes sobre ese proyecto usando IA.

El proyecto contempla dos modos de uso:

- **Modo invitado:** permite probar la funcionalidad principal de análisis e interacción con proyectos software sin necesidad de registro.
- **Modo autenticado:** permite persistir proyectos, historial de conversaciones y resultados de indexación asociados a cada usuario.

El problema que se quiere resolver no es simplemente “hacer una app con IA”. El problema real es que entender un proyecto software existente puede ser lento, porque el conocimiento suele estar repartido entre carpetas, archivos, documentación incompleta y memoria del equipo.

DevMind quiere ayudar a:

- Desarrolladores nuevos.
- Equipos con proyectos grandes.
- Personas que entran a mantener código ajeno.
- Equipos que no tienen documentación actualizada.

El enfoque del proyecto es convertir un proyecto software en una fuente de conocimiento consultable mediante lenguaje natural.

### Ejemplo práctico de uso

Un usuario podría tener guardado un proyecto llamado:

```text
Proyecto: DevMind API
```

Y podría hacer preguntas como:

- Explícame la arquitectura de este proyecto.
- ¿Qué endpoints existen?
- ¿Dónde se validan los datos de entrada?
- ¿Qué casos de uso tiene la autenticación?
- ¿Qué tests hay para auth?
- ¿Qué partes pertenecen a domain, application, infrastructure y transport?
- ¿Qué debería mejorar de este código?

Esto deja claro que DevMind no es solo un CRUD, sino una herramienta para entender proyectos software.

---

## 2. Roadmap general del proyecto

| Fase    | Nombre                                 | Descripción                                                                                            |
| ------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Fase 0  | Setup inicial                          | Crear la base del proyecto, dependencias, configuración, estructura y primer endpoint de salud.        |
| Fase 1  | Autenticación                          | Registro, login, JWT, bcrypt, middleware de autenticación, endpoint `/auth/me` y tests con TDD.        |
| Fase 2  | Proyectos persistentes                 | Permitir que usuarios autenticados creen, listen, consulten y borren sus propios proyectos.            |
| Fase 3  | Subida de archivos básica              | Añadir archivos dentro de proyectos mediante JSON, todavía sin ZIP.                                    |
| Fase 4  | PostgreSQL                             | Pasar usuarios, proyectos y `ProjectFiles` a una base de datos real.                                   |
| Fase 5  | Subida de ZIP                          | Subir ZIP, descomprimir, recorrer carpetas, filtrar archivos inútiles y guardar muchos `ProjectFiles`. |
| Fase 6  | Resubida / actualización de proyecto   | Primera versión: borrar archivos anteriores y guardar los nuevos.                                      |
| Fase 7  | Chunks                                 | Trocear `ProjectFiles` en fragmentos preparados para RAG.                                              |
| Fase 8  | Embeddings + búsqueda semántica        | Generar embeddings y buscar chunks relevantes.                                                         |
| Fase 9  | IA / RAG                               | Responder preguntas usando los chunks del proyecto.                                                    |
| Fase 10 | Historial                              | Añadir historial de conversaciones o consultas.                                                        |
| Fase 11 | Funciones inteligentes                 | Incorporar funcionalidades inteligentes adicionales.                                                   |
| Fase 12 | Modo invitado / demo sin registro      | Permitir probar DevMind sin crear cuenta.                                                              |
| Fase 13 | Onboarding visual / presentación final | Preparar la presentación final del proyecto.                                                           |

---

# Fase 0. Setup inicial

## 3. Objetivo de la fase

La Fase 0 consiste en crear la base inicial del proyecto para poder empezar a desarrollar DevMind de forma ordenada.

En esta fase se realiza:

- Inicialización del `package.json`.
- Instalación de dependencias.
- Configuración de TypeScript.
- Creación de la estructura base de carpetas.
- Preparación del primer endpoint `/health`.
- Comprobación de scripts básicos del proyecto.

## 4. Dependencias instaladas

Se instalan dependencias relacionadas con Express, TypeScript, testing y tipos necesarios:

```text
typescript
tsx
@types/node
@types/express
@types/cors
vitest
supertest
@types/supertest
```

## 5. Estructura inicial

Se crea la estructura base del proyecto:

```text
src
tests
```

También se inicializa el fichero de configuración de TypeScript:

```text
tsconfig.json
```

## 6. Trabajo con TDD desde el inicio

Desde esta fase se empieza a aplicar TDD para construir el proyecto. La idea es crear primero el test, comprobar que falla, implementar la funcionalidad mínima y volver a ejecutar los tests.

## 7. Checklist de Fase 0

| Estado    | Tarea                                |
| --------- | ------------------------------------ |
| Pendiente | Proyecto creado con npm              |
| Pendiente | Express instalado                    |
| Pendiente | TypeScript instalado                 |
| Pendiente | Vitest y Supertest instalados        |
| Pendiente | `tsconfig.json` configurado          |
| Pendiente | Estructura Clean Architecture creada |
| Pendiente | Test de `/health` creado             |
| Pendiente | `/health` implementado               |
| Pendiente | `npm test` funciona                  |
| Pendiente | `npm run typecheck` funciona         |
| Pendiente | `npm run build` funciona             |
| Pendiente | `npm run dev` funciona               |
| Pendiente | `.env.example` creado                |
| Pendiente | `.gitignore` creado                  |
| Pendiente | README inicial creado                |
| Pendiente | Primer commit hecho                  |

---

# Fase 1. Autenticación

## 8. Objetivo de la fase

La Fase 1 añade la autenticación del sistema. El objetivo es permitir que un usuario pueda registrarse, iniciar sesión y acceder a su información mediante un token.

Funcionalidades previstas:

- Registro de usuario.
- Login.
- JWT.
- bcrypt.
- Middleware de autenticación.
- `GET /auth/me`.
- Tests con TDD.

Antes de implementar nada, se crean tests con TDD para que fallen y después se implementa el caso de uso correspondiente.

---

## 9. Fase 1.1. Casos de uso de autenticación

### 9.1. `RegisterUserUseCase`

El primer caso de uso es el registro de usuario.

Antes de crear el primer test se crean las piezas base del dominio y de aplicación:

- Entidad `User`.
- Repositorio `UserRepository`.
- Puerto `IdGenerator`.
- Puerto `PasswordHasher`.

Después se crea el test unitario del caso de uso de registro.

El caso de uso debe cumplir estas reglas:

- Debe registrar un usuario nuevo.
- No debe permitir emails duplicados.
- Debe guardar la contraseña hasheada.

#### Checklist de `RegisterUserUseCase`

| Estado    | Tarea                          |
| --------- | ------------------------------ |
| Pendiente | `User` entity creada           |
| Pendiente | `UserRepository` creado        |
| Pendiente | `PasswordHasher` creado        |
| Pendiente | `IdGenerator` creado           |
| Pendiente | Test de registro creado        |
| Pendiente | `RegisterUserUseCase` creado   |
| Pendiente | Test de email duplicado creado |
| Pendiente | `npm test` pasa                |

### 9.2. Errores propios

Después del primer test se construyen manejadores de errores propios en lugar de usar errores generales.

Se crea en `shared` una carpeta `errors`. Dentro se añade un error general `AppError`, del que heredarán los demás errores.

También se crea un error específico:

```text
UserAlreadyExistsError
```

Este error se usa en el test para comprobar que, si el email ya está registrado, el caso de uso lanza un error concreto.

La ventaja de usar errores propios es que más adelante se podrá tener un middleware global que actúe así:

```text
Si el error es AppError -> responde con su statusCode
Si es otro error desconocido -> responde 500
```

### 9.3. `LoginUserUseCase`

El segundo caso de uso es el login de usuario.

Para implementarlo se actualiza el puerto `PasswordHasher`, añadiendo un método de comparación:

```ts
compare(plainPassword: string, passwordHash: string): Promise<boolean>;
```

Este cambio rompe temporalmente el test de registro, porque el fake anterior solo tenía un método. Por eso se añade también `compare` en el fake, aunque ese test no lo use.

Después se crea el puerto `TokenService`. Este puerto pertenece a la capa de aplicación. Todavía no se usa `jsonwebtoken` directamente, porque eso corresponde a infraestructura. El caso de uso solo declara que necesita algo que sepa generar tokens.

También se crea un nuevo tipo de error en la carpeta `errors`, para el caso en el que las credenciales no sean válidas.

A partir de aquí se sigue TDD:

1. Crear el test de login.
2. Comprobar que falla porque el caso de uso no existe.
3. Crear `LoginUserUseCase`.
4. Ejecutar los tests hasta que pasen.

### 9.4. `GetCurrentUserUseCase`

Una vez cerrada la parte de registro y login a nivel de aplicación, se crea el caso de uso que servirá para el endpoint:

```http
GET /auth/me
```

La idea del flujo será:

```text
Si el token es válido -> el middleware extrae el userId
GET /auth/me -> busca ese usuario por id
Devuelve sus datos públicos
```

Para esto se actualiza la interfaz del repositorio de usuarios con un nuevo método:

```ts
findById(id: string): Promise<User | null>;
```

Como se añade `findById`, los repositorios en memoria de los tests fallan hasta que se implementa ese método.

También se crea un nuevo tipo de error:

```text
UserNotFoundError
```

Este error se usará cuando alguien pida un usuario que no existe.

Después se crea el test unitario de `GetCurrentUserUseCase`, siguiendo el mismo flujo de TDD.

### 9.5. Estado de la Fase 1.1

En este punto ya está implementado:

| Estado     | Elemento                          |
| ---------- | --------------------------------- |
| Completado | `User` entity                     |
| Completado | `UserRepository`                  |
| Completado | `RegisterUserUseCase`             |
| Completado | `LoginUserUseCase`                |
| Completado | `GetCurrentUserUseCase`           |
| Completado | `PasswordHasher`                  |
| Completado | `TokenService`                    |
| Completado | `IdGenerator`                     |
| Completado | `UserAlreadyExistsError`          |
| Completado | `InvalidCredentialsError`         |
| Completado | `UserNotFoundError`               |
| Completado | Tests unitarios de registro       |
| Completado | Tests unitarios de login          |
| Completado | Tests unitarios de usuario actual |

Queda pendiente para cerrar la Fase 1:

| Estado    | Elemento                                  |
| --------- | ----------------------------------------- |
| Pendiente | Infraestructura real: bcrypt              |
| Pendiente | Infraestructura real: JWT                 |
| Pendiente | Infraestructura real: crypto id generator |
| Pendiente | Repositorio real o temporal para HTTP     |
| Pendiente | `AuthController`                          |
| Pendiente | `AuthRoutes`                              |
| Pendiente | `AuthMiddleware`                          |
| Pendiente | Error middleware                          |
| Pendiente | Tests de integración HTTP                 |

El siguiente paso lógico es crear las implementaciones reales de infraestructura:

- `BcryptPasswordHasher`, para hashear y comparar contraseñas.
- `JwtTokenService`, para generar y verificar tokens JWT.
- `CryptoIdGenerator`, para generar IDs reales.

---

## 10. Fase 1.2. Adaptadores reales de infraestructura

### 10.1. Dependencias usadas

En esta fase se usan:

- `bcryptjs`, para cifrar y comparar contraseñas.
- `jsonwebtoken`, para crear y verificar JWT.
- `crypto.randomUUID`, para generar IDs.

Se instalan estas dependencias:

```bash
npm install bcryptjs jsonwebtoken
npm install -D @types/jsonwebtoken
```

### 10.2. Variables de entorno

Se modifica el `.env` para añadir:

- El secreto para `jsonwebtoken`.
- Los días de expiración del token.

También se modifica `env.ts`, dentro de la configuración de infraestructura, para que coja los valores desde `.env`.

### 10.3. Actualización de `TokenService`

El puerto `TokenService` solo tenía `sign`, que sirve para firmar y generar tokens. Se añade también el método `verify`, porque más adelante el middleware de autenticación hará esto:

1. Recibir token.
2. Verificar token.
3. Extraer `userId`.
4. Permitir acceso a rutas protegidas.

Al añadir `verify`, el test de login puede fallar porque `FakeTokenService` ya no implementa toda la interfaz. Por eso se actualiza el fake.

### 10.4. Creación de adaptadores

Se crea la carpeta `authAdapters` dentro de `infrastructure`. Dentro se añaden los adaptadores que implementan los puertos de aplicación:

- `bcryptPasswordHasher`.
- `jwtTokenService`.
- `cryptoIdGenerator`.

Siguiendo TDD, se crean primero los tests unitarios de infraestructura. Estos deben fallar porque los adaptadores todavía no están implementados.

Después se crean las implementaciones reales de los puertos.

Durante la creación de los tests y las implementaciones se usa un nuevo tipo de error:

```text
UnauthorizedError
```

Este error se crea en la carpeta `errors` para que los tests puedan pasar.

### 10.5. Cierre de la Fase 1.2

Hasta este punto se ha realizado lo siguiente:

- Inicialización del proyecto con setup, dependencias y configuración.
- Creación de la estructura base de carpetas.
- Creación del dominio con entidad e interfaz de repositorio.
- Creación de puertos de aplicación.
- Creación de casos de uso que usan esos puertos.
- Implementación de los puertos con infraestructura real.
- Aplicación de TDD en las piezas principales.
- Creación de errores propios.
- Creación de `.env` y configuración de infraestructura para acceder a él.
- Creación del fichero de `app`, donde se crea la app de Express.
- Creación de un router con un endpoint pequeño.
- Creación del fichero `main`, que levanta el servidor.

---

## 11. Fase 1.3. Conexión con HTTP

### 11.1. Objetivo

En esta parte toca conectar todo con HTTP y crear los endpoints reales de autenticación:

```http
POST /auth/register
POST /auth/login
GET /auth/me
```

Como todavía no se ha incorporado PostgreSQL, se crea un repositorio en memoria dentro de infraestructura para poder probar los endpoints.

Este repositorio es temporal. Más adelante se cambiará por PostgreSQL. De momento permite terminar la autenticación HTTP sin esperar a tener la base de datos.

### 11.2. Contenedor de dependencias

Se crea un contenedor de dependencias simple para no instanciar todo manualmente en cada controller.

Esto es una forma sencilla de hacer inyección de dependencias manual. No se usa una librería externa, simplemente se conectan las interfaces con sus implementaciones reales en un único lugar.

### 11.3. Piezas añadidas

Para crear los endpoints se añaden estas piezas:

- `AuthController`.
- `AuthRoutes`.
- `AuthMiddleware`.
- `ErrorMiddleware`.
- `ValidateBodyMiddleware`.

También se instala `zod`, si todavía no estaba instalado. Se usa para validar que el usuario mande correctamente los datos.

### 11.4. Schemas y validación

Se crean schemas de autenticación. Este archivo define las reglas de entrada para registro y login.

Después se crea el middleware `validateBody`, que usará esos schemas.

No se valida directamente dentro del controller para evitar ensuciarlo. La validación se deja en un middleware separado.

### 11.5. Manejo de errores async

Cuando un controller es `async`, puede fallar. Por ejemplo:

```ts
await this.loginUserUseCase.execute(...)
```

Si el login falla, el caso de uso lanza:

```ts
throw new InvalidCredentialsError();
```

Express necesita que ese error llegue a un middleware de errores. Para evitar poner `try/catch` en cada controller, se usa un helper llamado `asyncHandler`.

### 11.6. `errorMiddleware`

Se crea `errorMiddleware`, que es el sitio central donde se convierten errores en respuestas HTTP.

Se conecta en `app.ts` después de las rutas:

```ts
app.use(errorMiddleware);
```

Debe ir después de las rutas porque primero Express intenta resolver la petición. Si alguna ruta lanza un error, entonces pasa al middleware de errores.

### 11.7. Controller y routes

Se crea `AuthController`, que recibe el contenedor y ejecuta las acciones de registro, login y usuario actual usando los casos de uso.

Por último se crea `AuthRoutes`, donde se definen los endpoints y se conectan los middlewares de validación y los métodos del controller.

### 11.8. Estrategia de testing

El proyecto aplica una estrategia de TDD.

En las capas de dominio y aplicación, donde se concentra la lógica de negocio, se han escrito pruebas unitarias antes de la implementación.

En la capa de transporte HTTP, al tratarse principalmente de código de integración y cableado entre rutas, middlewares y controladores, se han usado pruebas de integración para validar el comportamiento completo de los endpoints.

El proceso ha sido:

1. Crear tests primero.
2. Implementar una versión básica de rutas, middlewares y controladores para que los tests pasen.
3. Añadir más tests, por ejemplo casos de error.
4. Volver a implementar hasta que todos pasen.

---

# Fase 2. Proyectos persistentes

## 12. Objetivo de la fase

La Fase 2 añade la parte de proyectos a DevMind.

Hasta ahora DevMind ya sabía quién era el usuario gracias al login. En esta fase se hace que cada usuario pueda tener sus propios proyectos dentro de la aplicación.

La idea principal es:

- Un usuario puede crear, ver, listar y borrar sus propios proyectos.
- Un usuario nunca puede acceder a los proyectos de otro usuario.

## 13. Checklist de endpoints

| Estado    | Caso                                                            |
| --------- | --------------------------------------------------------------- |
| Pendiente | `POST /projects` sin token -> 401                               |
| Pendiente | `POST /projects` con token válido -> 201                        |
| Pendiente | `POST /projects` con body inválido -> 400                       |
| Pendiente | `GET /projects` sin token -> 401                                |
| Pendiente | `GET /projects` con token válido -> 200                         |
| Pendiente | `GET /projects` devuelve solo proyectos del usuario autenticado |
| Pendiente | `GET /projects/:id` con proyecto propio -> 200                  |
| Pendiente | `GET /projects/:id` con proyecto inexistente -> 404             |
| Pendiente | `GET /projects/:id` de otro usuario -> 404                      |
| Pendiente | `DELETE /projects/:id` con proyecto propio -> 204               |
| Pendiente | `DELETE /projects/:id` inexistente -> 404                       |
| Pendiente | `DELETE /projects/:id` de otro usuario -> 404                   |

## 14. Checklist de Postman

### Flujo recomendado

| Estado    | Prueba                                                  |
| --------- | ------------------------------------------------------- |
| Pendiente | Registrar usuario 1                                     |
| Pendiente | Login usuario 1                                         |
| Pendiente | Crear proyecto usuario 1                                |
| Pendiente | Listar proyectos usuario 1                              |
| Pendiente | Obtener proyecto usuario 1 por id                       |
| Pendiente | Eliminar proyecto usuario 1                             |
| Pendiente | Registrar usuario 2                                     |
| Pendiente | Login usuario 2                                         |
| Pendiente | Crear proyecto usuario 2                                |
| Pendiente | Comprobar separación entre proyectos de user-1 y user-2 |

### Endpoints a probar

```http
POST /auth/register
POST /auth/login
POST /projects
GET /projects
GET /projects/:id
DELETE /projects/:id
```

---

## 15. Casos de uso de proyectos

### 15.1. `CreateProjectUseCase`

Su responsabilidad es crear un proyecto asociado a un usuario autenticado.

Se empieza creando primero el test. El test falla porque todavía no están creados los imports necesarios.

Después se crea en `domain`:

- La entidad `Project`.
- El repositorio `ProjectRepository`.

Luego se crea en `application`:

- `CreateProjectUseCase`.

Al ejecutar los tests, estos pasan.

### 15.2. `ListUserProjectsUseCase`

Este caso de uso responde a la petición:

```text
Dame todos los proyectos de este usuario.
```

Ejemplo:

```ts
await listUserProjectsUseCase.execute({
  ownerId: "user-1",
});
```

Debe devolver solo los proyectos cuyo `ownerId` sea `user-1`.

La regla importante es:

- Un usuario solo puede listar sus propios proyectos.

Es decir, si existen proyectos de `user-1` y de `user-2`, cuando liste `user-1` no deben aparecer los de `user-2`.

Se genera primero el test siguiendo TDD. El test falla porque el caso de uso todavía no existe. Después se crea `ListUserProjectsUseCase` y los tests pasan.

### 15.3. `GetProjectByIdUseCase`

Este caso de uso sirve para obtener un proyecto concreto.

Responde a esta petición:

```text
Dame este proyecto concreto, pero solo si es mío.
```

Ejemplo:

```ts
await getProjectByIdUseCase.execute({
  projectId: "project-1",
  ownerId: "user-1",
});
```

Si se pidiera un proyecto solo por id, podría existir el riesgo de que un usuario recuperase un proyecto de otra persona. Por eso se busca usando `projectId` y `ownerId`.

Se crea primero el test unitario. El test falla porque el caso de uso todavía no existe. Después se crea el caso de uso y los tests pasan.

También se crea el error:

```text
ProjectNotFoundError
```

Si el proyecto no existe, se lanza este error para que después el middleware pueda convertirlo en una respuesta HTTP.

### 15.4. `DeleteProjectUseCase`

Este caso de uso sirve para borrar un proyecto concreto, pero solo si pertenece al usuario autenticado.

Si el proyecto no existe o no es del usuario, se lanza:

```text
ProjectNotFoundError
```

Recibe esta información:

```ts
{
  projectId: "project-1",
  ownerId: "user-1"
}
```

Y debe hacer:

1. Buscar el proyecto por `projectId` y `ownerId`.
2. Si no existe, lanzar `ProjectNotFoundError`.
3. Si existe, borrarlo.

Primero se crea el test unitario, que falla porque todavía no está implementado. Después se implementa el caso de uso y los tests pasan.

### 15.5. Repositorio en memoria y container

Se crea una implementación real en infraestructura del repositorio. De momento será en memoria.

Después se modifica el container. Antes había piezas sueltas; ahora se instancian los casos de uso y repositorios para tener todo conectado.

Con esto queda conectada la capa de aplicación de proyectos al container.

---

## 16. Implementación HTTP de proyectos

### 16.1. `POST /projects`

Este endpoint sirve para que un usuario autenticado cree un proyecto.

Ejemplo de petición:

```http
POST /projects
Authorization: Bearer TOKEN
Content-Type: application/json
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
  "id": "algo",
  "ownerId": "user-id-del-token",
  "name": "DevMind API",
  "description": "Backend con IA para consultar proyectos software",
  "createdAt": "fecha"
}
```

Status esperado:

```http
201 Created
```

El cliente no debe mandar `ownerId`.

Ejemplo incorrecto:

```json
{
  "ownerId": "user-1",
  "name": "DevMind API"
}
```

Ejemplo correcto:

```json
{
  "name": "DevMind API",
  "description": "Backend con IA para consultar proyectos software"
}
```

El motivo es que `ownerId` debe salir del token JWT:

```text
authMiddleware lee el token
authMiddleware obtiene el userId
controller usa ese userId como ownerId
```

Así se evita que un usuario pueda crear proyectos a nombre de otro.

Se empieza creando un test inicial de integración del endpoint. El test falla y después se implementa lo necesario.

Para hacerlo pasar se implementa:

- `ProjectController`.
- `ProjectRoutes`.
- `ProjectSchema`.

### 16.2. `GET /projects`

Este endpoint usa:

```text
ListUserProjectsUseCase
```

Sirve para listar solo los proyectos del usuario autenticado.

Ejemplo de petición:

```http
GET /projects
Authorization: Bearer ACCESS_TOKEN
```

Ejemplo de respuesta:

```json
[
  {
    "id": "project-1",
    "ownerId": "user-1",
    "name": "DevMind API",
    "description": "Backend con IA",
    "createdAt": "..."
  }
]
```

La regla importante es que un usuario solo debe ver sus propios proyectos.

Se construye el test de integración en el mismo fichero usado para el endpoint anterior. Después se actualiza el controller de proyectos con un método `list` y se añade la ruta en el router.

Cuando se ejecutan los tests, estos pasan.

### 16.3. `GET /projects/:id`

Este endpoint sirve para obtener un proyecto concreto del usuario autenticado.

Usa:

```text
GetProjectByIdUseCase
```

Ejemplo de petición:

```http
GET /projects/project-id
Authorization: Bearer ACCESS_TOKEN
```

Debe devolver ese proyecto solo si pertenece al usuario autenticado.

Se crea primero el test de integración para este endpoint.

### 16.4. `DELETE /projects/:id`

Este endpoint sirve para borrar un proyecto concreto, pero solo si pertenece al usuario autenticado.

Usa:

```text
DeleteProjectUseCase
```

Ejemplo de petición:

```http
DELETE /projects/:id
Authorization: Bearer ACCESS_TOKEN
```

Comportamiento esperado:

| Caso                           | Respuesta          |
| ------------------------------ | ------------------ |
| El proyecto existe y es mío    | `204 No Content`   |
| No hay token                   | `401 Unauthorized` |
| El proyecto no existe          | `404 Not Found`    |
| El proyecto es de otro usuario | `404 Not Found`    |

Se devuelve `404` cuando el proyecto es de otro usuario para no revelar que ese proyecto existe.

Se empieza creando el test de integración para que falle. Después se implementa el endpoint.

---

## 17. Cierre de la Fase 2

En la Fase 2 se ha añadido a DevMind la parte de proyectos.

La regla clave de seguridad ha sido:

```text
Un usuario no puede ver ni borrar proyectos de otro usuario.
```

Para conseguirlo, no se buscan proyectos solo por su id.

En vez de hacer:

```text
Busca este proyecto por id.
```

Se hace:

```text
Busca este proyecto por id y además comprueba que pertenece a este usuario.
```

### Arquitectura usada en Fase 2

Se mantiene la misma estructura limpia del proyecto:

```text
domain
  -> definición de Project y ProjectRepository

application
  -> casos de uso:
     CreateProjectUseCase
     ListUserProjectsUseCase
     GetProjectByIdUseCase
     DeleteProjectUseCase

infrastructure
  -> InMemoryProjectRepository

transport
  -> rutas, controller y schema HTTP de projects

container
  -> conexión de los casos de uso con el repositorio real temporal
```

---

# Fase 3. ProjectFiles básicos

## 18. Objetivo de la fase

Hasta ahora DevMind tiene esta estructura:

```text
User
└── Project
```

Es decir:

- Un usuario puede tener proyectos.
- Pero esos proyectos todavía están vacíos.
- Todavía no tienen archivos de código dentro.

La Fase 3 añade esta parte:

```text
User
└── Project
    └── ProjectFile
```

Es decir:

- Un proyecto puede tener varios archivos.

Esta fase se divide en partes pequeñas.

---

## 19. Fase 3.1. Base interna de `ProjectFiles`

Primero se crea la lógica interna, sin HTTP todavía.

En esta parte se crea:

- `ProjectFile` entity.
- `ProjectFileRepository`.
- `CreateProjectFileUseCase`.
- `InMemoryProjectFileRepository`.

La primera funcionalidad será crear un archivo dentro de un proyecto.

Para terminar esta parte se construyen las implementaciones de infraestructura de los puertos de aplicación.

### 19.1. Regla de seguridad de Fase 3

La regla de seguridad sigue siendo igual de importante que en Fase 2:

```text
Un usuario no puede añadir, ver ni borrar archivos de un proyecto que no es suyo.
```

Por eso, antes de crear un archivo, el caso de uso debe comprobar:

```text
¿El proyecto existe?
¿Y pertenece al usuario autenticado?
```

Para ello se usa de nuevo:

```ts
projectRepository.findByIdAndOwnerId(projectId, ownerId);
```

Si no existe o no pertenece al usuario:

```ts
throw new ProjectNotFoundError();
```

Así se evita que alguien pueda meter archivos en proyectos ajenos.

---

## 20. Casos de uso internos de `ProjectFiles`

### 20.1. `CreateProjectFileUseCase`

Se empieza siguiendo TDD, creando el test unitario del caso de uso para crear un archivo.

Este test es básico y prueba el flujo del caso de uso. Al principio falla porque todavía no hay nada creado.

Después se crea:

- La entidad `ProjectFile`.
- La interfaz de repositorio `ProjectFileRepository`.

También se crea un puerto:

```text
FileHashGeneratorPort
```

Se necesita porque la app debe tener una forma de hashear el código. De momento no hace falta saber cómo se hace; con la interfaz es suficiente.

Después se ejecutan los tests. Cuando pasan, queda cerrado el ciclo base de TDD.

A partir de ahí se pueden añadir tests para implementar funcionalidades de seguridad.

Después se implementan los adaptadores en infraestructura del repositorio y del hasheador.

Finalmente se modifica el container para que también instancie estas piezas.

### 20.2. `ListProjectFilesUseCase`

Su responsabilidad es listar los archivos de un proyecto, pero solo si ese proyecto pertenece al usuario autenticado.

Flujo:

```text
ownerId + projectId
        ↓
comprobar que el proyecto pertenece al usuario
        ↓
devolver los ProjectFile de ese proyecto
```

Se empieza creando el test unitario. El test falla porque todavía no hay nada creado.

Después se modifica el puerto `ProjectFileRepository` y el adaptador `InMemoryProjectFileRepository`, añadiendo el método:

```text
findByProjectId
```

Este método permite buscar y listar archivos.

Después se crea el caso de uso:

```text
ListProjectFilesUseCase
```

También se modifica el test anterior de creación, porque el fake del repositorio de archivos solo implementaba un método del repositorio.

### 20.3. `GetProjectFileByIdUseCase`

Su responsabilidad es obtener un archivo concreto de un proyecto del usuario autenticado.

Flujo:

```text
ownerId + projectId + fileId
        ↓
comprobar que el proyecto pertenece al usuario
        ↓
buscar el archivo dentro de ese proyecto
        ↓
devolverlo
```

Se crea primero su test unitario. El test no pasa porque el caso de uso y el nuevo tipo de error todavía no existen.

Se crea el error:

```text
ProjectFileNotFoundError
```

Después se actualiza tanto la interfaz del repositorio de archivos como la implementación.

Finalmente se crea el caso de uso.

### 20.4. `DeleteProjectFileUseCase`

Su responsabilidad es borrar un archivo concreto de un proyecto del usuario autenticado.

La seguridad es la misma:

1. Comprobar que el proyecto pertenece al usuario.
2. Comprobar que el archivo existe dentro de ese proyecto.
3. Borrar el archivo.

Se crea primero el test unitario.

Después se actualiza la interfaz del repositorio de archivos y su implementación.

Finalmente se crea el caso de uso.

### 20.5. Cierre de la capa interna de `ProjectFiles`

Con esto queda cerrada la capa interna de `ProjectFiles`:

| Estado     | Elemento                                 |
| ---------- | ---------------------------------------- |
| Completado | `CreateProjectFileUseCase`               |
| Completado | `ListProjectFilesUseCase`                |
| Completado | `GetProjectFileByIdUseCase`              |
| Completado | `DeleteProjectFileUseCase`               |
| Completado | `ProjectFileRepository` completo         |
| Completado | `InMemoryProjectFileRepository` completo |
| Completado | Container actualizado                    |
| Completado | Tests unitarios pasando                  |

Después de esto se pasa a la parte HTTP, porque ya están preparados todos los casos de uso.

---

## 21. Fase 3.2. Endpoints HTTP para `ProjectFiles`

En esta parte se añaden endpoints para trabajar con archivos dentro de proyectos.

Endpoints previstos:

```http
POST   /projects/:projectId/files
GET    /projects/:projectId/files
GET    /projects/:projectId/files/:fileId
DELETE /projects/:projectId/files/:fileId
```

Al principio el archivo se envía como JSON, no como ZIP.

Ejemplo:

```json
{
  "path": "src/app.ts",
  "language": "typescript",
  "content": "console.log('hello');"
}
```

Esto permite probar la lógica sin mezclar todavía subida de archivos reales.

La estrategia sigue siendo TDD pragmático:

1. Primero se crea el test de integración HTTP.
2. El test falla porque todavía no existe el endpoint.
3. Se crean schema, controller y routes.
4. Se conecta la ruta en `app.ts`.
5. El test pasa.

En esta fase todo es más simple. Incluso algunos datos que se pasan a los endpoints están hardcodeados y más adelante será la aplicación la que los saque y los pase al endpoint.

---

## 22. Endpoints HTTP de `ProjectFiles`

### 22.1. `POST /projects/:projectId/files`

Este endpoint crea un archivo dentro del proyecto con id `projectId`.

El cliente manda el body:

```json
{
  "path": "src/app.ts",
  "language": "typescript",
  "content": "console.log('hello');"
}
```

El cliente no manda ni `ownerId` ni `projectId` en el body.

El sistema los saca de aquí:

```text
ownerId   -> req.user.userId, gracias al authMiddleware
projectId -> req.params.projectId
```

Esto mantiene la misma idea que en proyectos: el cliente no decide quién es el dueño.

Se crea primero el test para este endpoint, que falla.

Después se implementa para que el test pase.

El endpoint debe hacer:

1. Comprobar que el usuario está autenticado.
2. Validar el body con Zod.
3. Sacar `ownerId` desde `req.user.userId`.
4. Sacar `projectId` desde `req.params.projectId`.
5. Llamar a `createProjectFileUseCase`.
6. Devolver `201` con el `ProjectFile` creado.

Primero se crea el schema para que `validateBody` pueda validar lo que se recibe.

Después se crea el controller para `ProjectFile`.

Por último se crean las rutas para conectar el endpoint con los middlewares y el controller.

### 22.2. `GET /projects/:projectId/files`

Este endpoint lista los archivos de un proyecto.

Se crea primero el test para este endpoint, que falla.

Después se implementa para que el test pase:

- Se añade el método `list` dentro del controller de archivos.
- Se añade al router la ruta `GET` para listar archivos.

Después los tests pasan.

También se añaden tests para comprobar casos de errores y seguridad.

Casos cubiertos:

| Estado     | Caso                            |
| ---------- | ------------------------------- |
| Completado | Con token válido -> 200         |
| Completado | Sin token -> 401                |
| Completado | Proyecto inexistente -> 404     |
| Completado | Proyecto de otro usuario -> 404 |

### 22.3. `GET /projects/:projectId/files/:fileId`

Este endpoint sirve para obtener un archivo concreto dentro de un proyecto.

Se crea primero el test para este endpoint, que falla.

Después se implementa para que el test pase:

- Se añade el método `getById` al controller.
- Se añade la ruta en el router para este endpoint.

Cuando los tests pasan, se añaden nuevos tests para asegurar errores y seguridad.

Casos cubiertos:

| Estado     | Caso                            |
| ---------- | ------------------------------- |
| Completado | Con token válido -> 200         |
| Completado | Sin token -> 401                |
| Completado | Proyecto inexistente -> 404     |
| Completado | Archivo inexistente -> 404      |
| Completado | Proyecto de otro usuario -> 404 |

### 22.4. `DELETE /projects/:projectId/files/:fileId`

Este endpoint usa:

```text
DeleteProjectFileUseCase
```

Debe devolver:

```http
204 No Content
```

Igual que se hizo con `DELETE /projects/:id`.

Se crea primero el test para este endpoint, que falla.

Después se implementa para que el test pase:

- Se añade el método correspondiente al controller.
- Se añade la ruta en el router para este endpoint.

Después de que los tests pasen, se añaden nuevos tests para asegurar errores y seguridad.

---

## 23. Cierre de la Fase 3

Se da por cerrada la Fase 3, correspondiente a `ProjectFiles` básicos.

Ahora mismo está implementada esta estructura:

```text
User
└── Project
    └── ProjectFile
```

DevMind ya puede:

| Estado     | Funcionalidad                                            |
| ---------- | -------------------------------------------------------- |
| Completado | Crear archivos dentro de un proyecto                     |
| Completado | Listar archivos de un proyecto                           |
| Completado | Obtener un archivo concreto                              |
| Completado | Borrar un archivo concreto                               |
| Completado | Validar que el proyecto pertenece al usuario autenticado |
| Completado | Evitar acceso a proyectos de otros usuarios              |
| Completado | Calcular size                                            |
| Completado | Calcular hash                                            |
| Completado | Guardar `ProjectFiles` en memoria                        |

Endpoints cubiertos:

```http
POST   /projects/:projectId/files
GET    /projects/:projectId/files
GET    /projects/:projectId/files/:fileId
DELETE /projects/:projectId/files/:fileId
```

Casos cubiertos:

| Estado     | Caso                         |
| ---------- | ---------------------------- |
| Completado | 200 / 201 / 204 correctos    |
| Completado | 400 body inválido            |
| Completado | 401 sin token                |
| Completado | 404 proyecto inexistente     |
| Completado | 404 proyecto de otro usuario |
| Completado | 404 archivo inexistente      |

---

# Fase 4. PostgreSQL

## 24. Objetivo de la fase

El objetivo de la Fase 4 es cambiar los repositorios en memoria por repositorios reales en PostgreSQL.

Hasta ahora el proyecto usa esta estructura:

```text
UseCase
  ↓
Repository interface
  ↓
InMemoryRepository
```

El objetivo es llegar a esta estructura:

```text
UseCase
  ↓
Repository interface
  ↓
PostgresRepository
```

Lo bueno es que los casos de uso no deberían cambiar casi nada, porque ya están programados contra interfaces. Esta era una de las ventajas de la arquitectura limpia/hexagonal usada en DevMind.

---

## 25. Levantar PostgreSQL

Primero solo se levanta la base de datos. Todavía no se tocan repositorios ni casos de uso.

En la raíz del proyecto se crea:

```text
docker-compose.yml
```

También se añade y modifica el `.env` con:

```text
DATABASE_URL
```

Después se levanta Docker Compose para comprobar que se carga el servidor.

---

## 26. Conexión de Node/Express con PostgreSQL

Una vez verificado lo anterior, se conecta Node/Express con el servidor PostgreSQL.

Se instalan:

```text
pg
```

Y sus tipos.

Después se crea la pool de conexión dentro de infraestructura:

```text
src/infrastructure/database/postgresPool.ts
```

Se crea un script para probar la conexión. Si da buen resultado, significa que la API ya sabe conectarse con el servidor PostgreSQL levantado en el contenedor.

La situación queda así:

```text
DevMind API
  ↓
postgresPool
  ↓
PostgreSQL en Docker
```

---

## 27. Migraciones y tablas

El siguiente paso es crear las tablas en la base de datos para:

- Usuarios.
- Proyectos.
- Archivos.

Es decir, generar migraciones.

Se crea la carpeta:

```text
src/infrastructure/database/migrations
```

Dentro se añaden archivos SQL como:

```text
001_create_users.sql
002_create_projects.sql
003_create_project_files.sql
```

Estos archivos contienen las instrucciones para crear las tablas.

En las instrucciones se usa:

```text
ON DELETE CASCADE
```

Se usa por estos motivos:

- Si se borra un usuario, se borran sus proyectos.
- Si se borra un proyecto, se borran automáticamente sus archivos.

Esto evita que existan archivos huérfanos si se borra un proyecto.

Después de crear las instrucciones, se genera un script para ejecutar las migraciones.

Al ejecutar el script, se comprueba en TablePlus, conectándose al Docker, que ha funcionado.

En PostgreSQL queda creada esta estructura:

```text
devmind_db
├── users
├── projects
└── project_files
```

Esto significa que ya no hay solo una base de datos vacía. Ahora existe la estructura real donde irán los datos.

En este punto las tablas existen, pero todavía pueden estar vacías.

---

## 28. Repositorios pendientes en PostgreSQL

Después de crear las tablas, falta la parte realmente importante:

| Estado    | Tarea                                      |
| --------- | ------------------------------------------ |
| Pendiente | Crear `PostgresUserRepository`             |
| Pendiente | Crear `PostgresProjectRepository`          |
| Pendiente | Crear `PostgresProjectFileRepository`      |
| Pendiente | Cambiar el container para usar PostgreSQL  |
| Pendiente | Probar que los datos aparecen en TablePlus |

El orden correcto es:

1. Crear `PostgresUserRepository`.
2. Cambiar el container para usarlo.
3. Probar register, login y `/auth/me`.
4. Ver usuarios en TablePlus.
5. Crear `PostgresProjectRepository`.
6. Crear `PostgresProjectFileRepository`.

---

## 29. Implementación de repositorios PostgreSQL

### 29.1. `PostgresUserRepository`

Se genera el repositorio de PostgreSQL para usuarios.

Después se genera un script para probarlo. Si funciona, se puede cambiar el container.

Se modifica el container para que la API use el repositorio de PostgreSQL para los usuarios. Para ello se modifican imports y conexiones del container.

Con esto se migra `users` a PostgreSQL.

La situación queda así:

```text
users         -> PostgreSQL
projects      -> memoria todavía
project_files -> memoria todavía
```

### 29.2. `PostgresProjectRepository`

Después se hace lo mismo con los proyectos.

Se cambia:

```text
InMemoryProjectRepository
        ↓
PostgresProjectRepository
```

Se crea el repositorio de PostgreSQL dentro de infraestructura.

Después se crea un script para probarlo. Como `projects.owner_id` referencia a `users.id`, primero se necesita crear un usuario real en PostgreSQL.

El script funciona como se esperaba. Después se conecta el repositorio al container y se comprueba que funciona.

### 29.3. Ajuste de tests con base de datos real

Al continuar, aparece un problema: al ejecutar los tests, además de que no pasan todos, se crean muchos usuarios, proyectos y demás datos.

Antes los tests usaban memoria, y esa memoria se borraba entre ejecución y ejecución. Ahora, al usar PostgreSQL, los datos persisten.

Para solucionar esto se decide usar dos bases de datos:

```text
devmind_db
```

Para uso manual con la API, frontend, TablePlus, curl, etc.

Y otra:

```text
devmind_test_db
```

Solo para tests automáticos.

Cada vez que se ejecutan los tests:

1. Se usa `devmind_test_db`.
2. Se crean las tablas si no existen.
3. Se limpian `users`, `projects` y `project_files` antes de empezar.
4. Se ejecutan los tests.
5. Se vuelven a limpiar las tablas al terminar.

El primer paso es crear la base de datos de tests dentro del contenedor.

Después se ejecutan las migraciones para crear las tablas, igual que se hizo con la otra base de datos.

Luego se crea un fichero global de test que hace lo siguiente:

1. Comprueba que `DATABASE_URL` apunta a `devmind_test_db`.
2. Ejecuta las migraciones por si faltara alguna tabla.
3. Limpia `users`, `projects` y `project_files`.
4. Ejecuta los tests.
5. Cuando terminan los tests, vuelve a limpiar las tablas.

Después se crea:

```text
vitest.config.ts
```

para conectar `globalSetup.ts`.

También se modifican los scripts del `package.json` para que los tests usen siempre la base de datos de tests:

```json
{
  "test": "DATABASE_URL=postgresql://devmind:devmind_password@localhost:5432/devmind_test_db vitest run",
  "test:watch": "DATABASE_URL=postgresql://devmind:devmind_password@localhost:5432/devmind_test_db vitest"
}
```

Con esto el error queda solucionado y se puede continuar.

### 29.4. `PostgresProjectFileRepository`

Se crea el archivo:

```text
postgresProjectFileRepository.ts
```

Este repositorio hace lo mismo que el repositorio en memoria, pero usando PostgreSQL.

Antes:

```text
InMemoryProjectFileRepository
↓
guardaba en un array []
```

Ahora:

```text
PostgresProjectFileRepository
↓
guarda en la tabla project_files
```

Se crea un script pequeño para probar el repositorio. Cuando funciona, se pone en el container.

Después se modifica el container para usarlo.

---

## 30. Cierre de la Fase 4

La Fase 4 queda terminada con la implementación de persistencia en PostgreSQL.

En esta parte no se ha usado TDD puro. Se han realizado scripts de verificación manual para comprobar si las conexiones, creaciones y demás operaciones estaban funcionando correctamente.

Durante la migración a PostgreSQL se realizaron scripts de verificación manual para validar rápidamente la conexión y el comportamiento de los nuevos repositorios. Posteriormente, estas verificaciones se consolidaron como tests de integración automatizados ejecutables mediante:

```bash
npm test
```

Conversión de scripts manuales a tests de integración:

| Script inicial                             | Test de integración                     |
| ------------------------------------------ | --------------------------------------- |
| `test-db-connection.ts`                    | `postgresConnection.test.ts`            |
| `test-postgres-project-file-repository.ts` | `postgresProjectFileRepository.test.ts` |
| `test-postgres-project-repository.ts`      | `postgresProjectRepository.test.ts`     |
| `test-postgres-user-repository.ts`         | `postgresUserRepository.test.ts`        |

---

# 31. Estado final documentado hasta ahora

Hasta este punto, la documentación recoge el desarrollo de DevMind desde el setup inicial hasta la persistencia en PostgreSQL.

El proyecto ha avanzado por estas fases:

| Fase   | Estado documentado                       |
| ------ | ---------------------------------------- |
| Fase 0 | Setup inicial creado                     |
| Fase 1 | Autenticación implementada               |
| Fase 2 | Proyectos de usuario implementados       |
| Fase 3 | ProjectFiles básicos implementados       |
| Fase 4 | Persistencia con PostgreSQL implementada |

El sistema queda preparado para continuar con las siguientes fases del roadmap:

- Subida de ZIP.
- Resubida o actualización de proyecto.
- Chunks.
- Embeddings y búsqueda semántica.
- IA/RAG.
- Historial.
- Funciones inteligentes.
- Modo invitado.
- Onboarding visual o presentación final.

## Resumen final de las fases realizadas

Durante el desarrollo de DevMind API se ha construido progresivamente una API backend profesional siguiendo una estructura limpia y organizada. El objetivo principal del proyecto ha sido crear una herramienta que permita a usuarios autenticados crear proyectos software, guardar sus archivos y, más adelante, poder consultar ese código mediante inteligencia artificial.

La idea central de DevMind es convertir un proyecto software en una fuente de conocimiento consultable mediante lenguaje natural. Para llegar a esa idea, el proyecto se ha dividido en fases pequeñas, cada una centrada en una parte concreta del sistema.

### Fase 0 — Setup inicial del proyecto

En esta fase se preparó la base técnica del proyecto.

Se inicializó el proyecto con Node.js, TypeScript y Express. También se instalaron las herramientas necesarias para trabajar con tests, principalmente Vitest y Supertest. Además, se creó la estructura inicial de carpetas siguiendo una arquitectura limpia, separando responsabilidades entre dominio, aplicación, infraestructura, transporte y tests.

También se configuraron archivos importantes como `tsconfig.json`, `.env.example`, `.gitignore` y el `README` inicial. Como primera comprobación, se creó el endpoint `/health`, que sirvió para validar que la API estaba funcionando correctamente.

Esta fase dejó preparado el entorno para poder construir el resto del proyecto de forma ordenada y aplicando TDD desde el principio.

### Fase 1 — Autenticación de usuarios

En esta fase se implementó todo el sistema de autenticación.

Primero se creó la parte interna de la autenticación a nivel de dominio y aplicación. Se definió la entidad `User`, el repositorio `UserRepository` y los puertos necesarios para generar IDs, hashear contraseñas y generar tokens. Después se construyeron los casos de uso principales:

- Registrar usuario.
- Iniciar sesión.
- Obtener el usuario actual.

Todo esto se hizo siguiendo TDD, creando primero los tests unitarios y después la implementación necesaria para que esos tests pasaran.

También se añadieron errores propios del dominio de la aplicación, como errores para email duplicado, credenciales inválidas, usuario no encontrado y acceso no autorizado. Esto permitió preparar el proyecto para tener un middleware global de errores más limpio y controlado.

Después se implementó la infraestructura real de autenticación usando `bcryptjs` para hashear y comparar contraseñas, `jsonwebtoken` para crear y verificar JWT, y `crypto.randomUUID` para generar identificadores reales.

Finalmente, se conectó la autenticación con HTTP mediante los endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

Para ello se crearon controladores, rutas, middlewares de autenticación, validación con Zod, manejo de errores asíncronos y middleware global de errores.

Al terminar esta fase, DevMind ya permitía registrar usuarios, iniciar sesión, generar tokens JWT y proteger rutas privadas.

### Fase 2 — Proyectos persistentes por usuario

En esta fase se añadió la funcionalidad de proyectos.

Hasta este punto, DevMind ya podía identificar usuarios mediante autenticación. En esta fase se hizo que cada usuario pudiera crear y gestionar sus propios proyectos.

Se creó la entidad `Project`, el repositorio `ProjectRepository` y los casos de uso necesarios para trabajar con proyectos:

- Crear un proyecto.
- Listar los proyectos de un usuario.
- Obtener un proyecto concreto.
- Borrar un proyecto.

La regla principal de esta fase fue que un usuario solo puede acceder a sus propios proyectos. Para conseguirlo, no se buscaban proyectos únicamente por su identificador, sino por el identificador del proyecto y el identificador del usuario propietario.

Esto permitió evitar que un usuario pudiera ver o borrar proyectos de otro usuario. En esos casos, la API respondía con un error 404 para no revelar si el proyecto existía o no.

Después se conectó esta funcionalidad con HTTP mediante los endpoints:

- `POST /projects`
- `GET /projects`
- `GET /projects/:id`
- `DELETE /projects/:id`

También se añadieron tests de integración para comprobar casos correctos y casos de error, como peticiones sin token, body inválido, proyectos inexistentes o intentos de acceder a proyectos de otro usuario.

Al terminar esta fase, DevMind ya permitía que cada usuario autenticado tuviera sus propios proyectos, separados de los proyectos de otros usuarios.

### Fase 3 — Archivos dentro de proyectos

En esta fase se añadió la relación entre proyectos y archivos.

Hasta este momento, la estructura era:

User
→ Project

Pero los proyectos todavía estaban vacíos. En esta fase se añadió:

User
→ Project
→ ProjectFile

Es decir, cada proyecto podía tener varios archivos asociados.

Primero se construyó la lógica interna de `ProjectFiles`. Se creó la entidad `ProjectFile`, el repositorio `ProjectFileRepository`, el puerto para generar hashes de archivos y los casos de uso principales:

- Crear un archivo dentro de un proyecto.
- Listar los archivos de un proyecto.
- Obtener un archivo concreto.
- Borrar un archivo.

También se creó una implementación en memoria del repositorio de archivos y se actualizó el contenedor de dependencias para conectar esta nueva parte del sistema.

La regla de seguridad siguió siendo la misma que en la fase anterior: un usuario solo puede añadir, ver o borrar archivos de proyectos que sean suyos. Por eso, antes de trabajar con cualquier archivo, el sistema comprueba que el proyecto existe y pertenece al usuario autenticado.

Después se construyó la parte HTTP de los archivos mediante estos endpoints:

- `POST /projects/:projectId/files`
- `GET /projects/:projectId/files`
- `GET /projects/:projectId/files/:fileId`
- `DELETE /projects/:projectId/files/:fileId`

En esta fase, los archivos todavía se enviaban como JSON, no como ZIP. Esto permitió probar la lógica de archivos sin mezclar todavía la subida real de carpetas o archivos comprimidos.

También se añadieron validaciones con Zod, controladores, rutas y tests de integración para comprobar respuestas correctas y errores como body inválido, falta de token, proyecto inexistente, proyecto de otro usuario o archivo inexistente.

Al terminar esta fase, DevMind ya permitía crear, listar, consultar y borrar archivos dentro de proyectos, manteniendo siempre la seguridad por usuario.

### Fase 4 — Persistencia con PostgreSQL

En esta fase se sustituyeron los repositorios en memoria por repositorios reales en PostgreSQL.

Hasta este punto, la aplicación usaba repositorios en memoria. Eso permitía avanzar rápido, pero los datos se perdían al reiniciar la aplicación. En esta fase se pasó a una base de datos real.

Primero se creó un `docker-compose.yml` para levantar PostgreSQL en un contenedor. Después se añadió la variable `DATABASE_URL` al entorno y se creó una pool de conexión desde Node.js hacia PostgreSQL.

Una vez comprobada la conexión, se crearon las migraciones SQL para generar las tablas principales:

- `users`
- `projects`
- `project_files`

También se usó `ON DELETE CASCADE` para que, si se borra un usuario, se borren sus proyectos, y si se borra un proyecto, se borren automáticamente sus archivos. Esto evita que queden archivos huérfanos.

Después se fueron creando los repositorios reales en PostgreSQL:

- `PostgresUserRepository`
- `PostgresProjectRepository`
- `PostgresProjectFileRepository`

Cada uno sustituyó progresivamente a su versión en memoria dentro del contenedor de dependencias.

Durante esta fase también apareció un problema importante con los tests: al usar PostgreSQL, los datos ya no desaparecían automáticamente entre ejecuciones como ocurría con la memoria. Para solucionarlo, se creó una base de datos separada para tests llamada `devmind_test_db`.

Se configuró un setup global de tests para:

- Comprobar que se usa la base de datos de test.
- Ejecutar migraciones.
- Limpiar tablas antes de los tests.
- Ejecutar los tests.
- Volver a limpiar las tablas al terminar.

Además, las verificaciones manuales que se habían hecho mediante scripts se consolidaron después como tests de integración automatizados.

Al terminar esta fase, DevMind dejó de depender de memoria y empezó a guardar usuarios, proyectos y archivos en PostgreSQL de forma real.

### Estado final alcanzado

Al finalizar estas fases, DevMind API ya tiene una base sólida y funcional.

El sistema permite:

- Registrar usuarios.
- Iniciar sesión.
- Generar y verificar tokens JWT.
- Consultar el usuario autenticado.
- Crear proyectos asociados a un usuario.
- Listar proyectos propios.
- Obtener un proyecto concreto.
- Borrar proyectos propios.
- Crear archivos dentro de proyectos.
- Listar archivos de un proyecto.
- Obtener un archivo concreto.
- Borrar archivos.
- Validar datos de entrada.
- Proteger rutas privadas.
- Controlar errores de forma centralizada.
- Evitar acceso a datos de otros usuarios.
- Guardar la información en PostgreSQL.
- Ejecutar tests unitarios e integración.

En resumen, en estas fases se ha pasado de tener un proyecto vacío a tener una API backend estructurada, testeada, autenticada, conectada a base de datos y preparada para continuar con las siguientes fases: subida de ZIP, actualización de proyectos, generación de chunks, embeddings, búsqueda semántica e integración con IA/RAG.

## Fase 5 — Subida de ZIP

### Objetivo de la fase

En esta fase se ha añadido a DevMind la posibilidad de subir un proyecto completo comprimido en formato ZIP.

Hasta ahora, DevMind permitía crear archivos de proyecto manualmente mediante el endpoint:

```txt
POST /projects/:projectId/files
```

Sin embargo, el objetivo de esta fase era permitir una subida automática de un proyecto comprimido mediante un nuevo endpoint:

```txt
POST /projects/:projectId/upload
```

La idea general de esta funcionalidad es la siguiente:

```txt
Usuario autenticado
↓
Sube un ZIP de un proyecto
↓
DevMind comprueba que el proyecto pertenece a ese usuario
↓
Extrae los archivos del ZIP
↓
Ignora carpetas inútiles como node_modules, .git, dist...
↓
Convierte cada archivo válido en ProjectFile
↓
Guarda todos los ProjectFile en PostgreSQL
```

Con esta fase, DevMind deja de depender únicamente de la creación manual de archivos y empieza a acercarse más al comportamiento real esperado: recibir un proyecto completo y transformarlo en archivos internos consultables.

---

### Decisión de diseño principal

Una decisión importante de esta fase ha sido no meter toda la lógica del ZIP directamente dentro del controller.

La opción incorrecta habría sido hacer que el controller se encargara de todo:

```txt
controller
↓
recibe ZIP
↓
extrae ZIP
↓
filtra archivos
↓
calcula hash
↓
guarda en base de datos
```

Esto habría ensuciado demasiado la capa HTTP, porque el controller acabaría mezclando demasiadas responsabilidades.

La solución elegida ha sido crear un caso de uso específico:

```txt
UploadProjectZipUseCase
```

Este caso de uso es el encargado de coordinar toda la operación.

La estructura planteada ha sido:

```txt
HTTP / Express
↓
UploadProjectZipUseCase
↓
ProjectRepository
ProjectFileRepository
ZipExtractor
IdGenerator
```

De esta forma, la capa HTTP solo recibe la petición y delega la lógica importante en la capa de aplicación.

---

### Endpoint de subida

El endpoint creado para esta funcionalidad es:

```txt
POST /projects/:projectId/upload
```

Este endpoint utiliza `multipart/form-data`, ya que el usuario no envía un JSON normal, sino un archivo ZIP.

El campo del archivo se llama:

```txt
file
```

Un ejemplo conceptual de uso sería:

```txt
curl -X POST http://localhost:3000/projects/PROJECT_ID/upload \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -F "file=@mi-proyecto.zip"
```

Una posible respuesta sería:

```json
{
  "projectId": "project-1",
  "filesCreated": 3,
  "files": [
    {
      "id": "file-1",
      "projectId": "project-1",
      "path": "src/index.ts",
      "language": "typescript",
      "size": 120,
      "hash": "..."
    }
  ]
}
```

De momento no se devuelve el contenido completo de cada archivo en la respuesta, porque si el ZIP contiene muchos archivos, la respuesta podría ser demasiado grande.

---

### Puerto ZipExtractor

Para no acoplar el caso de uso a una librería concreta de extracción de ZIP, se ha creado un nuevo puerto de aplicación:

```txt
ZipExtractor
```

La idea es que el caso de uso no tenga que saber cómo se extrae internamente un ZIP. Solo necesita depender de una interfaz que le permita obtener los archivos extraídos.

La relación queda así:

```txt
UploadProjectZipUseCase
↓ usa
ZipExtractor
```

Esto mantiene la separación entre la lógica de aplicación y los detalles concretos de infraestructura.

---

### Orden de trabajo seguido

El desarrollo de esta fase se ha planteado siguiendo TDD de forma progresiva.

El orden general ha sido:

```txt
1. Crear el test unitario del caso de uso.
2. Implementar UploadProjectZipUseCase.
3. Añadir tests unitarios para carpetas ignoradas como node_modules, .git, dist...
4. Crear test HTTP con Supertest para POST /projects/:projectId/upload.
5. Implementar el endpoint con multer.
6. Implementar el extractor real de ZIP.
7. Crear un test final de integración con ZIP real.
```

---

## 1. UploadProjectZipUseCase

El primer bloque de la fase ha sido la creación del caso de uso:

```txt
UploadProjectZipUseCase
```

Este caso de uso representa la lógica interna de la subida de un ZIP.

Su responsabilidad es:

```txt
recibir un ZIP
extraer muchos archivos
filtrar carpetas
detectar lenguaje
calcular size/hash
crear muchos ProjectFile
```

Como no pertenece exactamente al CRUD básico de usuarios, proyectos o archivos, se creó una nueva carpeta de tests unitarios específica para esta funcionalidad.

La carpeta creada fue:

```txt
tests/unit/application/uploadzip
```

Ahí se incluyó el test del caso de uso.

Al principio, el test fallaba porque todavía no existían ni el caso de uso ni el puerto necesario para extraer el ZIP.

Después se creó el puerto:

```txt
ZipExtractor
```

Y se implementó el caso de uso:

```txt
UploadProjectZipUseCase
```

---

### Prueba de seguridad: no extraer si el proyecto no pertenece al usuario

Después del primer test básico, se añadieron tests especializados para comprobar reglas importantes de seguridad.

Una de las comprobaciones fue que, si el proyecto no pertenece al usuario autenticado, el sistema no debe ni siquiera intentar extraer el ZIP.

Para comprobarlo, se modificó el fake del extractor de ZIP, añadiendo una forma de saber si había sido llamado o no.

Esto permitió validar la siguiente regla:

```txt
Si el proyecto no pertenece al usuario,
ni siquiera debería intentar extraer el ZIP.
```

El escenario probado fue:

```txt
Existe project-1,
pero pertenece a another-user.

El usuario user-1 intenta subir un ZIP a ese proyecto.
```

El resultado esperado era:

```txt
No se permite.
No se extrae el ZIP.
No se guarda ningún ProjectFile.
```

Aunque el proyecto exista realmente, para `user-1` debe comportarse como si no existiera.

Esto evita revelar información sensible.

No se quiere responder:

```txt
403 Forbidden: este proyecto existe pero no es tuyo
```

Porque eso confirmaría al usuario que ese `projectId` existe.

La respuesta correcta debe comportarse como:

```txt
404 Project not found
```

O, a nivel de caso de uso:

```txt
Project not found
```

Esta regla mantiene la misma lógica de seguridad que ya se había aplicado en fases anteriores.

---

### Filtrado de carpetas y archivos ignorados

Otra parte importante del caso de uso ha sido ignorar carpetas y archivos que no deben guardarse.

Por ejemplo:

```txt
node_modules
.git
dist
coverage
```

El test planteado decía:

```txt
Si el ZIP trae 6 archivos,
pero 5 están dentro de carpetas ignoradas,
entonces solo se debe guardar 1 ProjectFile real.
```

En ese caso, el único archivo válido era:

```txt
src/index.ts
```

Al principio, este test fallaba porque el caso de uso todavía no tenía una función encargada de filtrar las rutas.

Para solucionarlo, se añadió dentro del caso de uso una función de filtrado que descarta las carpetas que no se quieren guardar.

Después de aplicar ese filtrado, solo se convierten en `ProjectFile` los archivos válidos.

---

### Error cuando no hay archivos válidos

También se añadió una regla para controlar el caso en el que el ZIP no contiene ningún archivo útil.

Por ejemplo, podría ocurrir que el usuario subiera un ZIP que solo contuviera:

```txt
node_modules/
.git/
dist/
coverage/
```

O incluso un ZIP vacío.

En ese caso, no tendría sentido devolver una respuesta como esta:

```json
{
  "filesCreated": 0,
  "files": []
}
```

Esa respuesta parecería indicar que la subida ha ido bien, aunque realmente DevMind no habría importado nada útil.

Por eso se decidió que, si después de extraer y filtrar el ZIP no queda ningún archivo válido, el caso de uso debe lanzar un error:

```txt
No valid project files found
```

Más adelante, en la capa HTTP, ese error se convierte en una respuesta:

```txt
400 Bad Request
```

La lógica correcta queda así:

```txt
extrae archivos
↓
filtra archivos ignorados
↓
si no queda ninguno, lanza error
```

---

### Resultado del caso de uso

Con esto, quedó terminada la lógica interna de `UploadProjectZipUseCase`.

El caso de uso ya permite:

```txt
Crear ProjectFile desde archivos extraídos de un ZIP.
Validar que el proyecto pertenece al usuario.
No extraer el ZIP si el proyecto no pertenece al usuario.
Ignorar carpetas innecesarias.
Fallar si no hay archivos válidos.
```

Una vez cerrada esta parte, el siguiente paso fue pasar a la capa HTTP.

---

## 2. Endpoint POST /projects/:projectId/upload

El segundo bloque de la fase ha sido crear el endpoint HTTP para subir ZIPs:

```txt
POST /projects/:projectId/upload
```

Siguiendo TDD, primero se creó el test de integración con Supertest.

El objetivo del primer test HTTP era comprobar este flujo:

```txt
Dado un usuario autenticado
Y un proyecto suyo existente
Cuando sube un ZIP válido a /projects/:projectId/upload
Entonces la API devuelve 201
Y crea ProjectFile en PostgreSQL
```

---

### Dependencias instaladas

Para implementar el endpoint real se instalaron las siguientes dependencias:

```txt
npm install multer adm-zip
npm install -D @types/multer @types/adm-zip
```

Cada una cumple una función diferente:

```txt
multer  → permite que Express reciba archivos con multipart/form-data
adm-zip → permite leer el contenido del ZIP en Node.js
```

`multer` se encarga de recibir el archivo enviado en la petición.

Por ejemplo:

```txt
-F "file=@project.zip"
```

`adm-zip` se encarga de leer el ZIP y extraer sus archivos internos:

```txt
Buffer del ZIP
↓
archivos internos
↓
src/index.ts
package.json
README.md
```

---

### Flujo esperado del endpoint

El flujo completo del endpoint quedó planteado así:

```txt
Supertest
↓
POST /projects/:projectId/upload
↓
multer recibe el ZIP
↓
req.file.buffer contiene los bytes del ZIP
↓
UploadProjectZipUseCase procesa el buffer
↓
AdmZipExtractor extrae los archivos
↓
se guardan ProjectFile en PostgreSQL
↓
respuesta 201
```

---

### Extractor real de ZIP

Después del test inicial del endpoint, se creó el extractor real de infraestructura:

```txt
AdmZipExtractor
```

Este extractor recibe un ZIP y devuelve los archivos extraídos con su ruta y su contenido.

De esta forma, el caso de uso sigue dependiendo del puerto `ZipExtractor`, pero en ejecución real se usa una implementación concreta basada en `adm-zip`.

---

### Registro en el container

Una vez creado el extractor real, se registró el caso de uso en el contenedor de dependencias.

Esto permitió tener instanciado `UploadProjectZipUseCase` junto con el resto de dependencias reales necesarias.

Después se modificaron las rutas y el controller de proyectos para poder conectar el nuevo endpoint de subida.

---

### Controller y route

Para conectar la subida de ZIP con HTTP, se modificó el controller de proyectos añadiendo el método encargado de subir el ZIP.

También se modificó el route de proyectos para incluir el nuevo endpoint:

```txt
POST /projects/:projectId/upload
```

Este endpoint usa:

```txt
authMiddleware
multer
controller
```

La idea es que:

```txt
authMiddleware obtiene el usuario autenticado
multer recibe el archivo ZIP
controller llama al caso de uso
UploadProjectZipUseCase procesa la subida
```

---

### Corrección del test por orden de archivos

Durante la implementación se corrigió un detalle importante del test.

El extractor de ZIP no garantiza que los archivos se devuelvan siempre en el mismo orden.

Por eso, el test no debe depender de que:

```txt
src/index.ts
```

venga antes que:

```txt
package.json
```

Lo importante no es el orden, sino que ambos archivos existan en la respuesta.

Por tanto, el test se corrigió para comprobar la existencia de los archivos sin depender del orden en el que aparezcan.

---

### Tests de seguridad y casos de error

Después de hacer pasar el primer test, se añadieron más tests para validar seguridad y errores del endpoint.

#### Caso 1 — Petición sin archivo ZIP

Se comprobó que, si el usuario llama al endpoint sin enviar ningún archivo ZIP, la API responde con error 400.

El escenario fue:

```txt
Dado un usuario autenticado
Y un proyecto suyo
Cuando llama a /projects/:id/upload sin adjuntar archivo
Entonces la API responde 400
```

---

#### Caso 2 — Proyecto de otro usuario

También se comprobó que un usuario no puede subir un ZIP a un proyecto que pertenece a otro usuario.

Esto mantiene la regla principal de DevMind:

```txt
Nunca operar solo por projectId.
Siempre usar projectId + ownerId.
```

Así se evita que un usuario pueda modificar proyectos ajenos.

---

#### Caso 3 — ZIP sin archivos válidos

También se validó que, si el ZIP solo contiene carpetas ignoradas, la API debe devolver error 400.

Esto conecta con la regla ya implementada en el caso de uso:

```txt
Si no hay archivos válidos,
la subida debe fallar.
```

---

#### Caso 4 — Ignorar carpetas innecesarias en el flujo HTTP real

Por último, se comprobó que el endpoint real también ignora carpetas innecesarias como:

```txt
node_modules
.git
dist
coverage
.next
```

Esto ya estaba probado a nivel unitario, pero también se validó en el flujo completo HTTP con un ZIP real.

---

## Resultado final de la Fase 5

Al terminar esta fase, DevMind ya permite subir un proyecto comprimido en ZIP y convertirlo automáticamente en archivos internos del proyecto.

La nueva funcionalidad permite:

```txt
Subir un ZIP mediante multipart/form-data.
Recibir el archivo con multer.
Leer el ZIP con adm-zip.
Extraer archivos internos.
Ignorar carpetas innecesarias.
Validar que el proyecto pertenece al usuario autenticado.
Evitar acceso a proyectos de otros usuarios.
Crear varios ProjectFile automáticamente.
Guardar los archivos extraídos en PostgreSQL.
Responder con el número de archivos creados.
Fallar si no se envía archivo.
Fallar si el ZIP no contiene archivos válidos.
```

La estructura funcional alcanzada queda así:

```txt
User
└── Project
      └── ProjectFile
```

Pero ahora los `ProjectFile` ya no tienen que crearse solo manualmente uno a uno. También pueden generarse automáticamente a partir de un ZIP subido por el usuario.

Esta fase deja preparado el proyecto para continuar con funcionalidades más avanzadas, como la resubida o actualización de proyectos, el troceado de archivos en chunks y las fases posteriores de búsqueda semántica e IA/RAG.
