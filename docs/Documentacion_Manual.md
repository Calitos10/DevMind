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

Creamos el caso de uso de  ListProjectFilesUseCase

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

Ahora  pasamos a la parte HTTP, porque ya tenemos todos los casos de uso preparados.











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

Para usar  manualmente con la API, frontend, TablePlus, curl, etc.

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

  