# Documentación general de diseño — DevMind

## 1. Objetivo del proyecto

DevMind tiene como objetivo construir una **API backend profesional** que permita a usuarios autenticados crear proyectos software, subir e indexar su código y hacer consultas inteligentes sobre ese proyecto usando IA.

DevMind ofrece dos modos de uso:

- **Modo invitado:** permite probar la funcionalidad principal de análisis e interacción con proyectos software sin necesidad de registro.
- **Modo autenticado:** permite persistir proyectos, historial de conversaciones y resultados de indexación asociados a cada usuario.

El problema principal no es simplemente “hacer una app con IA”. El problema real es el siguiente:

> Entender un proyecto software existente puede ser lento porque el conocimiento está repartido entre carpetas, archivos, documentación incompleta y memoria del equipo.

DevMind quiere ayudar a:

- Desarrolladores nuevos.
- Equipos con proyectos grandes.
- Personas que entran a mantener código ajeno.
- Equipos que no tienen documentación actualizada.

El enfoque del proyecto es:

> Convertir un proyecto software en una fuente de conocimiento consultable mediante lenguaje natural.

### Ejemplo práctico

Un usuario podría tener guardado un proyecto como:

```txt
Proyecto: DevMind API
```

Y podría hacer preguntas como:

```txt
Explícame la arquitectura de este proyecto.
¿Qué endpoints existen?
¿Dónde se validan los datos de entrada?
¿Qué casos de uso tiene la autenticación?
¿Qué tests hay para auth?
¿Qué partes pertenecen a domain, application, infrastructure y transport?
¿Qué debería mejorar de este código?
```

Esto deja claro que DevMind no es solo un CRUD, sino una herramienta para entender proyectos software.

---

## 2. Fases del proyecto

El proyecto se ha dividido en fases para construir DevMind de forma progresiva y siguiendo una arquitectura limpia.

```txt
FASES IMPLEMENTADAS
Fase 0  → Inicialización del proyecto
Fase 1  → Autenticación
Fase 2  → Proyectos
Fase 3  → ProjectFiles
Fase 4  → PostgreSQL
Fase 5  → Subida de ZIP
Fase 6  → Sincronización de resubidas de ZIP
Fase 7  → CodeChunks
Fase 8  → Genkit + PostgreSQL/pgvector, embeddings y búsqueda semántica
Fase 9  → IA/RAG: preguntas sobre el proyecto
Fase 10 → Indexación asíncrona y robusta
Fase 11 → Refactor, endurecimiento y mejoras técnicas
Fase 12 → Historial de conversaciones (guardar preguntas/respuestas por proyecto)
Fase 13 → Modo invitado (onboarding sin registro: usar la API sin credenciales)

FASES PENDIENTES (no implementadas aún)
Fase 14 → Frontend (interfaz para subir el ZIP y preguntar al proyecto)
Fase 15 → Mejoras de RAG (mejor prompt, más sources, ranking, límites de contexto)
Fase 16 → Deploy (backend, PostgreSQL y variables de entorno en producción)
```

---

# Fase 0 — Inicialización del proyecto

## Objetivo

En esta fase empezamos a construir la base del proyecto.

Las tareas principales fueron:

- Inicializar el `package.json`.
- Instalar dependencias.
- Inicializar el fichero `tsconfig.json`.
- Crear la estructura base de carpetas: `src` y `tests`.

## Dependencias instaladas

Dependencias principales:

```txt
typescript
tsx
@types/node
@types/express
@types/cors
```

Dependencias de testing:

```txt
vitest
supertest
@types/supertest
```

## Metodología de trabajo

En todo el proyecto se va a seguir una metodología **TDD** en cada fase, subfase o implementación.

El flujo será:

```txt
1. Crear tests unitarios, de integración o E2E.
2. Comprobar que fallan.
3. Implementar el mínimo código necesario.
4. Comprobar que todo está bien con:
   - npm run test
   - npm run typecheck
5. Si los tests pasan en verde, se puede refactorizar si es necesario.
6. Dar por terminada esa parte.
```

## Puntos completados en esta fase

- Proyecto creado con `npm`.
- Express instalado.
- TypeScript instalado.
- Vitest y Supertest instalados.
- `tsconfig.json` configurado.
- Estructura Clean Architecture creada.
- Test de `/health` creado.
- Endpoint `/health` implementado.
- `npm test` funciona.
- `npm run typecheck` funciona.
- `npm run build` funciona.
- `npm run dev` funciona.
- `.env.example` creado.
- `.gitignore` creado.
- `README` inicial creado.
- Primer commit hecho.

---

# Fase 1 — Autenticación

## Objetivo

En esta fase se implementa la autenticación de usuarios.

El objetivo principal es añadir:

- Registro de usuario.
- Login de usuarios.
- Puertos y adaptadores para:
  - JWT.
  - bcrypt.
- Middleware de autenticación.
- Creación de schemas con Zod.
- Middleware para validar el body con schemas de Zod.
- Endpoint `GET /auth/me`.

Como en todo el proyecto, se sigue siempre TDD.

Antes de implementar nada, se crean tests siguiendo TDD. Primero deben fallar y después se implementa el caso de uso necesario.

---

## Fase 1.1 — Casos de uso de autenticación

En esta fase se crean los casos de uso que realizan:

- Registro de usuario.
- Login de usuario.
- Devolver los datos del usuario actual.

---

## 1. RegisterUserUseCase

### Objetivo

El caso de uso `RegisterUserUseCase` se encarga de registrar nuevos usuarios.

Antes de crear el primer test, debemos crear las entidades y contratos base:

- Entidad `User` en `domain`.
- Repositorio `UserRepository` en `domain`.
- Puertos de aplicación:
  - `IdGenerator`.
  - `PasswordHasher`.

### Tests unitarios

Creamos el test unitario del caso de uso de registrar usuario.

Debe comprobar que:

- Registra un usuario nuevo.
- No permite emails duplicados.
- Guarda la contraseña hasheada.

Una vez que el test pasa, realizamos la implementación del caso de uso.

---

## Manejo de errores propios

Una vez terminado el primer test, construimos manejadores de errores propios en vez de usar errores generales.

Creamos en `shared` una carpeta `errors`.

Dentro añadimos:

- Un error general `AppError`, del que heredarán el resto de errores.
- Un error específico `UserAlreadyExistsError`.

Este error se pasa al test que acabamos de crear para comprobar que, si el usuario ya existe, se lanza ese error.

Al ejecutar el test, fallará porque el caso de uso todavía lanza un error general. Después se modifica el caso de uso para lanzar `UserAlreadyExistsError`.

Esto es mejor porque más adelante podremos tener un middleware global que haga:

```txt
Si el error es AppError → responde con su statusCode.
Si es otro error desconocido → responde 500.
```

---

## 2. LoginUserUseCase

### Objetivo

El caso de uso `LoginUserUseCase` se encarga de autenticar a un usuario y devolver un token.

Empezamos generando un test para este caso de uso. El test no pasará porque todavía no hay nada implementado.

### Cambios necesarios

Una vez con el test en rojo, actualizamos el puerto `PasswordHasher`.

Debemos incluir un método de comparación:

```ts
compare(plainPassword: string, passwordHash: string): Promise<boolean>;
```

Esto romperá el test de registro porque el fake solo tiene un método. Debemos incluirlo también en el fake, aunque el test de registro no lo use, para que TypeScript no se queje.

Después creamos el puerto `TokenService`.

Este es un puerto de aplicación. No usamos todavía `jsonwebtoken` directamente porque eso será infraestructura.

El caso de uso solo dice:

> Necesito algo que sepa generar tokens.

También creamos un nuevo tipo de error en la carpeta `errors`. Este error representa credenciales inválidas, por ejemplo cuando la contraseña no es válida.

Con todo esto, el test sigue sin pasar porque el caso de uso aún no está creado.

Finalmente, creamos el caso de uso y comprobamos que el test pase.

---

## 3. GetCurrentUserUseCase

### Objetivo

Después de cerrar la parte de registro y login a nivel de aplicación, creamos el caso de uso necesario para el endpoint:

```txt
GET /auth/me
```

Este caso de uso sirve para obtener el usuario actual a partir de su `userId`.

La idea será:

```txt
Si el token es válido → el middleware extrae el userId.
GET /auth/me → busca ese usuario por id.
Devuelve sus datos públicos.
```

### Tests unitarios

Generamos el test para este caso de uso. El test no pasará porque todavía no hay nada implementado.

### Cambios necesarios

Debemos actualizar la interfaz del repositorio de usuarios para que pueda encontrar usuarios por id:

```ts
findById(id: string): Promise<User | null>;
```

Como hemos añadido `findById`, ahora los repositorios en memoria de los tests van a fallar. Implementamos ese nuevo cambio en los tests.

También creamos un nuevo tipo de error:

```txt
UserNotFoundError
```

Este error lo usaremos cuando alguien pida un usuario que no existe.

El test todavía no pasa porque el caso de uso aún no está creado.

Finalmente, creamos el caso de uso.

---

## Fase 1.2 — Adaptadores reales de infraestructura

El siguiente paso lógico es crear las implementaciones reales de infraestructura, es decir, los adaptadores.

Usaremos:

- `bcryptjs` para cifrar y comparar contraseñas.
- `jsonwebtoken` para crear y verificar JWT.
- `crypto.randomUUID` para generar IDs.

## Dependencias instaladas

```bash
npm install bcryptjs jsonwebtoken
npm install -D @types/jsonwebtoken
```

## Variables de entorno

Modificamos nuestro `.env` para añadir:

- El secreto para `jsonwebtoken`.
- Los días de expiración del token.

También modificamos `env.ts` dentro de la configuración de infraestructura para que lea todo desde `.env`.

## Tests de infraestructura

Generamos los tests para comprobar estas implementaciones de los puertos.

Los tests fallarán porque todavía no hay nada creado.

Con los tests en rojo, actualizamos el puerto `TokenService`.

Hasta ahora solo tenía `sign`, para firmar y generar el token. Ahora hay que añadir el método `verify`, porque más adelante el middleware de autenticación hará esto:

```txt
recibir token
↓
verificar token
↓
extraer userId
↓
permitir acceso a rutas protegidas
```

Al añadir `verify`, el test de login puede fallar porque `FakeTokenService` ya no implementa toda la interfaz.

## Adaptadores creados

Creamos la carpeta `authAdapters` dentro de `infrastructure`.

Ahí metemos los adaptadores que implementan los puertos de la carpeta de aplicación:

- `BcryptPasswordHasher`.
- `JwtTokenService`.
- `CryptoIdGenerator`.

Durante la creación de los tests y las implementaciones usamos un nuevo tipo de error:

```txt
UnauthorizedError
```

Lo creamos en la carpeta `errors` y ya podemos pasar los tests.

---

## Fase 1.3 — HTTP y endpoints de autenticación

Ahora toca conectar todo con HTTP, es decir, crear los endpoints reales:

```txt
POST /auth/register
POST /auth/login
GET /auth/me
```

En las capas de dominio y aplicación, donde se concentra la lógica de negocio, se han escrito pruebas unitarias antes de la implementación.

En la capa de transporte HTTP, al tratarse principalmente de código de integración y cableado entre rutas, middlewares y controladores, vamos a utilizar pruebas de integración para validar el comportamiento completo de los endpoints.

El flujo será:

```txt
1. Crear tests primero.
2. Implementar rutas, middlewares y controladores de forma básica.
3. Hacer que los tests pasen.
4. Añadir más tests si es necesario.
5. Implementar casos de error.
```

Una vez construidos los tests, no pasarán porque todavía no hay nada implementado.

---

## Repositorio en memoria temporal

Antes de nada necesitamos una pieza temporal.

Como todavía no hemos metido PostgreSQL, necesitamos un repositorio en memoria para usuarios dentro de infraestructura para poder probar los endpoints.

Este repositorio será temporal. Más adelante, cuando metamos PostgreSQL, lo cambiaremos.

Creamos un repositorio en memoria dentro de:

```txt
/infrastructure/repositoryAdapter/inMemory
```

Este repositorio es un adapter.

Nos permite terminar la autenticación HTTP sin esperar a la base de datos.

---

## Contenedor de dependencias

Creamos un contenedor de dependencias simple.

Para no estar instanciando todo en cada controller, creamos un archivo donde montamos los casos de uso.

Esto es una forma sencilla de hacer inyección de dependencias manual.

No estamos usando una librería externa. Simplemente estamos diciendo:

> Aquí conecto mis interfaces con implementaciones reales.

---

## Piezas HTTP creadas

Para crear los endpoints añadimos estas piezas:

- `AuthController`.
- `AuthRoutes`.
- `AuthMiddleware`.
- `ErrorMiddleware`.
- `ValidateBodyMiddleware`.

Instalamos `zod` como dependencia si no está instalado todavía.

Lo usamos para validar que el usuario mande bien los datos.

Creamos schemas de autenticación. Este archivo define las reglas de entrada para registro y login.

Después creamos el middleware `validateBody`.

Este middleware se usa para validar los datos que recibimos del body.

Podríamos validar directamente en el controller, pero eso ensuciaría el controller.

---

## Manejo de errores async

También añadimos una pieza importante: el manejo de errores async.

Cuando un controller es async, puede fallar.

Por ejemplo:

```ts
await this.loginUserUseCase.execute(...);
```

Si el login falla, el caso de uso lanza:

```ts
throw new InvalidCredentialsError();
```

Express necesita que ese error llegue a un middleware de errores.

Para no poner `try/catch` en cada controller, usamos un helper llamado:

```txt
asyncHandler
```

Después creamos `errorMiddleware`.

Este middleware es el sitio central donde convertimos errores en respuestas HTTP.

También conectamos `errorMiddleware` en `app.ts`.

Importante:

```txt
app.use(errorMiddleware)
```

va después de las rutas.

Primero Express intenta resolver la petición. Si alguna ruta lanza error, entonces pasa al middleware de errores.

---

## AuthController y AuthRoutes

Creamos `AuthController`.

Este controller recibe el contenedor y realiza las acciones de registrar, iniciar sesión y obtener el usuario actual usando los casos de uso sobre los datos que recibe del body o del token.

Por último, creamos `AuthRoutes`, donde se definen las rutas de los endpoints.

En cada endpoint se incluyen:

- Middlewares de validación.
- Middleware de autenticación cuando corresponda.
- Controller correspondiente.

Estos tres ficheros van dentro de:

```txt
transport/http/auth
```

Los ficheros son:

- `authSchemas`.
- `authController`.
- `authRoutes`.

---

## Conclusión de la Fase 1

Al terminar esta fase ya tenemos lo siguiente:

- [x] `User` entity.
- [x] `UserRepository`.
- [x] `RegisterUserUseCase`.
- [x] `LoginUserUseCase`.
- [x] `GetCurrentUserUseCase`.
- [x] `PasswordHasher`.
- [x] `TokenService`.
- [x] `IdGenerator`.
- [x] `UserAlreadyExistsError`.
- [x] `InvalidCredentialsError`.
- [x] `UserNotFoundError`.
- [x] Tests unitarios de registro.
- [x] Tests unitarios de login.
- [x] Tests unitarios de usuario actual.
- [x] Infraestructura real: bcrypt.
- [x] Infraestructura real: JWT.
- [x] Infraestructura real: crypto id generator.
- [x] Repositorio real o temporal para HTTP.
- [x] `AuthController`.
- [x] `AuthRoutes`.
- [x] `AuthMiddleware`.
- [x] Error middleware.
- [x] Tests de integración HTTP.

---

# Fase 2 — Proyectos

En esta fase ya tenemos la creación de usuarios mediante registro y login. Incluso podemos consultar los datos del usuario actual.

Ahora queremos hacer que cada usuario registrado pueda crear proyectos personales.

Vamos a empezar como en la fase anterior, siguiendo TDD.

---

## Fase 2.1 — Casos de uso de proyectos

En esta fase crearemos los casos de uso que realizan:

- Crear proyectos.
- Listar proyectos.
- Devolver un proyecto concreto.
- Borrar un proyecto concreto.

---

## 1. CreateProjectUseCase

### Responsabilidad

Su responsabilidad será:

> Crear un proyecto asociado a un usuario autenticado.

Antes de empezar con el test, creamos en `domain`:

- La entidad `Project`.
- El repositorio `ProjectRepository`.

Creamos el test. Este fallará porque todavía no hay nada creado y los imports no funcionarán.

Una vez en rojo, creamos en `application` el caso de uso:

```txt
CreateProjectUseCase
```

Ahora probamos los tests y pasan.

---

## 2. ListUserProjectsUseCase

### Responsabilidad

Este caso de uso responde a:

> Dame todos los proyectos de este usuario.

Ejemplo:

```ts
await listUserProjectsUseCase.execute({
  ownerId: "user-1",
});
```

Debería devolver solo los proyectos cuyo `ownerId` sea `"user-1"`.

Ya sabemos crear proyectos. El siguiente paso lógico es poder listarlos.

La regla importante será:

> Un usuario solo puede listar sus propios proyectos.

Es decir, si existen proyectos de `user-1` y de `user-2`, cuando liste `user-1` no deben aparecer los de `user-2`.

Generamos el test siguiendo TDD.

El test fallará porque importa el caso de uso y todavía no está creado.

Creamos el caso de uso y corremos los tests. Los tests pasan.

---

## 3. GetProjectByIdUseCase

### Responsabilidad

Este caso de uso sirve para obtener un proyecto concreto.

Responde a esta pregunta:

> Dame este proyecto concreto, pero solo si es mío.

Ejemplo:

```ts
await getProjectByIdUseCase.execute({
  projectId: "project-1",
  ownerId: "user-1",
});
```

Si se hace una petición pidiendo un proyecto concreto, podría darse la opción de que un usuario recuperase el proyecto de otra persona.

Haciéndolo así, solo recupera proyectos que son suyos.

Generamos primero el test unitario.

El test falla porque el caso de uso todavía no está creado.

Creamos el caso de uso, corremos los tests y pasa.

También hemos creado un tipo de error:

```txt
ProjectNotFoundError
```

Si el proyecto concreto no existe, lanzará este tipo de error.

Esto sirve para que luego el middleware pueda convertirlo en una respuesta HTTP.

---

## 4. DeleteProjectUseCase

### Responsabilidad

Este caso de uso sirve para:

> Borrar un proyecto concreto, pero solo si pertenece al usuario autenticado.

Como ya hemos decidido usar errores propios, si el proyecto no existe o no es del usuario, lanzará:

```txt
ProjectNotFoundError
```

Recibirá esto:

```ts
{
  projectId: "project-1",
  ownerId: "user-1"
}
```

Y deberá hacer:

```txt
1. Buscar el proyecto por projectId y ownerId.
2. Si no existe, lanzar ProjectNotFoundError.
3. Si existe, borrarlo.
```

Primero creamos el test unitario.

Este no pasará porque todavía no está implementado.

Implementamos el caso de uso y pasamos los tests.

---

## Fase 2.2 — Adaptadores de infraestructura

El siguiente paso lógico es crear las implementaciones reales de infraestructura, es decir, los adaptadores.

Creamos una implementación real en infraestructura del repositorio.

De momento será en memoria.

Después modificamos el `container`.

Ahora mismo tenemos piezas sueltas, como casos de uso y repositorios. En el container vamos a instanciarlo todo para tenerlo conectado.

Con esto ya tenemos conectada la capa de aplicación de `Projects` al container.

---

## Fase 2.3 — HTTP y endpoints de proyectos

El siguiente paso es pasar a la implementación HTTP y crear los endpoints.

Iremos endpoint por endpoint.

---

## 1. POST /projects

### Objetivo

Este endpoint servirá para que un usuario autenticado cree un proyecto.

El usuario hará una petición como esta:

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

La API debería responder:

```json
{
  "id": "algo",
  "ownerId": "user-id-del-token",
  "name": "DevMind API",
  "description": "Backend con IA para consultar proyectos software",
  "createdAt": "fecha"
}
```

Con status:

```txt
201 Created
```

### Regla importante

El cliente no debe mandar el `ownerId`.

Mal:

```json
{
  "ownerId": "user-1",
  "name": "DevMind API"
}
```

Bien:

```json
{
  "name": "DevMind API",
  "description": "Backend con IA para consultar proyectos software"
}
```

¿Por qué?

> Porque el `ownerId` debe salir del token JWT.

Es decir:

```txt
authMiddleware lee el token
↓
authMiddleware obtiene el userId
↓
controller usa ese userId como ownerId
```

Así evitamos que un usuario pueda crear proyectos a nombre de otro.

### TDD del endpoint

Empezamos creando un test inicial de integración del endpoint.

Más adelante iremos modificando este test con más endpoints.

El test no pasa y, una vez en rojo, empezamos a implementar.

Ahora implementamos:

- `ProjectController`.
- `ProjectRoutes`.
- `ProjectSchema`.

Estos archivos van dentro de:

```txt
transport/http/project
```

Las funciones de estos tres archivos son muy similares a las que creamos para `auth`, pero en este caso son para `project`.

Además, usan un middleware para verificar que el usuario está logueado y poder recuperar su id.

---

## 2. GET /projects

### Objetivo

Este endpoint servirá para:

> Listar solo los proyectos del usuario autenticado.

El usuario podrá hacer:

```http
GET /projects
Authorization: Bearer ACCESS_TOKEN
```

Y recibir algo como:

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

La regla importante es:

> Un usuario solo debe ver sus propios proyectos.

Vamos a construir el test de integración que prueba el endpoint.

Lo incluiremos en el fichero de test que ya teníamos creado y que usamos para el endpoint anterior.

Después actualizamos el controller de proyectos para que tenga un método `list`.

También actualizamos el router para que tenga el endpoint.

Los tests pasan.

---

## 3. GET /projects/:id

### Objetivo

Este endpoint servirá para:

> Obtener un proyecto concreto del usuario autenticado.

Queremos poder hacer:

```http
GET /projects/project-id
Authorization: Bearer ACCESS_TOKEN
```

Y que devuelva ese proyecto solo si pertenece al usuario autenticado.

Vamos a empezar modificando el mismo archivo de test de endpoint, creando el test para probar este endpoint.

Una vez que se ponga en rojo, implementamos el controller y el router.

---

## 4. DELETE /projects/:id

### Objetivo

Este endpoint servirá para:

> Borrar un proyecto concreto, pero solo si pertenece al usuario autenticado.

Queremos poder hacer:

```http
DELETE /projects/:id
Authorization: Bearer ACCESS_TOKEN
```

Y que pase esto:

```txt
Si el proyecto existe y es mío → 204 No Content
Si no hay token → 401 Unauthorized
Si el proyecto no existe → 404 Not Found
Si el proyecto es de otro usuario → 404 Not Found
```

Otra vez, devolvemos `404` cuando es de otro usuario para no revelar que ese proyecto existe.

Empezamos como siempre creando el test de integración para que falle.

Una vez en rojo, implementamos el controller y el router.

---

## Conclusión de la Fase 2

Cabe destacar que todos los cambios que hemos hecho los hemos instanciado añadiéndolos al container para que el controller pueda usarlos.

Hemos añadido a DevMind la parte de proyectos.

Hasta ahora DevMind ya sabía quién era el usuario gracias al login.

En esta fase hemos hecho que cada usuario pueda tener sus propios proyectos dentro de la aplicación.

La idea principal ha sido:

- Un usuario puede crear, ver, listar y borrar sus propios proyectos.
- Pero nunca puede acceder a los proyectos de otro usuario.

## Seguridad añadida

Un usuario no puede ver ni borrar proyectos de otro usuario.

Para conseguirlo, no buscamos proyectos solo por su id, sino que:

> Buscamos el proyecto por id y además comprobamos que pertenezca al usuario que lo pide.

## Arquitectura usada

A nivel de arquitectura hemos seguido la misma estructura limpia del proyecto:

```txt
domain
→ definición de Project y ProjectRepository

application
→ casos de uso:
  CreateProjectUseCase
  ListUserProjectsUseCase
  GetProjectByIdUseCase
  DeleteProjectUseCase

infrastructure
→ InMemoryProjectRepository

transport
→ rutas, controller y schema HTTP de projects

container
→ conexión de los casos de uso con el repositorio real temporal
```

---

# Fase 3 — ProjectFiles

Hasta ahora DevMind tiene esto:

```txt
User → Project
```

Es decir:

- Un usuario puede tener proyectos.
- Pero esos proyectos todavía están vacíos.
- No tienen archivos de código dentro.

La Fase 3 consiste en añadir esta parte:

```txt
User → Project → ProjectFile
```

Es decir:

- Un proyecto puede tener varios archivos.

---

## Fase 3.1 — Base interna de ProjectFiles

Primero creamos la lógica interna, sin HTTP todavía.

---

## 1. CreateProjectFileUseCase

Antes de nada, creamos:

- La entidad `ProjectFile`.
- La interfaz de repositorio `ProjectFileRepository`.

Después, siguiendo TDD, creamos el test unitario del caso de uso para crear un archivo.

Este test es básico y sirve para probar el flujo del caso de uso.

Al principio fallará porque todavía no hay nada creado.

Después de ver el rojo en el test, empezamos con la creación de un puerto que nos servirá para hashear el código de un archivo.

De momento no lo usaremos, pero más adelante nos vendrá bien para saber si un archivo tiene el mismo contenido o no.

Creamos el puerto:

```txt
FileHashGeneratorPort
```

Lo siguiente, para que los tests pasen, es implementar el caso de uso.

Una vez implementado, probamos los tests.

Los tests pasan y terminamos el ciclo base de TDD.

A partir de ahí podemos añadir más tests para implementar funcionalidades de seguridad.

---

## 2. ListProjectFilesUseCase

### Responsabilidad

Su responsabilidad será:

> Listar los archivos de un proyecto, pero solo si ese proyecto pertenece al usuario autenticado.

El flujo será:

```txt
ownerId + projectId
        ↓
comprobar que el proyecto pertenece al usuario
        ↓
devolver los ProjectFile de ese proyecto
```

Empezamos como siempre creando el test unitario.

El test falla porque todavía no hay nada creado.

Modificamos la interfaz del repositorio `ProjectFileRepository` para añadir el método:

```txt
findByProjectId
```

Este método permite buscar y listar los archivos.

Después creamos el caso de uso:

```txt
ListProjectFilesUseCase
```

También modificamos el test anterior del caso de uso de crear porque el fake del repositorio de archivos solo implementa un método del repositorio.

---

## 3. GetProjectFileByIdUseCase

### Responsabilidad

Su responsabilidad será:

> Obtener un archivo concreto de un proyecto del usuario autenticado.

El flujo será:

```txt
ownerId + projectId + fileId
        ↓
comprobar que el proyecto pertenece al usuario
        ↓
buscar el archivo dentro de ese proyecto
        ↓
devolverlo
```

Creamos su test unitario.

Este no pasa porque tanto el caso de uso como el nuevo tipo de error que hemos incluido no existen todavía.

Creamos el nuevo tipo de error:

```txt
ProjectFileNotFoundError
```

Actualizamos de nuevo la interfaz del repositorio añadiendo el nuevo método necesario.

Después creamos el caso de uso.

---

## 4. DeleteProjectFileUseCase

### Responsabilidad

Su responsabilidad será:

> Borrar un archivo concreto de un proyecto del usuario autenticado.

La seguridad será la misma:

```txt
1. Comprobar que el proyecto pertenece al usuario.
2. Comprobar que el archivo existe dentro de ese proyecto.
3. Borrar el archivo.
```

Creamos el test unitario.

Actualizamos de nuevo la interfaz del repositorio añadiendo el método necesario.

---

## Fase 3.2 — Adaptadores de infraestructura

En esta subfase implementamos los adaptadores en infraestructura de:

- El puerto del repositorio.
- El hasheador.

Después modificamos el container para que instancie también todo esto.

---

## Fase 3.3 — Endpoints HTTP para ProjectFiles

Pasamos a los endpoints HTTP para `ProjectFiles`.

Vamos a crear el fichero de test de integración.

Iremos construyendo los tests de cada endpoint y luego su implementación.

---

## 1. POST /projects/:projectId/files

### Objetivo

Este endpoint crea un archivo dentro del proyecto con id.

El cliente mandará esto en el body:

```json
{
  "path": "src/app.ts",
  "language": "typescript",
  "content": "console.log('hello');"
}
```

Pero no manda ni `ownerId` ni `projectId` en el body.

El sistema los saca de aquí:

```txt
ownerId   → req.user.userId, gracias al authMiddleware
projectId → req.params.projectId
```

Esto mantiene la misma idea que en projects:

> El cliente no decide quién es el dueño.

Creamos el test para este endpoint, el cual falla.

Ahora implementamos para que el test pase.

Debe hacer esto:

```txt
1. Comprobar que el usuario está autenticado.
2. Validar el body con Zod.
3. Sacar ownerId desde req.user.userId.
4. Sacar projectId desde req.params.projectId.
5. Llamar a createProjectFileUseCase.
6. Devolver 201 con el ProjectFile creado.
```

Primero creamos el schema para que el middleware `validateBody` pueda validar lo que le pasamos.

Después creamos el controller para `ProjectFile`.

Después creamos el router para conectar el endpoint con los middlewares y el controller.

---

## 2. GET /projects/:projectId/files

Creamos el test para este endpoint, el cual falla.

Ahora implementamos para que el test pase.

Añadimos el método `list` dentro del controller de archivos.

Añadimos al router la ruta `GET` para listar los archivos.

Ahora los tests pasan.

Después añadimos tests para comprobar casos de errores y seguridad.

Casos cubiertos:

```txt
✅ con token válido → 200
✅ sin token → 401
✅ proyecto inexistente → 404
✅ proyecto de otro usuario → 404
```

---

## 3. GET /projects/:projectId/files/:fileId

Este endpoint sirve para obtener un archivo concreto dentro de un proyecto.

Creamos el test para este endpoint, el cual falla.

Ahora implementamos para que el test pase.

Añadimos el método `getById` al controller.

Añadimos la ruta en el router para este endpoint.

Los tests pasan.

Después añadimos nuevos tests para asegurar casos de errores y seguridad.

Casos cubiertos:

```txt
✅ con token válido → 200
✅ sin token → 401
✅ proyecto inexistente → 404
✅ archivo inexistente → 404
✅ proyecto de otro usuario → 404
```

---

## 4. DELETE /projects/:projectId/files/:fileId

Creamos el test para este endpoint, el cual falla.

Ahora implementamos para que el test pase.

Añadimos la ruta en el router para este endpoint.

Los tests pasan.

Después añadimos nuevos tests para asegurar casos de errores y seguridad.

---

## Conclusión de la Fase 3

Podemos dar por cerrada la Fase 3.

Ahora mismo está implementado:

```txt
User → Project → ProjectFile
```

Y DevMind ya puede:

```txt
✅ Crear archivos dentro de un proyecto
✅ Listar archivos de un proyecto
✅ Obtener un archivo concreto
✅ Borrar un archivo concreto
✅ Validar que el proyecto pertenece al usuario autenticado
✅ Evitar acceso a proyectos de otros usuarios
✅ Calcular size
✅ Calcular hash
✅ Guardar ProjectFiles en memoria
```

Además, están cubiertos los endpoints:

```txt
POST   /projects/:projectId/files
GET    /projects/:projectId/files
GET    /projects/:projectId/files/:fileId
DELETE /projects/:projectId/files/:fileId
```

Con casos de:

```txt
✅ 200 / 201 / 204 correctos
✅ 400 body inválido
✅ 401 sin token
✅ 404 proyecto inexistente
✅ 404 proyecto de otro usuario
✅ 404 archivo inexistente
```

---

# Fase 4 — PostgreSQL

## Objetivo

El objetivo de esta fase es cambiar los repositorios en memoria por repositorios reales en PostgreSQL.

Ahora tenemos esto:

```txt
UseCase
  ↓
Repository interface
  ↓
InMemoryRepository
```

Queremos llegar a esto:

```txt
UseCase
  ↓
Repository interface
  ↓
PostgresRepository
```

Lo bueno es que los casos de uso no deberían cambiar casi nada, porque ya están programados contra interfaces.

Esa era justo una de las ventajas de la arquitectura limpia/hexagonal que estamos usando en DevMind.

---

## Fase 4.1 — Levantar PostgreSQL y conectar Node/Express

Primero solo vamos a levantar la base de datos.

Todavía no vamos a tocar repositorios ni casos de uso.

En la raíz del proyecto creamos:

```txt
docker-compose.yml
```

Añadimos y modificamos el `.env` con:

```txt
DATABASE_URL
```

Después levantamos el Docker Compose para ver si se carga el servidor.

Una vez verificado lo anterior, conectamos Node/Express con nuestro servidor de PostgreSQL.

Tenemos que instalar `pg` y sus tipos.

Después generamos la pool de conexión en una carpeta llamada `database` dentro de infraestructura.

Archivo:

```txt
postgresPool.ts
```

Luego creamos un script y lo ejecutamos para probar la conexión.

Si da buen resultado, la API ya sabe conectarse con el servidor PostgreSQL que está levantado en el contenedor.

Ahora mismo ya tenemos esto:

```txt
DevMind API
  ↓
postgresPool
  ↓
PostgreSQL en Docker
```

---

## Fase 4.2 — Migraciones y tablas

El siguiente paso es crear las tablas en la base de datos para:

- Usuarios.
- Proyectos.
- Archivos.

En definitiva, generar migraciones.

Creamos una carpeta:

```txt
src/infrastructure/database/migrations
```

Dentro metemos archivos SQL.

Por ejemplo:

```txt
001_create_users.sql
002_create_projects.sql
003_create_project_files.sql
```

Estos archivos son las instrucciones para crear las tablas.

En estas instrucciones usaremos:

```txt
ON DELETE CASCADE
```

### ¿Por qué usamos ON DELETE CASCADE?

- Si se borra un usuario, se borran sus proyectos.
- Si se borra un proyecto, se borran automáticamente sus archivos.

Esto arregla el detalle comentado antes:

> No queremos archivos huérfanos si borramos un proyecto.

Una vez creadas las instrucciones, generamos un script para realizar las migraciones.

Ejecutamos el script y, cuando termine, nos conectamos al Docker para ver si ha funcionado.

Ahora tenemos esto creado en PostgreSQL:

```txt
devmind_db
├── users
├── projects
└── project_files
```

Eso quiere decir que ya tenemos la estructura real donde irán los datos.

---

## Fase 4.3 — Repositorios PostgreSQL

Ahora falta la parte realmente importante:

- Crear `PostgresUserRepository`.
- Crear `PostgresProjectRepository`.
- Crear `PostgresProjectFileRepository`.
- Cambiar el container para usar PostgreSQL.
- Probar que los datos aparecen en TablePlus.

El orden correcto será:

```txt
1. PostgresUserRepository
2. Cambiar container para usarlo
3. Probar register/login/auth/me
4. Ver usuarios en TablePlus
5. PostgresProjectRepository
6. PostgresProjectFileRepository
```

---

## 1. PostgresUserRepository

Generamos el repositorio de PostgreSQL.

Generamos un script para probarlo.

Si funciona, podemos cambiarlo.

Después modificamos el container para que nuestra API use el repositorio de PostgreSQL para los usuarios.

Tenemos que modificar imports y demás del container.

Con esto habremos migrado `users`.

---

## 2. PostgresProjectRepository

Ahora hacemos exactamente lo mismo con los proyectos.

Es decir:

```txt
InMemoryProjectRepository → PostgresProjectRepository
```

Creamos el script para probarlo.

Como `projects.owner_id` referencia a `users.id`, primero necesitamos crear un usuario real en PostgreSQL.

El script funciona como se esperaba.

Después conectamos el repositorio al container.

Lo conectamos y vemos que funciona.

---

## 3. Error encontrado con los tests

Antes de continuar, apareció un error.

Al ejecutar los tests, aparte de que no pasaban todos, también creaban muchos usuarios, proyectos y demás.

Esto ocurría porque antes los tests usaban memoria, y esta se borraba entre ejecución y ejecución.

Ahora, al usar PostgreSQL, los datos persisten.

Por eso toca modificar los tests.

Vamos a tener dos bases de datos:

```txt
devmind_db
```

Para usar manualmente con la API, frontend, curl, etc.

Y otra:

```txt
devmind_test_db
```

Solo para tests automáticos.

Cada vez que se ejecuten los tests:

```txt
1. Se usa devmind_test_db.
2. Se crean las tablas si no existen.
3. Se limpian users, projects y project_files antes de empezar.
4. Se ejecutan los tests.
5. Se vuelven a limpiar al terminar.
```

### Creación de la base de datos de test

El primer paso es crear la base de datos en el contenedor.

Después tenemos que hacer las migraciones, es decir, crear las tablas como hicimos con la otra base de datos.

### Global setup de tests

Creamos un fichero global de test que hace lo siguiente:

```txt
1. Comprueba que DATABASE_URL apunta a devmind_test_db.
2. Ejecuta las migraciones por si faltara alguna tabla.
3. Limpia users, projects y project_files.
4. Ejecuta los tests.
5. Cuando terminan los tests, vuelve a limpiar las tablas.
```

El siguiente paso será crear:

```txt
vitest.config.ts
```

para conectar `globalSetup.ts`.

Después, en el `package.json`, cambiamos el comando de los tests para que siempre ejecute los tests con la base de datos de tests:

```json
{
  "scripts": {
    "test": "DATABASE_URL=postgresql://devmind:devmind_password@localhost:5432/devmind_test_db vitest run",
    "test:watch": "DATABASE_URL=postgresql://devmind:devmind_password@localhost:5432/devmind_test_db vitest"
  }
}
```

Este error ya está solucionado y podemos seguir.

---

## 4. PostgresProjectFileRepository

Creamos el archivo:

```txt
postgresProjectFileRepository.ts
```

Después creamos un script pequeño para probar el repositorio.

Cuando funcione, podemos ponerlo en el container.

Como funciona, modificamos el container.

---

## Conclusión de la Fase 4

Ya hemos terminado la Fase 4, en la que hemos implementado la persistencia en PostgreSQL.

En esta parte no hemos usado TDD puro, sino que hemos realizado scripts de verificación manual para validar rápidamente la conexión y el comportamiento de los nuevos repositorios.

Posteriormente, estas verificaciones se consolidaron como tests de integración automatizados ejecutables mediante:

```bash
npm test
```

Equivalencias entre scripts de verificación manual y tests automatizados:

```txt
test-db-connection.ts                       → postgresConnection.test.ts
test-postgres-project-file-repository.ts    → postgresProjectFileRepository.test.ts
test-postgres-project-repository.ts         → postgresProjectRepository.test.ts
test-postgres-user-repository.ts            → postgresUserRepository.test.ts
```

---

# Fase 5 — Subida de ZIP

Empezamos con la fase de subida del ZIP.

Ahora mismo DevMind puede crear archivos de proyecto manualmente:

```http
POST /projects/:projectId/files
```

Pero queremos añadir una subida automática de un proyecto comprimido:

```http
POST /projects/:projectId/upload
```

La idea será:

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

## Decisión importante

No vamos a meter toda la lógica del ZIP directamente en el controller.

Eso ensucia mucho la capa HTTP.

El flujo será:

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

Es decir, crearemos un caso de uso:

```txt
UploadProjectZipUseCase
```

Este caso de uso será el cerebro de la operación.

## Endpoint

El endpoint que usaremos será:

```http
POST /projects/:projectId/upload
```

Con `multipart/form-data`.

El campo del archivo se llamará:

```txt
file
```

Ejemplo conceptual:

```bash
curl -X POST http://localhost:3000/projects/PROJECT_ID/upload \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -F "file=@mi-proyecto.zip"
```

Respuesta posible:

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

Importante:

> De momento no hace falta devolver el `content` completo en la respuesta, porque si el ZIP contiene muchos archivos podría ser una respuesta enorme.

---

## Dependencias posibles

Más adelante probablemente necesitaremos:

```bash
npm install multer adm-zip
```

O una alternativa:

```bash
npm install multer yauzl
```

Pero todavía no las instalaría.

¿Por qué?

Porque el primer test será del caso de uso, y para eso no necesitamos leer un ZIP real.

Podemos usar un fake:

```txt
FakeZipExtractor
```

Así probamos la lógica sin depender todavía de:

- `multer`.
- `adm-zip`.
- Express.

También debemos crear una nueva pieza: un puerto llamado `ZipExtractor`.

El caso de uso no debería saber cómo se hace la extracción del ZIP, pero sí debe tener una interfaz que defina los métodos.

La idea:

```txt
UploadProjectZipUseCase
↓ usa
ZipExtractor
```

## Orden usando TDD

El orden que seguiremos aproximadamente será:

```txt
1. Test unitario del caso de uso.
2. Implementar UploadProjectZipUseCase.
3. Añadir más tests unitarios: ignora node_modules, .git, dist...
4. Test HTTP con Supertest para POST /projects/:projectId/upload.
5. Implementar endpoint con multer.
6. Implementar extractor real de ZIP.
7. Test final de integración con ZIP real.
```

---

## Fase 5.1 — Caso de uso UploadProjectZipUseCase

Vamos a comenzar con el caso de uso:

```txt
UploadProjectZipUseCase
```

Empezamos generando el test unitario.

Este claramente no pasará porque todavía no hay nada implementado.

Vamos a crear una nueva carpeta dentro de:

```txt
test/unit/application
```

Aquí dentro ya está separado por carpetas:

- `auth`.
- `project`.
- `projectFile`.

Estas carpetas tienen dentro los tests de los casos de uso CRUD de cada área.

Pero `UploadProjectZipUseCase` es otra cosa.

Por ello creamos una nueva carpeta llamada:

```txt
uploadZip
```

Ahí meteremos el test.

## Qué verificará el test

El test verificará:

- Recibir un ZIP.
- Extraer muchos archivos.
- Filtrar carpetas.
- Detectar lenguaje.
- Calcular `size`.
- Calcular `hash`.
- Crear muchos `ProjectFile`.

Una vez construido el test y verificado que no pasa, empezamos con la implementación.

Creamos el nuevo puerto de aplicación:

```txt
ZipExtractor
```

Ahora creamos el caso de uso:

```txt
UploadProjectZipUseCase
```

---

## Tests especializados

Después pasamos a tests especializados.

---

## 1. Seguridad: no subir ZIP a proyectos ajenos

Vamos a añadir un test para comprobar seguridad.

La regla es:

> No se puede subir un ZIP a un proyecto que no existe o que no pertenece al usuario autenticado.

Este test prepara este escenario:

```txt
Existe project-1,
pero pertenece a another-user.
```

Luego el usuario `user-1` intenta subir un ZIP a ese proyecto.

Resultado esperado:

```txt
❌ No se permite.
❌ No se extrae el ZIP.
❌ No se guarda ningún ProjectFile.
```

Esta parte es muy importante para la seguridad.

Aunque realmente el proyecto exista, para `user-1` debe comportarse como si no existiera.

Esto evita revelar información.

No queremos decir:

```txt
403 Forbidden: este proyecto existe pero no es tuyo
```

Porque eso confirma al usuario que ese `projectId` existe.

Preferimos:

```txt
404 Project not found
```

O a nivel de caso de uso:

```txt
Project not found
```

Este test debería pasar, ya que el caso de uso asegura eso.

---

## 2. Ignorar carpetas y archivos no deseados

Ahora añadimos un test para ignorar carpetas y archivos que no queremos guardar:

- `node_modules`.
- `.git`.
- `dist`.

Este test dice:

```txt
Si el ZIP trae 6 archivos
pero 5 están dentro de carpetas ignoradas
entonces solo se debe guardar 1 ProjectFile real.
```

En este caso solo debería guardarse:

```txt
src/index.ts
```

Este test no pasa todavía porque en el caso de uso no tenemos nada que filtre las carpetas que queremos ignorar.

Por ello, en el caso de uso metemos una función que haga ese filtrado y luego pase solo las carpetas filtradas.

---

## 3. Error si el ZIP no tiene archivos válidos

### Pregunta

¿Qué pasa si el ZIP no tiene ningún archivo válido?

Por ejemplo, el usuario sube un ZIP que solo contiene:

```txt
node_modules/
.git/
dist/
coverage/
```

O sube un ZIP vacío.

En ese caso no tendría sentido devolver:

```json
{
  "filesCreated": 0,
  "files": []
}
```

Porque parecería que la subida ha ido bien, pero realmente DevMind no ha importado nada útil.

Lo más lógico sería fallar con un error tipo:

```txt
No valid project files found
```

Más adelante, en el endpoint HTTP, ese error lo convertiremos en un:

```txt
400 Bad Request
```

Ahora mismo seguramente fallará, porque el caso de uso probablemente hace esto:

```txt
extrae archivos
↓
filtra archivos ignorados
↓
si no queda ninguno, devuelve filesCreated: 0
```

Pero queremos esto:

```txt
extrae archivos
↓
filtra archivos ignorados
↓
si no queda ninguno, lanza error
```

Con estos tests especializados, generamos las implementaciones para aquellos tests que no pasen.

## Resultado de la Fase 5.1

Con esto ya habríamos terminado `UploadProjectZipUseCase` y la lógica interna.

Ahora el caso de uso:

```txt
✅ crea ProjectFile desde archivos extraídos de un ZIP
✅ valida que el proyecto pertenece al usuario
✅ no extrae el ZIP si el proyecto no pertenece al usuario
✅ ignora carpetas innecesarias
✅ falla si no hay archivos válidos
```

El siguiente bloque será pasar a la capa HTTP.

---

## Fase 5.2 — HTTP y endpoint de subida de ZIP

Ahora pasamos a la parte de HTTP y endpoint.

Vamos a crear el endpoint:

```http
POST /projects/:projectId/upload
```

Como seguimos TDD, primero haremos el test de integración con Supertest.

El objetivo del primer test HTTP será:

```txt
Dado un usuario autenticado
Y un proyecto suyo existente
Cuando sube un ZIP válido a /projects/:projectId/upload
Entonces la API devuelve 201
Y crea ProjectFile en PostgreSQL
```

## Dependencias necesarias

Para el endpoint real necesitaremos dos dependencias:

```bash
npm install multer adm-zip
```

Y probablemente los tipos de `multer`:

```bash
npm install -D @types/multer
```

### ¿Para qué sirve cada una?

`multer` sirve para que Express pueda recibir archivos con `multipart/form-data`.

Es decir, esto:

```bash
-F "file=@project.zip"
```

`adm-zip` sirve para leer el contenido del ZIP en Node.js.

Es decir:

```txt
Buffer del ZIP
↓
archivos internos
↓
src/index.ts
package.json
README.md
```

## Orden de implementación

El orden será:

```txt
1. Instalar multer, adm-zip y @types/multer.
2. Crear test HTTP en rojo para POST /projects/:projectId/upload.
3. Crear extractor real AdmZipExtractor.
4. Crear controller/ruta HTTP.
5. Registrar UploadProjectZipUseCase en el container.
6. Hacer pasar el test.
```

## Instalación final

Empezamos instalando las dependencias:

```bash
npm install multer adm-zip
npm install -D @types/multer @types/adm-zip
```

Ahora creamos el test del endpoint, que no pasará.

Este test crea un ZIP en memoria.

No le pasamos un ZIP en concreto, pero nos sirve para probar el flujo.

El test no pasa.

Ahora implementamos.

Queremos lo siguiente:

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

Primero implementamos el extractor real de infraestructura del ZIP:

```txt
AdmZipExtractor
```

Este extractor recibe un ZIP y devuelve los archivos con el path y el contenido.

Después registramos el caso de uso en el container para tenerlo instanciado.

Una vez hecho eso, modificamos `projectRoute` para poder meter dependencias y conexiones para este endpoint.

También modificamos el controller para que tenga el método de subir el ZIP.

## Corrección del test por orden de archivos

Tuvimos que corregir el test porque el extractor de ZIP no asegura el orden.

Al coger los archivos, pueden venir desordenados.

Por eso:

> El test no debe depender de que `src/index.ts` venga antes que `package.json`.

Lo importante es que ambos archivos existan en la respuesta.

## Tests de seguridad y errores del endpoint

Después modificamos el test para añadir seguridad.

### 1. Endpoint sin archivo ZIP

Regla:

```txt
Si el usuario llama al endpoint sin enviar archivo ZIP,
la API debe responder 400.
```

Caso:

```txt
Dado un usuario autenticado
Y un proyecto suyo
Cuando llama a /projects/:id/upload sin adjuntar archivo
Entonces la API responde 400
```

### 2. Usuario subiendo ZIP a proyecto ajeno

Regla:

```txt
Un usuario NO puede subir un ZIP a un proyecto que pertenece a otro usuario.
```

Esto es coherente con la regla que ya tenemos en DevMind:

```txt
Nunca operar solo por projectId.
Siempre usar projectId + ownerId.
```

### 3. ZIP con solo carpetas ignoradas

Regla:

```txt
Si el ZIP solo contiene carpetas ignoradas,
la API debe devolver 400.
```

El caso de uso ya lo tiene cubierto, pero ahora falta validar cómo se comporta desde HTTP.

### 4. Ignorar carpetas en flujo HTTP real

También comprobamos que el endpoint ignora:

```txt
node_modules
.git
dist
coverage
.next
```

Ya lo tenemos probado en unitario, pero conviene validar que el flujo real HTTP también lo respeta cuando el ZIP real contiene esos archivos.

---

# Fase 6 — Sincronización de resubidas de ZIP

Esta fase consiste en implementar la sincronización de resubidas de ZIP.

Ahora mismo, si se sube el mismo ZIP dos veces al mismo proyecto, la API puede crear archivos duplicados.

Vamos a crear un sistema de sincronización mediante `path` y `hash`.

La sincronización sirve para que DevMind mantenga el proyecto actualizado, no duplicado.

La idea será:

```txt
Subo ZIP nuevo
↓
Comparo sus archivos con los que ya hay en PostgreSQL
↓
Creo los nuevos
Actualizo los modificados
Borro los que ya no existen
No toco los que siguen igual
```

Usaremos:

```txt
path → para saber si es el mismo archivo
hash → para saber si cambió el contenido
```

Aquí usaremos el puerto del hash que implementamos en la Fase 3.

## Ejemplo

```txt
src/index.ts existe y hash igual      → unchanged
src/app.ts existe y hash distinto     → updated
src/new.ts no existía                 → created
src/old.ts ya no viene en el ZIP      → deleted
```

Esto será muy útil para el futuro RAG porque, cuando tengamos chunks y embeddings, podremos hacer esto:

```txt
archivo igual      → no regenerar chunks/embeddings
archivo cambiado   → regenerar solo ese archivo
archivo nuevo      → generar chunks/embeddings
archivo eliminado  → borrar sus chunks/embeddings
```

Así DevMind será más eficiente y más realista.

---

## ¿Qué pasa si el usuario mueve un archivo entre carpetas?

Este caso es importante.

Antes:

```txt
src/services/userService.ts
hash: abc
```

Después:

```txt
src/users/userService.ts
hash: abc
```

El contenido es el mismo, pero el path ha cambiado.

Con una sincronización simple por path, DevMind lo verá así:

```txt
src/services/userService.ts → deleted
src/users/userService.ts    → created
```

Aunque el hash sea igual.

La base de datos tendrá el archivo en su nueva ruta.

La base de datos ya no tendrá el archivo en su ruta antigua.

Para RAG, eso es suficiente.

---

## Fase 6.1 — Modificación de UploadProjectZipUseCase

Vamos a modificar el comportamiento actual de `UploadProjectZipUseCase`.

Antes, el caso de uso hacía esto:

```txt
extraer ZIP
↓
filtrar archivos ignorados
↓
crear todos los ProjectFile
```

Ahora queremos que haga esto:

```txt
extraer ZIP
↓
filtrar archivos ignorados
↓
calcular hash
↓
leer ProjectFiles actuales del proyecto
↓
comparar por path
↓
crear / actualizar / borrar / dejar igual
↓
devolver resumen
```

La idea principal es que la subida de un ZIP ya no cree todos los archivos siempre, sino que sincronice el estado real del proyecto.

## Respuesta objetivo

Con la sincronización queremos evolucionar la respuesta hacia algo así:

```json
{
  "projectId": "project-1",
  "summary": {
    "created": 2,
    "updated": 1,
    "deleted": 1,
    "unchanged": 14
  },
  "files": {
    "created": [],
    "updated": [],
    "deleted": [],
    "unchanged": []
  }
}
```

De esta forma, la respuesta cuenta mejor lo que ha ocurrido durante la subida del ZIP.

## Metodología TDD

Como siempre, seguimos la metodología TDD:

```txt
1. Escribir primero el test.
2. Comprobar que falla.
3. Implementar el mínimo código necesario.
4. Volver a pasar los tests.
5. Refactorizar si hace falta.
```

Vamos a empezar por el caso de uso, no por el endpoint.

Primero haremos tests unitarios para estos comportamientos:

```txt
1. Si subo el mismo ZIP dos veces, no duplica archivos.
2. Si un archivo tiene mismo path pero distinto contenido, lo actualiza.
3. Si un archivo existía antes pero ya no viene en el ZIP, lo borra.
4. Si aparece un archivo nuevo, lo crea.
```

---

## Fase 6.1.1 — Tests unitarios de sincronización

Empezamos con los tests.

---

## 1. Test: no duplicar archivos unchanged

Vamos a añadir un nuevo test unitario en el caso de uso `UploadProjectZipUseCase`.

El primer comportamiento que queremos comprobar es:

```txt
Si subo el mismo ZIP dos veces,
no debe duplicar archivos.
```

Este test simula el siguiente caso:

```txt
Ya existe en BD:

src/index.ts
content: console.log('hello');
hash: X
```

Y el ZIP nuevo trae exactamente el mismo archivo:

```txt
src/index.ts
content: console.log('hello');
hash: X
```

El resultado esperado es:

```txt
No crear otro ProjectFile.
```

Es decir:

```txt
Antes había 1 archivo.
Después debe seguir habiendo 1 archivo.
```

Y además la respuesta debe indicar:

```ts
filesCreated = 0;
files = [];
```

Porque no se ha creado nada nuevo.

---

## Mantener temporalmente la respuesta antigua

Antes de evolucionar la respuesta completa, primero evitamos duplicados manteniendo la respuesta actual.

Por ahora mantenemos el contrato actual del caso de uso:

```ts
{
  (projectId, filesCreated, files);
}
```

Pero cambiaremos su comportamiento interno:

```txt
Si el archivo no existía → lo crea.
Si el archivo ya existía con mismo path y mismo hash → no lo crea otra vez.
```

---

## Resultado inicial del test

El test falla, como esperábamos.

Falla porque el caso de uso siempre crea archivos si son válidos.

No comprueba si ya existe un archivo con el mismo path y el mismo hash.

Por eso acaba habiendo 2 archivos iguales, cuando el test esperaba que solo hubiera 1.

---

## Implementación para que pase el test

Vamos a implementar en el caso de uso lo siguiente:

```txt
1. Cargar los ProjectFile actuales del proyecto.
2. Crear un Map por path.
3. Para cada archivo del ZIP:
   - si no existe el path → crear.
   - si existe y el hash es igual → no hacer nada.
```

Lo que hemos añadido es que el caso de uso:

```txt
Carga los archivos actuales del proyecto,
los organiza por path
y evita duplicados.
```

Con esto, el nuevo test pasa y los tests antiguos también deberían pasar, ya que hemos mantenido todavía la respuesta antigua.

## Resultado de este primer paso

Con esto ya tenemos el primer comportamiento implementado:

```txt
Si el ZIP trae un archivo que ya existe
y el hash es igual
→ no se duplica
```

---

## 2. Test: actualizar archivo si cambia el contenido

El siguiente comportamiento que queremos implementar es:

```txt
Mismo path,
pero contenido distinto
→ no crear otro archivo,
  actualizar el ProjectFile existente.
```

Primero, como siempre, creamos el test.

## Resultado inicial del test

El test falla porque ahora mismo el caso de uso hace esto:

```txt
mismo path + hash distinto
→ crea otro ProjectFile nuevo
```

Pero eso no es lo que queremos.

Lo correcto sería:

```txt
mismo path + hash distinto
→ actualizar el ProjectFile existente
```

## Cambios necesarios

Para que este test pase, necesitamos añadir un método:

```txt
update
```

Hay que añadirlo en tres sitios:

```txt
1. Al puerto ProjectFileRepository.
2. A la implementación real de infraestructura con PostgreSQL.
3. Al fake del repositorio usado en los tests.
```

El método sería algo como:

```ts
update(projectFile: ProjectFile): Promise<ProjectFile>;
```

Ahora tenemos que modificar el caso de uso.

El problema es que si existe el mismo path pero cambia el hash, ahora mismo llega al bloque de crear archivo nuevo.

Hay que meter un caso intermedio:

```txt
si existe y hash igual → no hacer nada
si existe y hash distinto → actualizar
si no existe → crear
```

## Resultado de este segundo paso

Con esto ya tenemos:

```txt
Archivo no existe en BD
→ save()
→ se crea nuevo ProjectFile

Archivo existe y hash igual
→ continue
→ no se duplica

Archivo existe y hash distinto
→ update()
→ se actualiza el ProjectFile existente
```

Ahora el comportamiento del caso de uso es más inteligente:

```txt
Subes ZIP
↓
Extrae archivos
↓
Filtra carpetas ignoradas
↓
Para cada archivo:
- si no existe ese path → crea ProjectFile
- si existe y hash igual → no hace nada
- si existe y hash distinto → actualiza ProjectFile
```

Todavía mantenemos la respuesta antigua:

```ts
{
  (projectId, filesCreated, files);
}
```

Y eso está bien por ahora.

No hemos cambiado todavía el contrato del endpoint.

---

## 3. Test: borrar archivos que ya no vienen en el ZIP

Ahora hay que implementar el siguiente comportamiento:

```txt
Archivo existía en BD,
pero ya no viene en el ZIP nuevo
→ se elimina
```

Como siempre, empezamos creando el test.

## Resultado inicial del test

El test no pasa, como esperábamos.

Ahora toca implementar el caso de uso.

La lógica que necesitamos es:

```txt
Si un ProjectFile existe en BD
pero su path no aparece en el ZIP nuevo
→ borrarlo
```

No vamos a cambiar todavía la respuesta del caso de uso.

Seguimos manteniendo:

```ts
{
  (projectId, filesCreated, files);
}
```

## Resultado de este tercer paso

Con esto, a nivel de caso de uso, ya tenemos implementada la sincronización básica por `path` + `hash`.

Ahora `UploadProjectZipUseCase` hace esto:

```txt
Archivo nuevo
→ se crea

Archivo existente + mismo hash
→ no se duplica

Archivo existente + hash distinto
→ se actualiza

Archivo existente en BD pero ausente en el ZIP nuevo
→ se elimina
```

Ahora mismo, la respuesta que da el caso de uso sigue siendo:

```ts
{
  (projectId, filesCreated, files);
}
```

Esto no está del todo bien porque ya no cuenta toda la verdad.

Ahora también puede haber:

```txt
archivos creados
archivos actualizados
archivos eliminados
archivos sin cambios
```

Esto lo cambiaremos después.

Pero primero vamos a comprobar la sincronización desde la API real, sin cambiar todavía la respuesta.

---

## Fase 6.2 — Tests de integración HTTP y nueva respuesta

Después de comprobar el comportamiento con tests unitarios del caso de uso, vamos con los tests del endpoint.

Con esto ya tenemos comprobada la sincronización en dos niveles:

```txt
1. Test unitario del caso de uso.
2. Test de integración HTTP con PostgreSQL real de test.
```

Ahora DevMind ya hace esto correctamente:

```txt
Primer ZIP:
src/index.ts
src/app.ts
src/old.ts

Segundo ZIP:
src/index.ts    igual
src/app.ts      cambiado
src/new.ts      nuevo
```

El comportamiento esperado es:

```txt
src/index.ts → unchanged
src/app.ts   → updated
src/old.ts   → deleted
src/new.ts   → created
```

---

## Evolución de la respuesta

Ahora nos ponemos con la parte de la respuesta, para que devuelva toda la información.

Primero hay que cambiar el primer test unitario para que espere la respuesta nueva.

La nueva respuesta objetivo es:

```json
{
  "projectId": "project-1",
  "summary": {
    "created": 2,
    "updated": 1,
    "deleted": 1,
    "unchanged": 14
  },
  "files": {
    "created": [],
    "updated": [],
    "deleted": [],
    "unchanged": []
  }
}
```

Este test fallará porque `result.summary` todavía no existe.

Ahora toca implementarlo.

Tenemos que modificar el caso de uso buscando cada rama de la sincronización para que devuelva la parte correspondiente del `summary`.

También hay que modificar el `return` final.

Cada rama del caso de uso debe ir acumulando los archivos en su categoría correspondiente:

```txt
Si el archivo no existe
→ created

Si el archivo existe y tiene el mismo hash
→ unchanged

Si el archivo existe y tiene distinto hash
→ updated

Si el archivo existía en BD pero ya no viene en el ZIP
→ deleted
```

La respuesta final debe incluir:

```ts
{
  projectId,
  summary: {
    created,
    updated,
    deleted,
    unchanged
  },
  files: {
    created,
    updated,
    deleted,
    unchanged
  }
}
```

Ahora este test pasa, pero el resto no, porque todavía esperan el resultado anterior.

Antes esperaban algo como:

```ts
{
  (projectId, filesCreated, files);
}
```

Pero ahora el caso de uso devuelve:

```ts
{
  (projectId, summary, files);
}
```

