OBJETIVO DEL PROYECTO:

- Construir una API backend profesional que permita a usuarios autenticados crear proyectos software, subir/indexar su código y hacer consultas inteligentes sobre ese proyecto usando IA.

- DevMind ofrece dos modos de uso: un modo invitado, que permite probar la funcionalidad principal de análisis e interacción con proyectos software sin necesidad de registro, y un modo autenticado, que permite persistir proyectos, historial de conversaciones y resultados de indexación asociados a cada usuario.

- El problema no es “hacer una app con IA”. El problema es:

  > Entender un proyecto software existente puede ser lento porque el conocimiento está repartido entre carpetas, archivos, documentación incompleta y memoria del equipo.

- DevMind quiere ayudar a:

  > desarrolladores nuevos
  > equipos con proyectos grandes
  > personas que entran a mantener código ajeno
  > equipos que no tienen documentación actualizada

-El enfoque es:

> Convertir un proyecto software en una fuente de conocimiento consultable mediante lenguaje natural.

Ejemplo práctico:

- Tú tendrías un proyecto guardado:

  > Proyecto: DevMind API

  > Podrías preguntarle:

  _Explícame la arquitectura de este proyecto
  _¿Qué endpoints existen?
  *¿Dónde se validan los datos de entrada?
  *Qué casos de uso tiene la autenticación?
  _¿Qué tests hay para auth?
  _¿Qué partes pertenecen a domain, application, infrastructure y transport?
  \*¿Qué debería mejorar de este código?

  > Eso deja claro que DevMind no es solo un CRUD, sino una herramienta para entender proyectos software.

FASES:

Fase 0 — Setup inicial
Fase 1 — Autenticación
Fase 2 — Proyectos persistentes
Fase 3 — Subida de archivos (basico)
Fase 4 — PostgreSQL
Pasar usuarios, proyectos y projectFiles a base de datos real.

Fase 5 — Subida de ZIP
Subir ZIP, descomprimir, recorrer carpetas, filtrar archivos inútiles y guardar muchos ProjectFiles.

Fase 6 — Resubida / actualización de proyecto
Primera versión: borrar archivos anteriores y guardar los nuevos.

Fase 7 — Chunks
Trocear ProjectFiles en fragmentos preparados para RAG.

Fase 8 — Embeddings + búsqueda semántica
Generar embeddings y buscar chunks relevantes.

Fase 9 — IA/RAG
Responder preguntas usando los chunks del proyecto.

Fase 10 — Historial
Fase 11 — Funciones inteligentes
Fase 12 — Modo invitado / demo sin registro
Fase 13 — Onboarding visual / presentación final

## . FASE 0

Vamos a empezar a construir el proyecto:

- Inicializo el package.json
- Instalamos dependencias:
  > typescript tsx @types/node @types/express @types/cors>
  > vitest supertest @types/supertest
- Inicializo el fichero tsconfij.json
- Creo la estructura base de carpetas : src y tests

Vamos a empezar a aplicar TDD para construir el proyecto:

[ ] Proyecto creado con npm
[ ] Express instalado
[ ] TypeScript instalado
[ ] Vitest y Supertest instalados
[ ] tsconfig.json configurado
[ ] Estructura Clean Architecture creada
[ ] Test de /health creado
[ ] /health implementado
[ ] npm test funciona
[ ] npm run typecheck funciona
[ ] npm run build funciona
[ ] npm run dev funciona
[ ] .env.example creado
[ ] .gitignore creado
[ ] README inicial creado
[ ] Primer commit hecho

## . FASE 1

Objetivo:

- Registro de usuario
- Login
- JWT
- bcrypt
- Middleware de autenticación
- GET /auth/me
- Tests con TDD

Antes de implementar nada vamos ha hacer tests conn TDD , que falen e implementar el caso de uso.

## . FASE 1.1

CASOS DE USO:

1.[RegisterUserUseCase]

- Antes de crear el primer test debemos:

  > Crear las entidades y repositorios base en domain : user y userrepository
  > Crear los puertos de aplicacion como son : idegenerate y paswordhassher

- Crearemos el test unitario del caso de uso de registrar usuario:

  > Debe registrar un usuario nuevo
  > No debe permitir emails duplicados
  > Debe guardar la contraseña hasheada

[ ] User entity creada
[ ] UserRepository creado
[ ] PasswordHasher creado
[ ] IdGenerator creado
[ ] Test de registro creado
[ ] RegisterUserUseCase creado
[ ] Test de email duplicado creado
[ ] npm test pasa

#.[Errores]

Ahora terminado el primer Test lo que vamosa hacer es la construccion de manejadores de errores propios y no generales:

- Creamos en shared una carpeta errors y metemos el error de app general del que heredaran el resto, creamos un user-already-exists.error , este se lo pasamos al test que acabmos de crear para que si ocurre que lance ese error, si ejecutamos el test dara error porque el caso de uso lanza un error general aun, ahora tenemos q hacer que el caso de uso lance este error y no uno general como hace ahora.

- Esto es mejor porque luego podremos tener un middleware global que diga:

  > Si el error es AppError → responde con su statusCode
  > Si es otro error desconocido → responde 500

  2.[LoginUserUseCase]

- Tenemos que actualizr el puerto PasswordHasher, debemos incluirle un metodo e comparacion:

  > compare(plainPassword: string, passwordHash: string): Promise<boolean>;

- Esto rompera el test de registro porque el fake solo tiene un metodo, debemos incluirlo aunque el test no lo use. Asi typescript no se queja.

- Creamos el puerto tokenService, Esto es un puerto de aplicación.No usamos todavía jsonwebtoken directamente porque eso será infraestructura.El caso de uso solo dice: Necesito algo que sepa generar tokens.

-Creamos un nuevo tipo de error en la carptea errros, aunque es el mismo tipo de error que el error de si estaba el correo ya registrado ( ahora el error es si la contraseña no es valida)

-Ahora ya podemos empezar con TDD y crear el test de Loggear Usuario

-Ya tenemos el TDD , no pasa porque el caso de uso no esta creado, lo creamos y comprobamos que el test pase, ya hemos terminado este caso de uso

3.[GetCurrentUserUseCase]

- Cerramos la parte de registro y login a nivel de aplicación, y ahora vamos con lo que nos servirá más adelante para el endpoint GET /auth/me: obtener el usuario actual a partir de su userId.

- La idea será:

  > Si el token es válido → el middleware extrae el userId
  > GET /auth/me → busca ese usuario por id
  > Devuelve sus datos públicos

- Debemos actualiar la interfaz del repositorio de usuarios para que encuentre usuarios por el id :

  > findById(id: string): Promise<User | null>;

- Como hemos añadido findById, ahora tus repositorios en memoria de los tests van a fallar hasta que lo implementes.

- Tenemos que crear un nuevo tipo de error : UserNotFoundError , este error lo usaremos cuando alguien pida un usuario que no existe.

- Ahora empezamos con TDD y vamos a crear el test GetCurrentUserUseCase:

Ya llevamos:

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

Nos falta para cerrar la Fase 1:

[ ] Infraestructura real: bcrypt
[ ] Infraestructura real: JWT
[ ] Infraestructura real: crypto id generator
[ ] Repositorio real o temporal para HTTP
[ ] AuthController
[ ] AuthRoutes
[ ] AuthMiddleware
[ ] Error middleware
[ ] Tests de integración HTTP

El siguiente paso lógico es crear las implementaciones reales de infraestructura (los adapters):

- BcryptPasswordHasher → para hashear y comparar contraseñas
- JwtTokenService → para generar y verificar tokens JWT
- CryptoIdGenerator → para generar IDs reales

## . FASE 1.2

Usaremos:

- bcryptjs → cifrar y comparar contraseñas
- jsonwebtoken → crear y verificar JWT
- crypto.randomUUID → generar IDs

Instalaremos las dependencias:

- npm install bcryptjs jsonwebtoken
- npm install -D @types/jsonwebtoken

Modificamos nuestor .env para añadir el secreto para jasonwebtoken y los dias de expiracion
Modificamos el env.ts de config de infra para que coja todo de .env

Tenemos que actualizar el puerto tokenService, ahora mismo solo tiene sign, para firmar y generar el token pero hay que añair el metodo verificar porque más adelante el middleware de autenticación hará esto:

- recibir token
- verificar token
- extraer userId
- permitir acceso a rutas protegidas

Al añadir verify, el test de login puede fallar porque FakeTokenService ya no implementa toda la interfaz.

Ahora vamos a crear la carpeta authAdapters dentro de infrastructura y ahi metermos los ficheros adapters que implementan a los ports de la carpeta de aplciacion : bcryptPasswordHasher, jwtTokenService, cryptoIdGenerator

Ahora, siguiendo el ciclo TDD, cramos los test unitarios de infraestructura, estos debene fallar porque aun no estan implementados los adapteres

Una vez creados los tests, creamos las implementaciones reales de los puertos.

