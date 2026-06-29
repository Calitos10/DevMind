OBJETIVO DEL PROYECTO: 
- Construir una API backend profesional que permita a usuarios autenticados crear proyectos software, subir/indexar su código y hacer consultas inteligentes sobre ese proyecto usando IA.

- DevMind ofrece dos modos de uso: un modo invitado, que permite probar la funcionalidad principal de análisis e interacción con proyectos software sin necesidad de registro, y un modo autenticado, que permite persistir proyectos, historial de conversaciones y resultados de indexación asociados a cada usuario.

- El problema no es “hacer una app con IA”. El problema es:

  >Entender un proyecto software existente puede ser lento porque el conocimiento está repartido entre carpetas, archivos, documentación incompleta y memoria del equipo.

- DevMind quiere ayudar a:

  >desarrolladores nuevos
  >equipos con proyectos grandes 
  >personas que entran a mantener código ajeno
  >equipos que no tienen documentación actualizada

-El enfoque es:

  >Convertir un proyecto software en una fuente de conocimiento consultable mediante lenguaje natural.



Ejemplo práctico:

- Tú tendrías un proyecto guardado:

  >Proyecto: DevMind API

  >Podrías preguntarle:

    *Explícame la arquitectura de este proyecto
    *¿Qué endpoints existen?
    *¿Dónde se validan los datos de entrada?
    *Qué casos de uso tiene la autenticación?
    *¿Qué tests hay para auth?
    *¿Qué partes pertenecen a domain, application, infrastructure y transport?
    *¿Qué debería mejorar de este código?

  > Eso deja claro que DevMind no es solo un CRUD, sino una herramienta para entender proyectos software.

FASES:

Fase 0 — Setup inicial
Fase 1 — Autenticación
Fase 2 — Proyectos persistentes
Fase 3 — Subida de archivos
Fase 4 — Indexación
Fase 5 — Chat RAG
Fase 6 — Historial
Fase 7 — Funciones inteligentes
Fase 8 — Modo invitado / demo sin registro
Fase 9 — Onboarding visual / presentación final


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
  >Si el token es válido → el middleware extrae el userId
  >GET /auth/me → busca ese usuario por id
  >Devuelve sus datos públicos

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


---------------

Hasta aqui lo que hemos hecho es crear e incializar el proyecto con el set up, dependencias y configuracion que necesitamos, hemos creado la estructura base de carpetas, creado el dominio con su entidad e interfaz de repositorio, creado los puertos que necesitamos en applicacion y los casos de uso que los usan, hemos implementado los puertos de aplicacion con infraestructura real y para todo esto hemos seguido TDD y hemos creado tipos de errores nuestros ( hemos creado tambien un .env y una confugracion en infraestructura para poder acceder a el). Tambien esta creado el fichero de app donde se crea la app de express, un ruter con un pequeño endpoint y el fichero main que levanta el servidor.

----------------


## . FASE 1.3

Ahora toca conectar todo con HTTP, es decir, crear los endpoints reales:

POST /auth/register
POST /auth/login
GET  /auth/me

Pero antes necesitamos una pieza temporal.

Como todavía no hemos metido PostgreSQL, necesitamos un repositorio en memoria dentro de infraestructura para poder probar los endpoints. Este repositorio será temporal. Luego, cuando metamos PostgreSQL, lo cambiaremos.

Pero ahora nos permite terminar la autenticación HTTP sin esperar a la base de datos.




Creamos un contenedor de dependencias simple. Para no estar instanciando todo en cada controller, creamos un archivo donde montamos los casos de uso.

Esto es una forma sencilla de hacer inyección de dependencias manual. No estamos usando una librería rara. Simplemente estamos diciendo:

- Aquí conecto mis interfaces con implementaciones reales.



Ahora vamos a crear estos endpoints:

POST /auth/register
POST /auth/login
GET  /auth/me

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

No estamos siguiendo TDD :

- El proyecto aplica una estrategia de TDD pragmático. En las capas de dominio y aplicación, donde se concentra la lógica de negocio, se han escrito pruebas unitarias antes de la implementación. En la capa de transporte HTTP, al tratarse principalmente de código de integración y cableado entre rutas, middlewares y controladores, se han utilizado pruebas de integración para validar el comportamiento completo de los endpoints. Hemos creado tests depues de toda la implementacion de esta parte, para asegurarnos de que todo funciona como queremos, no hemos sguido TDD en esta parte.


## . FASE 2

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

  >await listUserProjectsUseCase.execute({
    ownerId: "user-1",
   });

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

    >Ejemplo:

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






