Por tanto, hay que adaptar los tests antiguos al nuevo contrato de respuesta.

---

## Conclusión de la Fase 6

En esta fase hemos evolucionado `UploadProjectZipUseCase`.

Antes era una subida simple:

```txt
extraer ZIP
↓
filtrar archivos ignorados
↓
crear todos los ProjectFile
```

Ahora es una sincronización real:

```txt
extraer ZIP
↓
filtrar archivos ignorados
↓
calcular hash
↓
leer ProjectFiles actuales del proyecto
↓
comparar por path
↓
crear / actualizar / borrar / dejar igual
↓
devolver resumen
```

La sincronización se basa en:

```txt
path → para saber si es el mismo archivo
hash → para saber si el contenido ha cambiado
```

El comportamiento final es:

```txt
Archivo nuevo
→ se crea

Archivo existente + mismo hash
→ se deja igual

Archivo existente + hash distinto
→ se actualiza

Archivo existente en BD pero ausente en el ZIP nuevo
→ se elimina
```

Y la respuesta final debe evolucionar de:

```ts
{
  (projectId, filesCreated, files);
}
```

A:

```ts
{
  projectId,
  summary: {
    created,
    updated,
    deleted,
    unchanged
  },
  files: {
    created,
    updated,
    deleted,
    unchanged
  }
}
```

Con esto, DevMind ya no solo sube archivos, sino que sincroniza el estado real del proyecto al resubir un ZIP.

---

# Fase 7 — CodeChunks

## Objetivo de la fase

Ahora mismo DevMind tiene esta estructura:

```txt
Project
└── ProjectFile
```

El objetivo de esta fase es evolucionar a esta estructura:

```txt
Project
└── ProjectFile
    └── CodeChunk
```

La idea está alineada con lo que ya estaba previsto: `ProjectFile` guarda el archivo completo y `CodeChunk` guardará fragmentos pequeños para poder hacer RAG más adelante sin mandar archivos enteros a la IA.

Un `CodeChunk` será un trozo de un archivo.

Por ejemplo, este archivo:

```txt
src/users/userService.ts
```

Podría generar varios chunks:

```txt
chunk 0 → imports
chunk 1 → definición de clase UserService
chunk 2 → método createUser
chunk 3 → método findUserByEmail
```

Vamos a dividir el código por líneas.

Por ejemplo:

```txt
Chunk 0 → líneas 1-80
Chunk 1 → líneas 71-150
Chunk 2 → líneas 141-220
```

Eso incluye un pequeño `overlap`, es decir, unas líneas repetidas entre chunks para no cortar contexto de golpe.

---

## Paso 1 — Entidad CodeChunk y puerto CodeChunkRepository

Vamos a empezar creando la entidad `CodeChunk` y la interfaz de repositorio.

### Entidad CodeChunk

La entidad `CodeChunk` tendrá esta forma:

```ts
export type CodeChunk = {
  id: string;
  projectId: string;
  projectFileId: string;
  content: string;
  startLine: number;
  endLine: number;
  index: number;
  createdAt: Date;
};
```

Guardaría también `projectId`, aunque ya pueda deducirse desde `ProjectFile`.

¿Por qué?

Porque más adelante, cuando busquemos chunks de un proyecto, será mucho más cómodo hacer:

```sql
WHERE project_id = ...
```

en vez de tener que hacer joins todo el rato con `project_files`.

### Puerto CodeChunkRepository

El puerto del repositorio será:

```ts
export interface CodeChunkRepository {
  saveMany(codeChunks: CodeChunk[]): Promise<CodeChunk[]>;
  findByProjectFileId(projectFileId: string): Promise<CodeChunk[]>;
  deleteByProjectFileId(projectFileId: string): Promise<void>;
}
```

De momento no hace falta mucho más.

Más adelante, cuando lleguen los embeddings, seguramente añadiremos búsquedas tipo:

```ts
findMostSimilarByProjectId(...)
```

Pero eso todavía no toca.

---

## Paso 2 — LineCodeChunker

Vamos a crear una pieza llamada, por ejemplo:

```txt
LineCodeChunker
```

### Responsabilidad

Su responsabilidad será recibir el contenido de un archivo y dividirlo en chunks por líneas.

De momento no crea entidades `CodeChunk` completas con `id`, `projectId`, etc. Solo devuelve fragmentos con esta forma:

```ts
{
  content: string;
  startLine: number;
  endLine: number;
  index: number;
}
```

Luego el caso de uso ya convertirá esos fragmentos en `CodeChunk` reales.

Como seguimos TDD, empezaremos creando el archivo de test. Este fallará y después empezaremos a implementar.

---

### Primer ciclo TDD — Archivo pequeño

Una vez que el test falle, seguimos con la implementación de `LineCodeChunker`.

De momento creamos una implementación simple. Aunque sabemos que después tendrá que dividir archivos largos, ahora solo estamos cumpliendo el primer comportamiento que el test exige, siguiendo TDD:

```txt
primero test
↓
implementación mínima
```

Ahora los tests pasan.

---

### Segundo ciclo TDD — Archivo largo

Ahora hacemos el segundo test, todavía sin tocar la implementación.

Queremos forzar que `LineCodeChunker` ya no pueda devolver siempre un único chunk.

Este test falla.

Ahora toca modificar la implementación para que `LineCodeChunker` pueda generar varios chunks cuando el archivo supera `maxLinesPerChunk`.

Con esto deberían pasar los dos tests:

```txt
✓ devuelve un único chunk si el archivo tiene menos líneas que el máximo
✓ divide un archivo largo en varios chunks
```

---

### Tercer ciclo TDD — Overlap entre chunks

Ahora toca el tercer ciclo TDD: añadir `overlap`.

El `overlap` es importante porque evita que un chunk corte el contexto de forma brusca.

Por ejemplo, si un método empieza al final de un chunk y continúa en el siguiente, repetir unas líneas ayuda a que el siguiente chunk siga teniendo contexto.

Esto encaja con el objetivo de preparar los archivos para RAG más adelante.

Añadimos el tercer test. Este test fallará y el siguiente paso será implementar `overlapLines`.

Con esto ya tenemos cubierto:

```txt
1. Archivo pequeño → 1 chunk
2. Archivo largo → varios chunks
3. Archivo largo con overlap → varios chunks solapados
```

---

### Cuarto ciclo TDD — Contenido vacío

Ahora vamos a realizar un cuarto test importante antes de seguir: contenido vacío.

Esto importa porque `ProjectFile.content` puede estar vacío y no queremos generar un chunk inútil vacío para RAG.

Lo más limpio es que un archivo vacío devuelva:

```ts
[];
```

Añadimos el test al final del archivo de test.

Este test falla, así que vamos ahora con la implementación.

Con esto ya tenemos:

```txt
✅ archivo pequeño → 1 chunk
✅ archivo largo → varios chunks
✅ overlap entre chunks
✅ contenido vacío → []
```

---

### Quinto ciclo TDD — Configuración inválida

Al revisar el chunker, nos damos cuenta de que ahora mismo hay un caso peligroso:

```txt
maxLinesPerChunk: 3
overlapLines: 3
```

O peor:

```txt
maxLinesPerChunk: 3
overlapLines: 4
```

En esos casos, esta línea:

```ts
const step = input.maxLinesPerChunk - input.overlapLines;
```

daría `0` o un número negativo, y el bucle podría quedarse mal o infinito.

Vamos a generar el test para esto y luego su implementación.

Con esto dejamos `LineCodeChunker` suficientemente sólido para seguir con lo siguiente.

---

## Paso 3 — GenerateCodeChunksForProjectFileUseCase

Ahora vamos a empezar con el caso de uso.

Primero generamos los tests, como siempre.

El test que creamos comprueba tres cosas importantes:

```txt
1. Que antes de generar nuevos chunks se borran los chunks antiguos del archivo.
2. Que cada chunk generado se convierte en un CodeChunk real con id, projectId y projectFileId.
3. Que el caso de uso devuelve un resumen simple con los chunks creados.
```

Cuando este test falle, empezamos con el caso de uso.

En el caso de uso, en vez de importar directamente el propio `LineCodeChunker`, creamos un tipo o interfaz para que el caso de uso no dependa estrictamente de la implementación del chunker.

Así el caso de uso depende de una interfaz, siguiendo Clean Architecture / Hexagonal Architecture.

---

### Caso ProjectFile con contenido vacío

Ahora toca añadir un test más al caso de uso para cubrir un caso importante: `ProjectFile` con contenido vacío.

Esto importa porque en el proyecto `ProjectFile.content` puede estar vacío, pero para RAG no queremos guardar chunks vacíos.

Además, aunque el archivo esté vacío, sí tiene sentido borrar chunks antiguos por si antes ese archivo tenía contenido y luego quedó vacío tras una resubida del ZIP.

El test del caso de uso no repite la responsabilidad de `LineCodeChunker`.

`LineCodeChunker` ya prueba que `content: ""` devuelve `[]`.

Aquí solo probamos que el caso de uso se comporta bien cuando no hay chunks que guardar.

Esto mantiene separadas las responsabilidades de esta fase:

```txt
LineCodeChunker → parte texto.
GenerateCodeChunksForProjectFileUseCase → convierte esos resultados en CodeChunk y los persiste.
```

Añadimos el test al fichero de test.

Con esto queda cerrado:

```txt
✅ CodeChunk entity
✅ CodeChunkRepository port
✅ LineCodeChunker con tests
✅ GenerateCodeChunksForProjectFileUseCase con tests
✅ Caso de 0 chunks cubierto
```

---

## Paso 4 — Persistir CodeChunks en PostgreSQL

Ahora toca la siguiente pieza:

```txt
Persistir CodeChunks en PostgreSQL
```

Es decir, crear:

```txt
004_create_code_chunks.sql
PostgresCodeChunkRepository
tests de integración del repositorio
```

Pero siguiendo TDD, no empezamos por la migración ni por el repositorio.

Empezamos por el test de integración que todavía va a fallar.

Vamos a generar el test que falle.

Una vez que el test falla, empezamos con las implementaciones:

```txt
- Creamos la migración para crear la tabla en SQL.
- Creamos PostgresCodeChunkRepository.
```

Antes de continuar, añadimos un nuevo test para probar:

```txt
Si se borra un ProjectFile,
sus CodeChunks deben borrarse automáticamente por ON DELETE CASCADE.
```

---

## Paso 5 — Integrar CodeChunks con la subida/resubida del ZIP

Ahora toca integrar `CodeChunks` con la subida y resubida del ZIP.

La regla que vamos a implementar será esta:

```txt
created   → generar chunks
updated   → regenerar chunks
deleted   → borrar ProjectFile y dejar que PostgreSQL borre chunks por CASCADE
unchanged → no tocar chunks
```

Esto encaja directamente con la sincronización que ya se hizo en la fase anterior, donde el ZIP distingue archivos creados, actualizados, eliminados y sin cambios.

Vamos a empezar añadiendo tests al archivo de test `UploadProjectZipUseCase`.

Queremos comprobar:

```txt
- cuando se sube un ZIP con un archivo nuevo, debería generar chunks para el ProjectFile creado.
- cuando se resube un ZIP con un archivo actualizado, debería regenerar chunks para ese ProjectFile.
- cuando se resube un ZIP con un archivo unchanged, no debería regenerar chunks.
```

Lo que se añade al test es:

```txt
created → debe llamar al generador de chunks
updated → debe llamar al generador de chunks
unchanged → NO debe llamar al generador de chunks
```

En el test, le pasamos al caso de uso `UploadProjectZipUseCase` 5 dependencias en vez de 4 como estaba configurado, y el test fallará por eso.

Debemos implementar eso en `UploadProjectZipUseCase`, porque ahora le pasamos una dependencia para que no solo guarde los archivos, sino que genere chunks de cada uno.

También debemos modificar el `container` para pasarle las 5 dependencias.

---

## Paso 6 — Test de integración HTTP/PostgreSQL

Ahora toca el test de integración HTTP/PostgreSQL.

Es decir, comprobar que cuando llamas al endpoint real:

```txt
POST /projects/:id/upload
```

no solo se crean `ProjectFiles`, sino que también aparecen registros reales en la tabla `code_chunks`.

El siguiente test debería ir en el test de integración del endpoint ZIP, algo como:

```txt
cuando se sube un ZIP por HTTP,
debería crear ProjectFiles y también CodeChunks en PostgreSQL
```

Y después otro:

```txt
cuando se resube un ZIP con un archivo modificado,
debería regenerar sus CodeChunks
```

Con esto ya comprobado mediante test, podemos cerrar:

```txt
✅ LineCodeChunker por líneas
✅ Tests unitarios del LineCodeChunker
✅ Entidad CodeChunk
✅ Puerto CodeChunkRepository
✅ Migración code_chunks
✅ PostgresCodeChunkRepository
✅ Tests de integración del repositorio
✅ GenerateCodeChunksForProjectFileUseCase
✅ Tests unitarios del caso de uso
✅ Integración con UploadProjectZipUseCase
✅ Integración real en POST /projects/:id/upload
✅ Tests HTTP comprobando creación, actualización, unchanged y borrado por cascade
```

---

## Conclusión de la Fase 7

En esta fase se añadió una nueva entidad `CodeChunk` para representar fragmentos de código derivados de `ProjectFile`.

Los archivos se dividen por líneas usando `LineCodeChunker`, con soporte para:

```txt
- tamaño máximo por chunk;
- overlap entre chunks;
- contenido vacío;
- validación de configuración inválida.
```

Cada vez que se sube o resube un ZIP:

```txt
- los archivos nuevos generan chunks;
- los archivos modificados regeneran chunks;
- los archivos eliminados borran sus chunks mediante ON DELETE CASCADE;
- los archivos sin cambios conservan sus chunks.
```

Esto prepara el sistema para la siguiente fase: embeddings y búsqueda semántica.

---

## Revisión adicional de la Fase 7 — Inconsistencias, seguridad y README

En esta fase también se realiza un análisis de búsqueda de problemas, inconsistencias y seguridad.

### Inconsistencias detectadas

```txt
🟡 Inconsistencias:
```

- Naming de errores que mezclaba dos convenciones.
- Generación de tipos de errores para cumplir el contrato de `errorMiddleware`.
- Patrón de DI inconsistente, reunificado todo para que el `container` se instancie bien en el route, que actúa como `composition root`, y los controllers solo reciban lo que necesitan.

### Seguridad

```txt
🔴 Seguridad:
```

- **Alta:** establecer un límite de tamaño del ZIP subido y generar protección básica contra zip-bomb.
- **Media:** si no se define la variable, la app arranca igualmente firmando tokens con un secreto público hardcodeado, en vez de fallar rápido. Arreglar eso.
- **Media:** no hay `express-rate-limit`. `POST /auth/login` y `POST /auth/register` no tienen ninguna protección contra fuerza bruta. Solucionar eso instalando y aplicando con un middleware `express-rate-limit`. El middleware se desactiva automáticamente cuando `NODE_ENV === "test"`, porque Vitest lo pone así por defecto, para no romper la suite de integración que hace muchos registros/logins seguidos desde la misma IP.

---

## Pulido del README.md

```txt
🔵 Pulido del README.md
```

### DevMind API — Resumen del proyecto hasta Fase 7

#### Qué es DevMind

DevMind es una API backend con Node.js, TypeScript y Express que permite a un usuario autenticado crear proyectos software, subir su código vía ZIP y, en fases futuras, consultarlo en lenguaje natural usando IA mediante RAG.

La idea central es convertir un proyecto software en una fuente de conocimiento consultable, útil para:

```txt
devs nuevos
equipos con proyectos grandes
equipos sin documentación actualizada
personas que entran a mantener código ajeno
```

### Arquitectura

La arquitectura usada es Clean/Hexagonal Architecture:

```txt
domain
→ entidades + interfaces de repositorio

application
→ casos de uso + puertos

infrastructure
→ adaptadores reales: Postgres, bcrypt, JWT, adm-zip...

transport/http
→ Express: routes, controllers, middlewares

container
→ inyección de dependencias manual
```

La metodología seguida es:

```txt
TDD en dominio/aplicación
tests de integración HTTP con Supertest para la capa de transporte
```

### Jerarquía de dominio actual

La jerarquía de dominio actual queda así:

```txt
User
└── Project
    └── ProjectFile
        └── CodeChunk
```

---

## Fases completadas hasta Fase 7

### Fase 0 — Setup inicial

Proyecto Node/TypeScript/Express, Vitest + Supertest, estructura de carpetas limpia, `tsconfig`, `.env.example` y endpoint `/health`.

### Fase 1 — Autenticación

Se implementó:

- `User`.
- `UserRepository`.
- Casos de uso:
  - `RegisterUserUseCase`.
  - `LoginUserUseCase`.
  - `GetCurrentUserUseCase`.
- Adaptadores reales:
  - `bcryptjs`.
  - `jsonwebtoken`.
  - `crypto.randomUUID`.
- Endpoints:
  - `POST /auth/register`.
  - `POST /auth/login`.
  - `GET /auth/me`.
- `authMiddleware`.
- `errorMiddleware`.
- Validación con Zod.

Errores propios:

- `UserAlreadyExistsError`.
- `InvalidCredentialsError`.
- `UserNotFoundError`.
- `UnauthorizedError`.

### Fase 2 — Proyectos persistentes

Se implementó:

- `Project`.
- `ProjectRepository`.
- CRUD de proyectos por usuario:
  - `POST /projects`.
  - `GET /projects`.
  - `GET /projects/:id`.
  - `DELETE /projects/:id`.

Regla clave:

```txt
nunca buscar solo por id,
siempre projectId + ownerId
```

Un proyecto de otro usuario responde `404`, no `403`, para no revelar su existencia.

Error propio:

- `ProjectNotFoundError`.

### Fase 3 — ProjectFiles básicos

Se implementó:

- `ProjectFile`.
- `ProjectFileRepository`.
- CRUD de archivos vía JSON, sin ZIP todavía:
  - `POST /projects/:projectId/files`.
  - `GET /projects/:projectId/files`.
  - `GET /projects/:projectId/files/:fileId`.
  - `DELETE /projects/:projectId/files/:fileId`.
- Cálculo de `size`.
- Cálculo de `hash`.
- Misma regla de seguridad por ownership.

Error propio:

- `ProjectFileNotFoundError`.

### Fase 4 — PostgreSQL

Se sustituyen los repositorios en memoria por:

- `PostgresUserRepository`.
- `PostgresProjectRepository`.
- `PostgresProjectFileRepository`.

También se añade:

- Docker Compose.
- `postgresPool`.
- Migraciones SQL con `ON DELETE CASCADE`.
- Base de datos separada `devmind_test_db` para tests.
- `globalSetup` que limpia tablas antes y después de cada ejecución de tests.

### Fase 5 — Subida de ZIP

Se añade el endpoint:

```txt
POST /projects/:projectId/upload
```

Con `multipart/form-data` y campo:

```txt
file
```

`UploadProjectZipUseCase` coordina:

```txt
multer recibe el ZIP
↓
puerto ZipExtractor
↓
implementación real AdmZipExtractor
↓
extrae archivos
↓
se ignoran carpetas inútiles
↓
se crean ProjectFile
```

Carpetas ignoradas:

- `node_modules`.
- `.git`.
- `dist`.
- `build`.
- `coverage`.
- `.next`.

Si no queda ningún archivo válido:

```txt
NoValidProjectFilesFoundError → 400
```

Si no se adjunta archivo:

```txt
400 "Zip file is required"
```

### Fase 6 — Sincronización por path + hash

Evita duplicados al resubir el mismo ZIP.

Compara los archivos entrantes con los existentes por `path`, y por `hash` decide si están sin cambios.

Comportamiento:

```txt
nuevo → created
mismo path, hash distinto → updated
mismo path, mismo hash → unchanged
existía en BD pero ya no está en el ZIP → deleted
```

Para actualizar archivos se añade un nuevo método `update()` en `ProjectFileRepository`.

Caso especial:

```txt
archivo movido de carpeta = mismo hash pero distinto path
```

Se interpreta como:

```txt
deleted → ruta vieja
created → ruta nueva
```

Esto es válido para el objetivo actual.

Contrato de respuesta actualizado:

```json
{
  "projectId": "...",
  "summary": {
    "created": 0,
    "updated": 0,
    "deleted": 0,
    "unchanged": 0
  },
  "files": {
    "created": [],
    "updated": [],
    "deleted": [],
    "unchanged": []
  }
}
```

### Fase 7 — CodeChunks

Nueva entidad `CodeChunk`:

```txt
id
projectId
projectFileId
content
startLine
endLine
index
createdAt
```

Nuevo puerto `CodeChunkRepository`:

```txt
saveMany
findByProjectFileId
deleteByProjectFileId
```

`LineCodeChunker` trocea el contenido de un archivo por líneas, con:

- `maxLinesPerChunk` configurable.
- `overlapLines` configurable.
- `[]` si el contenido está vacío.
- Protección contra configuraciones inválidas, por ejemplo `overlap >= maxLines`.

`GenerateCodeChunksForProjectFileUseCase`:

```txt
borra chunks antiguos del archivo
genera los nuevos fragmentos
los persiste
```

Integrado en la subida/resubida de ZIP:

```txt
created / updated → (re)genera chunks
unchanged → no toca chunks
deleted → el ProjectFile se borra y sus chunks caen por ON DELETE CASCADE
```

Persistencia real en PostgreSQL:

```txt
004_create_code_chunks.sql
PostgresCodeChunkRepository
```

También se añade test específico de borrado en cascada.

Verificado con test de integración HTTP end-to-end sobre:

```txt
POST /projects/:id/upload
```

---

## Estado actual tras la Fase 7

Todo lo anterior está commiteado y el árbol de trabajo está limpio.

`docs/openapi.yaml` está al día con el contrato real.

Incluye:

- `summary`.
- `files` agrupados.
- Una nota sobre la indexación en chunks como efecto secundario interno sin cambiar la respuesta HTTP.

El siguiente paso lógico es:

```txt
Fase 8 — Embeddings + búsqueda semántica
```

El objetivo será generar embeddings de cada `CodeChunk` y poder buscar los chunks más relevantes para una consulta en lenguaje natural.

Esto es el paso previo imprescindible antes de la siguiente fase de IA/RAG, donde ya se podrán responder preguntas sobre el proyecto usando esos chunks recuperados.

---

# Fase 8 — Genkit + PostgreSQL/pgvector, embeddings y búsqueda semántica

## Objetivo de la fase

Hasta ahora tenemos esto cerrado:

```txt
projects
└── project_files
    └── code_chunks
```

Queremos llegar a esto:

```txt
projects
└── project_files
    └── code_chunks
        └── embedding vectorial
```

Pero no lo haremos “a mano sin Genkit”.

Lo haremos usando Genkit como capa de IA.

La responsabilidad quedaría así:

```txt
DevMind:
- usuarios
- proyectos
- archivos
- chunks
- permisos
- sincronización ZIP
- PostgreSQL

Genkit:
- modelo de embeddings
- generación de vectores
- recuperación semántica
- generación de respuesta
```

PostgreSQL con `pgvector` será el sitio donde guardaremos los embeddings.

Genkit tiene documentación oficial para usar PostgreSQL con `pgvector` como implementación de retriever, y explica que `pgvector` permite almacenar y consultar vectores de alta dimensión dentro de PostgreSQL.

---

## Qué es un embedding

Un embedding es una lista de números que representa el significado de un texto.

Ejemplo conceptual:

```txt
"crear usuario con email y contraseña"
↓
[0.123, -0.456, 0.982, ...]
```

Luego, cuando el usuario pregunte:

```txt
¿Dónde se registra un usuario?
```

la app también convierte esa pregunta en embedding y busca los chunks cuyos embeddings sean más parecidos.

Ese será el corazón del RAG.

---

## Metodología

En todo momento seguimos TDD:

```txt
1. Primero test
2. Ver que falla
3. Implementación mínima
4. Ver que pasa
5. Refactor si hace falta
```

---

## División prevista de la Fase 8

La fase se divide en los siguientes puntos:

```txt
8.1 Preparar PostgreSQL para pgvector
- Test primero: comprobar que PostgreSQL acepta la extensión vector.
- Fallará si la imagen actual no soporta pgvector.
- Implementación: cambiar Docker a una imagen con pgvector y crear migración.

8.2 Crear tabla de embeddings
- Test primero: comprobar que se puede guardar un embedding asociado a un CodeChunk.
- Fallará porque no existe la tabla.
- Implementación: migración code_chunk_embeddings.

8.3 Crear repositorio de embeddings
- Test primero: PostgresCodeChunkEmbeddingRepository guarda, busca y borra embeddings.
- Implementación mínima del repositorio.

8.4 Crear puerto EmbeddingGenerator
- Test primero con fake: dado un CodeChunk, se llama al generador con su content.
- Implementación: interfaz/puerto.

8.5 Crear GenerateEmbeddingForCodeChunkUseCase
- Test primero: genera embedding, lo guarda y devuelve resultado.
- Implementación mínima del caso de uso.

8.6 Crear adaptador GenkitEmbeddingGenerator
- Test controlado: comprobar que el adaptador llama a Genkit y devuelve number[].
- Implementación con ai.embed.

8.7 Integrar embeddings con generación de chunks
- Test primero: cuando se generan chunks nuevos, se generan embeddings.
- Implementación mínima.
- Test: unchanged no regenera embeddings.

8.8 Integrar con subida/resubida ZIP
- Test HTTP primero: al subir ZIP se crean chunks y embeddings.
- Test HTTP: al resubir ZIP, updated regenera embeddings y unchanged no.

8.9 Crear búsqueda semántica
- Test primero: dado un embedding de pregunta, se devuelven chunks del mismo proyecto ordenados por similitud.
- Implementación con pgvector.

8.10 Crear endpoint de preguntas
- Test HTTP primero:
  POST /projects/:projectId/ask
- Implementación:
  auth, project ownership, retrieve, generate, answer + sources.
```

---

## Fase 8.1 — Preparar PostgreSQL para pgvector

Como este proyecto sigue TDD, primero empezaremos con los tests.

Queremos comprobar esto:

```txt
PostgreSQL tiene habilitada la extensión vector.
```

Esa extensión es la que permite usar `pgvector`.

Vamos a crear el test `postgresVectorExtension`.

Este test mira dentro de PostgreSQL si existe una extensión llamada:

```txt
vector
```

El test falla porque aún no hay nada implementado.

Ahora que el test está en rojo, vamos con la implementación para ponerlo en verde:

```txt
- Crear migración para activar pgvector.
- De momento solo activamos la extensión.
- Es la implementación mínima para que el test pase.
```

Esto probablemente dará un error porque el servidor de Docker que hemos levantado con PostgreSQL no tiene `pgvector` instalado.

Para ello hay que modificar la imagen en el `docker-compose`.

Con todo esto, el test ya pasa.

---

## Fase 8.2 — Crear tabla para guardar embeddings

Queremos probar esto:

```txt
Dado un CodeChunk existente,
puedo guardar un embedding asociado a ese CodeChunk.
```

La tabla todavía no existe, así que el test debería fallar.

Empezamos creando el test `codeChunkEmbeddingsTable`.

Este test crea toda la cadena necesaria:

```txt
user
↓
project
↓
project_file
↓
code_chunk
↓
code_chunk_embedding
```

Y comprueba que el embedding guardado tiene dimensión:

```txt
768
```

Esto es importante porque nuestra futura tabla tendrá algo como:

```sql
embedding vector(768)
```

Ahora que el test falla en rojo, hacemos la implementación mínima: crear la tabla.

Creamos el archivo de migración para crear la tabla.

Con esto ya pasan todos los tests.

---

## Fase 8.3 — Crear PostgresCodeChunkEmbeddingRepository con TDD

Después de esto, lo primero es poder guardar y leer embeddings desde PostgreSQL en `PostgresCodeChunkEmbeddingRepository`.

Creamos primero el test de repositorio:

```txt
postgresCodeChunkEmbeddingRepository
```

En este test estamos probando:

```txt
Quiero un repositorio capaz de:
1. recibir un embedding como number[]
2. guardarlo en PostgreSQL como vector(768)
3. recuperarlo otra vez como number[]
4. mantener la relación con projectId y codeChunkId
```

Una vez que vemos que el test falla, pasamos a implementar:

```txt
- la entidad de embedding;
- la interfaz del repositorio;
- su adaptador en infraestructura.
```

---

## Fase 8.4 — Caso de uso para generar embedding de un CodeChunk

Queremos algo así:

```txt
CodeChunk
↓
EmbeddingGenerator
↓
CodeChunkEmbeddingRepository
↓
embedding guardado
```

El caso de uso hará:

```txt
1. Recibe un CodeChunk.
2. Le pasa el content al generador de embeddings.
3. Recibe un number[].
4. Crea un CodeChunkEmbedding.
5. Lo guarda en PostgreSQL mediante el repositorio.
```

Primero, como siempre, vamos con el test.

Una vez que veamos que este test falla, pasamos a implementar el puerto `EmbeddingGenerator` y `GenerateEmbeddingForCodeChunkUseCase`.

El caso de uso recibe un `CodeChunk`.

Ejemplo:

```ts
{
  id: "code-chunk-1",
  projectId: "project-1",
  content: "export const hello = 'world';"
}
```

Luego hace:

```txt
1. Coge el content del CodeChunk.
2. Se lo pasa al EmbeddingGenerator.
3. Recibe un number[].
4. Crea un CodeChunkEmbedding.
5. Lo guarda con el repositorio.
```

Cadena:

```txt
CodeChunk.content
↓
EmbeddingGenerator.generateEmbedding(...)
↓
number[]
↓
CodeChunkEmbedding
↓
CodeChunkEmbeddingRepository.save(...)
```

---

### Regeneración de embedding para el mismo CodeChunk

Una vez que ya tenemos esto pasando e implementado, añadimos un nuevo test para que se comporte de esta manera:

```txt
Si genero embedding para un CodeChunk por primera vez:
→ guarda embedding nuevo

Si genero embedding otra vez para el mismo CodeChunk:
→ borra el embedding anterior
→ guarda el nuevo
```

Este test no pasa y, por tanto, nos ponemos a implementar esta nueva lógica en el caso de uso.

---

### Borrado de embeddings

Ahora vamos a añadir dos nuevos tests para comprobar que, si se borra un `CodeChunk`, su embedding debe borrarse también.

Los tests los añadimos al test de repositorio.

El primer test comprueba esto:

```txt
repository.deleteByCodeChunkId(...)
↓
borra el embedding
```

El segundo comprueba esto:

```txt
DELETE code_chunk
↓
PostgreSQL borra embedding por ON DELETE CASCADE
```

Esto nos protege para la sincronización ZIP.

Estos tests pasan porque ya tenemos bastante implementado.

---

## Fase 8.5 — Crear el adaptador real GenkitEmbeddingGenerator

Vamos a empezar ya con Genkit para usarlo para generar embeddings.