Hay una cosa que nos falta, durante la creacion de los tests y las implementaciones hemos usado un nuevo tipo de error que es el de unauthorized.erro, lo creamos en la carpeta errors y ya podemos pasar los tests.

---

Hasta aqui lo que hemos hecho es crear e incializar el proyecto con el set up, dependencias y configuracion que necesitamos, hemos creado la estructura base de carpetas, creado el dominio con su entidad e interfaz de repositorio, creado los puertos que necesitamos en applicacion y los casos de uso que los usan, hemos implementado los puertos de aplicacion con infraestructura real y para todo esto hemos seguido TDD y hemos creado tipos de errores nuestros ( hemos creado tambien un .env y una confugracion en infraestructura para poder acceder a el). Tambien esta creado el fichero de app donde se crea la app de express, un ruter con un pequeño endpoint y el fichero main que levanta el servidor.

---

## . FASE 1.3

Ahora toca conectar todo con HTTP, es decir, crear los endpoints reales:

POST /auth/register
POST /auth/login
GET /auth/me

Pero antes necesitamos una pieza temporal.

Como todavía no hemos metido PostgreSQL, necesitamos un repositorio en memoria dentro de infraestructura para poder probar los endpoints. Este repositorio será temporal. Luego, cuando metamos PostgreSQL, lo cambiaremos.

Pero ahora nos permite terminar la autenticación HTTP sin esperar a la base de datos.

Creamos un contenedor de dependencias simple. Para no estar instanciando todo en cada controller, creamos un archivo donde montamos los casos de uso.

Esto es una forma sencilla de hacer inyección de dependencias manual. No estamos usando una librería rara. Simplemente estamos diciendo:

- Aquí conecto mis interfaces con implementaciones reales.

Ahora vamos a crear estos endpoints:

POST /auth/register
POST /auth/login
GET /auth/me

Y para hacerlo bien vamos a añadir estas piezas:

AuthController
AuthRoutes
AuthMiddleware
ErrorMiddleware
ValidateBodyMiddleware

Instalamos zod como dependencia si no esta instalado aun, Lo usaremos para validar que el usuario mande bien los datos.

Creamos schemas de autenticación; Este archivo define las reglas de entrada para registro y login.

Ahora necesitamos una función que use esos schemas. Para ello creamos el middleware de validateBody

Esto lo usaremos en el controller para validar los datos que recibimos del body. Por qué no validamos directamente en el controller: Podríamos hacerlo, pero ensuciaríamos el controller.

Seguimos entonces con la siguiente pieza: manejo de errores async.

Cuando un controller es async, puede fallar. Por ejemplo:

- await this.loginUserUseCase.execute(...)

Si el login falla, el caso de uso lanza:

- throw new InvalidCredentialsError();

Express necesita que ese error llegue a un middleware de errores. Para no poner try/catch en cada controller, usamos un helper llamado asyncHandler.

Ahora vamos a crear errorMiddleware; Este middleware es el sitio central donde convertimos errores en respuestas HTTP.

Ahora tenemso que Conectar errorMiddleware en app.ts. Importante: app.use(errorMiddleware) va después de las rutas.

Porque primero Express intenta resolver la petición, y si alguna ruta lanza error, entonces pasa al middleware de errores.

Creamos el authcontroller que sera el que reciba el contenedor y realice las acciones de registrar y demas usando los casos de usos sobre los datos que recibe del body

Por ultimo crearemos el authrutes donde crearemos las rutas de nuestros endpoint, en cada endpoint se incluira lo que cada uno haga , menteidno los middleware de validacio y posteriormente el controller

Estamos siguiendo TDD :

- El proyecto aplica una estrategia de TDD . En las capas de dominio y aplicación, donde se concentra la lógica de negocio, se han escrito pruebas unitarias antes de la implementación. En la capa de transporte HTTP, al tratarse principalmente de código de integración y cableado entre rutas, middlewares y controladores, se han utilizado pruebas de integración para validar el comportamiento completo de los endpoints. Hemos creado tests primero, luego una implementacion basica de rutas, middlewares y controladores para que los tests pasen y despues hemos añadid mas tests y hemos vuelto a implementar ( por ejemplo casos de eeror )

## . FASE 2

CHECKLIST:

[ ] POST /projects sin token → 401
[ ] POST /projects con token válido → 201
[ ] POST /projects con body inválido → 400
[ ] GET /projects sin token → 401
[ ] GET /projects con token válido → 200
[ ] GET /projects devuelve solo proyectos del usuario autenticado
[ ] GET /projects/:id con proyecto propio → 200
[ ] GET /projects/:id con proyecto inexistente → 404
[ ] GET /projects/:id de otro usuario → 404
[ ] DELETE /projects/:id con proyecto propio → 204
[ ] DELETE /projects/:id inexistente → 404
[ ] DELETE /projects/:id de otro usuario → 404

CHEKLIST POSTMAN:

Flujo recomendado:

[ ] Registrar usuario 1
[ ] Login usuario 1
[ ] Crear proyecto usuario 1
[ ] Listar proyectos usuario 1
[ ] Obtener proyecto usuario 1 por id
[ ] Eliminar proyecto usuario 1

Luego:

[ ] Registrar usuario 2
[ ] Login usuario 2
[ ] Crear proyecto usuario 2
[ ] Comprobar separación entre proyectos de user-1 y user-2

Endpoints a probar:

POST /auth/register
POST /auth/login
POST /projects
GET /projects
GET /projects/:id
DELETE /projects/:id

Vamos a ir con TDD, así que no empezamos creando el endpoint.

1.[CreateProjectUseCase]

Su responsabilidad será:

- Crear un proyecto asociado a un usuario autenticado.

Creamos primeor el test, este fallara porque aun no hay nada creado y los imports no iran

Creamos en domain la entidda projects y el repositorio projectRepository

Creamos en aplicacion el caso de uso de CreateProjectUseCase

Ahora probamos los tests y pasan.

2.[ListUserProjectsUseCase]

Este caso de uso responderá a:

- Dame todos los proyectos de este usuario.

- Ejemplo:

  > await listUserProjectsUseCase.execute({
  > ownerId: "user-1",
  > });

  > Debería devolver solo los proyectos cuyo ownerId sea "user-1".

Ya sabemos crear proyectos. El siguiente paso lógico es poder listarlos. El objetivo será comprobar esta regla:

- Un usuario solo puede listar sus propios proyectos.

- Es decir, si existen proyectos de user-1 y de user-2, cuando liste user-1 no deben aparecer los de user-2.

Generamos el test ya que estamos siguiendo TDD, este fallara porqueimporta el caso de uso y todavia no esta creado.

Creamos el caso de uso y corremos los tests, estos deben pasar

3.[GetProjectByIdUseCase]

Este caso de uso sirve para obtener un proyecto concreto.

Responde a esta pregunta:

- Dame este proyecto concreto, pero solo si es mío.

  > Ejemplo:

       await getProjectByIdUseCase.execute({
         projectId: "project-1",
         ownerId: "user-1",
       });

Si se hace una peticion pidiendo un proyecto en concreto, podria darse la opcion de que un usuario pudiese recuperar el proyecto de otra persona , haciendolo asi, solo recupera proyectos que son suyos

Generamos primeor el tes unitario, este falla porque le caso de uso aun no esta creado.

Creamos el caso de uso, corremos los test y este pasa.

Hemos creado un tipo de error:ProjectNotFoundError, si el proyecto en concreto no existe lanzara este tipo de error, esto sirve para que luego middleware pueda convertirlo en http

4.[DeleteProjectUseCase]

Este caso de uso servirá para:

- Borrar un proyecto concreto, pero solo si pertenece al usuario autenticado.

Y como ya hemos decidido usar errores propios, si el proyecto no existe o no es del usuario, lanzará:

- ProjectNotFoundError

Recibirá esto:

    {
      projectId: "project-1",
      ownerId: "user-1"
    }

Y deberá hacer:

1. Buscar el proyecto por projectId y ownerId.
2. Si no existe, lanzar ProjectNotFoundError.
3. Si existe, borrarlo.

Primeor creamos el test unitario, este no pasara orque aun no esta impelementado.

Implementamos el caso de uso y pasamos los test.

Ahora creamos una implementacion real en infrastructura del repositorio, de momento sera en memoria

Ahora vamos a modificar el container, ahora mismo tenemos piezas sueltas ( casos de uso y demas) en el container lo que vamos a hacer es intanciarlo todo ( con lo que ya esta) para tener todo conectado.

Con esto, ya tenemos conectada la capa de aplicación de Projects al container.

[IMPLEMENTACION DE HTTP Y ENDPOINT]

1.[POST /projects]

Ahora pasamos a la parte de HTTP. Vamos a crear el primer endpoint de proyectos:

- POST /projects

Este endpoint servirá para que un usuario autenticado cree un proyecto.

Qué debe pasar:

- El usuario hará una petición como esta:

  POST /projects
  Authorization: Bearer TOKEN
  Content-Type: application/json

  Body:

  {
  "name": "DevMind API",
  "description": "Backend con IA para consultar proyectos software"
  }

