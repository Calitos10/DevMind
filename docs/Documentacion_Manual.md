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

Antes de implementar nada vamos ha hacer tests cn TDD , que falen e implementar el caso de uso.


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

- Esto rompera el test de reggistro porque el fake solo tiene un metodo, debemos incluirlo aunque el test no lo use. Asi typescript no se queja.

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

Modificamos nuestor .env para añadir el secreto para jasonwebtoken y los dias de expricion
Modificamos el env.ts de config de infra para que coja todo de .env

Tenemos que actualizar el puerto tokenService, ahora mismo solo tiene sign,para firmar y generar el token pero hay que añair el metodo verificar porque más adelante el middleware de autenticación hará esto:

- recibir token
- verificar token
- extraer userId
- permitir acceso a rutas protegidas


Al añadir verify, el test de login puede fallar porque FakeTokenService ya no implementa toda la interfaz.

Ahora vamos a crear la carpeta authAdapters dentro de infrastructura y ahi metermos los ficheros de adapters que implementand a los ports de la carpeta de aplciacion : bcryptPasswordHasher, jwtTokenService, cryptoIdGenerator

Una vez creadas las implementaciones reales de los puertos, empezamos con TDD generarndo los test unitarios de infraestructura.

Despues de generar los test, podemos probarlos, pero ahy una cosa que nos falta, durante la creacion de las implementaciones y los tests hemos usado un nuevo tipo de error que es el de unauthorized.erro, lo creamos en la carpeta errors y ya podemos pasar los tests.


---------------

Hasta aqui lo que hemos hecho es crear e incializar el proyecto con el set up, dependencias y configuracion que necesitamos, hemos creado la estructura base de carpetas, creado el dominio con su entidad e interfaz de repositorio, creado los puertos que necesitamos en applicacion y los casos de uso que los usan, hemos implementado los puertos de aplicacion con infraestructura real y para todo esto hemos seguido TDD y hemos creado tipos de errores nuestors ( hemos creado tambien un ,en y una confugracion en infraestructura para poder acceder a el). Tambien esta creado el fichero de app donde se crea la app de express, un ruter con un pequeño endpoint y el fichero main que levanta el servidor.

----------------


## . FASE 1.3