Primero instalamos:

```txt
genkit
@genkit-ai/google-genai
```

Y en el `.env` añadimos:

```env
GEMINI_API_KEY=tu_api_key
```

Primero generamos el test `genkitEmbeddingGenerator`.

Este test no llama a Google.

Solo comprueba que nuestro adaptador usa el `ai` real configurado, pero mockeado durante el test.

Debería fallar porque todavía no existen estos archivos:

```txt
src/infrastructure/genkit/ai.ts
src/infrastructure/genkit/genkitEmbeddingGenerator.ts
```

Una vez que vemos que falla, pasamos a crear las implementaciones.

Una vez creadas y visto que ya pasan los tests, ya tenemos la siguiente cadena:

```txt
CodeChunk
↓
GenerateEmbeddingForCodeChunkUseCase
↓
GenkitEmbeddingGenerator
↓
Genkit ai.embed(...)
↓
PostgresCodeChunkEmbeddingRepository
↓
code_chunk_embeddings
```

Lo siguiente es conectar esa cadena al flujo que ya teníamos de chunks.

---

## Fase 8.6 — Generar embeddings automáticamente cuando se generan CodeChunks

El sitio correcto para conectarlo es:

```txt
GenerateCodeChunksForProjectFileUseCase
```

Porque ahora mismo ese caso de uso hace algo así:

```txt
ProjectFile
↓
LineCodeChunker
↓
CodeChunks
↓
saveMany(...)
```

Y queremos que pase a ser:

```txt
ProjectFile
↓
LineCodeChunker
↓
CodeChunks
↓
saveMany(...)
↓
GenerateEmbeddingForCodeChunkUseCase por cada chunk guardado
```

Así luego, por herencia, la subida ZIP quedará bien:

```txt
created file → genera chunks → genera embeddings
updated file → regenera chunks → regenera embeddings
unchanged file → no hace nada
deleted file → cascade borra chunks y embeddings
```

Como siempre, empezamos con los tests:

```txt
- Vamos a modificar generateCodeChunksForProjectFileUseCase.test.
- El test fallará porque al caso de uso le pasamos 4 cosas cuando debería recibir solo 3.
- Por lo tanto, modificamos GenerateCodeChunksForProjectFileUseCase.
- También hay que modificar los tests antiguos, ya que ahora el caso de uso recibe 4 cosas.
- También hay que modificar el container.
```

---

## Cierre parcial de la integración de embeddings

Para cerrar esta parte, añadimos un test en `uploadZipEndpoint`.

Queremos demostrar esto:

```txt
Cuando subo un ZIP por el endpoint,
se crean ProjectFiles,
se crean CodeChunks,
y también se crean CodeChunkEmbeddings.
```

Estos tests pasan.

Entonces cerramos esta parte:

```txt
✅ Upload ZIP crea ProjectFiles
✅ Upload ZIP crea CodeChunks
✅ Upload ZIP crea CodeChunkEmbeddings
✅ La sincronización ZIP conserva embeddings de unchanged
✅ Regenera embeddings de updated
✅ Borra embeddings de deleted por cascade
✅ Todos los tests pasan
```

Ahora mismo DevMind ya tiene esta cadena funcionando:

```txt
ZIP
↓
ProjectFiles
↓
CodeChunks
↓
Embeddings
↓
PostgreSQL/pgvector
```

Esto es un avance importante porque ya no solo guardamos el código troceado, sino también su representación vectorial.

---

## Fase 8.7 — Búsqueda semántica de chunks mediante embeddings

Para cerrar la fase entera, nos falta una última parte: usar los embeddings que ya guardamos.

Ahora mismo tenemos esto cerrado:

```txt
ZIP
↓
ProjectFiles
↓
CodeChunks
↓
Embeddings guardados en PostgreSQL/pgvector
```

Lo que falta para cerrar la fase de embeddings y búsqueda es:

```txt
embedding de pregunta
↓
buscar embeddings parecidos en PostgreSQL/pgvector
↓
devolver CodeChunks relevantes
```

`pgvector` permite ordenar vectores por distancia usando operadores como `<->` para distancia L2.

La documentación oficial muestra consultas tipo:

```sql
ORDER BY embedding <-> '[3,1,2]' LIMIT 5
```

Ese es justo el patrón que usaremos para buscar los chunks más cercanos.

Empezamos como siempre creando el test.

Vamos a modificar el test de `postgresCodeChunkEmbeddingRepository.test`.

Este debería fallar porque aún no hemos implementado el nuevo método en:

```txt
codeChunkEmbeddingRepository.ts
postgresCodeChunkEmbeddingRepository.ts
```

Una vez que vemos que falla, pasamos a implementar:

```txt
- Implementamos el nuevo método en el puerto del repositorio de embedding.
- Tenemos que crear el nuevo método y el nuevo tipo que devolver en array.
- Esto añade al contrato nuevo: dado un projectId + embedding de pregunta, devuélveme chunks parecidos de ese proyecto.
- Implementamos el adaptador del repositorio.
- Hay que actualizar el import para recibir el tipo SimilarCodeChunk.
- También añadimos e implementamos el nuevo método.
```

Con esto ya tenemos creado el nuevo método que buscará los chunks parecidos cuando un usuario le pase la pregunta.

---

## Resumen final — Estado actual del sistema RAG

Después de las últimas fases, DevMind ya tiene construida una cadena completa desde la subida del proyecto hasta la generación de embeddings.

La cadena actual es:

```txt
ZIP
↓
ProjectFiles
↓
CodeChunks
↓
Embeddings
↓
PostgreSQL/pgvector
```

Esto significa que DevMind ya puede recibir un proyecto comprimido en ZIP, convertir sus archivos en `ProjectFiles`, dividir esos archivos en `CodeChunks`, generar embeddings para esos chunks y guardarlos en PostgreSQL usando `pgvector`.

Además, ya se ha construido la base para la búsqueda semántica:

```txt
embedding de una pregunta
↓
buscar chunks parecidos por projectId
↓
devolver chunks relevantes ordenados por similitud
```

Esto es muy importante porque ya está creada la base real del sistema RAG.

Ahora DevMind no solo guarda código, sino que también puede representar ese código de forma vectorial y buscar fragmentos relevantes según el significado de una pregunta.

---

## Qué se ha cerrado en la Fase 8

En esta parte del proyecto se ha dejado implementado y comprobado:

```txt
✅ PostgreSQL preparado con pgvector
✅ Migración CREATE EXTENSION vector
✅ Tabla code_chunk_embeddings
✅ Repositorio de embeddings
✅ Guardar embedding
✅ Buscar embedding por codeChunkId
✅ Borrar embedding
✅ Borrado automático por cascade
✅ Puerto EmbeddingGenerator
✅ Caso de uso GenerateEmbeddingForCodeChunkUseCase
✅ Genkit instalado/configurado
✅ GenkitEmbeddingGenerator usando ai.embed
✅ Integración embeddings con generación de CodeChunks
✅ Integración embeddings con subida/resubida ZIP
✅ Test HTTP comprobando ProjectFiles + CodeChunks + Embeddings
✅ Método findSimilarByProjectId
✅ Búsqueda semántica filtrada por proyecto
```

Con esto, DevMind ya tiene preparada la parte necesaria para conectar el contenido del proyecto con búsquedas por significado.

---

## Flujo actual de sincronización

Ahora, cuando se sube o se resube un ZIP, DevMind sincroniza el proyecto de forma inteligente.

### Archivo nuevo

```txt
archivo created
↓
ProjectFile nuevo
↓
CodeChunks nuevos
↓
Embeddings nuevos
```

Si el archivo no existía antes, DevMind lo crea como `ProjectFile`, genera sus `CodeChunks` y después genera los embeddings correspondientes.

---

### Archivo actualizado

```txt
archivo updated
↓
ProjectFile actualizado
↓
CodeChunks regenerados
↓
Embeddings regenerados
```

Si el archivo ya existía pero su contenido ha cambiado, DevMind actualiza el `ProjectFile`, regenera sus chunks y vuelve a generar sus embeddings.

---

### Archivo sin cambios

```txt
archivo unchanged
↓
ProjectFile igual
↓
CodeChunks conservados
↓
Embeddings conservados
```

Si el archivo sigue igual, DevMind no hace trabajo innecesario.

Conserva el `ProjectFile`, los `CodeChunks` y los embeddings que ya existían.

---

### Archivo eliminado

```txt
archivo deleted
↓
ProjectFile eliminado
↓
CodeChunks eliminados por cascade
↓
Embeddings eliminados por cascade
```

Si un archivo ya no aparece en el nuevo ZIP, DevMind elimina el `ProjectFile`.

Después, PostgreSQL se encarga de borrar automáticamente sus `CodeChunks` y sus embeddings mediante `ON DELETE CASCADE`.

---

## Flujo actual de búsqueda semántica

Además de generar embeddings para el código, DevMind ya tiene la base para buscar fragmentos relevantes a partir de una pregunta.

El flujo es:

```txt
pregunta del usuario
↓
embedding de la pregunta
↓
findSimilarByProjectId
↓
chunks relevantes del mismo proyecto
```

Esto permite que una pregunta del usuario se convierta en un embedding y se compare con los embeddings de los chunks guardados.

La búsqueda se filtra por `projectId`, por lo que DevMind solo devuelve fragmentos relevantes del proyecto sobre el que el usuario está preguntando.

---

## Estado actual de DevMind tras la Fase 8

En este punto, DevMind ya tiene construida la base técnica real para RAG.

El sistema puede:

```txt
1. Recibir un ZIP de un proyecto.
2. Extraer sus archivos.
3. Guardarlos como ProjectFiles.
4. Dividirlos en CodeChunks.
5. Generar embeddings de cada chunk.
6. Guardar esos embeddings en PostgreSQL/pgvector.
7. Sincronizar correctamente archivos creados, actualizados, eliminados y sin cambios.
8. Buscar chunks relevantes mediante similitud vectorial.
9. Filtrar la búsqueda semántica por proyecto.
```

Esto deja el proyecto preparado para el siguiente gran paso: usar esos chunks relevantes como contexto para que la IA pueda responder preguntas sobre el proyecto.

# FASE 9 — IA/RAG: preguntas sobre el proyecto

## Objetivo de la fase

En esta fase empezamos la parte de IA real del proyecto.

La idea es que DevMind pueda recibir una pregunta del usuario sobre un proyecto, generar un embedding de esa pregunta, buscar los chunks más parecidos usando ese embedding y pasar esos chunks como contexto a una IA para que genere una respuesta.

El flujo general será:

```txt
pregunta del usuario
↓
generar embedding de la pregunta
↓
buscar chunks más parecidos en PostgreSQL/pgvector
↓
pasar chunks relevantes a la IA
↓
generar respuesta
↓
devolver answer + sources
```

Esta fase conecta la base RAG que ya teníamos construida con una respuesta final generada por IA.

Hasta ahora DevMind ya tenía esta cadena:

```txt
ZIP
↓
ProjectFiles
↓
CodeChunks
↓
Embeddings
↓
PostgreSQL/pgvector
```

Ahora añadimos el último paso:

```txt
pregunta del usuario
↓
búsqueda semántica
↓
chunks relevantes
↓
IA
↓
respuesta
```

---

# FASE 9.1 — AskProjectQuestionUseCase

## Objetivo

Vamos a empezar creando el caso de uso encargado de responder preguntas sobre un proyecto.

El caso de uso será:

```ts
AskProjectQuestionUseCase;
```

Su responsabilidad será coordinar todo el flujo RAG:

```txt
validar proyecto
↓
validar pregunta
↓
generar embedding de la pregunta
↓
buscar chunks similares del proyecto
↓
si no hay contexto suficiente, devolver respuesta segura
↓
si hay chunks relevantes, llamar al generador de respuestas
↓
devolver answer + sources
```

Como siempre, seguimos TDD:

```txt
1. Crear el test
2. Comprobar que falla
3. Implementar el mínimo código necesario
4. Comprobar que pasa
5. Refactorizar si hace falta
```

---

## Primer test del caso de uso

Empezamos creando el test:

```txt
askProjectQuestionUseCase.test
```

Este test comprueba el flujo básico del caso de uso.

Una vez vemos que el test falla, pasamos a la implementación.

---

## Implementación inicial

Para que el test pase, creamos dos piezas:

```txt
1. Puerto AnswerGenerator
2. Caso de uso AskProjectQuestionUseCase
```

---

## Puerto AnswerGenerator

Creamos el puerto:

```ts
AnswerGenerator;
```

Este puerto representa la pieza que más adelante conectaremos con Genkit.

De momento solo necesitamos la interfaz, porque el test usa un fake, igual que ya hicimos anteriormente con `EmbeddingGenerator`.

La idea es que el caso de uso no dependa directamente de Genkit, sino de una interfaz.

Así mantenemos la arquitectura limpia/hexagonal:

```txt
application
↓
puerto AnswerGenerator
↓
infrastructure
↓
implementación real con Genkit
```

---

## AskProjectQuestionUseCase

Creamos el caso de uso:

```ts
AskProjectQuestionUseCase;
```

Con la implementación inicial, el primer test ya pasa.

---

# Nuevos tests del caso de uso

Una vez creado el flujo básico, añadimos nuevos tests para cubrir comportamientos importantes.

---

## 1. Validación de pregunta vacía

Queremos evitar que el usuario pueda enviar una pregunta vacía.

El comportamiento esperado es:

```txt
pregunta vacía
↓
error de validación / respuesta controlada
```

Añadimos un nuevo test para validar este caso.

El test falla porque todavía no está implementada esta validación.

Después añadimos la implementación en el caso de uso para que el test pase.

---

## 2. Si el usuario no es dueño del proyecto, no puede preguntar sobre él

También añadimos un test para comprobar que un usuario no pueda preguntar sobre un proyecto que no le pertenece.

La regla sigue siendo la misma que en el resto de DevMind:

```txt
Nunca operar solo por projectId.
Siempre comprobar projectId + ownerId.
```

Si el proyecto no pertenece al usuario, se responde como si no existiera.

Esto evita revelar información sobre proyectos de otros usuarios.

El comportamiento esperado es:

```txt
usuario no dueño del proyecto
↓
ProjectNotFoundError / 404
```

Este test pasa directamente porque el comportamiento ya estaba cubierto por la validación de ownership del proyecto.

---

## 3. Evitar respuestas inventadas si no hay chunks relevantes

Este test es muy importante.

Queremos evitar que la IA invente respuestas cuando no hay contexto suficiente del proyecto.

El flujo esperado es:

```txt
pregunta válida
↓
embedding de la pregunta
↓
búsqueda semántica
↓
0 chunks encontrados
↓
NO llamar a la IA
↓
devolver respuesta segura
```

Esto es importante porque, en un sistema RAG, si no hay contexto recuperado, lo más seguro es no pedirle a la IA que responda.

Si llamamos a la IA sin contexto, podría inventarse una respuesta.

Por eso, si no hay chunks relevantes, DevMind debe devolver una respuesta segura como:

```txt
No tengo suficiente información del proyecto para responder a esa pregunta.
```

Añadimos el test.

El test falla porque todavía no estaba implementado este fallback.

Después añadimos la implementación en el caso de uso para que el test pase.

---

## 4. Construcción de sources a partir de los chunks relevantes

Puede pasar que `findSimilarByProjectId` devuelva varios chunks del mismo archivo o de las mismas líneas.

Como `SimilarCodeChunk` trae información como:

```txt
path
startLine
endLine
```

podemos usar esos datos para construir las fuentes de la respuesta.

El objetivo es que la respuesta no devuelva solo el texto generado por la IA, sino también las fuentes que se han usado.

La respuesta debería incluir algo parecido a:

```ts
{
  answer: "...",
  sources: [
    {
      path: "src/users/userService.ts",
      startLine: 10,
      endLine: 35
    }
  ]
}
```

Añadimos el test.

El test falla porque todavía no se estaban construyendo correctamente las fuentes.

Después añadimos la implementación en el caso de uso.

---

# Resultado de la Fase 9.1

Al terminar esta subfase tenemos:

```txt
✅ AskProjectQuestionUseCase creado
✅ Puerto AnswerGenerator creado
✅ Validación de pregunta vacía
✅ Protección por ownership del proyecto
✅ Fallback seguro si no hay chunks relevantes
✅ Construcción de sources a partir de los chunks recuperados
✅ Tests unitarios del caso de uso pasando
```

---

# FASE 9.2 — Endpoint HTTP

## Objetivo

Ahora pasamos a la capa HTTP.

Vamos a crear el endpoint:

```http
POST /projects/:id/ask
```

Este endpoint permitirá a un usuario autenticado hacer una pregunta sobre uno de sus proyectos.

---

## Endpoint objetivo

El endpoint será:

```http
POST /projects/:id/ask
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Body esperado:

```json
{
  "question": "¿Dónde se registra un usuario?"
}
```

Respuesta esperada:

```json
{
  "answer": "Texto generado por la IA...",
  "sources": [
    {
      "path": "src/auth/register.ts",
      "startLine": 1,
      "endLine": 40
    }
  ]
}
```

---

## Primer test del endpoint

Empezamos creando el test del endpoint en el fichero que ya tenemos:

```txt
projectEndpoints
```

Creamos un nuevo test para:

```http
POST /projects/:id/ask
```

Este primer test no sube ZIP ni prepara chunks.

Por eso esperamos la respuesta segura:

```txt
No tengo suficiente información del proyecto para responder a esa pregunta.
```

Así comprobamos primero que:

```txt
1. El endpoint existe.
2. Está autenticado.
3. Llama al caso de uso.
4. Si el proyecto no tiene chunks ni embeddings, no llama a la IA real.
5. Devuelve una respuesta segura.
```

---

## Implementación del endpoint

Para que el test pase, tocamos tres sitios principales:

```txt
1. container.ts
2. projectController.ts
3. projectRoutes.ts
```

---

## 1. Cambios en container.ts

Modificamos el container para instanciar y conectar las nuevas dependencias necesarias para el caso de uso:

```txt
AskProjectQuestionUseCase
EmbeddingGenerator
CodeChunkEmbeddingRepository
AnswerGenerator
ProjectRepository
```

De momento, el `AnswerGenerator` puede ser una pieza temporal que devuelva una respuesta fija.

Por ejemplo:

```txt
Respuesta generada por IA pendiente de implementar.
```

Esto permite probar el flujo HTTP sin depender todavía de Genkit real.

---

## 2. Cambios en projectController.ts

Añadimos un nuevo método en el controller de proyectos para gestionar la pregunta.

Este método debe:

```txt
1. Obtener ownerId desde req.user.userId.
2. Obtener projectId desde req.params.id.
3. Obtener question desde req.body.
4. Llamar a AskProjectQuestionUseCase.
5. Devolver la respuesta con answer + sources.
```

---

## 3. Cambios en projectRoutes.ts

Añadimos la nueva ruta:

```http
POST /projects/:id/ask
```

Esta ruta debe usar:

```txt
authMiddleware
validateBodyMiddleware
projectController.ask
```

Una vez terminada esta implementación, los tests pasan.

---

# Nuevos tests HTTP básicos

Después del primer test, añadimos nuevos tests para asegurar los casos HTTP principales.

---

## 1. Sin token debe devolver 401

Comprobamos que el endpoint exige autenticación.

El comportamiento esperado es:

```txt
POST /projects/:id/ask sin token
↓
401 Unauthorized
```

Este test pasa directamente porque el endpoint usa `authMiddleware`.

---

## 2. Un usuario no puede preguntar sobre el proyecto de otro

Comprobamos que un usuario no pueda preguntar sobre un proyecto que pertenece a otro usuario.

La regla sigue siendo la misma que en proyectos:

```txt
Si no es suyo, se responde 404, no 403.
```

Esto evita revelar que el proyecto existe.

El comportamiento esperado es:

```txt
proyecto de otro usuario
↓
404 Not Found
```

Este test pasa directamente porque el caso de uso ya valida el ownership.

---

## 3. Validación del body del endpoint

Ahora toca validar el body del endpoint.

El body debe contener una pregunta válida.

Ejemplo correcto:

```json
{
  "question": "¿Qué endpoints existen?"
}
```

Si el body es inválido, debe devolver 400.

El test falla porque todavía no existe un schema para la pregunta ni el router usa el middleware de validación.

Para que pase, implementamos:

```txt
1. askProjectQuestionSchema dentro del archivo de schemas de project
2. validateBodyMiddleware con ese schema en projectRoutes
```

Con esto, el test pasa.

---

## 4. Flujo HTTP completo con ZIP, chunks y embeddings

Ahora comprobamos el flujo completo:

```txt
crear usuario
↓
crear proyecto
↓
subir ZIP
↓
se crean ProjectFiles
↓
se crean CodeChunks
↓
se crean Embeddings
↓
preguntar al proyecto
↓
recibir answer + sources
```

En este test, de momento, el container todavía usa un `AnswerGenerator` temporal que devuelve:

```txt
Respuesta generada por IA pendiente de implementar.
```

Eso está bien por ahora.

Este test no valida todavía la calidad de la IA.

Lo que valida es que el endpoint ya usa el flujo RAG real:

```txt
pregunta
↓
embedding de la pregunta
↓
búsqueda de chunks relevantes
↓
answer + sources
```

Este test pasa directamente.

---

# Resultado de la Fase 9.2

Al terminar esta subfase tenemos:

```txt
✅ Endpoint POST /projects/:id/ask creado
✅ Endpoint protegido con authMiddleware
✅ Validación de body con Zod
✅ Protección por usuario/proyecto
✅ Respuesta segura si no hay chunks
✅ Respuesta con answer + sources si hay chunks
✅ Flujo HTTP usando chunks subidos por ZIP
✅ Tests de integración HTTP pasando
```

---

# FASE 9.3 — Implementación real del puerto AnswerGenerator con Genkit

## Estado antes de implementar GenkitAnswerGenerator

Hasta aquí ya tenemos:

```txt
✅ AskProjectQuestionUseCase
✅ POST /projects/:id/ask
✅ Validación de auth
✅ Validación de pregunta vacía
✅ Protección por usuario/proyecto
✅ Fallback si no hay chunks
✅ Respuesta con sources si hay chunks
✅ Flujo HTTP usando chunks subidos por ZIP
```

Ahora toca quitar la pieza temporal del container e implementar el puerto real con Genkit.

---

## Objetivo

Vamos a crear una implementación real del puerto:

```ts
AnswerGenerator;
```

La implementación será algo como:

```ts
GenkitAnswerGenerator;
```

Su responsabilidad será:

```txt
recibir pregunta del usuario
↓
recibir chunks relevantes
↓
construir un prompt con el contexto
↓
llamar a Genkit
↓
devolver el texto generado por el modelo
```

---

## Test de GenkitAnswerGenerator

Empezamos creando el test de la implementación.

Este test no llama a Gemini real.

Usa un `FakeAi`.

El test comprueba que `GenkitAnswerGenerator`:

```txt
1. Recibe la pregunta del usuario.
2. Recibe los chunks relevantes.
3. Construye un prompt con:
   - pregunta
   - path del archivo
   - líneas del chunk
   - contenido del chunk
   - instrucción para no inventar
4. Devuelve el texto generado por el modelo.
```

---

## Prompt esperado

El prompt debe incluir la información necesaria para que la IA pueda responder usando solo el contexto recuperado.

Debe contener:

```txt
pregunta del usuario
path del archivo
líneas del chunk
contenido del chunk
instrucción para no inventar
```

La instrucción para no inventar es importante.

El modelo debe saber que, si la respuesta no está en los chunks proporcionados, debe decir que no tiene información suficiente.

Esto reduce el riesgo de respuestas inventadas.

---

## Implementación

Una vez que el test falla, implementamos el puerto real:

```ts
GenkitAnswerGenerator;
```

Cuando el test pasa, ya tenemos conectada la generación de respuestas con Genkit a nivel de infraestructura.

---

## Sustituir la pieza temporal del container

Después de crear `GenkitAnswerGenerator`, modificamos el container.

Quitamos el `AnswerGenerator` temporal y conectamos la implementación real:

```txt
AnswerGenerator temporal
↓
GenkitAnswerGenerator
```

Una vez hecho esto, comprobamos que todos los tests siguen pasando.

---

## Tests de seguridad y robustez

Para cerrar esta parte, añadimos nuevos tests de seguridad.

---

### 1. Si Genkit devuelve una respuesta vacía, DevMind debe devolver una respuesta segura

Puede pasar que Genkit devuelva una respuesta vacía.

No queremos que DevMind devuelva:

```txt
""
```

Eso sería una mala experiencia y no aportaría información al usuario.

El comportamiento esperado debe ser:

```txt
Genkit devuelve respuesta vacía
↓
DevMind devuelve respuesta segura
```

Por ejemplo:

```txt
No he podido generar una respuesta fiable con la información disponible.
```

Añadimos el test.

El test falla.

Después implementamos la lógica necesaria para que, si Genkit devuelve una respuesta vacía, DevMind devuelva una respuesta segura.

---

## Resultado de la Fase 9.3

Al terminar esta subfase tenemos:

```txt
✅ Puerto AnswerGenerator implementado con Genkit
✅ GenkitAnswerGenerator creado
✅ Test con FakeAi, sin llamar a Gemini real
✅ Prompt construido con pregunta, sources y contenido de chunks
✅ Instrucción explícita para no inventar
✅ Container actualizado para usar GenkitAnswerGenerator
✅ Fallback seguro si Genkit devuelve una respuesta vacía
✅ Tests pasando
```

---

# Conclusión de la Fase 9

En esta fase hemos conectado la base RAG de DevMind con una respuesta generada por IA.

Antes teníamos:

```txt
ZIP
↓
ProjectFiles
↓
CodeChunks
↓
Embeddings
↓
PostgreSQL/pgvector
```

Ahora añadimos:

```txt
pregunta del usuario
↓
embedding de la pregunta
↓
búsqueda semántica de chunks relevantes
↓
chunks como contexto
↓
Genkit
↓
respuesta final
```

El flujo completo queda así:

```txt
Usuario pregunta sobre un proyecto
↓
POST /projects/:id/ask
↓
authMiddleware valida el token
↓
AskProjectQuestionUseCase valida que el proyecto pertenece al usuario
↓
se valida la pregunta
↓
se genera embedding de la pregunta
↓
findSimilarByProjectId busca chunks relevantes del proyecto
↓
si no hay chunks relevantes, se devuelve respuesta segura
↓
si hay chunks relevantes, se llama a AnswerGenerator
↓
GenkitAnswerGenerator construye el prompt
↓
Genkit genera la respuesta
↓
DevMind devuelve answer + sources
```

Con esto, DevMind ya no solo indexa proyectos, sino que puede responder preguntas sobre ellos usando RAG.

---

## Qué queda implementado

```txt
✅ AskProjectQuestionUseCase
✅ Puerto AnswerGenerator
✅ GenkitAnswerGenerator
✅ POST /projects/:id/ask
✅ Validación de autenticación
✅ Validación de body con Zod
✅ Validación de pregunta vacía
✅ Protección por ownership del proyecto
✅ Fallback seguro si no hay chunks relevantes
✅ Fallback seguro si Genkit devuelve respuesta vacía
✅ Respuesta con answer + sources
✅ Prompt con contexto recuperado
✅ Instrucción para no inventar
✅ Integración con embeddings y búsqueda semántica
✅ Flujo HTTP completo con ZIP → chunks → embeddings → pregunta → respuesta
```

---

## Estado actual de DevMind tras la Fase 9

En este punto, DevMind ya tiene una cadena RAG funcional:

```txt
ZIP
↓
ProjectFiles
↓
CodeChunks
↓
Embeddings
↓
PostgreSQL/pgvector
↓
Pregunta del usuario
↓
Embedding de pregunta
↓
Chunks relevantes
↓
Genkit
↓
Respuesta con fuentes
```

Esto permite que un usuario autenticado pueda subir un proyecto, indexarlo y hacer preguntas sobre él en lenguaje natural.

DevMind ya puede:

```txt
1. Recibir un proyecto en ZIP.
2. Sincronizar sus archivos.
3. Dividir los archivos en chunks.
4. Generar embeddings.
5. Guardar embeddings en PostgreSQL/pgvector.
6. Generar embedding de una pregunta.
7. Buscar chunks relevantes por similitud semántica.
8. Pasar esos chunks a Genkit.
9. Generar una respuesta.
10. Devolver la respuesta junto con las fuentes utilizadas.
```

Con esto queda cerrada la primera versión funcional del flujo IA/RAG de DevMind.

# FASE 9.4 — Filtrado de archivos binarios en la subida de ZIP

### Contexto

Una vez terminada la implementación anterior, se ha probado el proyecto de la API usando un frontend básico que consume la API.

Durante esa prueba se ha detectado un error al subir el propio ZIP del proyecto DevMind.

El error detectado es:

```txt
DevMind está intentando guardar en PostgreSQL un archivo que no es texto limpio UTF-8.
```

Esto ocurre porque la API intenta guardar en PostgreSQL archivos que no deberían tratarse como texto.

---

### Problema detectado

Al subir un ZIP del propio proyecto DevMind, la API lanza un error.

El problema es que hay que mejorar el extractor/filtro del ZIP para que DevMind no intente guardar archivos binarios.

Ahora mismo ya se ignoran carpetas como:

```txt
node_modules
.git
dist
build
coverage
.next
```

Pero eso no basta.

También necesitamos ignorar archivos no textuales.

Además, conviene detectar si el contenido tiene bytes nulos:

```txt
0x00
```

Si un archivo tiene bytes nulos, se considera binario y se salta.

---

### Origen concreto del error

El error se encuentra en el extractor real del ZIP.

Ahora mismo `AdmZipExtractor` convierte todas las entradas del ZIP a string usando algo parecido a:

```ts
entry.getData().toString("utf8");
```

El problema es que lo hace sin distinguir entre archivos de texto y archivos binarios.

Después, `UploadProjectZipUseCase` filtra carpetas ignoradas, pero no filtra archivos binarios.

Como consecuencia, acaba intentando guardar el `content` en PostgreSQL aunque el archivo no sea texto limpio.

El flujo problemático actual es:

```txt
ZIP
↓
AdmZipExtractor lee todas las entradas
↓
convierte todo a string con UTF-8
↓
UploadProjectZipUseCase filtra carpetas ignoradas
↓
pero no filtra archivos binarios
↓
intenta guardar binarios como TEXT en PostgreSQL
↓
error
```

---

### Solución planteada

La solución consiste en mejorar el filtrado de archivos durante la subida del ZIP.

DevMind debe ignorar:

```txt
imágenes
PDFs
ZIPs internos
archivos binarios
archivos cuyo contenido tenga \u0000
```

Esto evita que la aplicación intente guardar en PostgreSQL contenido que no es texto válido.

El caso importante es `\u0000`, porque PostgreSQL no acepta caracteres nulos dentro de campos `TEXT`.

---

### Implementación siguiendo TDD

Como siempre, seguimos TDD.

Primero añadimos un test en:

```txt
uploadProjectZipUseCase
```

El test debe comprobar que archivos como estos no se guardan:

```txt
assets/logo.png
.DS_Store
```

La idea del test es:

```txt
Dado un ZIP que contiene archivos de texto y archivos binarios
Cuando se procesa el ZIP
Entonces DevMind solo guarda los archivos textuales válidos
Y omite imágenes, .DS_Store y otros binarios
```

Este test falla al principio, porque de momento DevMind sí intenta guardar esos archivos.

---

### Implementación para corregir el error

Una vez visto el test en rojo, se implementa la solución en:

```txt
UploadProjectZipUseCase
```

La implementación añade lógica para ignorar archivos como:

```txt
imágenes
PDFs
ZIPs internos
archivos binarios
archivos cuyo contenido tenga \u0000
```

Con esto, DevMind deja de intentar guardar contenido binario en PostgreSQL.

---

### Resultado

Después de implementar el filtrado, los tests pasan.

Con esto, el problema queda solucionado.

El nuevo comportamiento es:

```txt
ZIP subido
↓
se extraen entradas
↓
se ignoran carpetas no deseadas
↓
se ignoran archivos binarios o no textuales
↓
solo se guardan archivos de texto válidos
↓
PostgreSQL no recibe contenido inválido
```

---

### Conclusión de la Fase 9.4

En esta subfase se ha corregido un problema real detectado durante pruebas con frontend.

DevMind ya no intenta guardar archivos binarios como si fueran texto.

Esto hace que la subida de ZIP sea más robusta y más segura frente a proyectos reales, que normalmente pueden contener imágenes, ficheros del sistema, PDFs, archivos comprimidos internos u otros binarios.

Queda implementado:

```txt
✅ Detección de archivos binarios
✅ Ignorar archivos no textuales
✅ Ignorar archivos con bytes nulos
✅ Evitar errores de PostgreSQL al guardar contenido inválido
✅ Test unitario para comprobar que archivos como logo.png y .DS_Store no se guardan
✅ UploadProjectZipUseCase más robusto
```

---

# FASE 9.5 — Detección del problema de cuota/límite al generar embeddings

### Contexto

Después de solucionar el problema anterior, se volvió a probar el proyecto.

Esta vez, al subir un ZIP más grande, apareció un nuevo problema.

El sistema muestra que se ha sobrepasado la cuota o el límite de peticiones.

---

### Problema detectado

Ahora mismo, cuando se sube un ZIP relativamente grande, DevMind genera muchos elementos en cadena:

```txt
ZIP grande
↓
muchos ProjectFiles
↓
muchos CodeChunks
↓
muchos embeddings
↓
muchas llamadas seguidas a Gemini
```

El problema es que todos esos embeddings se generan dentro de una sola request HTTP.

Esto provoca demasiadas llamadas seguidas a Gemini durante la propia petición de subida del ZIP.

El flujo actual funciona bien con ZIPs pequeños, pero no escala bien para proyectos grandes.

---

### Por qué esto es un problema importante

DevMind está pensado para organizaciones o personas que trabajan con proyectos relativamente grandes.

Por eso, aunque con proyectos pequeños la API funcione correctamente, este comportamiento no es suficiente para un uso realista.

El problema principal es:

```txt
No se pueden generar todos los embeddings durante la propia petición HTTP de subida del ZIP.
```

La subida del ZIP no debería quedarse bloqueada esperando a que se generen todos los embeddings.

Además, si Gemini devuelve un error de cuota o límite, como un `429`, toda la subida puede fallar aunque los archivos y chunks ya se hayan procesado correctamente.

---

### Flujo actual problemático

El flujo actual sería algo parecido a esto:

```txt
POST /projects/:id/upload
↓
extrae ZIP
↓
guarda ProjectFiles
↓
genera CodeChunks
↓
genera embeddings inmediatamente
↓
hace muchas llamadas seguidas a Gemini
↓
puede superar la cuota/límite
↓
la request HTTP falla o tarda demasiado
```

---

### Solución profesional planteada

La solución profesional es cambiar el flujo para que la generación de embeddings sea asíncrona.

El nuevo flujo debería ser:

```txt
POST /projects/:id/upload
↓
extrae ZIP
↓
guarda ProjectFiles
↓
genera CodeChunks
↓
marca el proyecto como "indexing"
↓
responde rápido al frontend
↓
un worker en segundo plano genera embeddings poco a poco
↓
cuando termina, marca el proyecto como "ready"
```

Es decir:

```txt
La subida del ZIP no debe esperar a que todos los embeddings estén creados.
```

---

### Nueva fase necesaria

Este problema se solucionará creando una nueva fase.

La nueva fase sustituye a la anterior Fase 10 prevista.

Ahora la Fase 10 será:

```txt
FASE 10 — Indexación asíncrona y robusta
```

---

# FASE 10 — Indexación asíncrona y robusta

## 1. Problema detectado

Hasta este punto, DevMind funcionaba así:

```txt
Usuario sube ZIP
↓
DevMind extrae archivos
↓
Guarda ProjectFiles
↓
Genera CodeChunks
↓
Genera embeddings de cada chunk llamando a Gemini
↓
Responde al frontend
```

Todo esto ocurría dentro de la misma petición HTTP:

```http
POST /projects/:id/upload
```

En el código, `UploadProjectZipUseCase` guardaba los archivos y después llamaba a:

```ts
generateCodeChunksForProjectFileUseCase.execute(...)
```

para cada archivo creado o actualizado.

Después, dentro del flujo actual, esos chunks acababan generando embeddings.

Para ZIPs pequeños esto funcionaba correctamente. De hecho, con proyectos pequeños ya se había comprobado que el RAG funcionaba.

El problema aparecía con ZIPs grandes:

```txt
Proyecto grande
↓
muchos archivos
↓
muchos chunks
↓
muchas llamadas seguidas a Gemini
↓
Gemini devuelve: 429 Too Many Requests
```

El problema no era que el RAG estuviera mal diseñado.

El problema era que DevMind estaba intentando hacer demasiado trabajo pesado dentro de una sola petición HTTP.

---

## 2. Solución planteada: indexación asíncrona

Para proyectos grandes necesitamos separar dos procesos:

```txt
Subir ZIP = guardar archivos y chunks
```

y después:

```txt
Indexar proyecto = generar embeddings poco a poco
```

A esto lo llamamos **indexación asíncrona**.

En este contexto, “asíncrona” significa que la subida del ZIP termina rápido, pero los embeddings se generan después, en segundo plano.

---

## 3. Por qué esta solución arregla el problema

Antes hacíamos esto:

```txt
300 embeddings seguidos durante la subida
```

Ahora queremos hacer esto:

```txt
Subida:
guarda archivos y chunks