- Y la API debería responder:

  {
  "id": "algo",
  "ownerId": "user-id-del-token",
  "name": "DevMind API",
  "description": "Backend con IA para consultar proyectos software",
  "createdAt": "fecha"
  }

  Con status:

  201 Created

Importante:

- El cliente no debe mandar el ownerId.

       Mal:

       {
         "ownerId": "user-1",
         "name": "DevMind API"
       }

       Bien:

       {
         "name": "DevMind API",
         "description": "Backend con IA para consultar proyectos software"
       }

- Por qué?

  > Porque el ownerId debe salir del token JWT.

  > Es decir:

      authMiddleware lee el token
      authMiddleware obtiene el userId
      controller usa ese userId como ownerId

  > Así evitamos que un usuario pueda crear proyectos a nombre de otro.

Empezamos creando como primera cosa un test inciial ( que luego iremos modificando con mas endpoint) de integracion del endpoint, este no pasar y nos ponemos a implementarlo.

Ahora implementamos projectcontroller, projectroutyes y prochecschema para que los tests pasen.

2.[GET /projects]

Este endpoint usará:

- ListUserProjectsUseCase

y servirá para:

- Listar solo los proyectos del usuario autenticado.

Queremos que un usuario pueda pedir:

    GET /projects
    Authorization: Bearer ACCESS_TOKEN

Y recibir algo como:

    [
      {
        "id": "project-1",
        "ownerId": "user-1",
        "name": "DevMind API",
        "description": "Backend con IA",
        "createdAt": "..."
      }
    ]

La regla importante es:

- Un usuario solo debe ver sus propios proyectos.

Vamos a constuir el test de integacion que prueba el ednpoint, este lo incluiremos el el fichero de test que ya tenemos creado y que usamos para el anteriro endpoint

Ahora actualizamos el controller de proyectos para que tenga un metodo list para listar los proyectos, actualizamos el ruter para que tenga el ednpoint y ya pasan los test

3.[DELETE /projects/:id]

Este endpoint servirá para:

- Obtener un proyecto concreto del usuario autenticado.

Usará este caso de uso:

- GetProjectByIdUseCase

Queremos poder hacer:

    GET /projects/project-id
    Authorization: Bearer ACCESS_TOKEN

Y que devuelva ese proyecto solo si pertenece al usuario autenticado.

Vamos a empezar crean en el mismo archivo de test de endpoint , el test para probar este endpoint

4.[DELETE /projects/:id]

Este endpoint servirá para:

- Borrar un proyecto concreto, pero solo si pertenece al usuario autenticado.

Usará este caso de uso:

- DeleteProjectUseCase

Queremos poder hacer:

    DELETE /projects/:id
    Authorization: Bearer ACCESS_TOKEN

Y que pase esto:

    Si el proyecto existe y es mío → 204 No Content
    Si no hay token → 401 Unauthorized
    Si el proyecto no existe → 404 Not Found
    Si el proyecto es de otro usuario → 404 Not Found

Otra vez, devolvemos 404 cuando es de otro usuario para no revelar que ese proyecto existe.

Empezamos como siempre creando el test de integracion para que falle

En la Fase 2 hemos añadido a DevMind la parte de proyectos.Hasta ahora DevMind ya sabía quién era el usuario gracias al login. En esta fase hemos hecho que cada usuario pueda tener sus propios proyectos dentro de la aplicación.La idea principal ha sido esta:

- Un usuario puede crear, ver, listar y borrar sus propios proyectos.
- Pero nunca puede acceder a los proyectos de otro usuario.

Seguridad que hemos añadido:

La regla clave de esta fase ha sido:

- Un usuario no puede ver ni borrar proyectos de otro usuario.

Para conseguirlo, no buscamos proyectos solo por su id.

En vez de hacer:

- Busca este proyecto por id.

hacemos:

- Busca este proyecto por id y además comprueba que pertenece a este usuario.

Qué hemos hecho a nivel de arquitectura

Hemos seguido la misma estructura limpia del proyecto:

domain
→ definición de Project y ProjectRepository.

application
→ casos de uso:
CreateProjectUseCase
ListUserProjectsUseCase
GetProjectByIdUseCase
DeleteProjectUseCase

infrastructure
→ InMemoryProjectRepository.

transport
→ rutas, controller y schema HTTP de projects.

container
→ conexión de los casos de uso con el repositorio real temporal.

## . FASE 3

Hasta ahora DevMind tiene esto:

    User
    └── Project

Es decir:

- Un usuario puede tener proyectos.

- Pero esos proyectos todavía están vacíos. No tienen archivos de código dentro.

La Fase 3 consiste en añadir esta parte:

    User
    └── Project
          └── ProjectFile

Es decir:

- Un proyecto puede tener varios archivos.

La Fase 3 la vamos a hacer en partes pequeñas.

Fase 3.1 — Base interna de ProjectFiles

Primero creamos la lógica interna, sin HTTP todavía.

Aquí haremos:

    ProjectFile entity
    ProjectFileRepository
    CreateProjectFileUseCase
    InMemoryProjectFileRepository

La primera funcionalidad será:

Crear un archivo dentro de un proyecto.

Para terminar esta parte lo que haremos es construir las implementaciones de infraestructura de los puertos de aplicacion

Fase 3.2 — Endpoints HTTP para ProjectFiles

Después añadiremos endpoints como:

    POST   /projects/:projectId/files
    GET    /projects/:projectId/files
    GET    /projects/:projectId/files/:fileId
    DELETE /projects/:projectId/files/:fileId

Al principio enviaremos el archivo como JSON, no como ZIP.

Ejemplo:

    {
      "path": "src/app.ts",
      "language": "typescript",
      "content": "console.log('hello');"
    }

Esto nos permite probar la lógica sin mezclar todavía subida de archivos reales

Regla de seguridad de Fase 3

Esta regla sigue siendo igual de importante que en Fase 2:

Un usuario no puede añadir, ver ni borrar archivos de un proyecto que no es suyo.

Por eso, antes de crear un archivo, el caso de uso debe comprobar:

    ¿El proyecto existe?
    ¿Y pertenece al usuario autenticado?

Es decir, usaremos de nuevo:

    projectRepository.findByIdAndOwnerId(projectId, ownerId)

Si no existe o no pertenece al usuario:

    throw new ProjectNotFoundError();

Así evitamos que alguien pueda meter archivos en proyectos ajenos.

IMPLEMENTACION DE LA FASE 3

Fase 3.1 — Base interna de ProjectFiles

1.[createProjectFileUseCase]

Empezamos (siguiendo TDD) creando el test unitario del caso de uso para crear un archivo.
Este test es un basico , para probar el flujo del caso de uso, obviamente ahora va a fallar ya que no hay nada creado aun.

Ahora nos disponemos a crear la entidad projectFIle y la interfaz de repositorio projectRepository

Ahora nos ponemos a crear un puerto fileHashGeneratorPort porque necesitamos que la app tenga un fichero para hasear el codigp, de momento no nos hace falta saber como se hace, con la interfaz vale

Ahora continuamos probando los tests, estos pasan y por lo tanto terminamos el ciclo base de TDD, ahora podemos añadir test para implementar por ejemplo funcionalidades de seguridad

Ahora nos ponemos a implementar lls adaptadores en infraestructura del puerto del repositorio y del hasheador.

Ahora tenmos que modificar container para que instancie tambien esto

2.[ListProjectFilesUseCase]

Su responsabilidad será:

- Listar los archivos de un proyecto, pero solo si ese proyecto pertenece al usuario autenticado.

Es decir:

    ownerId + projectId
            ↓
    comprobar que el proyecto pertenece al usuario
            ↓
    devolver los ProjectFile de ese proyecto

Empezamos como siempre creando el test unitario.

El test falla porque todavia no hay nada creado

Modificamos tanto el puerto como el adapter de ProjectFileRepository y InMemoryProjectFileRepository para añadirle el metodo de findByProjectId para poder buscar y listar los archivos.

Creamos el caso de uso de ListProjectFilesUseCase

Modificamos el anteriro test del caso de uso de crear porque el fake del repositorio de archivos solo implementa un metodo del repositorio.

3.[GetProjectFileByIdUseCase]

Su responsabilidad será:

- Obtener un archivo concreto de un proyecto del usuario autenticado.

Es decir:

    ownerId + projectId + fileId
            ↓
    comprobar que el proyecto pertenece al usuario
            ↓
    buscar el archivo dentro de ese proyecto
            ↓
    devolverlo

Creamos su tes unitario. Este no pasa porque tanto el caso de uso , como el nuevo tipo de error que hemos incluido no existe.

Creamos el nuevo tipo de error : ProjectFileNotFoundError

ACtualizamos tanto la interfaz del repositorio de archivos como la implementacion.

Nos ponemos a crear el caso de uso

4.[DeleteProjectFileUseCase]

Su responsabilidad será:

- Borrar un archivo concreto de un proyecto del usuario autenticado.