Después:
genera embeddings poco a poco
con pausa entre llamadas
con control de errores
con progreso
```

De esta forma, aunque haya muchos chunks, DevMind no rompe la petición HTTP ni agota Gemini de golpe.

---

## 4. Plan de implementación

La Fase 10 se divide en las siguientes subfases:

```txt
FASE 10.1 — Separar chunks de embeddings
FASE 10.2 — Crear tabla de estado de indexación
FASE 10.3 — Crear caso de uso IndexProjectEmbeddingsUseCase
FASE 10.4 — Crear endpoint para lanzar indexación
FASE 10.5 — Crear endpoint para consultar estado
FASE 10.6 — Añadir rate limit interno
FASE 10.7 — Hacer configurable el delay desde .env
FASE 10.8 — Lanzar indexación automática en segundo plano
```

---

# FASE 10.1 — Separar chunks de embeddings

## Objetivo

En esta subfase vamos a separar la generación de chunks de la generación de embeddings.

Hasta ahora, al generar chunks también se generaban embeddings.

Queremos cambiar eso.

La nueva regla será:

```txt
Generar CodeChunks
↓
NO generar embeddings todavía
```

Los embeddings se generarán después, en un flujo de indexación separado.

---

## Cambio en los tests de GenerateCodeChunksForProjectFileUseCase

El primer test que vamos a cambiar está en:

```txt
tests/unit/application/codeChunk/generateCodeChunksForProjectFileUseCase.test.ts
```

Ahora mismo existía este test:

```ts
it("generates embeddings for saved code chunks", async () => {
  ...
});
```

Ese test ya no representa la nueva arquitectura, así que se elimina.

También se elimina el fake que ya no vamos a utilizar:

```ts
FakeGenerateEmbeddingForCodeChunkUseCase;
```

---

## Cambio en la creación del caso de uso

Antes se instanciaba el caso de uso así:

```ts
const generateEmbeddingForCodeChunkUseCase =
  new FakeGenerateEmbeddingForCodeChunkUseCase();

const useCase = new GenerateCodeChunksForProjectFileUseCase(
  codeChunkRepository,
  codeChunker,
  idGenerator,
  generateEmbeddingForCodeChunkUseCase,
);
```

Ahora debe quedar así:

```ts
const useCase = new GenerateCodeChunksForProjectFileUseCase(
  codeChunkRepository,
  codeChunker,
  idGenerator,
);
```

Este cambio se aplica en todos los tests donde se instancia `GenerateCodeChunksForProjectFileUseCase`.

Lo normal es que el test falle con algo parecido a:

```txt
Expected 4 arguments, but got 3
```

Ese fallo es correcto.

Significa que el test ya está pidiendo la nueva arquitectura, pero la implementación todavía sigue acoplada a embeddings.

---

## Implementación

Para que el test pase, se modifica `GenerateCodeChunksForProjectFileUseCase`.

Se elimina:

```txt
la dependencia que genera embeddings
toda la lógica relacionada con generar embeddings
```

A partir de ahora, este caso de uso solo se encarga de:

```txt
recibir un ProjectFile
↓
dividirlo en CodeChunks
↓
guardar los CodeChunks
```

---

## Cambio en los tests de uploadZipEndpoint

Una vez hecho este cambio, los tests de `uploadZipEndpoint` fallan.

Antes esperaban esto:

```txt
upload ZIP
↓
crea ProjectFiles
↓
crea CodeChunks
↓
crea Embeddings
```

Pero ahora la nueva regla es:

```txt
upload ZIP
↓
crea ProjectFiles
↓
crea CodeChunks
↓
NO crea Embeddings todavía
```

Por eso se modifican los tests de este fichero.

Cambios realizados:

```txt
- Se elimina el import de PostgresCodeChunkEmbeddingRepository.
- Se elimina la función expectEmbeddingForCodeChunk.
- Se cambian los nombres de los tests que antes hablaban de embeddings.
- Se quitan todas las comprobaciones de embeddings.
```

Ahora `POST /projects/:projectId/upload` solo debe crear:

```txt
ProjectFiles
CodeChunks
```

No debe crear embeddings.

---

## Cambio en el test de /ask

También se modifica el test de `projectEndpoint` relacionado con `/ask`.

Después de subir un ZIP, como todavía no hay embeddings, DevMind devuelve correctamente:

```txt
No tengo suficiente información del proyecto para responder a esa pregunta.
```

Esto ahora es correcto, porque subir el ZIP ya no genera embeddings automáticamente dentro de la misma petición.

---

## Resultado de la Fase 10.1

Con esto, `UploadProjectZipUseCase` sigue haciendo lo siguiente:

```txt
extrae archivos
↓
filtra archivos válidos
↓
guarda ProjectFiles
↓
genera CodeChunks
```

Pero ya no dispara embeddings durante esa misma subida.

Queda cerrado:

```txt
✅ GenerateCodeChunksForProjectFileUseCase desacoplado de embeddings
✅ Eliminada la dependencia GenerateEmbeddingForCodeChunkUseCase
✅ Upload ZIP crea ProjectFiles + CodeChunks
✅ Upload ZIP ya no crea embeddings
✅ Tests actualizados a la nueva arquitectura
✅ /ask devuelve fallback si todavía no hay embeddings
```

---

# FASE 10.2 — Tabla de estado de indexación

## Objetivo

Ahora que al subir un ZIP ya no se generan embeddings, necesitamos guardar algo que indique el estado de indexación del proyecto.

Necesitamos poder representar estados como:

```txt
Este proyecto está pendiente de indexar.
Este proyecto se está indexando.
Este proyecto ya está completado.
Este proyecto ha fallado.
```

Para eso crearemos una tabla nueva:

```txt
project_indexing_jobs
```

Esta tabla actúa como una hoja de seguimiento del proceso de indexación.

No guarda:

```txt
contenido del código
embeddings
chunks
```

Solo guarda el estado del trabajo de indexación.

---

## Nueva entidad y repositorio

Para esta subfase necesitamos crear:

```txt
Entidad ProjectIndexingJob
Puerto ProjectIndexingJobRepository
Adaptador PostgresProjectIndexingJobRepository
Migración project_indexing_jobs
```

---

## Primer test del repositorio

Como siempre, empezamos con TDD.

Creamos el test:

```txt
postgresProjectIndexingJobRepository.test.ts
```

Este test comprueba:

```txt
Quiero poder guardar un trabajo de indexación.
Quiero poder buscarlo después por projectId.
```

El test falla porque todavía no existen:

```txt
PostgresProjectIndexingJobRepository
ProjectIndexingJob
ProjectIndexingJobRepository
project_indexing_jobs
```

---

## Implementación

Para que el test pase, implementamos:

```txt
1. Entidad projectIndexingJob.ts
2. Interfaz projectIndexingJobRepository.ts
3. Migración 007_create_project_indexing_jobs.sql
4. Adaptador postgresProjectIndexingJobRepository.ts
```

Después de implementar estas piezas, el test pasa.

---

## Estructura del ProjectIndexingJob

Ahora DevMind puede guardar algo como:

```json
{
  "projectId": "project-1",
  "status": "pending",
  "totalChunks": 10,
  "processedChunks": 0,
  "failedChunks": 0
}
```

Esto es la base para que después podamos crear:

```txt
IndexProjectEmbeddingsUseCase
```

Este caso de uso será quien genere embeddings poco a poco y vaya actualizando ese estado.

---

## Tests adicionales antes de cerrar la subfase

Antes de pasar a la siguiente subfase, terminamos bien la Fase 10.2 añadiendo dos tests pequeños más.

Esto es necesario porque en la siguiente fase necesitaremos actualizar el progreso:

```txt
processedChunks: 0
↓
processedChunks: 1
↓
processedChunks: 2
↓
...
status: completed
```

Para eso necesitamos asegurarnos de que `update` funciona bien.

También queremos comprobar que, si se borra un proyecto, su job de indexación se borra automáticamente mediante `ON DELETE CASCADE`, igual que ya ocurre con chunks y embeddings.

Añadimos dos tests en:

```txt
postgresProjectIndexingJobRepository
```

Los tests comprueban:

```txt
1. Actualizar un indexing job.
2. Borrar el job automáticamente si se borra el proyecto.
```

Con estos tests pasando, cerramos la subfase.

---

## Resultado de la Fase 10.2

Queda implementado:

```txt
✅ Entidad ProjectIndexingJob creada
✅ Puerto ProjectIndexingJobRepository creado
✅ Migración 007_create_project_indexing_jobs.sql creada
✅ PostgresProjectIndexingJobRepository creado
✅ Test save + findByProjectId pasa
✅ Test update pasa
✅ Test ON DELETE CASCADE pasa
✅ globalSetup actualizado para limpiar la nueva tabla
```

Todavía no estamos generando embeddings.

Solo hemos creado la hoja de seguimiento para decir:

```txt
Este proyecto tiene una indexación pendiente.
```

---

# FASE 10.3 — IndexProjectEmbeddingsUseCase

## Objetivo

Ahora vamos a crear un nuevo caso de uso:

```txt
IndexProjectEmbeddingsUseCase
```

Este caso de uso hará lo siguiente:

```txt
recibe projectId + ownerId
↓
comprueba que el proyecto pertenece al usuario
↓
busca los chunks del proyecto
↓
crea un ProjectIndexingJob
↓
genera embeddings para cada chunk
↓
actualiza el progreso
↓
marca la indexación como completed
```

Muy importante:

```txt
No vamos a volver a meter embeddings dentro del upload.
```

---

## Primer test del caso de uso

Como siempre, empezamos con los tests.

Creamos el fichero:

```txt
indexProjectEmbeddingsUseCase.test.ts
```

El primer test unitario comprueba el caso feliz:

```txt
Si un proyecto tiene 2 chunks,
IndexProjectEmbeddingsUseCase genera embeddings para los 2 chunks
y marca el job como completed.
```

El test falla porque `IndexProjectEmbeddingsUseCase` todavía no existe.

---

## Implementación inicial

Para implementar el caso de uso necesitamos que `CodeChunkRepository` pueda buscar chunks por proyecto.

Por eso añadimos un nuevo método al repositorio de chunks:

```ts
findByProjectId(projectId: string): Promise<CodeChunk[]>;
```

Después implementamos `IndexProjectEmbeddingsUseCase`.

El flujo queda así:

```txt
IndexProjectEmbeddingsUseCase
↓
comprueba que el proyecto pertenece al usuario
↓
busca todos los chunks del proyecto
↓
crea un ProjectIndexingJob en processing
↓
genera embedding chunk 1
↓
actualiza processedChunks a 1
↓
genera embedding chunk 2
↓
actualiza processedChunks a 2
↓
marca el job como completed
```

Todavía no añadimos endpoint.

---

## Test de fallo durante la generación de embeddings

Antes de cerrar, añadimos un test de seguridad y robustez.

El test comprueba:

```txt
Si falla un embedding,
marca el job como failed.
```

Este test falla al principio.

El fallo es correcto, porque el caso de uso probablemente hacía esto:

```txt
chunk 1 OK
chunk 2 falla
↓
lanza error
↓
pero no actualiza el job a failed
```

---

## Implementación del estado failed

Implementamos la lógica para que, si falla un embedding, el job quede marcado como fallido.

Antes pasaba esto:

```txt
chunk 1 OK
chunk 2 falla
↓
se lanza error
↓
el job se queda en processing
```

Ahora pasa esto:

```txt
chunk 1 OK
processedChunks = 1

chunk 2 falla
failedChunks = 1
status = failed
errorMessage = "Gemini quota exceeded"

después relanza el error
```

Esto es importante.

Marcamos el job como fallido, pero no ocultamos el error.

El endpoint o worker que llame a este caso de uso podrá enterarse de que la indexación falló.

---

## Test de seguridad: proyecto ajeno o inexistente

Añadimos otro test importante:

```txt
Si el usuario no es dueño del proyecto:
- no busca chunks
- no genera embeddings
- no crea indexing job
- lanza ProjectNotFoundError
```

Este test pasa directamente porque la validación de ownership ya estaba bien implementada.

---

## Resultado de la Fase 10.3

Queda cerrado:

```txt
✅ IndexProjectEmbeddingsUseCase creado
✅ Caso feliz probado
✅ Caso de fallo probado
✅ Caso de proyecto ajeno/inexistente probado
✅ Todos los tests verdes
```

Ahora DevMind ya tiene el caso de uso que faltaba:

```txt
projectId + ownerId
↓
validar proyecto
↓
buscar chunks
↓
crear ProjectIndexingJob
↓
generar embeddings
↓
actualizar progreso
↓
completed / failed
```

---

# FASE 10.4 — Endpoint manual de indexación

## Objetivo

Vamos a crear el endpoint:

```http
POST /projects/:id/index
```

La idea será:

```txt
Subes ZIP
↓
se crean ProjectFiles + CodeChunks
↓
llamas a POST /projects/:id/index
↓
se generan embeddings
↓
el proyecto ya queda consultable por /ask
```

De momento será manual.

Más adelante lo convertiremos en worker automático.

---

## Primer test del endpoint

Como siempre, empezamos generando el test.

Añadimos un nuevo test dentro del fichero:

```txt
projectEndpoint
```

Este test simula el flujo real:

```txt
1. Registrar usuario
2. Login
3. Crear proyecto
4. Subir ZIP
5. Crear chunks
6. Llamar a POST /projects/:id/index
7. Comprobar que la indexación termina como completed
```

Todavía no existe la ruta, así que el test debe fallar.

---

## Implementación del endpoint

Una vez vemos el test en rojo, implementamos el endpoint conectando tres piezas:

```txt
ProjectController
projectRoutes
container
```

---

## Cambios en ProjectController

Modificamos `ProjectController`:

```txt
- Añadimos el import de IndexProjectEmbeddingsUseCase.
- Pasamos esta dependencia al constructor.
- Creamos un nuevo método en el controller: index.
```

---

## Cambios en projectRoutes

Modificamos `projectRoutes`:

```txt
- Añadimos container.indexProjectEmbeddingsUseCase al crear el ProjectController.
- Añadimos la nueva ruta de indexación.
```

La ruta queda:

```ts
projectRoutes.post("/:id/index", ...);
```

---

## Cambios en container

Modificamos `container`:

```txt
- Añadimos los imports de PostgresProjectIndexingJobRepository e IndexProjectEmbeddingsUseCase.
- Instanciamos el repositorio.
- Montamos las dependencias necesarias.
- Añadimos indexProjectEmbeddingsUseCase al container.
```

---

## Resultado del caso feliz

Con todo esto, queda cerrado el caso feliz de la Fase 10.4:

```txt
✅ POST /projects/:id/index creado
✅ ProjectController conectado
✅ projectRoutes conectado
✅ container conectado
✅ IndexProjectEmbeddingsUseCase se ejecuta desde HTTP
✅ Upload ZIP crea chunks
✅ POST /index genera embeddings
✅ El endpoint devuelve completed
✅ Tests verdes
```

---

## Nuevo flujo real

El flujo real queda así:

```txt
POST /projects/:id/upload
↓
guarda ProjectFiles
↓
genera CodeChunks
↓
NO genera embeddings
```

Después:

```txt
POST /projects/:id/index
↓
busca chunks
↓
genera embeddings
↓
actualiza ProjectIndexingJob
↓
status completed
```

Con esto ya solucionamos la separación principal que necesitábamos.

---

## Tests de seguridad del endpoint

Antes de continuar, reforzamos el endpoint con dos tests de seguridad:

```txt
1. POST /projects/:id/index devuelve 401 sin token.
2. POST /projects/:id/index devuelve 404 si el proyecto pertenece a otro usuario.
```

Esto es importante porque la indexación no puede lanzarla cualquiera.

Solo puede lanzarla el dueño del proyecto.

Una vez pasan estos tests, cerramos la subfase.

---

# FASE 10.5 — Endpoint para consultar estado de indexación

## Objetivo

Creamos el endpoint:

```http
GET /projects/:id/indexing-status
```

Este endpoint servirá para que el frontend pueda consultar el estado de indexación del proyecto.

Debe devolver algo como:

```json
{
  "projectId": "project-1",
  "status": "completed",
  "totalChunks": 1,
  "processedChunks": 1,
  "failedChunks": 0,
  "progress": 100
}
```

El campo nuevo importante es:

```txt
progress
```

Se calcula como:

```txt
processedChunks / totalChunks * 100
```

---

## Primer test del endpoint

Empezamos generando el test dentro de:

```txt
projectEndpoints
```

Este test hace el flujo completo:

```txt
1. Crear usuario
2. Login
3. Crear proyecto
4. Subir ZIP
5. Indexar proyecto
6. Consultar estado
7. Esperar completed + progress 100
```

El test debe fallar porque todavía no existe esta ruta:

```http
GET /projects/:id/indexing-status
```

---

## Implementación limpia con caso de uso propio

Para implementarlo de forma limpia, creamos un caso de uso propio:

```txt
GetProjectIndexingStatusUseCase
```

La idea será:

```txt
Controller
↓
GetProjectIndexingStatusUseCase
↓
ProjectRepository para validar owner
↓
ProjectIndexingJobRepository para leer estado
```

---

## GetProjectIndexingStatusUseCase

El caso de uso hace lo siguiente:

```txt
1. Comprueba que el proyecto pertenece al usuario.
2. Busca el ProjectIndexingJob por projectId.
3. Si existe, devuelve estado + progress.
4. Si todavía no existe, devuelve pending con progress 0.
```

---

## Cambios en ProjectController

Modificamos `ProjectController`:

```txt
- Añadimos el import de GetProjectIndexingStatusUseCase.
- Lo añadimos al constructor.
- Creamos un nuevo método para consultar el estado.
```

---

## Cambios en projectRoutes

Modificamos `projectRoutes`:

```txt
- Añadimos container.getProjectIndexingStatusUseCase al crear el controller.
- Generamos la nueva ruta GET.
```

---

## Cambios en container

Modificamos `container`:

```txt
- Añadimos el import del nuevo caso de uso.
- Añadimos su instanciación al container.
```

---

## Tests adicionales de robustez

Antes de cerrar la Fase 10.5, reforzamos este endpoint con nuevos tests.

Los tests son:

```txt
Test 1 — devuelve pending si todavía no se ha indexado.
Test 2 — devuelve 401 sin token.
Test 3 — devuelve 404 si el proyecto es de otro usuario.
Test 4 — después de indexar, /ask debe responder con sources.
```

Con estos tests pasando, queda completada la subfase.

---

## Resultado de la Fase 10.5

Queda implementado:

```txt
✅ GET /projects/:id/indexing-status
✅ GetProjectIndexingStatusUseCase
✅ Validación de ownership
✅ Estado pending si todavía no hay job
✅ Estado completed con progress 100
✅ 401 sin token
✅ 404 si el proyecto es de otro usuario
✅ /ask responde con sources después de indexar
✅ Tests verdes
```

---

# FASE 10.6 — Rate limit interno entre embeddings

## Problema

Aunque ya hemos sacado los embeddings fuera del upload, ahora `POST /projects/:id/index` todavía puede hacer esto:

```txt
embedding chunk 1
embedding chunk 2
embedding chunk 3
embedding chunk 4
...
embedding chunk 200
```

Todo seguido.

Eso puede volver a provocar el error de Gemini:

```txt
429 Too Many Requests
RESOURCE_EXHAUSTED
```

Por eso añadimos un rate limit interno entre embeddings.

---

## Objetivo

Queremos que DevMind espere un poco entre chunk y chunk.

Antes:

```txt
chunk 1 → Gemini
chunk 2 → Gemini
chunk 3 → Gemini
chunk 4 → Gemini
```

Ahora:

```txt
chunk 1 → Gemini
esperar un poco
chunk 2 → Gemini
esperar un poco
chunk 3 → Gemini
esperar un poco
chunk 4 → Gemini
```

En tests no queremos esperar de verdad, así que crearemos un fake.

---

## Test con FakeDelay

Añadimos en el test de `IndexProjectEmbeddingsUseCase` un nuevo fake:

```txt
FakeDelay
```

Después hacemos las modificaciones necesarias para el caso de uso.

El test falla porque `IndexProjectEmbeddingsUseCase` todavía no usa delay o porque su constructor todavía no acepta los nuevos argumentos.

---

## Implementación

Para que el test pase, hacemos lo siguiente:

```txt
1. Creamos un nuevo puerto llamado Delay.
2. Creamos la implementación real del puerto: TimeoutDelay.
3. Modificamos IndexProjectEmbeddingsUseCase.
4. Actualizamos el container.
```

---

## Nuevo puerto Delay

Creamos el puerto:

```ts
Delay;
```

Este puerto representa una espera controlada.

En producción usaremos una implementación real con `setTimeout`.

En tests usaremos un fake para no ralentizar la suite.

---

## TimeoutDelay

Creamos la implementación real:

```txt
TimeoutDelay
```

Esta implementación usa `setTimeout`.

---

## Cambio en IndexProjectEmbeddingsUseCase

Antes el bucle era conceptualmente así:

```txt
chunk 1 → embedding
chunk 2 → embedding
chunk 3 → embedding
```

Ahora queda así:

```txt
chunk 1 → embedding
actualizar progreso
esperar

chunk 2 → embedding
actualizar progreso
esperar

chunk 3 → embedding
actualizar progreso
terminar
```

Si queda otro chunk después del actual, espera.

Si el chunk actual era el último, no espera.

---

## Cambio en container

Actualizamos `container`:

```txt
- Añadimos el import de TimeoutDelay.
- Inicializamos TimeoutDelay.
- Pasamos Delay e intervalo al IndexProjectEmbeddingsUseCase.
```

Con todo esto, los tests pasan.

---

## Resultado de la Fase 10.6

Queda implementado:

```txt
✅ Puerto Delay
✅ TimeoutDelay real con setTimeout
✅ FakeDelay para tests
✅ IndexProjectEmbeddingsUseCase espera entre chunks
✅ No espera después del último chunk
✅ El delay está conectado en container
✅ Tests unitarios verdes
✅ Tests globales verdes
```

---

# FASE 10.7 — Delay configurable desde .env

## Objetivo

Ahora mismo el delay está hardcodeado en el código.

Queremos cambiarlo por una variable de entorno:

```env
INDEXING_DELAY_BETWEEN_CHUNKS_MS=1000
```

Así podremos cambiarlo sin tocar código.

Por ejemplo:

```env
INDEXING_DELAY_BETWEEN_CHUNKS_MS=500
```

---

## Flujo deseado

La idea final será esta:

```txt
.env
↓
env.ts
↓
container.ts
↓
IndexProjectEmbeddingsUseCase
```

Antes teníamos algo como:

```ts
const indexProjectEmbeddingsUseCase = new IndexProjectEmbeddingsUseCase(
  projectRepository,
  codeChunkRepository,
  projectIndexingJobRepository,
  generateEmbeddingForCodeChunkUseCase,
  idGenerator,
  delay,
  1000,
);
```

Queremos pasar a algo así:

```ts
const indexProjectEmbeddingsUseCase = new IndexProjectEmbeddingsUseCase(
  projectRepository,
  codeChunkRepository,
  projectIndexingJobRepository,
  generateEmbeddingForCodeChunkUseCase,
  idGenerator,
  delay,
  env.indexing.delayBetweenChunksMs,
);
```

---

## Cambio en env.ts

Añadimos en:

```txt
src/infrastructure/config/env.ts
```

la nueva configuración:

```ts
indexing: {
  delayBetweenChunksMs:
    Number(process.env.INDEXING_DELAY_BETWEEN_CHUNKS_MS) || 1000,
},
```

---

## Cambio en container

Después modificamos `container`.

Ya no debe tener el delay hardcodeado.

Debe cogerlo desde `env`:

```txt
env.indexing.delayBetweenChunksMs
```

También es importante que la variable exista en `.env`.

Con esto terminamos esta subfase.

---

## Resultado de la Fase 10.7

Queda implementado:

```txt
✅ Delay entre chunks configurable desde .env
✅ Variable INDEXING_DELAY_BETWEEN_CHUNKS_MS
✅ env.ts actualizado
✅ container actualizado
✅ Se elimina el valor hardcodeado de 1000 ms
```

---

# FASE 10.8 — Indexación automática en segundo plano

## Estado anterior

Hasta ahora el flujo era manual:

```txt
POST /projects/:id/upload
↓
crea ProjectFiles + CodeChunks