La seguridad será la misma:

    1. Comprobar que el proyecto pertenece al usuario.
    2. Comprobar que el archivo existe dentro de ese proyecto.
    3. Borrar el archivo.

Creamos el test unitario.

ACtualizamos tanto la interfaz del repositorio de archivos como la implementacion.

Nos ponemos a crear el caso de uso

Con esto, dejamos cerrada la capa interna de ProjectFiles:

✅ CreateProjectFileUseCase
✅ ListProjectFilesUseCase
✅ GetProjectFileByIdUseCase
✅ DeleteProjectFileUseCase
✅ ProjectFileRepository completo
✅ InMemoryProjectFileRepository completo
✅ Container actualizado
✅ Tests unitarios pasando

Ahora pasamos a la parte HTTP, porque ya tenemos todos los casos de uso preparados.

Fase 3.2 — Endpoints HTTP para ProjectFiles

Pasamos al siguiente bloque: HTTP

Seguimos con TDD pragmático:

    1. Primero test de integración HTTP.
    2. El test falla porque todavía no existe el endpoint.
    3. Creamos schema, controller y routes.
    4. Conectamos la ruta en app.ts.
    5. El test pasa.

En estas fase todo es mas simple, incluso datos que le pasamos a los endpoitn que son hardcodeaods y que ma sadelante sera la app la que los saque y se los pase al endpoint

Vamos a crear el fichero de test de integracion, iremos construyendo los tests de cada enpoint, y luego su implementacion:

1. [POST /projects/:projectId/files]

Crea un archivo dentro del proyecto con id X

El cliente mandará esto en el body:

    {
      "path": "src/app.ts",
      "language": "typescript",
      "content": "console.log('hello');"
    }

Pero no manda ni ownerId ni projectId en el body.

El sistema los saca de aquí:

    ownerId   → req.user.userId, gracias al authMiddleware
    projectId → req.params.projectId

Esto mantiene la misma idea que en projects: el cliente no decide quién es el dueño.

Creamos el test para este endpoint, el cual falla.

Ahora implementamos para que el test pase. El endpoint que queremos crear es:

    POST /projects/:projectId/files

Y debe hacer esto:

    1. Comprobar que el usuario está autenticado.
    2. Validar el body con Zod.
    3. Sacar ownerId desde req.user.userId.
    4. Sacar projectId desde req.params.projectId.
    5. Llamar a createProjectFileUseCase.
    6. Devolver 201 con el ProjectFile creado.

Primero creamos el schema pra que el validatebody ( middlware) pueda validar lo que le pasamos

Ahora creamos el controllador para projectfile

Ahora creamos la rutas pra conectar el endpint con los middleware y el controller

2. [GET /projects/:projectId/files]

Creamos el test para este endpoint, el cual falla.

Ahora implementamos para que el test pase.

Añadimos el metodo list dentro del controller de archivos

Añadimos al ruter la ruta de get para listar los archivos

Ahora los test pasan

Ahora añadimos test en el archivo para comprobar casos de errores y seguridad

Dejamos cerrado este endpoint:

    GET /projects/:projectId/files

Con estos casos:

    ✅ con token válido → 200
    ✅ sin token → 401
    ✅ proyecto inexistente → 404
    ✅ proyecto de otro usuario → 404

3. [GET /projects/:projectId/files/:fileId]

Este servirá para obtener un archivo concreto dentro de un proyecto.

Creamos el test para este endpoint, el cual falla.

Ahora implementamos para que el test pase

Añadimos el metodo getbyID al controller

Añadimos la ruta en el ruter para este endpoint

los test pasan, ahora añadimos nuevos test para asegurarnos cosas de errores y seguridad.

dejamos cerrado también:

    GET /projects/:projectId/files/:fileId

Con estos casos:

    ✅ con token válido → 200
    ✅ sin token → 401
    ✅ proyecto inexistente → 404
    ✅ archivo inexistente → 404
    ✅ proyecto de otro usuario → 404

4. [DELETE /projects/:projectId/files/:fileId]

Este endpoint usará el caso de uso que ya tenemos:

    DeleteProjectFileUseCase

Y debe devolver:

    204 No Content

igual que hicimos con DELETE /projects/:id.

Creamos el test para este endpoint, el cual falla.

Ahora implementamos para que el test pase

Añadimos el metodo getbyID al controller

Añadimos la ruta en el ruter para este endpoint

los test pasan, ahora añadimos nuevos test para asegurarnos cosas de errores y seguridad.

Podemos Dar por cerrada la Fase 3 — ProjectFiles básica.

Ahora mismo esta implementado:

    User
    └── Project
          └── ProjectFile

Y DevMind ya puede:

    ✅ Crear archivos dentro de un proyecto
    ✅ Listar archivos de un proyecto
    ✅ Obtener un archivo concreto
    ✅ Borrar un archivo concreto
    ✅ Validar que el proyecto pertenece al usuario autenticado
    ✅ Evitar acceso a proyectos de otros usuarios
    ✅ Calcular size
    ✅ Calcular hash
    ✅ Guardar ProjectFiles en memoria

Además, tienes cubiertos los endpoints:

    POST   /projects/:projectId/files
    GET    /projects/:projectId/files
    GET    /projects/:projectId/files/:fileId
    DELETE /projects/:projectId/files/:fileId

Con casos de:

    ✅ 200 / 201 / 204 correctos
    ✅ 400 body inválido
    ✅ 401 sin token
    ✅ 404 proyecto inexistente
    ✅ 404 proyecto de otro usuario
    ✅ 404 archivo inexistente

## . FASE 4

Objetivo de esta fase:

- Cambiar los repositorios en memoria por repositorios reales en PostgreSQL.

Ahora tienes esto:

    UseCase
      ↓
    Repository interface
      ↓
    InMemoryRepository

Queremos llegar a esto:

    UseCase
      ↓
    Repository interface
      ↓
    PostgresRepository

Lo bueno es que los casos de uso no deberían cambiar casi nada, porque ya están programados contra interfaces. Eso era justo una de las ventajas de la arquitectura limpia/hexagonal que estamos usando en DevMind.

Primero solo vamos a levantar la base de datos. Todavía no vamos a tocar repositorios ni casos de uso.

En la raiz del proyecto vamos a crear un docker-compose.yml

Añadimos y modificamos el . env con el DATABASE_URL

Ahora levantamos el docker compose para ver si se carga el servidor.

Ahora una vez verificado lo anteriro lo que vamos a conectar es node/express con nuestro servidor de postgre.

Tenemos que instala pg y sus typos

Una vez hecho eso podemos generar la pool de conecxion en una carpeta llamada database dentro de infraestrucutra dentro meteremos postgresPool.ts

Ahora creamos un script y lo ejecutamos para probar la conexion. Si da buen resultaod, la API ya sabe conectarse con el servidor postgre que esta levantado en el contenedor.

Ahora mismo ya tienes esto:

    DevMind API
      ↓
    postgresPool
      ↓
    PostgreSQL en Docker

Ahora el,siguiente paso es crear las tablas en la base de datos para usuarios, proyectos y archivos, en definitiva generar migraciones.

Antes de seguir: qué vamos a crear

Vamos a crear una carpeta:

    src/infrastructure/database/migrations

Y dentro meteremos archivos SQL.

Por ejemplo:

    001_create_users.sql
    002_create_projects.sql
    003_create_project_files.sql

Estos archivos son las instrucciones para crear las tablas.

En estas instrucciones usaremos ON DELETE CASCADE.

Por qué usamos ON DELETE CASCADE:

- Si se borra un usuario, se borran sus proyectos.
- Si se borra un proyecto, se borran automáticamente sus archivos.

Esto arregla el detalle que comentamos antes: no queremos archivos huérfanos si borramos un proyecto.

Una vez creadas las instrucciones vamos a generar un script para realizar las migraciones.

Ejecutamos el script y una vez termine nos metemos en la app tableplus , nos conectamos al docker y vemos si ha funcionado.

Así que ahora tenemos esto creado en PostgreSQL:

    devmind_db
    ├── users
    ├── projects
    └── project_files

Eso quiere decir que ya no tienes solo una base de datos vacía. Ahora ya tienes la estructura real donde irán los datos.

Pero ojo: todavía no hay datos

Ahora mismo las tablas existen, pero probablemente están vacías.

Ahora falta la parte realmente importante:

⬜ Crear PostgresUserRepository
⬜ Crear PostgresProjectRepository
⬜ Crear PostgresProjectFileRepository
⬜ Cambiar el container para usar PostgreSQL
⬜ Probar que los datos aparecen en TablePlus

El orden correcto sería:

1. PostgresUserRepository
2. Cambiar container para usarlo
3. Probar register/login/auth/me
4. Ver usuarios en TablePlus
5. Luego PostgresProjectRepository
6. Luego PostgresProjectFileRepository

EMPEZAMOS:

1. [PostgresUserRepository]

Generamos el repositorio de postgre, generamos un script para probarlo y si funciona podemos cambiarlo.

Ahora podemos modificar el container para que nuestra api use el repositorio de postgre para los usarios , tenemos que modificar los imports y demas del containe

Con esto habremos migrado users.

La situación quedaría así:

    users          → PostgreSQL ✅
    projects       → memoria todavía
    project_files  → memoria todavía

2. [PostgresProjectRepository]

hora vamos a hacer exactamente lo mismo con los proyectos.

Es decir:

InMemoryProjectRepository
↓
PostgresProjectRepository

Y una vez eso funcione:

Vamos a crear el repositorio de postgre dentro de infraestructura

Ahora creamos el script para probarlo. Como projects.owner_id referencia a users.id, primero necesitamos crear un usuario real en PostgreSQL.

El scrip funciona como se esperaba, ahora vamos a conectar el repositprio al container

Lo conectamos y vemos que funciona.

Antes de continuar, me he encontrado un error, los test cuando los ejecuto lo que hacen es aparte de que no pasan todos lo que hacen es crear muchos usuairos y proyectos y demas , porque claro antes usaban memoria y esta se borraba entre ejecucion y ejecucion. Lo que nos toca ahora es mdoficar los tests.

Vamos a tener dos bases de datos:

- devmind_db

Para usar manualmente con la API, frontend, TablePlus, curl, etc.

Y otra:

- devmind_test_db

Solo para tests automáticos.

Cada vez que ejecutes los tests:

    1. Se usa devmind_test_db.
    2. Se crean las tablas si no existen.
    3. Se limpian users, projects y project_files antes de empezar.
    4. Se ejecutan los tests.
    5. Se vuelven a limpiar al terminar.

Primer paso es crear la base de datos en el contenedor, la creamos

Ahora tenemos que hacer las migraciones ( crear las tablas ) como hicimos con la otra base de datos

Ahora vamos a crear un fichero global de test que lo que hace es:

    1. Comprueba que DATABASE_URL apunta a devmind_test_db.
    2. Ejecuta las migraciones por si faltara alguna tabla.
    3. Limpia users, projects y project_files.
    4. Ejecuta los tests.
    5. Cuando terminan los tests, vuelve a limpiar las tablas.

El siguiente paso será crear:

- vitest.config.ts

para conectar globalSetup.ts.

Y ahira en el apckage.json cambiamos el comando script de los tests por esto, para que siempre ejecute los test con la base de datos de tests:

    "test": "DATABASE_URL=postgresql://devmind:devmind_password@localhost:5432/devmind_test_db vitest run",
    "test:watch": "DATABASE_URL=postgresql://devmind:devmind_password@localhost:5432/devmind_test_db vitest"

Este error ya esta solucionado y ahor apodemos seguir.

3. [PostgresProjectRepository]

creamos el archivo postgresProjectFileRepository.ts

Hace lo mismo que tu repositorio en memoria, pero usando PostgreSQL.

Antes:

    InMemoryProjectFileRepository
    ↓
    guardaba en un array []

Ahora:

    PostgresProjectFileRepository
    ↓
    guarda en la tabla project_files

Ahora vamos a crear un script pequeño para probar el repositorio y cuando funcione podemos ponerle en el container

Ahora como funciona modificamos el container

Ya hemos terminado la fse 4 en la que hemos implementado la persistnecia en postgre, en esta parte no hemos usado tdd puro sino que hemos realizado scripts que eriiaban si las comexiomnes, creaciones y demas estaban bien.

Durante la migración a PostgreSQL se realizaron scripts de verificación manual para validar rápidamente la conexión y el comportamiento de los nuevos repositorios. Posteriormente, estas verificaciones se consolidaron como tests de integración automatizados ejecutables mediante npm test.

test-db-connection.ts--> postgresConnection.test.ts
test-postgres-project-file-repository.ts --> postgresProjectFileRepository.test.ts
test-postgres-project-repository.ts --> postgresProjectRepository.test.ts
test-postgres-user-repository.ts --> postgresUserRepository.test.ts

---

---

---

---

---

---

---

---

---

## . FASE 5

Empezamos con la fase de subida del zip.

Ahora mismo DevMind puede crear archivos de proyecto manualmente:

    POST /projects/:projectId/files

Pero queremos añadir una subida automática de un proyecto comprimido:

    POST /projects/:projectId/upload

La idea será:

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

Primera decisión importante

- No vamos a meter toda la lógica del ZIP directamente en el controller.

- Mala idea:

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
  guarda en BD

- Eso ensucia mucho la capa HTTP.

- La idea buena será esta:

  HTTP / Express
  ↓
  UploadProjectZipUseCase
  ↓
  ProjectRepository
  ProjectFileRepository
  ZipExtractor
  IdGenerator

- Es decir, crearemos un caso de uso:

  UploadProjectZipUseCase

- Este caso de uso será el cerebro de la operación.

El Endpoint que usaremos sera

    POST /projects/:projectId/upload

Con multipart/form-data.

El campo del archivo se llamaría:

    file

Ejemplo conceptual:

    curl -X POST http://localhost:3000/projects/PROJECT_ID/upload \
      -H "Authorization: Bearer ACCESS_TOKEN" \
      -F "file=@mi-proyecto.zip"

Respuesta posible:

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

IMPORTSNTE: De momento no hace falta devolver el content completo en la respuesta, porque si el ZIP contiene muchos archivos podría ser una respuesta enorme.

Dependencias:

Más adelante necesitaremos probablemente:

    npm install multer adm-zip

    O una alternativa:

    npm install multer yauzl

Pero todavía no las instalaría.

¿Por qué?

Porque el primer test será del caso de uso, y para eso no necesitamos leer un ZIP real. Podemos usar un fake:

    FakeZipExtractor

Así probamos la lógica sin depender todavía de multer, adm-zip ni Express.

Debemos crear tambien una nuva pieza que sera un puerto llamado sipextractor, el caso de uso no deberia saber como se hace la extraccion del zip, pero si que debe tener una interfaz que defina los metodos.

    La idea:

    UploadProjectZipUseCase
    ↓ usa
    ZipExtractor

Orden usando TDD que seguiremos aproximadamente:

    1. Test unitario del caso de uso
    2. Implementar UploadProjectZipUseCase
    3. Añadir más tests unitarios: ignora node_modules, .git, dist...
    4. Test HTTP con Supertest para POST /projects/:projectId/upload
    5. Implementar endpoint con multer
    6. Implementar extractor real de ZIP
    7. Test final de integración con ZIP real

1.[UploadProjectZipUseCase]

Empezamos generando el test unitario, este claramente no pasara porque no hay nada implementado aun.

Vamos a crear una nueva carpeta dentro de test/unit/application ya que aqui denro esta separado por carpetas por auth, project y project file y estas carpetas tienen denro los test de los casos de uso de los CRUD de cada campo , pero UploadProjectZipUseCase es otra cosa:

    recibir un ZIP
    extraer muchos archivos
    filtrar carpetas
    detectar lenguaje
    calcular size/hash
    crear muchos ProjectFile

Por ello creamos una nueva carpeta llamada uploadzip donde meteremos el test

Ahora vamos a implementar.

Creamos el nuevo puerto de aplicacion zipExtractor

Ahora creamos el caos de uso uploadProjectZipUseCase

Vamos a pasar a test especializados, Primeor vamos a modificar el fake del zip extractor para meterle algo que nso diga si ha sido llamdo o no, Esto nos permite comprobar una cosa importante:

        Si el proyecto no pertenece al usuario,
        ni siquiera debería intentar extraer el ZIP.

Ahora vamos a añadir test al archivo para comprobar seguridad:

- "No se puede subir un ZIP a un proyecto que no existe o que no pertenece al usuario autenticado.

  > Este test prepara este escenario:

       Existe project-1
       pero pertenece a another-user

  > Luego el usuario user-1 intenta subir un ZIP a ese proyecto.

       Resultado esperado:

       ❌ No se permite
       ❌ No se extrae el ZIP
       ❌ No se guarda ningún ProjectFile

  > Esta parte es muy importante para la seguridad.

  > Aunque realmente el proyecto existe, para user-1 debe comportarse como si no existiera.

  > Esto evita revelar información.

  > No queremos decir:

       403 Forbidden: este proyecto existe pero no es tuyo

  > Porque eso le confirma al usuario que ese projectId existe.

  > Preferimos:

       404 Project not found

  > O a nivel de caso de uso:

       Project not found

  > Este tes deberia pasar ya que el caso de uso asegura eso

- Ignorar carpetas y archivos que no queremos guardar (node_modules, .git, dist)

  > Este test dice:

       Si el ZIP trae 6 archivos
       pero 5 están dentro de carpetas ignoradas
       entonces solo se debe guardar 1 ProjectFile real

  > En este caso solo debería guardarse:

       src/index.ts

  > Este test no pasa aun, porque en el caso de uso no tenemos nada que lo que haga es filtar las carpetas que quermos y que no, por ello, en el casod e uso metemos una funcion que haga eso y luego que pase solo las carpetas filtradas