POST /projects/:id/index
↓
genera embeddings
```

Queremos pasar a esto:

```txt
POST /projects/:id/upload
↓
crea ProjectFiles + CodeChunks
↓
responde rápido
↓
lanza la indexación en segundo plano
```

Es decir, el usuario sube el ZIP y ya no tiene que pulsar manualmente `/index`.

---

## Regla importante

No vamos a meter otra vez los embeddings dentro del upload.

No queremos esto:

```txt
upload espera a que terminen todos los embeddings
```

Queremos esto:

```txt
upload responde
y por detrás empieza la indexación
```

---

## Nueva pieza: ProjectIndexingScheduler

Para hacerlo bien, creamos una pieza nueva:

```txt
ProjectIndexingScheduler
```

Será un puerto pequeño con una operación como:

```ts
schedule(input: { projectId: string; ownerId: string }): void;
```

Este puerto significa:

```txt
Programa la indexación de este proyecto en segundo plano.
```

---

## Implementación real del scheduler

La implementación real hará algo como:

```ts
void indexProjectEmbeddingsUseCase.execute({
  projectId,
  ownerId,
});
```

La clave está en usar `void`, para lanzar la indexación sin esperar a que termine.

Así, `POST /upload` puede responder rápido.

Además, añadimos un `.catch(...)` para evitar que un error del proceso de fondo quede como una promesa rechazada sin controlar.

---

## Test en UploadProjectZipUseCase

Como siempre, empezamos por el test.

Modificamos:

```txt
uploadProjectZipUseCase.test.ts
```

Cambios realizados:

```txt
- Añadimos FakeProjectIndexingScheduler.
- Modificamos el helper createUploadProjectZipUseCase para aceptar esa nueva dependencia.
- Añadimos un test nuevo que comprueba que, después de subir un ZIP válido, se programa la indexación automática del proyecto.
```

El test falla porque `UploadProjectZipUseCase` todavía no acepta `ProjectIndexingScheduler`.

---

## Implementación en UploadProjectZipUseCase

Para que el test pase:

```txt
1. Creamos el puerto ProjectIndexingScheduler.
2. Modificamos UploadProjectZipUseCase.
3. Creamos el scheduler real.
4. Modificamos el container.
```

---

## Cuándo programar indexación

No programamos indexación si todo está unchanged.

Ejemplo:

```txt
created: 0
updated: 0
deleted: 0
unchanged: 10
```

En ese caso, el ZIP no ha cambiado nada.

Pero sí programamos indexación si hay algo relevante:

```txt
created > 0
updated > 0
deleted > 0
```

Eso significa que el contenido indexable del proyecto ha cambiado.

---

## Scheduler real

Creamos el adaptador real:

```txt
AsyncProjectIndexingScheduler
```

Este adaptador lanza la indexación, pero no espera a que termine.

Así:

```txt
POST /upload responde rápido.
```

Además, el scheduler captura errores con `.catch(...)`.

---

## Cambios en container

Modificamos el `container` para conectar:

```txt
ProjectIndexingScheduler
AsyncProjectIndexingScheduler
IndexProjectEmbeddingsUseCase
UploadProjectZipUseCase
```

---

## Resultado de la Fase 10.8

Con esto, DevMind ya puede lanzar la indexación automáticamente en segundo plano después de subir un ZIP.

El flujo queda:

```txt
POST /projects/:id/upload
↓
guarda ProjectFiles
↓
genera CodeChunks
↓
responde rápido
↓
lanza indexación automática en segundo plano
```

Después:

```txt
AsyncProjectIndexingScheduler
↓
IndexProjectEmbeddingsUseCase
↓
genera embeddings poco a poco
↓
actualiza project_indexing_jobs
↓
GET /projects/:id/indexing-status muestra progreso
```

Queda implementado:

```txt
✅ Puerto ProjectIndexingScheduler
✅ FakeProjectIndexingScheduler en tests
✅ AsyncProjectIndexingScheduler real
✅ UploadProjectZipUseCase programa indexación automática
✅ No se programa indexación si todo está unchanged
✅ Se programa indexación si hay created, updated o deleted
✅ Scheduler con .catch para controlar errores de fondo
✅ container actualizado
```

---

# Conclusión de la Fase 10

La Fase 10 tenía como objetivo principal solucionar este problema:

```txt
Subir ZIP grande
↓
generar muchos chunks
↓
llamar muchas veces a Gemini de golpe
↓
429 / errores / subida lenta / bloqueo
```

Ahora el flujo queda así:

```txt
POST /projects/:id/upload
↓
guarda ProjectFiles
↓
genera CodeChunks
↓
responde rápido
↓
lanza indexación automática en segundo plano
↓
GET /projects/:id/indexing-status muestra progreso
↓
cuando termina, POST /projects/:id/ask responde usando RAG
```

Además, se ha probado con el ZIP real de DevMind:

```txt
149 archivos creados
508 chunks totales
508 chunks procesados
0 fallidos
status completed
progress 100%
```

Esta es una prueba fuerte de que el flujo funciona con un proyecto grande real.

---

## Qué hemos cerrado en Fase 10

```txt
✅ 10.1 Separar chunks de embeddings
✅ 10.2 Tabla project_indexing_jobs
✅ 10.3 IndexProjectEmbeddingsUseCase
✅ 10.4 POST /projects/:id/index manual
✅ 10.5 GET /projects/:id/indexing-status
✅ 10.6 Delay/rate limit entre embeddings
✅ 10.7 Delay configurable desde .env
✅ 10.8 Indexación automática en segundo plano
✅ Scheduler real AsyncProjectIndexingScheduler
✅ Scheduler Noop/Fake para tests
✅ Reindexación idempotente
✅ Filtro de docs y .md para centrar el RAG en código
✅ Prueba real con ZIP grande completada
✅ /ask responde con fuentes de código real
```

---

## Estado final tras la Fase 10

Después de esta fase, DevMind ya no genera embeddings dentro de la petición de subida del ZIP.

Ahora separa correctamente:

```txt
Subida de proyecto
↓
guardado de archivos
↓
generación de chunks
↓
respuesta rápida al frontend
```

de:

```txt
indexación de embeddings
↓
procesamiento progresivo
↓
control de rate limit
↓
estado consultable
↓
RAG disponible cuando termina
```

Esto hace que DevMind sea mucho más robusto, más realista y más preparado para proyectos grandes.


# Fase 11 — Refactor, endurecimiento y mejoras técnicas

## Objetivo

Esta fase no añade funcionalidad nueva de cara al usuario. Su objetivo es dejar más sólido, seguro y mantenible todo lo construido hasta la Fase 10, corrigiendo inconsistencias detectadas al revisar el proyecto con detalle: duplicación en los tests, un límite de tamaño de ZIP demasiado bajo para proyectos reales y un detalle de seguridad en la generación/verificación de JWT.

Se agrupan aquí varios cambios pequeños e independientes entre sí, cada uno cerrado por separado.

---

## Fase 11.1 — Restricción explícita del algoritmo JWT

### Problema

`JwtTokenService` firmaba y verificaba tokens sin indicar explícitamente qué algoritmo debía usarse, apoyándose en el comportamiento por defecto de la librería `jsonwebtoken`. Aunque en la práctica siempre se firmaba con `HS256`, no forzar ese algoritmo en `verify` deja la puerta abierta a ataques de tipo *algorithm confusion*, donde un token manipulado intenta forzar la verificación con un algoritmo distinto al esperado.

### Cambio realizado

En `src/infrastructure/authAdapters/jwtTokenService.ts` se fija explícitamente el algoritmo en las dos operaciones:

```txt
sign()   → se añade algorithm: "HS256"
verify() → se añade algorithms: ["HS256"]
```

Así, `JwtTokenService` nunca acepta ni genera tokens con un algoritmo distinto al esperado, cerrando esa vía de ataque aunque el comportamiento observable de la aplicación no cambia.

```txt
✅ sign() firma siempre con HS256
✅ verify() solo acepta HS256
✅ Sin cambios de comportamiento para los tokens ya emitidos
```

---

## Fase 11.2 — Límite de subida de ZIP ampliado

### Problema

Los límites configurados en la Fase 6.1 (protección zip-bomb) eran demasiado conservadores para el uso real esperado de DevMind: `MAX_ZIP_SIZE_MB` a 20 MB y `MAX_ZIP_UNCOMPRESSED_SIZE_MB` a 200 MB. Un proyecto de software mediano-grande, comprimido, puede superar fácilmente esos 20 MB.

### Cambio realizado

Se amplían los valores por defecto en `src/infrastructure/config/env.ts`, y se reflejan también en `.env` y `.env.example`:

```txt
MAX_ZIP_SIZE_MB               20  → 200
MAX_ZIP_UNCOMPRESSED_SIZE_MB  200 → 1000
```

El límite de tamaño descomprimido se mantiene siempre por encima del comprimido, con margen suficiente para código fuente real (que normalmente se expande varias veces al descomprimir), sin dejar de proteger frente a un ZIP bomba que intente expandirse muchísimo más de lo razonable.

No fue necesario tocar `multer` ni `AdmZipExtractor`: ambos ya leían estos límites desde `env.upload`, así que el cambio es puramente de configuración.

```txt
✅ MAX_ZIP_SIZE_MB por defecto: 200
✅ MAX_ZIP_UNCOMPRESSED_SIZE_MB por defecto: 1000
✅ .env y .env.example actualizados
✅ README actualizado con los nuevos valores
```

---

## Fase 11.3 — Refactor de fakes duplicados en los tests

### Problema

Al revisar la carpeta `tests/`, varios casos de uso definían su propio *fake* de un mismo puerto o repositorio dentro del propio archivo de test, en lugar de reutilizar los fakes ya existentes en `tests/fakes/`. Esto provocaba tres problemas:

```txt
1. Duplicación: la misma clase fake reescrita, casi idéntica, en varios archivos.
2. Inconsistencia de nombres: por ejemplo, InMemoryUserRepository en un test
   y FakeUserRepository (con el mismo comportamiento) en el resto del proyecto.
3. Un bug real de tipado: el FakeCodeChunkRepository local de
   generateCodeChunksForProjectFileUseCase.test.ts no implementaba
   findByProjectId, un método que el puerto CodeChunkRepository ya exige
   desde la Fase 10. Esto hacía fallar npm run typecheck.
```

### Fakes consolidados en `tests/fakes/`

Se crean cinco fakes nuevos, compartidos, cada uno implementando su puerto o repositorio de dominio real (no un tipo local reinventado):

```txt
fakeSequentialIdGenerator.ts       → IdGenerator que devuelve ids de una lista, en orden
fakeCodeChunkRepository.ts         → CodeChunkRepository completo (incluye findByProjectId)
fakeCodeChunkEmbeddingRepository.ts → CodeChunkEmbeddingRepository completo, con
                                      similarCodeChunks configurable y registro de
                                      las llamadas a findSimilarByProjectId
fakeEmbeddingGenerator.ts          → EmbeddingGenerator, registra los textos recibidos
fakeTokenService.ts                → TokenService, mismo comportamiento que ya se
                                      usaba solo en el test de login
```

El fake de un único id ya existente (`fakeIdGenerator.ts`) no se toca: sigue sirviendo para los casos donde solo hace falta un id fijo. El nuevo `fakeSequentialIdGenerator.ts` cubre el caso distinto de necesitar varios ids en orden, que antes se resolvía con dos implementaciones casi iguales (`FakeIdGenerator` con `.shift()` en un test y `FakeSequentialIdGenerator` con índice en otro).

### Archivos de test actualizados

```txt
getCurrentUserUseCase.test.ts                    → usa FakeUserRepository en vez de
                                                    una InMemoryUserRepository local
loginUserUseCase.test.ts                         → usa FakeTokenService compartido
generateCodeChunksForProjectFileUseCase.test.ts  → usa FakeCodeChunkRepository y
                                                    FakeSequentialIdGenerator
                                                    (corrige el bug de tipado)
indexProjectEmbeddingsUseCase.test.ts            → usa FakeCodeChunkRepository y
                                                    FakeIdGenerator compartidos
generateEmbeddingForCodeChunkUseCase.test.ts     → usa FakeCodeChunkEmbeddingRepository,
                                                    FakeEmbeddingGenerator y
                                                    FakeIdGenerator compartidos
askProjectQuestionUseCase.test.ts                → usa FakeCodeChunkEmbeddingRepository
                                                    y FakeEmbeddingGenerator compartidos
uploadProjectZipUseCase.test.ts                  → usa FakeSequentialIdGenerator
                                                    compartido
```

Los fakes que solo se usaban en un único archivo (por ejemplo `FakeZipExtractor`, `FakeAnswerGenerator`, `FakeProjectIndexingScheduler` o `FakeFileHashGenerator`) se dejan donde estaban: extraerlos no habría eliminado duplicación real, solo habría movido código de sitio.

### Verificación

Tras el refactor:

```txt
npm run typecheck  → sin errores (incluido el bug de findByProjectId, ya corregido)
npm run test (unit) → 80/82 tests en verde
```

Los 2 tests que seguían fallando (`askProjectQuestionUseCase.test.ts`, esperando `limit: 5` cuando el caso de uso real ya pedía `limit: 7`) son un desajuste anterior a este refactor, no introducido por él, y quedan pendientes de corregir en el propio test.

```txt
✅ Fakes duplicados consolidados en tests/fakes/
✅ Un fake por puerto/repositorio, reutilizado donde corresponde
✅ Corregido el bug de tipado en FakeCodeChunkRepository
✅ InMemoryUserRepository unificado con FakeUserRepository
✅ npm run typecheck sin errores
✅ Suite de tests unitarios verificada tras el cambio
```

---

## Fase 11.4 — Corrección del código de estado HTTP en pregunta vacía

### Problema

Cuando un usuario hacía una pregunta vacía en `/ask`, DevMind lanzaba el error `QuestionIsRequired`, que heredaba de `AppError` pero pasaba el código de estado `404`. Ese código es incorrecto a nivel semántico: un `404 Not Found` significa "el recurso pedido no existe", mientras que una pregunta vacía es un error del **input** del cliente, que corresponde a un `400 Bad Request`.

Además, era una inconsistencia dentro del propio proyecto: el resto de errores de validación ya devolvían `400` (`ZipFileRequiredError`, `NoValidProjectFilesFoundError`, etc.). Solo este devolvía `404`.

### Cambio realizado

En `src/shared/errors/questionIsRequired.ts` se corrige el código de estado:

```txt
super("Question is required", 404)  →  super("Question is required", 400)
```

En la práctica este error salta muy pocas veces por HTTP, porque el schema de Zod (`askProjectQuestionSchema`) ya rechaza las preguntas vacías antes de llegar al caso de uso. Aun así, la comprobación redundante del caso de uso (defensa en profundidad) ahora devuelve el código correcto.

```txt
✅ Pregunta vacía devuelve 400 (Bad Request), no 404
✅ Consistente con el resto de errores de validación del proyecto
```

---

## Fase 11.5 — Umbral de relevancia en el RAG

### Problema

`AskProjectQuestionUseCase` solo devolvía el mensaje "No tengo suficiente información del proyecto..." cuando la búsqueda vectorial devolvía **cero** chunks. Eso únicamente ocurre cuando el proyecto no tiene ningún embedding indexado.

El problema es que, para un proyecto ya indexado, `findSimilarByProjectId` devuelve **siempre** los 5 chunks "más cercanos", aunque la pregunta no tenga nada que ver con el código. Esos chunks irrelevantes entraban igualmente en el prompt de Gemini, con el riesgo de que el modelo generara una respuesta "convincente pero inventada" sobre algo que no está en el proyecto.

Lo llamativo es que la información necesaria para evitarlo ya existía: la consulta de pgvector calcula y devuelve la `distance` de cada chunk (operador `<->`, distancia L2), pero ese dato no se usaba para nada.

### Cambio realizado

Se añade un umbral de distancia configurable y se filtran los chunks recuperados antes de pasarlos al modelo:

```txt
1. env.ts → nuevo env.rag.maxDistance (variable RAG_MAX_DISTANCE, por defecto 1.0).

2. AskProjectQuestionUseCase → recibe maxDistance por constructor
   (por defecto Number.POSITIVE_INFINITY, para no acoplar la capa de
   aplicación a la configuración y no alterar los tests existentes).
   Tras recuperar los chunks, descarta los que superan el umbral:
       relevantChunks = contextChunks.filter(c => c.distance <= maxDistance)
   Si no queda ninguno relevante, devuelve el mismo mensaje de "sin información".

3. container.ts → inyecta env.rag.maxDistance en el caso de uso.
```

De esta forma, si la pregunta no guarda relación con el proyecto, todos los chunks quedan fuera y DevMind responde honestamente que no tiene información, en lugar de forzar una respuesta.

**Nota sobre calibración:** el valor por defecto (`1.0`) es un punto de partida y debe ajustarse con preguntas reales, ya que la escala de la distancia depende del modelo de embeddings. Como está en `.env` (`RAG_MAX_DISTANCE`), se puede calibrar sin tocar código.

```txt
✅ Se filtran los chunks por distancia antes de generar la respuesta
✅ Preguntas fuera de contexto → "no tengo información" en vez de inventar
✅ Umbral configurable por entorno (RAG_MAX_DISTANCE)
✅ Sin acoplar la capa de aplicación a la configuración
```

---

## Fase 11.6 — Cabeceras de seguridad (helmet) y CORS configurable

### Problema

En `src/app.ts` la aplicación solo montaba `cors` y `express.json`, sin ninguna cabecera de seguridad HTTP. Faltaba el estándar mínimo (`X-Content-Type-Options`, `X-Frame-Options`, ocultar `X-Powered-By`, etc.).

Además, el origen permitido por CORS estaba escrito directamente en el código (`http://localhost:5173`), lo que obligaba a editar y recompilar para cambiarlo entre desarrollo y producción.

### Cambio realizado

```txt
1. Se instala helmet y se monta como primer middleware:
       app.use(helmet());

2. El origen de CORS pasa a leerse de la configuración:
       env.cors.origin (variable CORS_ORIGIN, por defecto http://localhost:5173)
       app.use(cors({ origin: env.cors.origin }));

3. Se añade CORS_ORIGIN a .env y .env.example.
```

El mismo código sirve ahora en local y en producción cambiando solo la variable de entorno, y todas las respuestas incluyen las cabeceras de seguridad de helmet.

```txt
✅ helmet añade cabeceras de seguridad en todas las respuestas
✅ Origen de CORS configurable por entorno (CORS_ORIGIN)
✅ .env y .env.example actualizados
```

---

## Fase 11.7 — Rate limit en rutas caras (/ask y /upload)

### Problema

Hasta ahora solo las rutas de autenticación (`/auth/register`, `/auth/login`) tenían rate limit. Las dos rutas más costosas quedaban sin protección:

```txt
/ask     → cada pregunta genera un embedding y llama a Gemini (coste real €).
/upload  → cada subida consume CPU/memoria y dispara la indexación en background.
```

Sin límite, un usuario autenticado (o un script suyo) podía lanzar miles de preguntas en bucle y disparar la factura de la API de Gemini, o martillear la subida de ZIPs.

### Cambio realizado

Se crea un middleware de rate limit reutilizable, pensado para aplicarse **después** de `authMiddleware`, de forma que puede limitar por **usuario autenticado** en lugar de solo por IP:

```txt
1. src/transport/http/middleware/userRateLimitMiddleware.ts
   - createUserRateLimitMiddleware({ max, windowMinutes }): factory de rate limit.
   - keyGenerator: usa req.user.userId; si no hubiera, cae a la IP (ipKeyGenerator).
   - skip: se desactiva en entorno de test (env.nodeEnv === "test").
   - Exporta askRateLimitMiddleware y uploadRateLimitMiddleware ya configurados.

2. env.ts → env.askRateLimit (20 / 15 min) y env.uploadRateLimit (10 / 60 min),
   ambos configurables por .env.

3. projectRoutes.ts → se aplican los middlewares tras authMiddleware:
       /:id/ask     → askRateLimitMiddleware
       /:id/upload  → uploadRateLimitMiddleware
```

Al limitar por `userId` y no solo por IP, el control es más preciso (dos usuarios detrás de la misma IP no se penalizan entre ellos, y un mismo usuario no esquiva el límite cambiando de IP).

```txt
✅ /ask y /upload protegidos con rate limit
✅ Límite por usuario autenticado (con fallback a IP)
✅ Límites configurables por entorno (ASK_/UPLOAD_RATE_LIMIT_*)
✅ Desactivado en tests para no interferir con la suite
```

---

## Fase 11.8 — Corrección de typos en comentarios

### Problema

Varios comentarios en español contenían erratas que, aunque no afectan al comportamiento, restan profesionalidad de cara a la revisión del proyecto:

```txt
container.ts                → "memmoria", "EMDEDDING", "Postgre"
uploadProjectZipUseCase.ts  → "udel", "archos", "estraidos",
                              "corresponiente", "archvio" y varias tildes
```

### Cambio realizado

Se corrigen todas esas erratas en los comentarios de `src/container/container.ts` y `src/application/uploadZip/uploadProjectZipUseCase.ts`. Es un cambio puramente cosmético, sin ninguna modificación de lógica.

```txt
✅ Comentarios corregidos en container.ts y uploadProjectZipUseCase.ts
✅ Sin cambios de comportamiento
```

---

## Fase 11.9 — Tests herméticos: generador de embeddings de test

### Problema

El `container` decide en tiempo de arranque qué implementación concreta usar para cada puerto, y en entorno de test ya cambiaba dos de ellas: el `AnswerGenerator` (por `TestAnswerGenerator`) y el `ProjectIndexingScheduler` (por `NoopProjectIndexingScheduler`). Sin embargo, el `EmbeddingGenerator` **se quedaba fijo** en `GenkitEmbeddingGenerator`, también durante los tests:

```txt
answerGenerator    → TestAnswerGenerator          (si NODE_ENV === "test")
scheduler          → NoopProjectIndexingScheduler (en test)
embeddingGenerator → new GenkitEmbeddingGenerator()  ← SIEMPRE, también en test
```

Como los tests de integración de `/projects/:id/index` y `/projects/:id/ask` generan embeddings, cada ejecución de la suite hacía **llamadas reales a la API de Gemini**. Esto tenía varios problemas serios:

```txt
- La suite dependía de la red, de la API key y de la cuota de Gemini.
- Podía fallar justo cuando Gemini devuelve un 503 (como pasó en pruebas reales),
  aunque el código fuera correcto.
- Era más lenta, no reproducible offline y consumía cuota en cada `npm test`.
```

Un test de integración debe ser determinista y no depender de un tercero externo.

### Cambio realizado

Se añade un generador de embeddings de test y se inyecta en el `container` con el mismo patrón que ya se usaba para el `AnswerGenerator`:

```txt
1. src/infrastructure/genkit/testing/testEmbeddingGenerator.ts
   - TestEmbeddingGenerator implementa EmbeddingGenerator.
   - Devuelve siempre el mismo vector determinista, de dimensión 768
     (la misma que la columna vector(768); si fuera otra, el INSERT fallaría).

2. container.ts
   embeddingGenerator = NODE_ENV === "test"
       ? new TestEmbeddingGenerator()
       : new GenkitEmbeddingGenerator();
```

Al devolver siempre el mismo vector, la distancia entre el embedding de la pregunta y el de cualquier chunk es 0 (por debajo del umbral del RAG), de modo que la búsqueda por similitud es estable y los tests que indexan y luego preguntan siguen recuperando sus chunks, pero **sin tocar la red**.

```txt
✅ Los tests de /index y /ask ya no llaman a Gemini
✅ Suite determinista, offline y sin consumo de cuota
✅ Mismo patrón de sustitución que answerGenerator y scheduler
✅ 142/142 tests en verde tras el cambio
```

---

## Fase 11.10 — Sincronización del OpenAPI con la Fase 11

### Problema

Tras los cambios de la Fase 11, el contrato `docs/openapi.yaml` se había quedado desactualizado en dos puntos:

```txt
- No documentaba las respuestas 429 (Too Many Requests) de las rutas con
  rate limit, ni las de auth (ya existentes) ni las nuevas de /ask y /upload.
- La descripción de /ask no reflejaba el nuevo umbral de relevancia (11.5):
  el fallback ahora también salta si los chunks no son suficientemente relevantes.
```

Un detalle a favor: el `400` de pregunta vacía en `/ask` **ya estaba** correctamente documentado en el OpenAPI. El desajuste real estaba en el código (devolvía 404), y se corrigió en la Fase 11.4; así que ahora contrato y código coinciden sin tocar el OpenAPI en ese punto.

### Cambio realizado

```txt
1. Se añade la respuesta "429" a las cuatro rutas con rate limit:
   /auth/register, /auth/login, /projects/{id}/upload, /projects/{id}/ask.

2. Se actualiza la descripción de /projects/{id}/ask para explicar que la
   respuesta de fallback también se devuelve cuando los chunks encontrados
   no superan el umbral de similitud configurado (RAG_MAX_DISTANCE).
```

El fichero se validó parseándolo tras el cambio: sigue siendo YAML válido, con sus 12 endpoints y las cuatro rutas con la respuesta 429 declarada.

```txt
✅ 429 documentado en las 4 rutas con rate limit
✅ Descripción de /ask actualizada con el umbral del RAG
✅ openapi.yaml validado (parseo correcto)
```

---

## Fase 11.11 — Indexación explícita: se elimina el scheduler automático de la subida del ZIP

En la **Fase 10** se introdujo un *worker* de indexación (el puerto `ProjectIndexingScheduler` con su adaptador `AsyncProjectIndexingScheduler`) para que, tras subir un ZIP, la generación de embeddings se lanzara **automáticamente en segundo plano** y la subida pudiera responder rápido. Esta subfase revisa esa decisión y da marcha atrás de forma consciente.

### El problema que vi

Probando la API con un proyecto real, la indexación automática en segundo plano **falló**: Gemini devolvió un `503 Service Unavailable` transitorio al generar el embedding de un chunk (el 82 de 397). Como esa indexación se lanzaba con un patrón *fire-and-forget* (`void useCase.execute().catch(console.error)`), el error solo se escribía en la consola del servidor. Al usuario ya se le había respondido `201` al subir el ZIP, así que **nunca se enteró del fallo por HTTP**; en la pantalla solo veía el estado `failed` sin explicación.

Al analizarlo, el problema de fondo es más profundo que "Gemini a veces falla":

```txt
Una tarea que se lanza en segundo plano DESPUÉS de responder la petición HTTP
no puede comunicar su resultado por esa respuesta, porque la respuesta ya se envió.
El errorMiddleware solo existe dentro del ciclo de vida de una petición.
Por tanto, un fallo de la indexación automática es intrínsecamente "mudo" por HTTP.
```

### Cómo pensé la solución

Comparé los dos caminos posibles:

```txt
- Mantener la indexación automática (fire-and-forget):
    [+] la subida responde rápido y no hay timeout
    [-] pero el fallo no se puede comunicar por HTTP (queda mudo)

- Hacer la indexación una acción EXPLÍCITA y síncrona del usuario:
    [+] el error vuelve por la respuesta HTTP (el usuario lo ve)
    [-] a cambio de que esa petición espere a que termine
```

La clave fue darme cuenta de que **ya existía** el endpoint manual `POST /projects/:id/index` (síncrono, pasa por el `errorMiddleware`) y un botón para lanzarlo. Así que la solución más simple y honesta era **eliminar el disparador automático** y dejar que sea el usuario quien indexe cuando quiera. De ese modo, si Gemini falla, el error se devuelve directamente en la respuesta del botón "Indexar".

El *trade-off* asumido: la indexación síncrona de un proyecto **muy grande** podría dar timeout de conexión (la petición se queda abierta mientras dura). Para la escala de este proyecto no ocurre, y queda documentado como trabajo futuro (cola real). Es el mismo motivo por el que en la Fase 10 se separó la indexación de la subida, pero con una diferencia importante: ahora es una acción donde **el usuario espera conscientemente** (puede verse un *spinner*), no la subida del ZIP quedándose bloqueada.

### Cómo se dejó implementado

Se elimina por completo el *worker* introducido en la Fase 10 y todo lo que colgaba de él:

```txt
Borrado (código muerto tras el cambio):
  - src/application/ports/projectIndexingScheduler.ts          (el puerto)
  - src/infrastructure/indexingAdapter/asyncProjectIndexingScheduler.ts
  - src/infrastructure/indexingAdapter/noopProjectIndexingScheduler.ts
  - la carpeta indexingAdapter/ (queda vacía)

Modificado:
  - UploadProjectZipUseCase: ya no recibe el scheduler ni llama a schedule(...)
    al final. Solo sincroniza ProjectFiles/CodeChunks y devuelve el resumen.
  - container.ts: se quitan los imports y la selección Noop/Async, y con ella
    la variable isTestEnvironment (que solo servía para elegir el scheduler).
  - tests: se elimina el FakeProjectIndexingScheduler y el test
    "schedules project indexing after uploading project files".
```

`IndexProjectEmbeddingsUseCase` **no se toca**: sigue siendo quien genera los embeddings, pero ahora se invoca **solo** desde el endpoint manual `/index`. El flujo queda así:

```txt
Subida ZIP
↓
guarda ProjectFiles + CodeChunks
↓
responde con el resumen de cambios   ← ya NO se indexa automáticamente
↓
(el usuario revisa y pulsa "Indexar")
↓
POST /projects/:id/index  (síncrono)
↓
genera embeddings; si Gemini falla, el error vuelve por HTTP (errorMiddleware)
```

```txt
✅ Indexación pasa a ser una acción explícita del usuario
✅ Los fallos de indexación se comunican por HTTP (ya no quedan mudos)
✅ Arquitectura más simple: desaparece el patrón fire-and-forget y sus riesgos
✅ IndexProjectEmbeddingsUseCase intacto; solo cambia quién lo invoca
✅ Trade-off (timeout en proyectos enormes) documentado como trabajo futuro
```

---

## Fase 11.12 — Reintentos con backoff ante fallos transitorios del proveedor de embeddings

### El problema y cómo me di cuenta

Probando la API con un proyecto real, la generación de embeddings falló en un chunk (el 82 de 397) porque Gemini devolvió un `503 Service Unavailable`. Era un fallo **transitorio**: el servicio estaba caído unos segundos. El problema es que el código **no reintentaba**, así que una única incidencia puntual tumbaba la indexación entera y obligaba a relanzarla desde cero.

Al analizarlo me di cuenta de que el problema de fondo no era "Gemini falla", sino que **no tolerábamos fallos temporales de un servicio externo**, algo totalmente esperable al integrarse con cualquier API de terceros. La primera vez que lo detecté, la indexación era automática en segundo plano; en la Fase 11.11 pasó a ser manual y síncrona, lo que además hace que ahora este tipo de error llegue al usuario por HTTP.