- Pasar un error si el zip que se sube no tiene ningun archivo valido.

  > ¿Qué pasa si el ZIP no tiene ningún archivo válido?

  > Por ejemplo, el usuario sube un ZIP que solo contiene:

       node_modules/
       .git/
       dist/
       coverage/

  > O sube un ZIP vacío.

  > En ese caso, no tendría sentido devolver:

       {
       "filesCreated": 0,
       "files": []
       }

  > Porque parecería que la subida ha ido bien, pero realmente DevMind no ha importado nada útil.

  > Lo más lógico sería fallar con un error tipo:

       No valid project files found

  > Más adelante, en el endpoint HTTP, ese error lo convertiremos en un 400 Bad Request.

  > Ahora mismo seguramente fallará, porque tu caso de uso probablemente hace esto:

       extrae archivos
       ↓
       filtra archivos ignorados
       ↓
       si no queda ninguno, devuelve filesCreated: 0

  > Pero queremos esto:

       extrae archivos
       ↓
       filtra archivos ignorados
       ↓
       si no queda ninguno, lanza error

  > Añadimos en el caso de uso un apartado que lance error si no quedan archivos validos

Con esto ya habriamos terminado UploadProjectZipUseCase y la logica interna

        ✅ crea ProjectFile desde archivos extraídos de un ZIP
        ✅ valida que el proyecto pertenece al usuario
        ✅ no extrae el ZIP si el proyecto no pertenece al usuario
        ✅ ignora carpetas innecesarias
        ✅ falla si no hay archivos válidos

Ahora el siguiente bloque sería pasar a la capa HTTP.

2.[POST /projects/:projectId/upload]

Vamos a crear el endpoint:

        POST /projects/:projectId/upload

Pero siguiendo TDD, primero escribiremos el test de integración con Supertest.

El objetivo del primer test HTTP será:

        Dado un usuario autenticado
        Y un proyecto suyo existente
        Cuando sube un ZIP válido a /projects/:projectId/upload
        Entonces la API devuelve 201
        Y crea ProjectFile en PostgreSQL

Para el endpoint real necesitaremos dos dependencias:

        npm install multer adm-zip

Y probablemente los tipos de multer:

        npm install -D @types/multer

Para qué sirve cada una

multer sirve para que Express pueda recibir archivos con multipart/form-data.

Es decir, esto:

        -F "file=@project.zip"

adm-zip sirve para leer el contenido del ZIP en Node.js.

Es decir:

        Buffer del ZIP
        ↓
        archivos internos
        ↓
        src/index.ts
        package.json
        README.md

Orden que haremos:

        1. Instalar multer, adm-zip y @types/multer
        2. Crear test HTTP en rojo para POST /projects/:projectId/upload
        3. Crear extractor real AdmZipExtractor
        4. Crear controller/ruta HTTP
        5. Registrar UploadProjectZipUseCase en el container
        6. Hacer pasar el test

EMPEZAMOS:

Primero instalamos las dependencias :

        npm install multer adm-zip
        npm install -D @types/multer @types/adm-zip

multer → para recibir el ZIP
adm-zip → para extraer los archivos del ZIP

Ahora empezamos creando el test del endpoint, que no pasara

Este test lo que hara es crear un zip en memoria, no psarle un zip en concreto, pero nos sirve para probar el flujo.

El test pasa, ahoa vamos a implementar, queremos lo siguient:

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

Primero vamos a implementar el extractor real de infraestuctura del zip : admZipExtractor que sera el extractor que reciba un zip y devuelva los archivos con el path y el contenido.

Ahora vamos a registrar el caos de uso en el container para tenerlo instanciado.

Una vez hecho eso lo que tenemos que hacer es modificar el project route par poider meter dependncias y conexiones para este endpoint tambien hay que mdoficar el controller para que tenga el metodo de subir el zip.

Hemos tenido que corregir el test, porque el etractor de zip no asegura el orden y al coger los archivos puede venir desordenado, entonces,El test no debe depender de que src/index.ts venga antes que package.json; lo importante es que ambos archivos existan en la respuesta.

Ahora vamos a modificar el test para añadir seguridad:

- Si el usuario llama al endpoint sin enviar archivo ZIP, la API debe responder 400.

        Dado un usuario autenticado
        Y un proyecto suyo
        Cuando llama a /projects/:id/upload sin adjuntar archivo
        Entonces la API responde 400

- Un usuario NO puede subir un ZIP a un proyecto que pertenece a otro usuario.

        Esto es coherente con la regla que ya tienes en DevMind:

        Nunca operar solo por projectId.
        Siempre usar projectId + ownerId.

- Si el ZIP solo contiene carpetas ignoradas,la API debe devolver 400.

        Porque en el caso de uso ya lo tenemos cubierto, pero ahora falta validar cómo se comporta desde HTTP.

- Comprobar que el endpoint ignora node_modules, .git, dist, coverage, .next...

       Ya lo tenemos probado en unitario, pero estaría bien validar que el flujo real HTTP también lo respeta cuando el ZIP real contiene esos archivos.

## . FASE 5.1

Ahora mismo, si subes el mismo ZIP dos veces al mismo proyecto, la API puede crear archivos duplicados.

Vamos a crear un sistema de sincronizacion mediante path y hash.

La sincronización sirve para que DevMind mantenga el proyecto actualizado, no duplicado.

La idea será:

        Subo ZIP nuevo
        ↓
        Comparo sus archivos con los que ya hay en PostgreSQL
        ↓
        Creo los nuevos
        Actualizo los modificados
        Borro los que ya no existen
        No toco los que siguen igual

Usaremos:

        path → para saber si es el mismo archivo
        hash → para saber si cambió el contenido

Ejemplo:

        src/index.ts existe y hash igual      → unchanged
        src/app.ts existe y hash distinto     → updated
        src/new.ts no existía                 → created
        src/old.ts ya no viene en el ZIP      → deleted

Esto será muy útil para el futuro RAG porque, cuando tengamos chunks y embeddings, podremos hacer esto:

        archivo igual      → no regenerar chunks/embeddings
        archivo cambiado   → regenerar solo ese archivo
        archivo nuevo      → generar chunks/embeddings
        archivo eliminado  → borrar sus chunks/embeddings

Así DevMind será más eficiente y más realista.

¿Que pasa si el usuario mueve un archivo entre carpetas?

Este caso es importante.

Antes:

        src/services/userService.ts
        hash: abc

Después:

        src/users/userService.ts
        hash: abc

El contenido es el mismo, pero el path ha cambiado.

Con una sincronización simple por path, DevMind lo verá así:

        src/services/userService.ts → deleted
        src/users/userService.ts    → created

Aunque el hash sea igual.

Para una primera versión está bien, porque el resultado final será correcto:

        La BD tendrá el archivo en su nueva ruta.
        La BD ya no tendrá el archivo en su ruta antigua.

Para RAG, eso es suficiente.

[EMPEZAMOS A IMPLEMENTAR:]

Vamos a modificar el comportamiento actual de UploadProjectZipUseCase.

Antes hacía:

        extraer ZIP
        ↓
        filtrar archivos ignorados
        ↓
        crear todos los ProjectFile

Ahora queremos que haga:

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

Ahora seguramente devuelves algo como:

        {
        "projectId": "project-1",
        "filesCreated": 18,
        "files": [...]
        }

Con sincronización queremos evolucionarlo a algo así:

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

Como siempre seguimos la metodlogia TDD.

Vamos a empezar por el caso de uso, no por el endpoint.

Primero haremos tests unitarios para estos comportamientos:

        1. Si subo el mismo ZIP dos veces, no duplica archivos
        2. Si un archivo tiene mismo path pero distinto contenido, lo actualiza
        3. Si un archivo existía antes pero ya no viene en el ZIP, lo borra
        4. Si aparece un archivo nuevo, lo crea

Vamos a empezar con el test.

Una pieza importante que tenemos que cambiar es el ProjectFileRepository. Para poder sincronizar necesitamos que el repositorio pueda actualizar archivos existentes. Por ello tenemos que añadirle tanto al puerto como a la implementacion un metodo como:

        update(projectFile: ProjectFile): Promise<ProjectFile>;

Pero siguiendo TDD, no vamos a implementarlo todavía en PostgreSQL hasta que un test nos lo pida.

Primero empezamos por el test unitario del caso de uso, usando el FakeProjectFileRepository.

1. [Test no duplicar archivo unchanged]

En el test unitario del caso de uso que tenemos de UploadProjectZipUseCase vamos a añadir un nuevo test. Antes de esribirlo vamos a modificar lo que va a devolver el caso de uso que ahora sera :

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


Esto causara error en otros test asique hay que adaptarlos.

Pero primeo empezamos con el test, que falle y ya iremos modificando todo.

Creamos el test unitario.

Primero evitamos duplicados manteniendo la respuesta actual. Luego ya evolucionaremos la respuesta cuando toque.

Es decir, por ahora mantenemos el contrato actual del caso de uso:

        {
        projectId,
        filesCreated,
        files
        }

Pero cambiaremos su comportamiento:

        Si el archivo no existía → lo crea
        Si el archivo ya existía con mismo path y mismo hash → no lo crea otra vez

Este test simula esto:

        Ya existe en BD:
        src/index.ts
        content: console.log('hello');
        hash: X

        El ZIP nuevo trae:
        src/index.ts
        content: console.log('hello');
        hash: X

        Resultado:
        No crear otro ProjectFile.

Es decir:

        Antes había 1 archivo.
        Después debe seguir habiendo 1 archivo.

Y además:

        filesCreated = 0
        files = []

Porque no se ha creado nada nuevo.

Genial, el test falla , eso es porque le caso de uso siempre crear archivos si son validos, no comprueba tendra 2 archivos iguales y el test solo esperaba uno.

Ahora vamos a implementar en el caso de uso:

    1. Cargar los ProjectFile actuales del proyecto.
    2. Crear un Map por path.
    3. Para cada archivo del ZIP:
    - si no existe el path → crear
    - si existe y el hash es igual → no hacer nada

Lo que hemos añadido es:

- Carga los archivos actuales del proyecto los organiza por path y evita duplicados

Con estoel nuevo test pasara y los test antiguos debene pasar tambien ya que hemos mantenido aun la respuesta antigua.

Con esto ya tendcriamos el primer paso:

        Si el ZIP trae un archivo que ya existe
        y el hash es igual
        → no se duplica

El siguiente paso seria:

        Mismo path
        pero contenido distinto
        → No crear otro archivo.
          actualizar el ProjectFile existente

Primero como siempre creamos el test

El test falla porque ahora mismo el caso de uso hace :

        mismo path + hash distinto
        → crea otro ProjectFile nuevo

Vamos a implementar para que el test pase.

Añadimos un metodo update al puerto del repositorio

Añadimos el metodo update a la implementacion real de infraestrcutura ( postgresql)

Añadimos el metodo update al fake del repositorio en los test

Y ahora tenemos que modificar el caso de uso ya que el problema es que si existe el mismo path pero cambia el hash, ahora mismo llega al bloque de crear archivo nuevo.

Hay que meter un caso intermedio:

    si existe y hash igual → no hacer nada
    si existe y hash distinto → actualizar
    si no existe → crear

Lo añadimos y Con esto ya tenemos:

        Archivo no existe en BD
        → save()
        → se crea nuevo ProjectFile

        Archivo existe y hash igual
        → continue
        → no se duplica

        Archivo existe y hash distinto
        → update()
        → se actualiza el ProjectFile existente

Ya estaria, Ahora el comportamiento del caso de uso es más inteligente:

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

Todavía mantenemos la respuesta antigua:

        {
        projectId,
        filesCreated,
        files
        }

Y eso está bien por ahora. No hemos cambiado el contrato del endpoint todavía

Ahora hay que ponerse a implementar el siguiente comportamien:

        Archivo existía en BD
        pero ya no viene en el ZIP nuevo
        → se elimina

Nos ponemos a crear como siempre el test

El test no pasa como esperabamos. Ahora toca implementar el caso de uso:

        Si un ProjectFile existe en BD
        pero su path no aparece en el ZIP nuevo
        → borrarlo

No vamos a cambiar todavía la respuesta del caso de uso. Seguimos manteniendo:

        {
        projectId,
        filesCreated,
        files
        }

Con esto ya , a nivel caso de uso ya tenemos implementada la sincronización básica por path + hash.

Ahora UploadProjectZipUseCase hace esto:

    Archivo nuevo
    → se crea

    Archivo existente + mismo hash
    → no se duplica

    Archivo existente + hash distinto
    → se actualiza

    Archivo existente en BD pero ausente en el ZIP nuevo
    → se elimina

Ahora mismo, la respuesta que da el caso de uso sigue siendo

    {
    projectId,
    filesCreated,
    files
    }

esto no esta del todo bien porque a no cuenta toda la verdad, porque ahora también puede haber archivos actualizados o eliminados.

Esto lo cambiaremos ahora despues , pero primero Vamos a comprobar la sincronización desde la API real, pero sin cambiar todavía la respuesta.

Vamos con los test de los endpoint.

Con esto ya tenemos comprobada la sincronización en dos niveles:

        1. Test unitario del caso de uso
        2. Test de integración HTTP con PostgreSQL real de test

Ahora DevMind ya hace esto correctamente:

        Primer ZIP:
        src/index.ts
        src/app.ts
        src/old.ts

        Segundo ZIP:
        src/index.ts    igual
        src/app.ts      cambiado
        src/new.ts      nuevo

Ahora nos ponemos con la parte de la respuesta, para que devuelva todo.

Primero hay que cambiar el primer test unitario para que sea con la respuesta nueva

Este test fallara poraue result.summary todavía no existe. Vamos a implementarlo, tenemos que modificar el caso de uso buscando cada rama para aue devuelva la parte del summary correspondiente y el return.

Ahora este test pasar , pero el resto no porque aun sigue con el anterior resulatdo.

## . FASE 6

Ahora mismo se tiene esto:

        Project
        └── ProjectFile

Y queremos llegar a esto:

        Project
        └── ProjectFile
            └── CodeChunk

La idea está alineada con lo que ya tenías previsto: ProjectFile guarda el archivo completo y CodeChunk guardará fragmentos pequeños para poder hacer RAG más adelante sin mandar archivos enteros a la IA.

Un CodeChunk será un trozo de un archivo.

Por ejemplo, este archivo:

        src/users/userService.ts

podría generar varios chunks:

        chunk 0 → imports
        chunk 1 → definición de clase UserService
        chunk 2 → método createUser
        chunk 3 → método findUserByEmail

Vamos a dividir el codigo por lineas.Por ejemplo:

        Chunk 0 → líneas 1-80
        Chunk 1 → líneas 71-150
        Chunk 2 → líneas 141-220

Eso incluye un pequeño overlap, es decir, unas líneas repetidas entre chunks para no cortar contexto de golpe.

### Paso 1.

Vamos a empezar creando la entidad de codechunk y la interfaz de repositorio.

Entidad codeChunk:

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

- Guardaría también projectId, aunque ya pueda deducirse desde ProjectFile.

- ¿Por qué? Porque más adelante, cuando busquemos chunks de un proyecto, será mucho más cómodo hacer:

       WHERE project_id = ...

en vez de tener que hacer joins todo el rato con project_files.

Puerto Repositorio:

        export interface CodeChunkRepository {
        saveMany(codeChunks: CodeChunk[]): Promise<CodeChunk[]>;
        findByProjectFileId(projectFileId: string): Promise<CodeChunk[]>;
        deleteByProjectFileId(projectFileId: string): Promise<void>;
        }

- De momento no hace falta mucho más.

- Más adelante, cuando lleguen embeddings, seguramente añadiremos búsquedas tipo:

       findMostSimilarByProjectId(...)

- Pero eso todavía no toca

### Paso 2

Vamos a crear una pieza llamada, por ejemplo:

        LineCodeChunker

Responsabilidad:

Recibe el contenido de un archivo y lo divide en chunks por líneas.

De momento no crea entidades CodeChunk completas con id, projectId, etc. Solo devuelve fragmentos con:

        {
        content: string;
        startLine: number;
        endLine: number;
        index: number;
        }

Luego el caso de uso ya convertirá esos fragmentos en CodeChunk reales.

Como seguimos TDD emepzaremos creando el archivo de test, este fallara y empezaremos a implementar.

Una vez que el test falle, vamos a seguir con la implementacion del lineCodeChunker.

De momento creamos una implementacion simple. Aunque sabemos que después tendrá que dividir archivos largos, ahora solo estamos cumpliendo el primer comportamiento que el test exige, siguiendo TDD: primero test, luego implementación mínima.

Ahora los test pasan.

Ahora hacemos el segundo test, todavía sin tocar la implementación. Queremos forzar que el LineCodeChunker ya no pueda devolver siempre un único chunk.

Este test falla, Ahora toca modificar la implementación para que el LineCodeChunker pueda generar varios chunks cuando el archivo supera maxLinesPerChunk.

Con esto deberían pasar los dos tests:

        ✓ devuelve un único chunk si el archivo tiene menos líneas que el máximo
        ✓ divide un archivo largo en varios chunks

Ahora toca el tercer ciclo TDD: añadir overlap.

El overlap es importante porque evita que un chunk corte el contexto de forma brusca. Por ejemplo, si un método empieza al final de un chunk y continúa en el siguiente, repetir unas líneas ayuda a que el siguiente chunk siga teniendo contexto. Esto encaja con el objetivo de preparar los archivos para RAG más adelante.

Añadimso el tercer test, este test fallara y el siguiente paso es implementar el overlapLines.

Ya enemos cubierto esto:

        1. Archivo pequeño → 1 chunk
        2. Archivo largo → varios chunks
        3. Archivo largo con overlap → varios chunks solapados

Ahora vamos a realizar un cuarto test importante antes de seguir: contenido vacío.

Esto importa porque el proyecto ProjectFile.content puede estar vacío, y no queremos generar un chunk inútil vacío para RAG. Lo más limpio es que un archivo vacío devuelva []