### La solución

**Reintentos con backoff exponencial**: ante un error transitorio, esperar cada vez un poco más (1s, 2s, 4s) y reintentar, en lugar de rendirse a la primera. Si el proveedor solo parpadeó, lo más probable es que un reintento funcione y no se pierda nada.

Dos matices importantes de la solución:

```txt
- Solo se reintentan los errores TRANSITORIOS: 503 (UNAVAILABLE) y 429
  (RESOURCE_EXHAUSTED). Un error "de verdad" (p. ej. API key inválida) NO se
  reintenta, porque reintentarlo no lo arreglaría; falla directo.
- Si tras agotar los reintentos el proveedor sigue caído, se lanza un error de
  dominio tipado (EmbeddingProviderUnavailableError, un AppError con código 503),
  que el errorMiddleware convierte en una respuesta HTTP clara.
```

### Cómo se implementó (siguiendo TDD)

Como el resto del proyecto, esta mejora se hizo con **TDD**: primero el test en rojo, luego la implementación mínima para ponerlo en verde.

```txt
Piezas nuevas:
  - src/infrastructure/retry/retryWithBackoff.ts
        utilidad genérica de reintentos con backoff.
  - src/shared/errors/embeddingProviderUnavailableError.ts
        error de dominio (extiende AppError, código 503).

Piezas modificadas:
  - GenkitEmbeddingGenerator: envuelve la llamada ai.embed(...) con
        retryWithBackoff y, si el fallo persiste, traduce el error crudo de
        Genkit al error de dominio tipado.
  - env.ts + .env/.env.example: EMBEDDING_MAX_RETRIES (3) y
        EMBEDDING_RETRY_BASE_MS (1000).
  - container.ts: inyecta el puerto Delay y la config en el adaptador.

Tests escritos primero:
  - retryWithBackoff.test.ts            (4 casos)
  - genkitEmbeddingGenerator.test.ts    (3 casos nuevos de reintento)
```

### Decisiones de diseño

1. **Los reintentos viven en infraestructura, no en aplicación.** La utilidad está en `src/infrastructure/retry/` y quien reintenta es el adaptador. Reintentar es un detalle de *cómo* se habla con un servicio externo, no lógica de negocio; por eso **no** se puso como un puerto de aplicación ni dentro de un caso de uso. Los casos de uso ni se enteran de que hay reintentos por debajo.

2. **La utilidad es genérica; el conocimiento de Gemini queda en el adaptador.** `retryWithBackoff` no sabe qué es un error de Genkit: recibe un predicado `isRetryable`. Quien sabe qué error es "transitorio" (`isTransientGenkitError`) es el adaptador, la única pieza que conoce Genkit. Así la utilidad se podría reutilizar mañana (por ejemplo para el generador de respuestas) sin acoplarla a ningún proveedor.

3. **La traducción del error también en el adaptador.** El error crudo de Genkit se traduce al error de dominio `EmbeddingProviderUnavailableError` en el adaptador, igual que en la Fase 11.1 se encapsuló el algoritmo del JWT en `JwtTokenService`. La capa de aplicación no depende de cómo falla Gemini.

4. **Reutilizar el puerto `Delay` existente.** El backoff espera mediante el mismo puerto `Delay` que ya usa `IndexProjectEmbeddingsUseCase`, inyectado por constructor. Gracias a eso, los tests usan un `Delay` falso que resuelve al instante y **no esperan de verdad** (los reintentos se testean sin que la suite tarde segundos).

5. **Números configurables por entorno.** 3 reintentos y base 1000 ms por defecto (esperas 1s→2s→4s, ~7s máximo por chunk que falle), ajustables por `.env` sin tocar código, como ya se hace con el resto de parámetros.

### Resultado / flujo

```txt
Usuario pulsa "Indexar" → POST /:id/index (síncrono)
   → por cada chunk, GenkitEmbeddingGenerator llama a Gemini
       → 503/429: reintenta con backoff (1s, 2s, 4s)
       → si acierta en un reintento: sigue normal, sin perder progreso
       → si se rinde: lanza EmbeddingProviderUnavailableError (503)
   → IndexProjectEmbeddingsUseCase marca el job "failed", guarda el mensaje, relanza
   → errorMiddleware → 503 con mensaje claro en la respuesta del botón
```

Nota: no se implementó el "paso 5" que se había documentado como opcional (exponer `errorMessage` en `/indexing-status`), porque con la indexación ya manual y síncrona (Fase 11.11) el error llega directamente por la respuesta HTTP del botón. La entrada correspondiente se retira de "Mejoras futuras" de la Defensa al quedar implementada aquí.

```txt
✅ Reintentos con backoff ante 503/429 del proveedor de embeddings
✅ Utilidad retryWithBackoff genérica y reutilizable (infraestructura)
✅ Error tipado EmbeddingProviderUnavailableError (503) tras agotar reintentos
✅ Solo se reintentan los errores transitorios; el resto falla directo
✅ Reintentos y backoff configurables por .env
✅ Implementado con TDD (7 tests nuevos, todos en verde)
```

---

## Fase 11.13 — Limpieza de `UploadProjectZipUseCase`: clasificador de dominio y puertos explícitos

### El problema

`UploadProjectZipUseCase` era el caso de uso más complejo del proyecto (unas 200 líneas) y **mezclaba responsabilidades que no le tocaban**:

```txt
1. Reglas de dominio incrustadas como funciones sueltas al final del archivo:
   - detectLanguageFromPath  → qué lenguaje es según la extensión
   - isIgnoredProjectFilePath → qué carpetas se ignoran (node_modules, .git...)
   - isBinaryProjectFile      → qué se considera binario (extensión o byte nulo)
   Ese conocimiento de negocio vivía dentro de un caso de uso cuya función
   principal debería ser ORQUESTAR, no contener las reglas.

2. Dependencias tipadas con un type local anónimo:
   type GenerateCodeChunksForProjectFileUseCase = {
     execute(input): Promise<unknown>;   ← acoplamiento implícito y sin tipado
   };
   El mismo problema existía en IndexProjectEmbeddingsUseCase con la
   generación de embeddings.
```

### La solución y cómo se implementó (siguiendo TDD)

Se abordó en dos partes, cada una en **TDD** (primero el test en rojo, luego la implementación):

**Parte 1 — Extraer las reglas de dominio a un `ProjectFileClassifier`.**

```txt
- Nuevo servicio de dominio: src/domain/services/projectFileClassifier.ts
    · isRelevant(file)     → true si el archivo no está en carpeta ignorada
                             ni es binario (compone las reglas)
    · detectLanguage(path) → el lenguaje según la extensión
- Nuevo test propio: tests/unit/domain/services/projectFileClassifier.test.ts
    (6 casos: archivos válidos, carpetas ignoradas, binarios por extensión,
     byte nulo, detección de lenguaje, extensión desconocida)
- UploadProjectZipUseCase pasa a USAR el clasificador en lugar de las funciones
  sueltas, que se eliminan del archivo.
```

**Parte 2 — Puertos explícitos para los casos de uso anidados.**

```txt
- Nuevos puertos en application/ports:
    · CodeChunkGenerator            (codeChunkGeneratorPort.ts)
    · EmbeddingForCodeChunkGenerator (embeddingForCodeChunkGeneratorPort.ts)
  Cada uno con su tipo de resultado explícito (ya no Promise<unknown>).
- Los casos de uso concretos ahora IMPLEMENTAN su puerto:
    · GenerateCodeChunksForProjectFileUseCase   implements CodeChunkGenerator
    · GenerateEmbeddingForCodeChunkUseCase      implements EmbeddingForCodeChunkGenerator
- UploadProjectZipUseCase e IndexProjectEmbeddingsUseCase dependen ahora del
  puerto (interfaz nombrada) en vez del type local anónimo.
```

Las reglas de comportamiento (qué carpetas se ignoran, qué es binario, qué lenguaje) se copiaron **tal cual** al clasificador: es un refactor que **no cambia el comportamiento**, y los tests de integración de la subida de ZIP (que ya existían) sirvieron de red de seguridad para garantizarlo.

### Decisiones de diseño

1. **El clasificador es un servicio de DOMINIO** (`src/domain/services/`), no de aplicación ni de infraestructura. "Qué archivos interesan" y "en qué lenguaje están" son reglas de negocio puras, sin entrada/salida, así que su sitio natural es el dominio.

2. **El clasificador se inyecta con un valor por defecto** (`fileClassifier: ProjectFileClassifier = new ProjectFileClassifier()`). Es el mismo patrón que ya se usa en otros adaptadores del proyecto: no obliga a tocar el `container` ni los tests existentes, pero deja la dependencia explícita y sustituible.

3. **Los puertos devuelven el tipo de resultado real, no `Promise<unknown>` ni `Promise<void>`.** Se comprobó que TypeScript no admite que un `Promise<objeto>` satisfaga un puerto `Promise<void>`, así que el contrato refleja lo que la operación produce de verdad. El resultado: un contrato **nombrado, explícito y tipado**, frente al anterior tipo anónimo y opaco.

4. **Refactor en pasos pequeños y verificados.** Primero el clasificador (con su test), verificando verde; después los puertos. Cada paso se comprobó con `typecheck` + tests antes de seguir.

### Qué NO se hizo (y por qué)

La tercera parte prevista —extraer un `ProjectFilesSynchronizer` que encapsule el diff de sincronización (crear/actualizar/borrar/mantener)— **no se implementó** en esta fase. Es la extracción de mayor tamaño y su beneficio es sobre todo de limpieza; se deja documentada como limitación asumida en la Defensa, para acometerla más adelante sin prisa. Con el clasificador y los puertos, el caso de uso ya ha adelgazado de forma notable.

```txt
✅ Reglas de dominio extraídas a ProjectFileClassifier (con su propio test)
✅ Puertos explícitos CodeChunkGenerator y EmbeddingForCodeChunkGenerator
✅ Casos de uso concretos implementan sus puertos (fin de Promise<unknown>)
✅ Comportamiento idéntico (refactor cubierto por los tests existentes)
✅ Implementado con TDD, en pasos pequeños y verificados
```

---

## Fase 11.14 — Protección de la ruta de indexación: guard de "ya en proceso" (409) y rate limit

### Problema

`POST /projects/:id/index` era, paradójicamente, la ruta **más cara del sistema** y la única de las costosas **sin ninguna protección**:

```txt
/ask     → 1 llamada a Gemini por petición.            → tenía rate limit (11.7)
/upload  → 0 llamadas a Gemini (solo escribe en BD).   → tenía rate limit (11.7)
/index   → N llamadas a Gemini (una por CADA chunk,    → SIN protección
           y además no incremental: reindexar borra
           y regenera todos los embeddings).
```

La idea inicial era que "solo se indexa cuando al usuario se le ha notificado que ya puede", pero eso es una condición de la **UI**, no una barrera del backend: nada impedía hacer `POST /:id/index` directamente (curl, un doble clic o un reintento del cliente). Peor aún, `IndexProjectEmbeddingsUseCase` **no comprobaba si ya había un job en `processing`** antes de arrancar: repetir la petición lanzaba **indexaciones solapadas** sobre el mismo proyecto, todas haciendo `deleteByCodeChunkId` + `save` sobre los mismos embeddings a la vez (carreras de datos, cuota de Gemini quemada por duplicado y el contador del job pisándose entre ejecuciones).

### Cambio realizado

Se atacan las dos capas del problema, la raíz y la defensa en profundidad:

```txt
1. Guard de idempotencia en el caso de uso (ataca la raíz del solapamiento)
   - Nuevo error de dominio IndexingAlreadyInProgressError (extiende AppError, 409).
   - IndexProjectEmbeddingsUseCase.execute: tras findByProjectId, si el job
     existente está en estado "processing", lanza el error ANTES de tocar nada
     (no reinicia el job ni genera embeddings). El errorMiddleware ya mapea
     AppError → su statusCode, así que el cliente recibe un 409 Conflict limpio.

2. Rate limit por usuario en la ruta (defensa en profundidad)
   - env.ts → env.indexRateLimit (5 / 60 min), configurable por
     INDEX_RATE_LIMIT_MAX / INDEX_RATE_LIMIT_WINDOW_MINUTES.
   - userRateLimitMiddleware.ts → indexRateLimitMiddleware, reutilizando la
     misma factory createUserRateLimitMiddleware de la Fase 11.7 (limita por
     userId con fallback a IP, y se desactiva en tests).
   - projectRoutes.ts → /:id/index pasa a: authMiddleware → indexRateLimitMiddleware.
```

Los dos mecanismos son complementarios: el **guard de estado** evita el solapamiento y el desperdicio de forma inmediata (es la corrección de fondo), y el **rate limit** da una capa extra frente a scripts que martilleen el endpoint fuera de una indexación en curso.

### Verificación

Se añadió un test unitario al caso de uso que arranca con un job ya en `processing` y comprueba que `execute` lanza `IndexingAlreadyInProgressError` **sin** generar ningún embedding ni actualizar el job (`updatedJobs` queda vacío). Junto con los tests previos (índice completo y fallo a mitad), el caso de uso queda en 4 tests en verde.

```txt
✅ /index protegido con guard de idempotencia (409 si ya hay indexación en curso)
✅ /index protegido con rate limit por usuario (INDEX_RATE_LIMIT_*, 5 / 60 min)
✅ Se evita el solapamiento de indexaciones concurrentes sobre el mismo proyecto
✅ Nuevo test del guard + suite del caso de uso en verde; typecheck limpio
```

---

## Fase 11.15 — Consistencia de nombres: archivos, carpetas y una clase de error

### Problema

Una revisión de _naming_ archivo por archivo confirmó que la base era sólida (todo en inglés, `lowerCamelCase` en los ficheros, sin mezcla español/inglés en identificadores, y las clases de infraestructura casando con su nombre de fichero). Aun así, aparecían **inconsistencias de coherencia** que, sin ser bugs, ensuciaban la lectura y rompían las convenciones del propio proyecto:

```txt
1. shared/errors/questionIsRequired.ts → clase QuestionIsRequired.
   Todas las demás clases de error terminan en "Error" (ProjectNotFoundError,
   ZipTooLargeError...). Esta se leía como una frase, no como un sustantivo.

2. application/ports/ → sufijo "Port" aplicado a medias: 5 ficheros con sufijo
   (idGeneratorPort, passwordHasherPort, fileHashGeneratorPort,
   codeChunkGeneratorPort, embeddingForCodeChunkGeneratorPort) y 5 sin él
   (delay, tokenService, answerGenerator, embeddingGenerator, zipExtractor).
   Además NINGUNA interfaz interna usa el sufijo (IdGenerator, PasswordHasher...).

3. domain/repository/ en singular, mientras sus hermanas son plurales
   (domain/entities/, domain/services/) y la carpeta agrupa 6 repositorios.

5. transport/http/auth/authSchema.ts en singular pese a exportar 2 schemas
   (registerSchema, loginSchema); sus equivalentes son plurales
   (projectSchemas.ts, projectFileSchemas.ts).

6. infrastructure/authAdapters/ en plural, frente a fileAdapter, repositoryAdapter,
   timeDelayAdapter y uploadZipAdapter, todos en singular.
```

(Los puntos se numeran como en el informe de revisión; el 4 —`application/codeChunk` en singular— y el 7 —`User` como `class` en vez de `type`— se dejaron fuera por implicar mover una carpeta de dominio con más superficie y por tocar código que instancia la entidad, respectivamente. Se documentan como deuda menor pendiente.)

### Cambio realizado

Renombrados puramente mecánicos (fichero/carpeta + actualización de imports), sin ningún cambio de comportamiento:

```txt
1. questionIsRequired.ts        → questionIsRequiredError.ts
   class QuestionIsRequired      → QuestionIsRequiredError

2. ports: se elimina el sufijo "Port" de los 5 ficheros para alinearlos con el
   resto y con las interfaces que ya no lo llevaban:
     idGeneratorPort.ts                    → idGenerator.ts
     passwordHasherPort.ts                 → passwordHasher.ts
     fileHashGeneratorPort.ts              → fileHashGenerator.ts
     codeChunkGeneratorPort.ts             → codeChunkGenerator.ts
     embeddingForCodeChunkGeneratorPort.ts → embeddingForCodeChunkGenerator.ts

3. domain/repository/            → domain/repositories/

5. auth/authSchema.ts           → auth/authSchemas.ts

6. infrastructure/authAdapters/ → infrastructure/authAdapter/
   (y su carpeta espejo en tests: tests/unit/infrastructure/authAdapter/)
```

Todos los movimientos se hicieron con `git mv` para preservar el historial, y las importaciones afectadas (en `src` y `tests`) se actualizaron en consecuencia.

### Verificación

```txt
✅ grep de referencias obsoletas: ninguna (ni imports ni nombre de clase antiguo)
✅ npm run typecheck → sin errores
✅ Tests unitarios sin dependencia de BD en verde (84/84), incluidos los de
   authAdapter/, ports y el error renombrado
   [los tests de infrastructure/database/ requieren PostgreSQL levantado y no
    se ejecutaron en esta verificación local]
✅ Cambio de solo-renombrado: comportamiento idéntico, cubierto por los tests
   existentes
```

Quedan como deuda menor consciente los puntos 4 (`application/codeChunk` → `codeChunks`) y 7 (`User` como `type` en lugar de `class`), por su mayor superficie de cambio frente al beneficio de coherencia.

---

## Fase 11.16 — Cierre de huecos de cobertura: test del estado de indexación y test del rate limiting

### Problema

Una revisión de la carpeta `tests/` detectó dos huecos de cobertura sobre funcionalidad **real y activa** del proyecto:

```txt
1. GetProjectIndexingStatusUseCase no tenía test unitario propio: solo se
   ejercitaba de forma indirecta a través del test de integración HTTP. Era el
   único caso de uso del bloque de indexación/RAG sin test dedicado (los otros
   —indexProjectEmbeddings, askProjectQuestion, generateEmbeddingForCodeChunk—
   sí lo tenían).

2. El rate limiting no estaba testeado en ningún sitio. Ninguno de los cuatro
   limiters (auth, ask, upload e index) tenía un test que disparase el límite y
   comprobase el 429; se había verificado a mano en su momento, pero sin quedar
   como test automatizado. Riesgo de regresión silenciosa: alguien podía tocar
   la configuración del limiter y romper el límite sin que nada lo avisara.
```

El segundo hueco era especialmente relevante tras la Fase 11.14, que añadió un **cuarto** limiter (`indexRateLimitMiddleware`) precisamente para proteger la ruta más cara del sistema: una protección de seguridad que conviene demostrar con un test en verde, no solo con una comprobación manual.

### Cambio realizado

**1. Test unitario de `GetProjectIndexingStatusUseCase.**

```txt
tests/unit/application/indexing/getProjectIndexingStatusUseCase.test.ts
  - Calca el patrón del test de indexProjectEmbeddings (fake local del
    repositorio de jobs + FakeProjectRepository compartido).
  - 5 casos: sin job (estado "pending" con contadores a 0), job "processing"
    (verifica el cálculo de progreso: 3/8 → 38 %, redondeado), job "completed"
    (100 %), job "failed" (mantiene el progreso parcial 1/4 → 25 %) y proyecto
    de otro usuario (ProjectNotFoundError).
```

**2. Test de integración del rate limiting (los cuatro limiters).**

El reto era que los limiters se **desactivan en entorno de test** (`skip: () => env.nodeEnv === "test"`), para no interferir con el resto de la suite. La clave es que ese `skip` es un _closure_ que lee `env.nodeEnv` **en cada petición**, así que el test puede activarlos temporalmente:

```txt
tests/integration/rateLimit/rateLimitMiddleware.test.ts
  - beforeAll: env.nodeEnv = "development"  (desactiva el skip → limiters activos)
    afterAll:  se restaura el valor original.
    Es seguro porque vitest.config.ts usa fileParallelism: false (los ficheros
    corren en serie): ningún otro test se ve afectado por el cambio temporal.
  - Monta cada middleware REAL sobre una ruta trivial (GET /limited) con
    supertest, sin arrastrar auth, base de datos ni proyectos. El rate limit es
    agnóstico al método/ruta, así que esto prueba el limiter de forma aislada.
  - Por cada limiter dispara env.X.max peticiones (deben dar 200) y una más
    (debe dar 429 con el mensaje "Too many requests, please try again later").
    Al leer el límite desde env.X.max, el test NO se rompe si se reconfiguran
    los límites por entorno.
  - Cubre los cuatro: authRateLimit, askRateLimit, uploadRateLimit e
    indexRateLimit (este último, el añadido en la Fase 11.14).
```

### Verificación

```txt
✅ getProjectIndexingStatusUseCase.test.ts → 5/5 en verde
✅ rateLimitMiddleware.test.ts → 4/4 en verde (un test por limiter, patrón N+1)
✅ npm run typecheck → sin errores
```

Con esto, todo el bloque de indexación/RAG tiene test unitario dedicado y el rate limiting —incluida la nueva protección de la ruta de indexación— queda demostrado con tests automatizados en lugar de depender de comprobaciones manuales.

---

## Fase 11.17 — Eliminar la dependencia oculta de `GEMINI_API_KEY` en la suite de tests

### Problema

Una revisión de la carga de la suite detectó una **dependencia oculta en tiempo de _import_**: toda la batería de tests requería que la variable `GEMINI_API_KEY` estuviese definida, **aunque ningún test llama de verdad a la API de Gemini** (con `NODE_ENV=test` el container inyecta fakes: `TestEmbeddingGenerator` y `TestAnswerGenerator`).

El motivo es la cadena de importaciones y el hecho de que la comprobación de la clave está en el **cuerpo del módulo** (se ejecuta al importar, no al usar):

```txt
tests → app.ts → container.ts
  import { GenkitAnswerGenerator }    (container.ts, import estático e incondicional)
  import { GenkitEmbeddingGenerator }
        → import { ai } from "./ai"
              → ai.ts (nivel de módulo):
                    if (!process.env.GEMINI_API_KEY) throw new Error(...)
```

La paradoja: el container **decide usar fakes en tiempo de ejecución**, pero esa decisión ocurre *después* de que todos los `import` se hayan resuelto. Al importar `GenkitAnswerGenerator`/`GenkitEmbeddingGenerator` se arrastra `ai.ts`, cuyo `throw` de nivel de módulo se dispara en la carga, mucho antes de elegir el fake. Resultado: **runtime** no usa la clave para nada, pero **load time** la exige o la suite entera revienta en el import.

Hoy no daba la cara porque `.env` siempre define la variable (y `ai.ts` hace `dotenv.config()` al cargar). El riesgo aparece en un **checkout limpio sin `.env`** o en un **futuro pipeline de CI**: toda la suite fallaría antes de ejecutar un solo test, con un error (`GEMINI_API_KEY is not defined`) que no tiene nada que ver con el test que se quería correr. El impacto real es **bajo hoy** (solo se ejecuta en la máquina de desarrollo, no hay CI), pero es relevante de cara a portabilidad y despliegue.

### Cambio realizado

Se optó por la solución más simple y de menor riesgo (**valores dummy garantizados en el entorno de test**), sin tocar el código de producción. `vitest.config.ts` ya inyectaba `NODE_ENV=test`; se añaden ahí las dos variables que se comprueban a nivel de módulo. Aprovechando el mismo cambio se cubrió también el **caso hermano de `JWT_SECRET`** (`infrastructure/config/env.ts` lanza igual si falta), de modo que la suite queda totalmente independiente de un `.env` presente:

```txt
vitest.config.ts → test.env:
    NODE_ENV: "test"
    GEMINI_API_KEY: "test-dummy-gemini-key"   ← nuevo (ai.ts)
    JWT_SECRET: "test-dummy-jwt-secret"       ← nuevo (env.ts)
```

Es seguro porque:

- Los tests **nunca** llaman a Gemini (usan fakes), así que `GEMINI_API_KEY` no se emplea para ninguna llamada real; solo satisface el `if` de `ai.ts` al importar.
- El `JWT_SECRET` dummy se usa de forma **autoconsistente**: los tests que ejercitan auth firman y verifican el token con ese mismo secreto, así que un valor de relleno es perfectamente válido.
- `vitest` aplica `test.env` a `process.env` **antes** de cargar el grafo de módulos, y `dotenv.config()` no sobrescribe variables ya presentes, por lo que la suite deja de depender de que exista un `.env`.

No se eligió la alternativa (mover los `throw` a un chequeo _perezoso_ dentro del primer uso real) para no tocar código de producción ya en uso; la inyección en la config de test resuelve el problema con un cambio localizado y reversible. `DATABASE_URL`, la tercera variable requerida, ya la aporta el script `npm test` de forma explícita, así que no necesita dummy.

### Verificación

Se reprodujo el escenario del hallazgo moviendo temporalmente el `.env` (simulando un checkout limpio), comprobando tanto `GEMINI_API_KEY` (import de `ai.ts`) como `JWT_SECRET` (import de `env.ts`):

```txt
✅ SIN el dummy de GEMINI_API_KEY y SIN .env → falla en el import con exactamente
   "GEMINI_API_KEY environment variable is not defined"      (reproduce el problema)
✅ SIN el dummy de JWT_SECRET y SIN .env    → falla en el import con
   "JWT_SECRET is required"                                  (mismo patrón, caso hermano)
✅ CON ambos dummies y SIN .env → la suite carga y los tests pasan
✅ .env restaurado tras la comprobación
```

Con esto, la suite deja de tener dependencias ocultas en el import: arranca en un checkout limpio sin `.env` (las tres variables requeridas quedan cubiertas: `GEMINI_API_KEY` y `JWT_SECRET` por `test.env`, y `DATABASE_URL` por el script `npm test`).

---

## Fase 11.18 — Eliminar la creación manual de archivos: los archivos solo entran por ZIP

### Problema

El sistema exponía **dos vías** para meter archivos en un proyecto:

```txt
1. POST /projects/:projectId/upload  → subir un ZIP (flujo principal).
2. POST /projects/:projectId/files   → crear un archivo suelto a mano
                                        (path + language + content en el body).
```

La segunda vía (creación manual, archivo a archivo) había quedado **en desuso**: la experiencia real es subir el proyecto entero como ZIP, y mantener un endpoint alternativo para crear archivos sueltos era superficie de código y de API sin uso, que además invitaba a estados incoherentes (archivos creados a mano que no forman parte de ningún ZIP subido).

### Cambio realizado

Se elimina **solo** la vía de creación manual (`POST .../files`), conservando el resto de la gestión de archivos (**listar, ver y borrar**), que sigue siendo útil para inspeccionar y depurar lo que el ZIP ha creado. Al hacerlo se detectó y limpió toda la cadena que quedaba muerta —no bastaba con borrar la ruta—:

```txt
Ruta        projectFileRoutes.ts     → se quita el POST /:projectId/files
                                        (y el import de validateBody, ya sin uso aquí).
Controller  projectFileController.ts → se elimina el método create() y su dependencia.
Caso de uso createProjectFileUseCase.ts → borrado (solo lo usaba esa ruta; el flujo de
                                        ZIP escribe en projectFileRepository directamente).
Schema      projectFileSchemas.ts    → borrado (projectFileSchema solo validaba el create).
Puerto/adaptador de hash:
   ports/fileHashGenerator.ts        → borrado
   infrastructure/fileAdapter/cryptoFileHashGenerator.ts → borrado (carpeta eliminada)
   → eran dependencias EXCLUSIVAS del create manual. El flujo de ZIP calcula su propio
     hash inline con createHash de node:crypto, así que este puerto quedaba huérfano.
Container   container.ts             → se retiran los imports e instancias de
                                        CreateProjectFileUseCase y CryptoFileHashGenerator.
OpenAPI     openapi.yaml             → se elimina la operación POST /projects/{projectId}/files.
```

Un detalle importante que confirma que el borrado es seguro: `UploadProjectZipUseCase` **nunca** dependió de `CreateProjectFileUseCase`; sincroniza los archivos usando `projectFileRepository` directamente (`save`/`update`/`delete`). Por eso quitar la creación manual no toca en absoluto la subida por ZIP.

### Impacto en los tests

El test de integración de archivos (`projectFilesEndpoints.test.ts`) **sembraba** los datos de las pruebas de listar/ver/borrar usando el propio `POST .../files`. Al desaparecer ese endpoint, se reescribió la siembra para que use el **único camino real** que ahora crea archivos: la subida de un ZIP (con `AdmZip`, igual que el test de `upload`). Se extrajeron helpers (`registerAndLogin`, `createProject`, `uploadFiles`) para no repetir el _setup_, y se eliminaron los casos que probaban específicamente el `POST` de creación manual. Las pruebas de listar, ver y borrar se mantienen intactas en intención.

Se eliminó también el test unitario `createProjectFileUseCase.test.ts` (el caso de uso ya no existe). No había test dedicado del adaptador de hash, así que su borrado no dejó tests colgando.

### Verificación

```txt
✅ npm run typecheck → sin errores (sin referencias muertas al caso de uso, schema,
   puerto ni adaptador eliminados)
✅ openapi.yaml → YAML válido tras quitar la operación POST
✅ smoke test → la app arranca y cablea el container sin el caso de uso de creación
   (import de src/app.ts sin errores)
   [los tests de integración de archivos requieren PostgreSQL levantado; con la BD
    activa se validan con npm test]
```

La gestión de archivos queda alineada con el flujo real del producto: **los archivos solo entran por ZIP**, y el usuario únicamente puede listar, ver y borrar los que ese ZIP ha generado.

---

## Verificación de la Fase 11

Tras aplicar todos los cambios:

```txt
npm run typecheck  → sin errores
npm test           → 154/154 tests en verde (38 archivos), sin llamadas reales
                     a Gemini (embeddings faked en entorno de test)
                     [148 → 154 al añadir los 6 tests del ProjectFileClassifier]
smoke test         → la app arranca con el clasificador, los puertos explícitos,
                     los reintentos, helmet, CORS y rate limits, sin errores