Añadimos el test alfinal del archivo de test

Este test falla asique vamos ahora con la implementacion.

Con esto ya tenemos:

        ✅ archivo pequeño → 1 chunk
        ✅ archivo largo → varios chunks
        ✅ overlap entre chunks
        ✅ contenido vacío → []

Dandome cuenta, he notaod que Ahora mismo hay un caso peligroso:

        maxLinesPerChunk: 3
        overlapLines: 3

O peor:

        maxLinesPerChunk: 3
        overlapLines: 4

En esos casos esta línea:

        const step = input.maxLinesPerChunk - input.overlapLines;

daría 0 o negativo, y el bucle podría quedarse mal o infinito.

Vamosa generar el test para esto y luego su implementacion. Con esto dejamos el LineCodeChunker suficientemente sólido para seguir con lo siguiente.

### Paso 3

Ahora vamos a empezar con el caso de uso, primero generamos los test como siempre.

El test que creemos, comprueba tres cosas importantes:

        1. Que antes de generar nuevos chunks se borran los chunks antiguos del archivo.
        2. Que cada chunk generado se convierte en un CodeChunk real con id, projectId y projectFileId.
        3. Que el caso de uso devuelve un resumen simple con los chunks creados.

Cuando este tes falle, empezamos con el caso de uso.

En el caso de uso, en vez de importar el propio linecodechunker lo que haremos es crear type para que asi el caso de uso no dependea estrcitramente de la implementacion del codechunker y que dependa de una interfaz ( ya que estamos siguiendo clean/hexagonal arquitecture).

Ahora toca añadir un test más al caso de uso para cubrir un caso importante: ProjectFile con contenido vacío.

Esto importa porque en tu proyecto ProjectFile.content puede estar vacío, pero para RAG no queremos guardar chunks vacíos. Además, aunque el archivo esté vacío, sí tiene sentido borrar chunks antiguos por si antes ese archivo tenía contenido y luego quedó vacío tras una resubida del ZIP.

El Test del caso de uso no repite la responsabilidad del LineCodeChunker. El LineCodeChunker ya prueba que content: "" devuelve []; aquí solo probamos que el caso de uso se comporta bien cuando no hay chunks que guardar. Esto mantiene separadas las responsabilidades de la Fase 6: LineCodeChunker parte texto, y GenerateCodeChunksForProjectFileUseCase convierte esos resultados en CodeChunk y los persiste

Añadimos el test al fichero de test.

Ahora ya queda cerrado:

    ✅ CodeChunk entity
    ✅ CodeChunkRepository port
    ✅ LineCodeChunker con tests
    ✅ GenerateCodeChunksForProjectFileUseCase con tests
    ✅ Caso de 0 chunks cubierto

### Paso 4

Ahora toca la siguiente pieza:

        Persistir CodeChunks en PostgreSQL

Es decir, crear:

    004_create_code_chunks.sql
    PostgresCodeChunkRepository
    tests de integración del repositorio

Pero siguiendo TDD, no empezamos por la migración ni por el repositorio. Empezamos por el test de integración que todavía va a fallar.

Vamos a generar el Test que falle.

Una vez que el test falla, vamos a empezar con las implementaciones:

- Creamos la migracion para crear la tabla en el sql
- Creamos el postgresCodeChunkRepository

Ahora antes de continiar, vamos a añadir un nuevo tes para probar :

        Si se borra un ProjectFile,
        sus CodeChunks deben borrarse automáticamente por ON DELETE CASCADE.

### Paso 5

Integrar CodeChunks con la subida/resubida del ZIP

La regla que vamos a implementar será esta:

        created   → generar chunks
        updated   → regenerar chunks
        deleted   → borrar ProjectFile y dejar que PostgreSQL borre chunks por CASCADE
        unchanged → no tocar chunks

Esto encaja directamente con la sincronización que ya se hizo en Fase 5.1, donde el ZIP distingue archivos creados, actualizados, eliminados y sin cambios.

Vamos a empezar añadiendo tests al archivo de test UploadProjectZipUseCase:

- cuando se sube un ZIP con un archivo nuevo, debería generar chunks para el ProjectFile creado

- cuando se resube un ZIP con un archivo actualizado, debería regenerar chunks para ese ProjectFile

- cuando se resube un ZIP con un archivo unchanged, no debería regenerar chunks

Lo que se añade al test es:

- created → debe llamar al generador de chunks
- updated → debe llamar al generador de chunks
- unchanged → NO debe llamar al generador de chunks

En el test, le pasamos al casod e uso de UploadProjectZipUseCase 5 dependencias en vez de 4 como esta configurado y el test fallara por eso.

Debemos implementar eso en el caso de uso de UploadProjectZipUseCase, porque ahora le pasamos una dependencias para que no solo guarde los archivos sino que genere chunk de cada uno.

Tambien debemos modificar el container para que le pasemos las 5 dependencias tambien

### Paso 6

Ahora toca el test de integración HTTP/PostgreSQL

Es decir, comprobar que cuando llamas al endpoint real:

        POST /projects/:id/upload

no solo se crean ProjectFiles, sino que también aparecen registros reales en la tabla code_chunks.

El siguiente test debería ir en el test de integración del endpoint ZIP, algo como:

        cuando se sube un ZIP por HTTP,
        debería crear ProjectFiles y también CodeChunks en PostgreSQL

Y después otro:

        cuando se resube un ZIP con un archivo modificado,
        debería regenerar sus CodeChunks

Con esto ya comprobado mediante test, podemos cerrar :

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

La fase 6 quedaria:

Se añadió una nueva entidad CodeChunk para representar fragmentos de código derivados de ProjectFile.

Los archivos se dividen por líneas usando LineCodeChunker, con soporte para:

- tamaño máximo por chunk;
- overlap entre chunks;
- contenido vacío;
- validación de configuración inválida.

Cada vez que se sube o resube un ZIP:

- los archivos nuevos generan chunks;
- los archivos modificados regeneran chunks;
- los archivos eliminados borran sus chunks mediante ON DELETE CASCADE;
- los archivos sin cambios conservan sus chunks.

Esto prepara el sistema para la siguiente fase: embeddings y búsqueda semántica.




----------------------------------

🔴 Seguridad
Severidad	Ubicación	Problema

Media	src/infrastructure/config/env.ts:6	secret: process.env.JWT_SECRET || "devmind_dev_secret" — si no defines la variable, la app arranca igualmente firmando tokens con un secreto público hardcodeado, en vez de fallar rápido (throw si falta). Muy fácil de fugar a producción sin darte cuenta.
Media	src/infrastructure/uploadZipAdapter/admZipExtractor.ts:16	Las rutas de las entradas del ZIP no se sanitizan contra path traversal (../../etc/passwd); solo se normalizan barras invertidas. Hoy no escribe a disco, pero si en el futuro alguna función vuelca esos path a filesystem, es una vulnerabilidad real.
Media	package.json / src/app.ts	No hay helmet (cabeceras de seguridad) ni express-rate-limit. POST /auth/login y /auth/register no tienen ninguna protección contra fuerza bruta.
Baja	projectFileSchemas.ts	Sin .max() en content ni límite de tamaño de body en express.json() — depende del límite implícito de Express.
✅ Verificado limpio	Los 4 repos Postgres	Todas las queries están parametrizadas — sin riesgo de inyección SQL.
✅ Verificado limpio	.env	Correctamente en .gitignore, no committeado.
✅ Verificado limpio	Autorización	ownerId/projectId se comprueba de forma consistente en todos los casos de uso.





🔵 Pulido profesional (esto es lo que más va a notar un evaluador de TFM/entrevistador)
El README está desactualizado y es engañoso: dice literalmente "Todavía no está implementada la indexación de código, embeddings ni RAG" y que los datos "se guardan en memoria", cuando el proyecto ya tiene Postgres, subida/sincronización de ZIP y generación de CodeChunks completos y commiteados (Fases 4, 5, 5.1, 6). Esto es lo primero que lee cualquiera que abra el repo.
No hay instrucciones de instalación: falta npm install, docker-compose up, setup de .env, cómo correr migraciones.
No hay CI (.github/workflows) pese a tener suite de tests y typecheck ya listos para engancharse.
No hay LICENSE, aunque package.json declara "license": "ISC".
docs/ tiene 4 markdowns grandes y solapados (hasta 104KB) sin ningún índice que diga cuál es el canónico/vigente — puede confundir a quien entra a mirar la documentación.




⚪ Dependencias
No hay helmet, express-rate-limit, eslint ni prettier en package.json.
package-lock.json está commiteado — bien.
Clasificación dependencies/devDependencies correcta.
No se detectaron dependencias obviamente sin usar.
Prioridad si tuviera que elegir 3 cosas antes de enseñar esto en una entrevista: (1) actualizar el README, (2) limitar tamaño del ZIP en multer, (3) hacer fallar el arranque si falta JWT_SECRET en vez de usar un valor por defecto. Dime cuáles quieres que aborde y en qué orden.