openapi.yaml       → YAML válido tras la sincronización
```

---

## Estado tras la Fase 11

La mayoría de esta fase es consolidación y endurecimiento sin cambiar el comportamiento (JWT, helmet, rate limit, límite de ZIP, CORS y umbral de RAG por entorno, 400 en pregunta vacía, tests herméticos, OpenAPI sincronizado y la limpieza de `UploadProjectZipUseCase` con el clasificador de dominio y los puertos explícitos). Los dos cambios con impacto de comportamiento son: la Fase 11.11 (tras subir un ZIP DevMind **ya no indexa automáticamente**; la indexación es una acción explícita del usuario mediante `POST /projects/:id/index`) y la Fase 11.12 (el proveedor de embeddings ahora **se reintenta ante fallos transitorios** y, si se rinde, devuelve un 503 con mensaje claro). Juntas hacen que los fallos del proveedor se toleren cuando son pasajeros y se comuniquen por HTTP cuando son reales, en lugar de tumbar la indexación en silencio. A ellas se suma la Fase 11.14, que protege la ruta de indexación —la más cara del sistema— con un guard de idempotencia (**409 si ya hay una indexación en curso**, evitando pasadas solapadas) y un rate limit por usuario. La Fase 11.15 es una pasada de **consistencia de nombres** (archivos, carpetas y una clase de error) sin impacto de comportamiento, que alinea el proyecto con sus propias convenciones. La Fase 11.16 **cierra dos huecos de cobertura** (test unitario del estado de indexación y test del rate limiting de los cuatro limiters, incluido el de indexación), sustituyendo comprobaciones manuales por tests automatizados. La Fase 11.17 elimina las **dependencias ocultas de `GEMINI_API_KEY` y `JWT_SECRET`** en la carga de la suite, inyectando valores dummy en el entorno de test para que no dependa de un `.env` presente (checkout limpio, CI). Y la Fase 11.18 **elimina la creación manual de archivos** (`POST .../files`) y toda su cadena de código muerto asociada, de modo que los archivos solo entran por la subida de ZIP; se conservan listar, ver y borrar. En conjunto, el proyecto queda más seguro, más simple, más resiliente y más honesto en cómo comunica los errores.

---

# Fase 12 — Guardado de historial de conversaciones

## Objetivo de la fase

Hasta ahora, cuando un usuario preguntaba a un proyecto (`POST /projects/:id/ask`), la respuesta se generaba y se devolvía, pero **no se guardaba en ningún sitio**: al recargar o volver más tarde, la conversación se había perdido.

Esta fase añade el **historial de conversaciones por proyecto**: cada pregunta que hace el usuario y su respuesta se **persisten**, de modo que el proyecto conserva un registro de todo lo que se le ha preguntado. Es una de las ventajas del usuario registrado frente al futuro modo invitado (que no guardará nada).

Requisitos concretos:

- El historial se guarda **por proyecto** (si un usuario tiene tres proyectos, cada uno tiene su propio historial).
- De cada intercambio se guarda **la pregunta del usuario y la respuesta de la IA** (más las fuentes que ya devuelve el RAG).
- Es una funcionalidad **solo para el flujo autenticado**; reutiliza la misma comprobación de propiedad que el resto del sistema.

## Enfoque de esta fase: desarrollo asistido por IA (yo como orquestador)

Esta fase se ha desarrollado de forma deliberada **apoyándome en una herramienta de IA (un asistente de programación)**, asumiendo yo el papel de **orquestador**. La IA no decidió *qué* construir ni *cómo* encajarlo en la arquitectura: ejecutó bajo mi dirección a partir de unos requisitos, unas decisiones de diseño y unas reglas de trabajo que yo había definido previamente.

Mi papel como orquestador consistió en:

- **Definir el objetivo y los requisitos funcionales** con precisión: historial por proyecto, guardar la pregunta y la respuesta, feature exclusiva del usuario registrado.
- **Tomar todas las decisiones de diseño** (las de la sección siguiente): elegí el modelo de una sola tabla frente al de dos tablas tras sopesar los _trade-offs_, el nombre del endpoint, guardar también las respuestas de "sin información", prescindir de paginación y enlazar la tabla solo por `project_id`. La IA me planteó las alternativas con sus pros y contras; la elección fue mía y razonada.
- **Imponer la metodología del proyecto:** exigí **TDD estricto** (test en rojo antes de implementar) para mantener la coherencia con el DDD y la arquitectura hexagonal ya establecidos.
- **Fijar guardarraíles:** indiqué explícitamente que no se hicieran cambios significativos sin consultarme y explicar el porqué, para que la IA no alterase la arquitectura por su cuenta.
- **Pedir y revisar un plan antes de codificar:** primero exigí un plan de implementación, lo revisé y lo aprobé; solo entonces se pasó a la ejecución.
- **Validar el resultado:** comprobé que cada test fallara primero (rojo) y pasara después (verde), y que la suite completa quedara en verde contra la base de datos real.

El valor de esta fase, desde el punto de vista del uso de IA, no está en que "la IA escribió el código", sino en que **un prompt bien construido y unos fundamentos sólidos** —requisitos claros, decisiones de diseño argumentadas, una metodología impuesta y unos límites definidos— permitieron que la IA produjera una feature que **encaja de forma natural en la arquitectura existente, con sus tests y su documentación**, sin desviarse del estilo del proyecto. Esa dirección es la aportación principal: saber **qué** pedir, **cómo** acotarlo y **cómo** verificarlo.

## Decisiones de diseño (que tomé como orquestador antes de empezar)

1. **Modelo de datos: una sola tabla, una fila por intercambio.** Cada fila guarda la pregunta y su respuesta juntas (`conversation_entries`). Se descartó el modelo de dos tablas (`conversations` + `messages`, estilo chat multi-turno) porque el RAG actual es "sin memoria" (cada pregunta es independiente): ese modelo añadiría complejidad sin uso real. Queda como posible mejora futura.
2. **Endpoint de lectura: `GET /projects/:id/history`.**
3. **Se guardan también las respuestas de "no tengo información"**, porque son historial real de lo que el usuario preguntó.
4. **Sin paginación** por ahora: se devuelve todo ordenado por fecha (suficiente para el alcance del proyecto).
5. **La tabla se enlaza solo por `project_id`** (con `ON DELETE CASCADE`), sin `user_id`: el proyecto ya implica a su dueño. Esto además hace que, el día que exista el modo invitado, al borrar un usuario invitado se borren en cascada sus proyectos y, con ellos, su historial, sin lógica adicional.

## Metodología

Siguiendo la metodología que impuse como orquestador, la IA trabajó con **TDD** de forma estricta, coherente con el resto del proyecto (DDD + arquitectura hexagonal): para cada pieza de lógica se escribió **primero el test** y se comprobó que **falla (rojo)** antes de implementar; solo entonces se escribió el código mínimo para ponerlo **en verde**. Yo revisé el rojo y el verde de cada paso. Los pasos siguientes reflejan ese ciclo, que es también el orden en el que se construyó la feature.

## Paso a paso

### 1. Dominio: la entidad y el puerto del repositorio

Primero se modela el concepto en el dominio, sin depender de infraestructura:

- **Entidad** `ConversationEntry` (`src/domain/entities/conversationEntry.ts`): `id`, `projectId`, `question`, `answer`, `sources` (array de `{ path, startLine, endLine }`) y `createdAt`.
- **Puerto** `ConversationRepository` (`src/domain/repositories/conversationRepository.ts`): interfaz con `save(entry)` y `findByProjectId(projectId)` (que devuelve el historial ordenado cronológicamente).

Al ser tipos e interfaz, no llevan test propio; su corrección se valida a través de los tests de quienes los usan. En paralelo se crea el doble de test `FakeConversationRepository` (`tests/fakes/fakeConversationRepository.ts`), un repositorio en memoria que implementa el puerto y ordena por fecha, para poder testear los casos de uso sin tocar PostgreSQL.

### 2. Persistencia al preguntar (TDD sobre `AskProjectQuestionUseCase`)

**Primero el test (rojo).** Se amplió `tests/unit/application/projectQuestions/askProjectQuestionUseCase.test.ts` para afirmar que, tras preguntar, **se guarda una entrada** en el `FakeConversationRepository` con la pregunta, la respuesta y las fuentes. Se añadió también la afirmación en el caso de "no hay información" (debe guardarse igualmente) y, en los caminos que lanzan error (pregunta vacía, proyecto ajeno), que **no se guarda nada**.

Al ejecutarlo, el test **falló** por dos motivos esperados: el caso de uso todavía no persistía nada, y su constructor no aceptaba el nuevo repositorio.

**Después la implementación (verde).** Se modificó `AskProjectQuestionUseCase`:

- **Cambio necesario de dependencias:** el constructor recibe ahora dos dependencias nuevas, `ConversationRepository` e `IdGenerator` (para generar el id de la entrada). Es un cambio aditivo e imprescindible: persistir el intercambio es parte de "responder una pregunta", así que la responsabilidad vive de forma cohesionada en este caso de uso, no repartida en el controlador.
- **Guardado en ambos caminos:** se reestructuró `execute` para calcular `answer` y `sources` (tanto en el camino normal como en el de "sin información") y, a continuación, **guardar una vez** la entrada antes de devolver la respuesta. El comportamiento externo del endpoint no cambia (misma respuesta); solo que ahora, por dentro, además persiste.

Tras el cambio, los tests del caso de uso pasaron a **verde**.

### 3. Lectura del historial (TDD sobre un caso de uso nuevo)

**Primero el test (rojo).** Se creó `tests/unit/application/projectQuestions/getProjectConversationHistoryUseCase.test.ts` con tres casos: devuelve el historial del proyecto ordenado por fecha (y no mezcla el de otros proyectos), devuelve vacío si no hay historial, y lanza `ProjectNotFoundError` si el proyecto no pertenece al usuario. Al no existir aún el caso de uso, el test **falló** al importarlo.

**Después la implementación (verde).** Se creó `GetProjectConversationHistoryUseCase` (`src/application/projectQuestions/getProjectConversationHistoryUseCase.ts`), que reutiliza el patrón de autorización del resto del sistema: comprueba `findByIdAndOwnerId(projectId, userId)` y, si el proyecto es del usuario, devuelve `conversationRepository.findByProjectId(projectId)`. Test **en verde**.

### 4. Infraestructura: migración y repositorio PostgreSQL

- **Migración** `008_create_conversation_entries.sql`: tabla `conversation_entries` con `project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE`, `question`, `answer`, `sources JSONB` y `created_at`, más un índice sobre `project_id`. El uso de `JSONB` permite guardar el array de fuentes de forma nativa.
- **Adaptador** `PostgresConversationRepository`: implementación del puerto con SQL parametrizado (mismo patrón que el resto de repositorios). En `save` se serializa `sources` con `JSON.stringify` y `$5::jsonb`; en la lectura, `node-postgres` deserializa el `JSONB` automáticamente. `findByProjectId` ordena por `created_at ASC`.
- **Test de base de datos** `postgresConversationRepository.test.ts`: guarda entradas, comprueba que se listan por proyecto en orden y que las `sources` (incluida la lista vacía) sobreviven al viaje de ida y vuelta a `JSONB`. Se añadió `conversation_entries` a la limpieza (`TRUNCATE`) del `globalSetup` de tests, por consistencia con la convención de listar las tablas explícitamente (aunque el `CASCADE` de `projects` ya la arrastraría).

### 5. Capa HTTP: endpoint, controlador, ruta y wiring

- **Endpoint nuevo:** `GET /projects/:id/history`, protegido con `authMiddleware`.
- **Controlador:** método `history` en `ProjectController`, que delega en `GetProjectConversationHistoryUseCase` con el `userId` tomado del JWT (nunca del body).
- **Ruta:** registrada en `projectRoutes.ts`.
- **Container:** se instancia `PostgresConversationRepository` y se inyecta tanto en `AskProjectQuestionUseCase` (para guardar) como en el nuevo caso de uso de lectura. El endpoint `POST /:id/ask` no cambia por fuera.

### 6. Test de integración (extremo a extremo)

Se creó `tests/integration/projectQuestions/conversationHistoryEndpoint.test.ts`, que ejercita el flujo completo contra la base de datos real: registrarse → login → crear proyecto → preguntar dos veces → `GET /history` devuelve las dos preguntas con sus respuestas en orden. Cubre además: historial vacío (devuelve `[]`), `401` sin token y `404` sobre el proyecto de otro usuario.

### 7. Documentación del contrato (OpenAPI)

Se añadió al `openapi.yaml` la operación `GET /projects/{id}/history` y el schema `ConversationEntry`, para que el contrato siga reflejando fielmente la API (y sirva para generar el frontend).

## Verificación

```txt
✅ TDD respetado: cada pieza tuvo su test en rojo antes de implementarse
✅ npm run typecheck → sin errores
✅ npm test → 166/166 tests en verde (42 archivos), incluidos:
   - el test unitario de persistencia en AskProjectQuestionUseCase (con fakes)
   - el test unitario de GetProjectConversationHistoryUseCase (con fakes)
   - el test de base de datos de PostgresConversationRepository (PostgreSQL real)
   - el test de integración del endpoint GET /:id/history (extremo a extremo)
✅ openapi.yaml válido tras añadir el endpoint y el schema ConversationEntry
```

## Resultado

DevMind guarda ahora, por cada proyecto, el historial de preguntas y respuestas, y lo expone en `GET /projects/:id/history`. La implementación reutiliza por completo la arquitectura existente (puertos/adaptadores, comprobación de propiedad, fakes de test) y no altera el comportamiento externo del endpoint de preguntas. El único cambio de firma —añadir el repositorio de conversaciones y el generador de ids a `AskProjectQuestionUseCase`— era imprescindible para que el guardado viva donde le corresponde. Con esta fase, el "premio" de registrarse queda completo: proyectos, archivos, chunks y embeddings persistentes **y** el historial de conversaciones.

Como cierre, esta fase deja constancia de un **uso responsable y dirigido de la IA** como herramienta de desarrollo: el objetivo, las decisiones de diseño, la metodología (TDD) y la validación fueron mías; la IA aceleró la ejecución dentro de esos límites. El resultado —una feature coherente con la arquitectura, cubierta por tests y documentada— no proviene de delegar el criterio, sino de **orquestar la herramienta con buenos fundamentos**: un objetivo claro, decisiones argumentadas y una verificación exigente.

---

# Fase 13 — Modo invitado (onboarding sin registro)

## Objetivo de la fase

El objetivo nace de un requisito de experiencia de usuario: **lo primero que se ve al abrir DevMind no debe ser una pantalla de login/registro**, sino el producto listo para probarse. Para que un visitante pueda **subir un ZIP y hablar con la IA sin registrarse**, se añade un **modo invitado**. Registrarse pasa a ser el "plus" (proyectos e historial permanentes, cubiertos por las fases anteriores).

El reto de fondo es que **toda la API exige una credencial**: cada ruta protegida verifica un token JWT y todo recurso cuelga de un `ownerId` que es clave foránea a `users`. No existe un camino anónimo. La solución elegida respeta esa arquitectura en lugar de romperla: **un invitado es un usuario temporal real, creado automáticamente**, al que se le entrega un token legítimo. Así reutiliza todo el pipeline (subida, chunks, embeddings, RAG, historial) exactamente igual que un registrado.

### Aclaración importante sobre "persistencia"

La diferencia invitado/registrado **no es "guardar vs no guardar"**: para que el RAG funcione, el ZIP del invitado **tiene que** trocearse, generar embeddings y guardarse en PostgreSQL. El invitado **también escribe en las mismas tablas** durante su sesión. La diferencia real es:

- **Registrado → permanente y recuperable** (puede volver a iniciar sesión y ver sus datos).
- **Invitado → temporal y no recuperable** (sus datos se guardan durante la sesión pero caducan y se limpian; y al no tener credenciales, al volver empieza de cero).

## Decisiones de diseño (tomadas como orquestador antes de empezar)

1. **El invitado es un usuario temporal real** en la misma tabla `users`, marcado con `is_guest` y `expires_at`. No se crean tablas aparte ni se hace `ownerId` _nullable_.
2. **Opción B — limpieza diferida:** se implementa la lógica de borrado de invitados caducados (con su test), pero **no** se monta un _scheduler_ automático. La limpieza se ejecuta con un script (`npm run purge-guests`) y programarla queda como tarea de operaciones / mejora futura.
3. **`password_hash` inservible:** el invitado nunca inicia sesión con contraseña; se guarda el hash de un valor aleatorio, para que nadie pueda autenticarse como él.
4. **TTL configurable** por entorno (`GUEST_TTL_HOURS`, por defecto 24 h).
5. **Rate limit por IP** en el endpoint público de invitado.

### Decisión consciente: NO limitar el número de proyectos del invitado

Se valoró **limitar al invitado a un solo proyecto** como diferenciador frente al registrado. **Se decidió deliberadamente no hacerlo (por ahora)**, y conviene dejar constancia del razonamiento:

- **Se podría haber hecho, pero implicaba bastante más** y del tipo "malo": era el **primer punto donde la lógica de invitado se colaría en el pipeline compartido**. Sin ese límite, el modo invitado es **prácticamente aditivo** y no toca ningún caso de uso existente; el límite rompe esa propiedad.
- En concreto, habría obligado a: (1) **tocar `CreateProjectUseCase`** (una pieza ya funcionando y testeada), (2) darle una forma de **saber si el usuario es invitado** —cargar el usuario desde el repositorio (dependencia + consulta extra) o meter `is_guest` en el JWT (cambiar el contrato del token, el `authMiddleware` y los tipos)—, (3) **un error nuevo** (`403`) con su mapeo, y (4) **tests del nuevo comportamiento**.
- **No aporta valor imprescindible:** el objetivo (probar sin registrarse) se cumple igual; la temporalidad de los datos ya la garantizan el **TTL + la limpieza**; y el abuso caro (llamadas a Gemini) ya está frenado por los **rate limits** existentes. Crear proyectos de más solo genera filas vacías baratas que además se limpian por caducidad.
- **Queda como mejora futura contenida:** si se quisiera el diferenciador, se añade después, idealmente metiendo `is_guest` en el JWT (que además le serviría al frontend para saber cuándo mostrar el aviso de "regístrate para guardar").

### Refinamiento sobre el plan inicial: marcas de invitado solo en infraestructura

El plan preveía extender la **entidad de dominio `User`** con los campos `isGuest`/`expiresAt`. Al implementar se optó por una vía **aún más aditiva y de menor riesgo**: como **ninguna lógica de dominio necesita saber si un usuario es invitado** (consecuencia directa de la decisión anterior de no limitar proyectos), las marcas de invitado se mantienen **solo en la capa de infraestructura**. En la práctica, esto significó **no tocar la entidad `User` ni sus consumidores**: la persistencia de invitado y su limpieza se resuelven con **dos métodos nuevos en el repositorio** (`saveGuest`, `deleteExpiredGuests`), sin modificar `save`, `toDomain` ni la entidad. Menos superficie tocada, mismo resultado.

## Metodología

Igual que en la Fase 12, **TDD estricto**: para cada pieza con lógica se escribió **primero el test**, se comprobó que **falla (rojo)** y solo entonces se implementó lo mínimo para ponerlo **en verde**. El orden de los pasos siguientes es el orden real de construcción.

## Paso a paso

### 1. Migración: columnas de invitado en `users`

`009_add_guest_columns_to_users.sql` añade `is_guest BOOLEAN NOT NULL DEFAULT false` y `expires_at TIMESTAMP NULL`, más un índice sobre `(is_guest, expires_at)` para que la limpieza sea eficiente. Los valores por defecto hacen que **los usuarios registrados existentes sigan funcionando sin cambios**.

### 2. Puerto `UserRepository` y su fake

Se amplía la interfaz `UserRepository` con dos métodos (los existentes no se tocan):

- `saveGuest(user, expiresAt)`: guarda un usuario con `is_guest = true` y su caducidad.
- `deleteExpiredGuests(now)`: borra los invitados caducados y devuelve cuántos.

Se actualiza `FakeUserRepository` para implementarlos en memoria (registrando la caducidad de cada invitado), de modo que los casos de uso se puedan testear sin base de datos.

### 3. `CreateGuestUserUseCase` (TDD)

**Primero el test (rojo).** `createGuestUserUseCase.test.ts` afirma que `execute()` crea un invitado (`name = "Invitado"`, `email = guest-<id>@devmind.local`), lo guarda con `saveGuest`, calcula `expiresAt = createdAt + TTL` y devuelve `{ accessToken, user }`. Un detalle clave para un test **determinista sin reloj**: como `createdAt` y `expiresAt` derivan del mismo `now`, el test comprueba que `expiresAt - createdAt === TTL` exactamente. Al no existir el caso de uso, el test falla al importarlo.

**Después la implementación (verde).** `CreateGuestUserUseCase` genera el id, compone el email, hashea un valor aleatorio como contraseña inservible, calcula la caducidad, crea un `User` normal (con 5 argumentos: **sin tocar la entidad**), lo persiste con `saveGuest` y firma un JWT con `TokenService`, reutilizando los puertos que ya existían.

### 4. Infraestructura: `PostgresUserRepository` + test de BD

Se implementan los dos métodos nuevos en el adaptador Postgres (`saveGuest` con un `INSERT` que fija `is_guest = true` y `expires_at`; `deleteExpiredGuests` con un `DELETE ... WHERE is_guest AND expires_at < $1` que devuelve `rowCount`). Los métodos existentes (`save`, `findByEmail`, `findById`, `toDomain`) **no se modifican**.

El test de BD comprueba, contra PostgreSQL real, que: un invitado caducado se borra y **se lleva su proyecto por cascada**; y que un invitado **no** caducado y un usuario **registrado** sobreviven a la limpieza. Los dos tests previos del repositorio de usuarios siguen pasando, confirmando que los cambios no rompen nada.

### 5. Capa HTTP + configuración + wiring

- **Endpoint público** `POST /auth/guest`, sin body, protegido con **rate limit por IP** (`authRateLimitMiddleware`), que responde `201` con `{ accessToken, user }`.
- Método `guest` en `AuthController`; ruta en `authRoutes.ts`.
- **Config:** `env.guest.ttlHours` (`GUEST_TTL_HOURS`, 24 h por defecto).
- **Container:** se instancia `CreateGuestUserUseCase` reutilizando `userRepository`, `passwordHasher`, `tokenService`, `idGenerator` y el TTL.

### 6. Test de integración (extremo a extremo)

`guestEndpoint.test.ts` valida el flujo completo contra la base de datos real: `POST /auth/guest` → `201` con token; con ese token, el invitado **crea un proyecto, sube un ZIP y pregunta a la IA** (todo el pipeline). Además comprueba el **aislamiento**: un invitado **no** puede ver el proyecto de otro (`404`).

### 7. Limpieza de invitados: script

`scripts/purge-guests.ts` (ejecutable con `npm run purge-guests`, al estilo de `run-migrations`) llama a `deleteExpiredGuests(new Date())`. La cascada de la base de datos se encarga de borrar proyectos, archivos, chunks, embeddings, jobs e historial del invitado. El _scheduler_ automático se deja diferido (decisión de la opción B).

**Cómo encajan la caducidad y el borrado (aclaración):** el TTL (`GUEST_TTL_HOURS`, 24 h) **no borra nada por sí solo**. Al crear el invitado solo se guarda su `expires_at` como una **marca** de cuándo pasa a ser borrable; el borrado real lo hace el script (`DELETE ... WHERE is_guest AND expires_at < ahora`), que es el **disparador**. Es decir, la caducidad define **a quién** se borra y el script define **cuándo** se ejecuta (hoy a mano; en el futuro podría lanzarlo un cron). Ese criterio de caducidad es justo lo que hace el borrado **seguro**: nunca elimina a un invitado recién creado que podría estar usándose en ese momento. Conviene matizar además que el hecho de que un invitado **"empiece de cero al volver" no depende de esta limpieza**, sino de que no tiene credenciales para volver a iniciar sesión; el script es solo **higiene de la base de datos** (evitar que se acumulen invitados viejos).

### 8. Documentación del contrato (OpenAPI)

Se añade la operación `POST /auth/guest` al `openapi.yaml`, para que el contrato refleje la nueva puerta de entrada (y sirva para generar el frontend).

### 9. Refinamiento: el historial de conversaciones es solo para registrados

Al probar el modo invitado se detectó que, aunque un invitado **puede hablar con la IA**, se le estaba **guardando el historial** de conversaciones igual que a un registrado. Eso contradice el diseño: el historial (Fase 12) es un **"plus" del usuario registrado**; el invitado debe poder preguntar, pero **sin que se le persista** el historial (además, sus datos son temporales de todos modos).

**Cómo saber si quien pregunta es invitado.** El `AskProjectQuestionUseCase` solo recibe el `userId`, no si es invitado. Se valoraron dos vías: (a) meter `is_guest` en el JWT y leerlo en el flujo, o (b) una consulta al repositorio. Se eligió **(b)** para **no tocar la capa de autenticación** (token, `authMiddleware`, tipos), a cambio de una pequeña consulta indexada por pregunta (coste trivial frente al resto de operaciones del `/ask`).

**TDD.** Primero el test (rojo): en `askProjectQuestionUseCase.test.ts` se añadió un caso "responde pero **no** guarda historial para invitados", que falla porque el caso de uso guardaba siempre. Después la implementación (verde):

- Se añadió `isGuest(userId): Promise<boolean>` al puerto `UserRepository` (y a sus tres implementaciones: Postgres, fake e in-memory). En Postgres es un `SELECT is_guest FROM users WHERE id = $1`.
- El `AskProjectQuestionUseCase` recibe ahora el `UserRepository` y **solo guarda el intercambio si el usuario no es invitado**. La respuesta al usuario **no cambia**: el invitado recibe su respuesta igual; simplemente no se persiste.

El test de integración del invitado se amplió para comprobarlo de extremo a extremo: tras preguntar, `GET /projects/:id/history` del invitado devuelve `[]`. Con esto, la tabla "Invitado vs Registrado" de esta fase (historial: No / Sí) queda respaldada por el comportamiento real.

## Seguridad

- **Los tokens no se pueden falsificar:** el `authMiddleware` verifica la **firma** del JWT con `JWT_SECRET` (que solo conoce el servidor) y el algoritmo fijado a `HS256`. Un token inventado o manipulado no pasa la verificación. El invitado recibe un token **legítimo emitido por el servidor**, no uno que él fabrique.
- **El riesgo real no es la falsificación, sino el abuso del endpoint público** (pedir muchos invitados): se mitiga con **rate limit por IP** + el **TTL/limpieza** + los **límites de tamaño de ZIP** ya existentes.
- **Aislamiento por usuario:** cada invitado es su propio usuario; la autorización por `ownerId` (tomado del token) + `findByIdAndOwnerId` garantiza que no ve datos de otros (verificado en el test de integración).

## Nota sobre código heredado

Al ampliar la interfaz `UserRepository`, el adaptador **en memoria** `InMemoryUserRepository` —que es **código muerto** (nadie lo usa; solo aparece comentado en el container, ya señalado en la revisión de arquitectura)— dejaba de compilar. Para no salir del alcance de esta fase ni borrar archivos sin decisión previa, se le añadieron implementaciones mínimas de los dos métodos nuevos, dejando su eventual eliminación como limpieza pendiente.

## Verificación

```txt
✅ TDD respetado: cada pieza con lógica tuvo su test en rojo antes de implementarse
✅ npm run typecheck → sin errores
✅ npm test → 173/173 tests en verde (44 archivos), incluidos:
   - createGuestUserUseCase.test.ts (unit, con fakes)
   - los tests de saveGuest y deleteExpiredGuests de PostgresUserRepository (BD real, con cascada)
   - guestEndpoint.test.ts (integración: el invitado usa todo el pipeline, sin historial + aislamiento)
   - el caso "no guarda historial para invitados" en askProjectQuestionUseCase.test.ts
✅ openapi.yaml válido tras añadir POST /auth/guest
```

## Resultado

DevMind permite ahora **usar el producto sin registrarse**: `POST /auth/guest` entrega automáticamente un token de invitado con el que se puede subir un ZIP y hablar con la IA, reutilizando **todo** el pipeline existente. Los datos del invitado son temporales (caducan y se limpian con `purge-guests`, apoyándose en las cascadas de la base de datos), mientras que registrarse conserva el "plus" de permanencia. La feature resultó **prácticamente aditiva**: no se tocó la entidad `User` ni ningún caso de uso del pipeline; solo se añadieron piezas nuevas y dos métodos al repositorio de usuarios. El backend del modo invitado queda listo para que, en la fase de frontend, la primera pantalla sea el producto y no un formulario de registro.

---

# Corrección — Reintentos y error tipado (503) en la generación de respuestas del RAG

## Problema detectado

Al probar el `/ask`, se observó que si el proveedor de IA (Gemini) devolvía un `503` (modelo saturado: _"This model is currently experiencing high demand"_), el endpoint respondía con un **`500 Internal server error` genérico** y en el log aparecía el `GenkitError` crudo. El fallo del proveedor **no estaba ni tolerado ni tipado** en el paso de generar la respuesta.

## Causa

La Fase 11.12 había añadido **reintentos con backoff** y **traducción a un `503` tipado** (`EmbeddingProviderUnavailableError`) al **generador de embeddings**, pero **no al generador de respuestas** (`GenkitAnswerGenerator`). Es decir, el paso de "generar la respuesta" del RAG no tenía ni reintentos ni error de dominio; cualquier fallo de Gemini ahí caía en el `500` genérico. Era exactamente el hueco **[ERR-3]** señalado en la revisión de seguridad (resiliencia inconsistente entre los dos caminos que llaman a Gemini).

## Solución (con TDD)

- Se **extrajo `isTransientGenkitError`** (la detección de errores transitorios `503`/`429` del proveedor) a un módulo compartido `infrastructure/genkit/genkitErrors.ts`, reutilizado ahora por **ambos** generadores (elimina la duplicación).
- Nuevo error de dominio **`AnswerProviderUnavailableError`** (`503`) con un mensaje claro para el usuario: _"El asistente de IA no está disponible ahora mismo. Vuelve a intentarlo en unos segundos."_
- **`GenkitAnswerGenerator`** envuelve ahora la llamada a Gemini en `retryWithBackoff` (reintenta ante `503`/`429` con backoff exponencial) y, si tras los reintentos el fallo sigue siendo transitorio, lanza `AnswerProviderUnavailableError` (`503`); cualquier otro error se relanza tal cual. Es el mismo patrón que ya usaba el generador de embeddings, ahora aplicado de forma simétrica.
- **TDD:** se añadieron al test del generador de respuestas los casos "reintenta y luego acierta", "lanza `AnswerProviderUnavailableError` si el proveedor sigue fallando" y "relanza los errores no transitorios sin reintentar". Primero en rojo (el generador aún no reintentaba ni traducía), luego en verde tras la implementación.
- **OpenAPI:** se documenta el `503` en `/projects/{id}/ask` (puede venir tanto del embedding de la pregunta como de la generación de la respuesta) y también en `/projects/{id}/index` (que ya lo devolvía desde la Fase 11.12 pero no estaba documentado).

## Verificación

```txt
✅ npm run typecheck → sin errores
✅ npm test → 176/176 tests en verde (44 archivos), incluidos los tres nuevos
   casos de reintento/503 del generador de respuestas
✅ openapi.yaml válido tras documentar el 503 en /ask y /index
```

Con esto, ante un fallo transitorio de Gemini al preguntar, DevMind **reintenta** y, si el problema persiste, devuelve un **`503` con un mensaje claro** en lugar de un `500` genérico. Los dos caminos del RAG que dependen de Gemini (embedding de la pregunta y generación de la respuesta) quedan protegidos de la misma forma.
