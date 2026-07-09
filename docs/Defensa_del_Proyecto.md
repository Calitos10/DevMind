# DevMind — Defensa técnica

## 1. Qué es DevMind

DevMind es una API backend que permite a los usuarios generar una base de conocimiento a partir de sus proyectos de código. 

El usuario puede subir un proyecto en formato ZIP, la API extrae los archivos relevantes, los divide en fragmentos o chunks, genera embeddings de esos fragmentos y los almacena en PostgreSQL usando pgvector.

Después, el usuario puede hacer preguntas en lenguaje natural sobre el proyecto, y DevMind utiliza un sistema RAG para buscar los fragmentos de código más relevantes y generar una respuesta con ayuda de un modelo de IA.

En resumen, DevMind permite consultar y entender proyectos software mediante preguntas en lenguaje natural.

## 2. Problema que resuelve

En muchos proyectos software, el código está repartido entre muchas carpetas, archivos, capas y módulos. Esto hace que entender el funcionamiento completo del proyecto pueda ser lento y complicado, sobre todo cuando el código no lo ha escrito uno mismo o cuando no existe una documentación clara.

Este problema aparece, por ejemplo, cuando un desarrollador entra en un proyecto nuevo, tiene que mantener código heredado, revisar una base de código grande o localizar rápidamente dónde se implementa una funcionalidad concreta.

DevMind ayuda a resolver este problema permitiendo que un usuario suba un proyecto y pueda hacer preguntas sobre él en lenguaje natural. En lugar de tener que buscar manualmente entre todos los archivos, el usuario puede preguntar cosas como dónde se registra un usuario, cómo se sube un ZIP o qué caso de uso se encarga de una operación concreta.

De esta forma, DevMind facilita la comprensión de proyectos software y reduce el tiempo necesario para orientarse dentro de una base de código.


## 3. Arquitectura general

DevMind sigue una arquitectura Clean/Hexagonal. La idea principal de esta arquitectura es que las dependencias vayan desde las capas externas hacia las capas internas.

De forma simplificada, la estructura es:

Infrastructure → Application → Domain

Esto significa que el dominio y los casos de uso no dependen directamente de detalles técnicos como Express, PostgreSQL, Genkit, JWT o bcrypt. En su lugar, la capa de aplicación trabaja con contratos o puertos, y la infraestructura proporciona las implementaciones concretas de esos contratos.

Por ejemplo, un caso de uso no necesita saber si los datos se guardan en memoria o en PostgreSQL. Solo necesita depender de una interfaz como `ProjectRepository` o `UserRepository`. Después, en la capa de infraestructura, se crea una implementación concreta como `PostgresProjectRepository`.

Esta separación aporta varias ventajas:

1. El código de negocio queda más limpio y desacoplado de tecnologías concretas.
2. Es más fácil hacer tests unitarios, porque se pueden usar fakes en lugar de depender de una base de datos real o de servicios externos.
3. Es más sencillo cambiar una tecnología por otra. Por ejemplo, se podría sustituir PostgreSQL por otra base de datos creando un nuevo adaptador sin cambiar los casos de uso.
4. La aplicación queda organizada por responsabilidades: dominio, casos de uso, adaptadores técnicos, controladores HTTP y configuración de dependencias.

El `container` es el lugar donde se conectan todas las piezas. Ahí se decide qué implementación concreta se usa para cada puerto, por ejemplo qué repositorio, qué generador de tokens, qué generador de embeddings o qué scheduler de indexación se inyecta en cada caso de uso.

## 4. Flujo de autenticación

El flujo de autenticación en DevMind incluye tres operaciones principales: registro, login y obtención del usuario autenticado.

### Registro de usuario

Cuando un usuario quiere registrarse, introduce en el frontend su nombre, email y contraseña. Esa información se envía al backend mediante el endpoint:

POST /auth/register

La petición entra primero por `app.ts`, donde están registradas las rutas principales de la API. Desde ahí se redirige hacia las rutas de autenticación, definidas en `authRoutes.ts`.

Antes de llegar al controlador, la petición pasa por varios middlewares. Primero puede pasar por un middleware de rate limit, que sirve para limitar el número de peticiones y evitar abusos o saturación de la API. Después pasa por un middleware de validación del body, que utiliza Zod y un schema definido previamente para comprobar que los datos enviados tienen el formato correcto.

Una vez validada la petición, se llama al método `register` del `AuthController`. Este controlador ha sido construido previamente recibiendo sus dependencias desde el `container`, donde se inyectan los casos de uso necesarios.

El método `register` recoge los datos ya validados del body y se los pasa al caso de uso `RegisterUserUseCase`. Este caso de uso contiene la lógica de registro: comprueba si ya existe un usuario con ese email, hashea la contraseña, genera un identificador para el usuario y guarda el nuevo usuario en el repositorio.

Es importante recalcar que la contraseña no se guarda en texto plano por un tema de seguridad. Si la base de datos se filtrase o alguien consiguiera acceso a ella, podría ver directamente algo como:  email: usuario@example.com , password: miContraseña123

Esto es peligroso por estas razones:
1. Podrían entrar en la cuenta del usuario dentro de DevMind.
2. Si el usuario usa la misma contraseña en Gmail, Instagram, GitHub, banco, etc., también podrían intentar entrar allí.
3. Como desarrollador, estariamos almacenando información sensible de forma insegura.

Por eso en DevMind no guardas la contraseña real. Guardas un hash.

Finalmente, el caso de uso devuelve el usuario creado y el controlador responde al cliente con la información correspondiente.

### Login de usuario

Cuando un usuario ya está registrado y quiere iniciar sesión, introduce su email y contraseña en el frontend. Esa información se envía al backend mediante el endpoint:

POST /auth/login

La petición sigue un flujo parecido al registro: entra por `app.ts`, pasa por las rutas de autenticación en `authRoutes.ts`, atraviesa los middlewares correspondientes y llega al método `login` del `AuthController`.

El método `login` recoge el email y la contraseña del body y llama al caso de uso `LoginUserUseCase`.

Este caso de uso primero busca al usuario por email en el repositorio. Si no existe, lanza un error de credenciales inválidas. Si el usuario existe, compara la contraseña enviada con el `passwordHash` guardado en base de datos usando el servicio de hashing. Si la contraseña no coincide, lanza un error de credenciales inválidas. 

Si la contraseña es correcta, el caso de uso llama al servicio de generación de tokens. Este servicio genera un JWT usando información del usuario, como su `userId` y su email.

Finalmente, el backend devuelve una respuesta con el usuario autenticado y el `accessToken`.

A partir de este momento, el frontend debe enviar ese token en las peticiones protegidas usando el header:

Authorization: Bearer TOKEN

### Obtener usuario autenticado

Cuando un usuario ya ha iniciado sesión y quiere recuperar su información, el frontend realiza una petición al endpoint:

GET /auth/me

Este endpoint está protegido, por lo que la petición debe incluir el token JWT en el header `Authorization`.

En este caso, la petición pasa por el middleware `authMiddleware`. Este middleware comprueba si existe el header de autorización, verifica que tenga el formato correcto y valida el token. Si el token es válido, lo decodifica y extrae la información del usuario, como el `userId` y el email.

Después, el middleware añade esa información a la request, normalmente en `req.user`, para que las siguientes capas puedan saber qué usuario está haciendo la petición.

Una vez superado el middleware, la petición llega al método correspondiente del `AuthController`, el cual es `me`.

Ese método obtiene el `userId` desde la request y se lo pasa al caso de uso `GetCurrentUserUseCase`. Este caso de uso busca al usuario en el repositorio mediante su identificador y devuelve la información del usuario autenticado.

Finalmente, el controlador responde con los datos del usuario.


## 5. Flujo de proyectos

Una vez que un usuario está registrado y ha iniciado sesión, puede gestionar sus propios proyectos dentro de DevMind.

Todas las rutas de proyectos están protegidas mediante autenticación, por lo que el usuario debe enviar su token JWT en el header `Authorization`. A partir de ese token, el backend obtiene el `userId` del usuario autenticado y lo utiliza para asociar o filtrar los proyectos.

### Crear un proyecto

Para crear un proyecto, el usuario rellena en el frontend los campos de nombre y descripción. Esa información se envía al backend mediante el endpoint:

POST /projects

La petición entra por `app.ts`, donde están registradas las rutas principales de la API. Desde ahí se redirige hacia las rutas de proyectos, definidas en `projectRoutes.ts`.

En este endpoint, la petición pasa primero por el middleware `authMiddleware`, que verifica que el usuario haya enviado un token válido. Si el token es correcto, el middleware extrae la información del usuario autenticado y la añade a la request.

Después, la petición pasa por el middleware de validación del body, que utiliza Zod para comprobar que los datos enviados tienen el formato esperado.

Una vez superados los middlewares, la petición llega al método `create` del `ProjectController`. Este controlador ha sido construido previamente recibiendo sus dependencias desde el `container`.

El método `create` obtiene el `userId` del usuario autenticado desde la request y también obtiene el `name` y la `description` desde el body. Después llama al caso de uso `CreateProjectUseCase`, pasándole esos datos.

El caso de uso crea un nuevo proyecto asociado al usuario autenticado, genera su identificador, lo guarda en el repositorio de proyectos y devuelve el proyecto creado.

Finalmente, el controlador responde al cliente con los datos del nuevo proyecto.

### Listar proyectos del usuario

Para listar los proyectos del usuario autenticado, el frontend realiza una petición al endpoint:

GET /projects

Esta petición sigue un flujo parecido al de creación, pero en este caso no necesita validar un body, porque no se envían datos en el cuerpo de la petición.

La petición pasa por `authMiddleware`, que valida el token JWT y añade el usuario autenticado a la request. Después llega al método `list` del `ProjectController`.

El método `list` obtiene el `userId` desde la request y se lo pasa al caso de uso `ListUserProjectsUseCase`.

Este caso de uso llama al repositorio de proyectos para buscar todos los proyectos cuyo `ownerId` coincide con el identificador del usuario autenticado.

De esta forma, cada usuario solo recibe sus propios proyectos y no los proyectos de otros usuarios.

### Obtener un proyecto concreto

Para consultar un proyecto concreto, el frontend realiza una petición al endpoint:

GET /projects/:id

En este caso, `:id` representa el identificador del proyecto que se quiere consultar.

La petición pasa primero por `authMiddleware`, que valida el token y obtiene el `userId` del usuario autenticado. Después llega al método `getById` del `ProjectController`.

El controlador obtiene dos datos importantes:

- el `projectId`, que viene en los parámetros de la URL;
- el `userId`, que viene de la información añadida por el `authMiddleware`.

Después llama al caso de uso `GetProjectByIdUseCase`, pasándole ambos valores.

Este caso de uso busca el proyecto usando tanto el identificador del proyecto como el identificador del usuario propietario. Para ello, el repositorio utiliza un método como `findByIdAndOwnerId`.

Esto es importante porque no basta con que exista un proyecto con ese `id`: además debe pertenecer al usuario autenticado.

Si el proyecto existe y pertenece al usuario, se devuelve. Si no existe o pertenece a otro usuario, se responde como si no se hubiera encontrado.

### Borrar un proyecto

Para borrar un proyecto concreto, el frontend realiza una petición al endpoint:

DELETE /projects/:id

La petición sigue un flujo similar al de obtener un proyecto concreto. Primero pasa por `authMiddleware`, que valida el token JWT y obtiene el `userId` del usuario autenticado.

Después llega al método `delete` del `ProjectController`.

El controlador obtiene el `projectId` desde los parámetros de la URL y el `userId` desde la request. Con esos datos llama al caso de uso `DeleteProjectUseCase`.

Este caso de uso llama al repositorio para borrar el proyecto usando tanto el `id` del proyecto como el `ownerId` del usuario autenticado.

De esta forma, un usuario solo puede borrar proyectos que le pertenecen. No puede borrar proyectos de otros usuarios aunque conozca su identificador.

### Seguridad en el flujo de proyectos

Un punto importante del flujo de proyectos es que todas las operaciones se hacen teniendo en cuenta el usuario autenticado.

El `userId` no se recibe desde el frontend ni desde el body de la petición. Se obtiene del token JWT mediante el `authMiddleware`. Esto es más seguro porque evita que un usuario pueda enviar manualmente el identificador de otro usuario para acceder a sus proyectos.

Por eso, los métodos del repositorio no trabajan únicamente con el `id` del proyecto, sino también con el `ownerId`. Por ejemplo, se usan métodos como:

findByIdAndOwnerId
deleteByIdAndOwnerId

Gracias a esto, DevMind garantiza que un usuario solo pueda consultar, listar o borrar sus propios proyectos.

Esta decisión protege la aplicación frente a accesos indebidos entre usuarios. Si un usuario intenta acceder a un proyecto que no le pertenece, aunque conozca su identificador, la API no se lo devolverá.

## 6. Flujo de creación manual, listado, consulta y borrado de archivos

Cuando un usuario está autenticado y ha creado un proyecto, puede añadir archivos manualmente a ese proyecto.

Esta funcionalidad existe actualmente como parte del desarrollo y de las pruebas del sistema. Sin embargo, en una versión más orientada a producción, la forma principal de introducir archivos en DevMind será mediante la subida de un ZIP completo del proyecto.

### Crear un archivo manualmente

Para crear un archivo manualmente, el usuario debe enviar información como el `path`, el `language` y el `content` del archivo.

Esta información se envía al backend mediante el endpoint:

POST /projects/:projectId/files

La petición entra primero por `app.ts`, donde están registradas las rutas principales de la API. Después pasa por las rutas generales y llega a `projectFileRoutes.ts`, donde están definidas las rutas relacionadas con los archivos de proyecto.

En este endpoint, la petición pasa primero por `authMiddleware`, que verifica que el usuario ha enviado un token JWT válido. Si el token es correcto, el middleware extrae el `userId` del usuario autenticado y lo añade a la request.

Después, la petición pasa por el middleware de validación del body, que comprueba con Zod que los datos enviados tienen el formato esperado.

Una vez superados los middlewares, la petición llega al método `create` del `ProjectFileController`. Este controlador ha sido construido previamente recibiendo sus dependencias desde el `container`.

El método `create` recoge:

- el `projectId`, que viene en los parámetros de la URL;
- el `userId`, que viene del token JWT y ha sido añadido a la request por `authMiddleware`;
- el `path`, `language` y `content`, que vienen en el body de la petición.

Con esos datos llama al caso de uso encargado de crear archivos de proyecto.

Antes de guardar el archivo, el caso de uso comprueba que existe un proyecto con ese `projectId` y que además pertenece al usuario autenticado. Para ello utiliza una búsqueda por `projectId` y `ownerId`.

Esta comprobación es importante porque evita que un usuario pueda crear archivos dentro de un proyecto que no le pertenece. Si no existe la combinación de `projectId` y `ownerId`, el sistema responde como si el proyecto no existiera, aunque realmente pudiera existir para otro usuario.

Si el proyecto pertenece al usuario, el caso de uso crea el `ProjectFile`, genera su identificador, calcula sus datos necesarios y lo guarda en el repositorio de archivos.

### Listar archivos de un proyecto

Para listar los archivos de un proyecto, el frontend realiza una petición al endpoint:

GET /projects/:projectId/files

Esta petición sigue un flujo parecido al de creación, pero no necesita validar un body, porque no se envían datos en el cuerpo de la petición.

La petición pasa por `authMiddleware`, que valida el token JWT y añade el usuario autenticado a la request. Después llega al método `list` del `ProjectFileController`.

El controlador recoge el `projectId` desde los parámetros de la URL y el `userId` desde la request. Con esos datos llama al caso de uso encargado de listar archivos.

El caso de uso primero comprueba que el proyecto existe y pertenece al usuario autenticado. Si la comprobación es correcta, busca en el repositorio todos los archivos asociados a ese proyecto y los devuelve.

De esta forma, un usuario solo puede listar archivos de sus propios proyectos.

### Obtener un archivo concreto

Para consultar un archivo concreto, el frontend realiza una petición al endpoint:

GET /projects/:projectId/files/:fileId

La petición pasa primero por `authMiddleware`, que valida el token JWT y obtiene el `userId` del usuario autenticado.

Después llega al método correspondiente del `ProjectFileController`, normalmente `getById`.

El controlador recoge:

- el `projectId`, desde los parámetros de la URL;
- el `fileId`, también desde los parámetros de la URL;
- el `userId`, desde la request autenticada.

Con esos datos llama al caso de uso encargado de obtener un archivo concreto.

El caso de uso realiza dos comprobaciones:

1. Comprueba que el proyecto existe y pertenece al usuario autenticado.
2. Comprueba que existe un archivo con ese `fileId` dentro de ese `projectId`.

Si ambas comprobaciones se cumplen, devuelve el archivo. Si el proyecto no pertenece al usuario o el archivo no existe dentro de ese proyecto, se devuelve un error controlado.

### Borrar un archivo concreto

Para borrar un archivo concreto, el frontend realiza una petición al endpoint:

DELETE /projects/:projectId/files/:fileId

La petición sigue un flujo similar al de obtener un archivo concreto. Primero pasa por `authMiddleware`, que valida el JWT y añade el usuario autenticado a la request.

Después llega al método `delete` del `ProjectFileController`.

El controlador obtiene el `projectId`, el `fileId` y el `userId`, y se los pasa al caso de uso encargado de borrar archivos.

El caso de uso comprueba primero que el proyecto existe y pertenece al usuario autenticado. Después comprueba que el archivo existe dentro de ese proyecto. Si todo es correcto, llama al repositorio de archivos para borrar el archivo.

Así se evita que un usuario pueda borrar archivos de proyectos que no le pertenecen.

### Seguridad en archivos de proyecto

Un punto importante es que `ProjectFile` no tiene un campo `ownerId` propio.

La seguridad no se comprueba directamente sobre el archivo, sino sobre el proyecto al que pertenece. Esta comprobación se repite en todos los casos de uso relacionados con archivos: crear, listar, obtener y borrar.

El `userId` nunca llega desde el body ni desde los parámetros de la URL. Siempre viene del token JWT a través de `authMiddleware`.

El `projectId` sí llega desde la URL, y por eso podría intentarse un ataque enviando el identificador de un proyecto que pertenece a otro usuario.

Para evitarlo, antes de tocar cualquier `ProjectFile`, los casos de uso comprueban primero la propiedad del proyecto usando una operación como:

findByIdAndOwnerId(projectId, ownerId)

Esta consulta solo devuelve el proyecto si coinciden a la vez el identificador del proyecto y el identificador del usuario propietario.

Si un usuario intenta crear, listar, consultar o borrar un archivo usando el `projectId` de otro usuario, esta búsqueda no encuentra nada. En ese caso se lanza un `ProjectNotFoundError` y la operación se detiene antes de acceder al repositorio de archivos.

En resumen, el archivo hereda la seguridad de su proyecto. No es necesario guardar `ownerId` en `project_files`, porque nunca se accede a un archivo sin comprobar antes que el proyecto pertenece al usuario autenticado.


## 7. Flujo de subida ZIP y sincronización por path + hash

Un usuario autenticado puede subir un proyecto completo en formato ZIP.

Para ello, desde el frontend selecciona un archivo ZIP y lo envía al backend mediante el endpoint:

POST /projects/:id/upload

En este caso, `:id` representa el identificador del proyecto al que se quiere subir el ZIP.

La petición entra primero por `app.ts`, donde están registradas las rutas principales de la API. Después llega a las rutas de proyectos definidas en `projectRoutes.ts`.

En este endpoint, la petición pasa primero por `authMiddleware`. Este middleware comprueba que el usuario haya enviado un token JWT válido. Si el token es correcto, extrae el `userId` del usuario autenticado y lo añade a la request.

Después, la petición pasa por el middleware de `multer`. En este caso, `multer` se encarga de leer el archivo enviado en el campo `file`, guardarlo en memoria como un `Buffer` y añadirlo a la request en `req.file`.

Una vez superados estos middlewares, la petición llega al método encargado de subir ZIPs en el `ProjectController`. Este controlador ha sido construido previamente recibiendo sus dependencias desde el `container`.

El método del controlador comprueba primero que realmente se haya enviado un archivo. Si no existe `req.file`, devuelve un error. Si el archivo existe, llama al caso de uso `UploadProjectZipUseCase`, pasándole tres datos principales:

- el `projectId`, que viene de los parámetros de la URL;
- el `ownerId` o `userId`, que viene del token JWT;
- el `zipBuffer`, que es el contenido del ZIP guardado en memoria por `multer`.

El caso de uso `UploadProjectZipUseCase` es el encargado de coordinar todo el proceso de subida y sincronización del ZIP.

### Validación del proyecto

Lo primero que hace el caso de uso es comprobar que el proyecto existe y pertenece al usuario autenticado.

Para ello, consulta el repositorio de proyectos usando el `projectId` y el `ownerId`.

Esta comprobación es importante por seguridad. No basta con que el proyecto exista; también tiene que pertenecer al usuario que está haciendo la petición.

Si el proyecto no existe o pertenece a otro usuario, se devuelve un error de proyecto no encontrado y el proceso se detiene.

### Extracción y filtrado de archivos del ZIP

Una vez comprobado el proyecto, el caso de uso utiliza el puerto `ZipExtractor` para extraer los archivos del ZIP.

La implementación concreta de ese puerto es `AdmZipExtractor`, que recibe el buffer del ZIP y devuelve una lista de archivos extraídos con su `path` y su `content`.

Después de extraer los archivos, DevMind filtra aquellos que no interesa guardar ni analizar.

Por ejemplo, se ignoran carpetas como:

- `node_modules`
- `.git`
- `dist`
- `build`
- `coverage`
- `.next`
- `docs`

También se ignoran archivos no textuales o binarios, como imágenes, vídeos, fuentes, bases de datos, ZIPs internos, PDFs, etc.

Además, se descartan archivos que contengan bytes nulos, porque eso suele indicar que el archivo es binario y no texto limpio compatible con PostgreSQL.

Por último, también se ignoran archivos de documentación en formato Markdown, como:

- `.md`
- `.mdx`

Esto se hizo para que, de momento, DevMind se centre más en código fuente real y no base sus respuestas principalmente en documentación.

### Sincronización por path + hash

Después de extraer y filtrar los archivos válidos del ZIP, DevMind no borra todo y vuelve a guardar todo desde cero. En su lugar, realiza una sincronización usando el `path` y el `hash` de cada archivo.

El `path` sirve para identificar si un archivo ya existía previamente en el proyecto.

El `hash` sirve para saber si el contenido de ese archivo ha cambiado.

El flujo de sincronización funciona así:

1. El caso de uso busca en el repositorio todos los archivos que ya existían para ese proyecto.
2. Ordena o agrupa esos archivos existentes por `path`, para poder encontrarlos rápidamente.
3. Inicializa varios arrays para clasificar los cambios:
   - archivos creados;
   - archivos actualizados;
   - archivos eliminados;
   - archivos sin cambios.
4. Recorre todos los archivos válidos extraídos del nuevo ZIP.
5. Para cada archivo extraído, comprueba si ya existía otro archivo con el mismo `path`.

Si el archivo no existía antes, DevMind lo considera un archivo nuevo. Entonces crea un nuevo `ProjectFile`, calcula sus datos necesarios, lo guarda en el repositorio y lo añade al array de archivos creados.

Si el archivo ya existía y el `hash` es el mismo, significa que el contenido no ha cambiado. En ese caso, DevMind no actualiza el archivo y lo añade al array de archivos sin cambios.

Si el archivo ya existía pero el `hash` es distinto, significa que el contenido ha cambiado. En ese caso, DevMind actualiza el archivo en el repositorio y lo añade al array de archivos actualizados.

### Detección de archivos eliminados

Además de crear y actualizar archivos, DevMind también detecta archivos eliminados.

Para ello, crea un conjunto con todos los `path` que vienen en el nuevo ZIP.

Después recorre los archivos que ya existían previamente en el repositorio. Si alguno de esos archivos existentes tiene un `path` que ya no aparece en el nuevo ZIP, significa que ese archivo ha sido eliminado del proyecto.

En ese caso, DevMind lo borra del repositorio y lo añade al array de archivos eliminados.

Gracias a este proceso, cuando se vuelve a subir un ZIP actualizado del mismo proyecto, la base de datos queda sincronizada con el contenido real del ZIP.

### Qué ocurre si un archivo se mueve de carpeta

Si un archivo se mueve de una carpeta a otra, su `path` cambia.

Como DevMind identifica los archivos por su `path`, interpreta ese movimiento como dos operaciones:

1. El archivo con el path antiguo ya no aparece en el ZIP, así que se considera eliminado.
2. El archivo con el path nuevo no existía antes, así que se considera creado.

Por tanto, un movimiento de archivo se interpreta como:

delete + create

Esto simplifica la sincronización, porque DevMind no necesita detectar movimientos explícitos entre carpetas.

### Respuesta de la subida ZIP

Una vez terminado el proceso de sincronización, el caso de uso devuelve un resumen con los cambios realizados.

La respuesta incluye información como:

- cuántos archivos se han creado;
- cuántos archivos se han actualizado;
- cuántos archivos se han eliminado;
- cuántos archivos no han cambiado.

También puede devolver arrays con los archivos clasificados en cada categoría.

De forma simplificada, la respuesta tiene una estructura parecida a esta:

{
  "projectId": "project-1",
  "summary": {
    "created": 2,
    "updated": 1,
    "deleted": 1,
    "unchanged": 5
  },
  "files": {
    "created": [],
    "updated": [],
    "deleted": [],
    "unchanged": []
  }
}

### Seguridad en creación de archivos y subida de ZIP

La seguridad en DevMind se basa en que todas las operaciones sobre proyectos y archivos están asociadas al usuario autenticado.

Un usuario no puede crear archivos ni subir ZIPs en proyectos de otros usuarios, aunque conozca el `projectId`, porque DevMind nunca confía únicamente en el identificador del proyecto recibido por la URL.

#### De dónde sale el usuario autenticado

Cuando el usuario hace login, DevMind le devuelve un token JWT. A partir de ese momento, en las rutas protegidas, el frontend debe enviar ese token en el header:

Authorization: Bearer TOKEN

Antes de llegar al controlador, la petición pasa por `authMiddleware`.

Este middleware se encarga de:

1. Comprobar que existe el header `Authorization`.
2. Verificar que el token JWT es válido.
3. Decodificar el token.
4. Extraer los datos del usuario, como el `userId`.
5. Añadir esa información a la request, normalmente en `req.user`.

De esta forma, los casos de uso no reciben el usuario desde el body ni desde los parámetros de la URL. El usuario autenticado siempre viene del token validado por el backend.

Esto es importante porque el cliente no puede decidir libremente qué usuario es. El backend lo obtiene del JWT.

---

### Relación con chunks e indexación

Dentro de este mismo flujo también se conectan otras partes importantes del sistema, como la generación de chunks y la indexación posterior.

Cuando un archivo es creado o actualizado, DevMind genera o regenera sus `CodeChunks`.

Después, si ha habido cambios relevantes en el ZIP, se programa la indexación automática en segundo plano para generar embeddings de esos chunks.

Esta parte pertenece al flujo de chunks, embeddings e indexación, por lo que se explica con más detalle en los siguientes apartados.

## 8. Generación de chunks

La generación de chunks forma parte del flujo de subida y sincronización de un ZIP.

Cuando un usuario sube un ZIP, el caso de uso `UploadProjectZipUseCase` extrae los archivos válidos y los compara con los archivos que ya existían en el proyecto usando sincronización por `path` y `hash`.

Durante esa sincronización, pueden ocurrir tres casos importantes:

1. Si el archivo es nuevo, DevMind crea un nuevo `ProjectFile` y después genera sus chunks.
2. Si el archivo ya existía pero su contenido ha cambiado, DevMind actualiza el `ProjectFile` y después regenera sus chunks.
3. Si el archivo ya no aparece en el nuevo ZIP, DevMind elimina el `ProjectFile`.

En el caso de archivos eliminados, no hace falta borrar los chunks manualmente desde el caso de uso de subida del ZIP, porque la base de datos está configurada con relaciones `ON DELETE CASCADE`. Esto significa que si se borra un `ProjectFile`, PostgreSQL borra automáticamente los `CodeChunks` relacionados con ese archivo.

---

### Por qué se generan chunks

DevMind no trabaja directamente con archivos completos para el RAG, sino que divide el contenido de cada archivo en fragmentos más pequeños llamados `CodeChunks`.

Esto se hace porque un archivo completo puede ser demasiado grande o contener muchas partes distintas. Al dividirlo en chunks, DevMind puede buscar después las partes concretas del código que son más relevantes para una pregunta del usuario.

Por ejemplo, si un archivo tiene muchas funciones, puede que solo una parte del archivo sea útil para responder una pregunta. Gracias a los chunks, DevMind puede recuperar únicamente esa parte relevante.

---

### Caso de uso de generación de chunks

La generación de chunks se realiza mediante el caso de uso `GenerateCodeChunksForProjectFileUseCase`.

Este caso de uso recibe un `ProjectFile` y se encarga de generar los `CodeChunks` asociados a ese archivo.

Lo primero que hace es borrar los chunks que ya existían para ese `projectFileId`.

Esto es importante por dos motivos:

- Si el archivo es nuevo, no habrá chunks anteriores, así que no se borrará nada.
- Si el archivo ya existía y ha sido actualizado, los chunks antiguos ya no representan el contenido actual del archivo, por lo que deben eliminarse antes de generar los nuevos.

Después de borrar los chunks anteriores, el caso de uso utiliza un componente encargado de dividir el contenido del archivo en fragmentos. En DevMind, esta implementación es `LineCodeChunker`.

---

### Funcionamiento de LineCodeChunker

`LineCodeChunker` divide el contenido del archivo por líneas.

Recibe el contenido completo del archivo y devuelve una lista de fragmentos. Cada fragmento contiene:

- el contenido del chunk;
- la línea inicial;
- la línea final;
- el índice del chunk dentro del archivo.

Esto permite que después DevMind pueda saber de qué parte exacta del archivo viene cada fragmento.

Por ejemplo, un chunk puede representar las líneas 1 a 80 de un archivo, y otro chunk puede representar las líneas 71 a 150 si existe solapamiento entre chunks.

---

### Qué es el overlap

El `overlap` es un pequeño solapamiento entre chunks consecutivos.

Sirve para evitar que una parte importante del código quede cortada justo entre dos chunks.

Por ejemplo, si un chunk termina en la línea 80 y el siguiente empieza en la línea 81, podría partirse una función o una explicación importante. Con overlap, el siguiente chunk puede empezar unas líneas antes, por ejemplo en la línea 71.

Así, parte del contexto se repite entre chunks y se reduce el riesgo de perder información importante.

---

### Creación de CodeChunks

Una vez que `LineCodeChunker` devuelve los fragmentos, el caso de uso recorre esa lista y crea entidades `CodeChunk`.

Cada `CodeChunk` contiene información como:

- `id`: identificador del chunk;
- `projectId`: proyecto al que pertenece;
- `projectFileId`: archivo del que viene;
- `content`: contenido del fragmento;
- `startLine`: línea inicial;
- `endLine`: línea final;
- `index`: posición del chunk dentro del archivo;
- `createdAt`: fecha de creación.

Después, todos esos chunks se guardan en el repositorio de chunks.

---

### Relación con embeddings

Es importante destacar que, después de la Fase 10, la generación de chunks ya no genera embeddings directamente.

Antes, al generar chunks también se generaban embeddings en el mismo flujo. Esto podía provocar problemas con proyectos grandes, porque la subida del ZIP quedaba bloqueada mientras se hacían muchas llamadas a Gemini.

Por tanto, GenerateCodeChunksForProjectFileUseCase solo se encarga de generar y guardar chunks. La generación de embeddings se realiza después mediante el flujo de indexación.

Ahora el flujo está separado:

```txt
Subida ZIP
↓
ProjectFiles
↓
CodeChunks
↓
respuesta rápida al frontend
↓
indexación automática en segundo plano
↓
embeddings
```

# 9. Embeddings, pgvector e indexación asíncrona

Un embedding es una representación numérica de un texto. En DevMind, se genera un embedding a partir del contenido de cada `CodeChunk`.

Es decir, cada chunk de código se transforma en un vector de números. Ese vector intenta representar el significado del contenido del chunk para que después se puedan hacer búsquedas por similitud.

Por ejemplo:

```txt
CodeChunk
↓
contenido del chunk
↓
modelo de embeddings
↓
vector de números
```

Estos embeddings se guardan en PostgreSQL usando la extensión `pgvector`.

`pgvector` no es una base de datos distinta, sino una extensión de PostgreSQL que permite almacenar vectores y hacer búsquedas de similitud entre ellos. Gracias a esto, DevMind puede guardar los embeddings en la misma base de datos donde guarda usuarios, proyectos, archivos y chunks.

La tabla encargada de guardar los embeddings es `code_chunk_embeddings`.

Cada embedding está relacionado con:

- un proyecto, mediante `projectId`;
- un chunk concreto, mediante `codeChunkId`;
- el vector numérico generado para ese chunk.

---

## Por qué se separó la indexación de la subida del ZIP

Al principio, la generación de embeddings estaba más unida al flujo de subida del ZIP. El problema es que, si un proyecto tenía muchos archivos y muchos chunks, DevMind tenía que hacer muchas llamadas seguidas al modelo de embeddings.

Esto podía provocar varios problemas:

- la petición de subida del ZIP tardaba demasiado;
- el usuario tenía que esperar mucho tiempo;
- podían aparecer errores de cuota o rate limit en Gemini;
- la API podía bloquearse mientras generaba todos los embeddings.

Por eso, en la Fase 10 se separó el flujo en dos partes:

```txt
Subida ZIP
↓
guardar ProjectFiles
↓
generar CodeChunks
↓
responder rápido al frontend
↓
indexar embeddings en segundo plano
```

De esta forma, la subida del ZIP termina antes y la generación de embeddings se hace en background.

---

## Cuándo se lanza la indexación

Cuando termina el caso de uso `UploadProjectZipUseCase`, DevMind comprueba si ha habido cambios relevantes en el proyecto.

Para ello, revisa si hay archivos:

- creados;
- actualizados;
- eliminados.

Si alguno de estos arrays tiene elementos, significa que el contenido del proyecto ha cambiado y, por tanto, merece la pena volver a indexar.

La idea es algo parecido a:

```txt
createdFiles.length > 0
updatedFiles.length > 0
deletedFiles.length > 0
```

Si hay cambios, el caso de uso llama al scheduler de indexación.

Este scheduler recibe:

- el `projectId`;
- el `ownerId`  del usuario autenticado.

El scheduler no se espera con `await` desde la subida del ZIP. Su método devuelve `void`, porque su responsabilidad no es devolver los embeddings, sino lanzar el proceso de indexación en segundo plano.

Gracias a esto, el endpoint de subida del ZIP puede responder al frontend sin esperar a que todos los embeddings estén generados.

---

## AsyncProjectIndexingScheduler

La implementación real del scheduler es `AsyncProjectIndexingScheduler`.

Este adaptador se encarga de llamar al caso de uso `IndexProjectEmbeddingsUseCase` en segundo plano.

El flujo es:

```txt
UploadProjectZipUseCase
↓
ProjectIndexingScheduler.schedule(...)
↓
AsyncProjectIndexingScheduler
↓
IndexProjectEmbeddingsUseCase
```

El scheduler llama al caso de uso de indexación, pero no bloquea la respuesta de la subida del ZIP.

Además, si ocurre un error durante la indexación, el scheduler lo captura y lo muestra por consola, evitando que el error rompa directamente la petición HTTP original.

---

## IndexProjectEmbeddingsUseCase

El caso de uso `IndexProjectEmbeddingsUseCase` es el encargado de generar los embeddings de todos los chunks de un proyecto.

Recibe como entrada:

- `projectId`;
- `ownerId`.

Lo primero que hace es comprobar que el proyecto existe y pertenece al usuario autenticado. Esta comprobación mantiene la misma seguridad que en el resto del sistema: un usuario no puede indexar proyectos ajenos.

Después, busca todos los `CodeChunks` asociados a ese proyecto.

Una vez que tiene los chunks, comprueba si ya existe un registro de indexación para ese proyecto en la tabla `project_indexing_jobs`.

Si no existe, crea un nuevo job de indexación.

Si ya existe, reutiliza ese job y lo reinicia para una nueva indexación.

El job se marca con estado `processing` y se inicializan los contadores:

- `totalChunks`;
- `processedChunks`;
- `failedChunks`;
- `status`.

---

## Generación y guardado de embeddings

Después, el caso de uso recorre todos los chunks del proyecto.

Por cada chunk:

1. Llama al caso de uso `GenerateEmbeddingForCodeChunkUseCase`.
2. Este caso de uso usa el puerto `EmbeddingGenerator`.
3. La implementación real del puerto es `GenkitEmbeddingGenerator`.
4. `GenkitEmbeddingGenerator` llama al modelo de embeddings de Gemini.
5. Se obtiene un vector numérico.
6. Ese vector se guarda en la tabla `code_chunk_embeddings`.

Después de procesar cada chunk, DevMind actualiza el registro de `project_indexing_jobs`.

Por eso el frontend puede consultar el progreso de la indexación mediante:

```txt
GET /projects/:id/indexing-status
```

Ese endpoint permite saber cuántos chunks hay en total, cuántos se han procesado y qué porcentaje de progreso lleva la indexación.

---

## Estados de la indexación

La tabla `project_indexing_jobs` permite saber en qué estado está el proceso de indexación.

Los estados principales son:

- `pending`: todavía no se ha iniciado la indexación.
- `processing`: la indexación está en curso.
- `completed`: la indexación ha terminado correctamente.
- `failed`: la indexación ha fallado.

Mientras el proceso avanza, se actualizan campos como:

- `totalChunks`;
- `processedChunks`;
- `failedChunks`;
- `errorMessage`;
- `updatedAt`.

Cuando todos los chunks se han procesado correctamente, el job se marca como `completed`.

Esto confirma que los embeddings del proyecto ya han sido generados y guardados.

---

## Qué ocurre si se resube un ZIP actualizado

Si el usuario vuelve a subir un ZIP actualizado del mismo proyecto, DevMind vuelve a hacer la sincronización por `path` y `hash`.

Si detecta archivos nuevos, modificados o eliminados, se vuelven a generar los chunks necesarios y se programa otra indexación.

En ese caso, `IndexProjectEmbeddingsUseCase` vuelve a ejecutarse para ese proyecto.

Si el job de indexación ya existía, no se crea uno duplicado, sino que se reutiliza y se reinicia con los nuevos valores.

Además, cuando se genera un embedding para un chunk que ya tenía embedding anterior, DevMind reemplaza el embedding antiguo por el nuevo. Así se evita mantener embeddings desactualizados.

---

## Resumen del flujo completo

El flujo completo queda así:

```txt
Usuario sube ZIP
↓
UploadProjectZipUseCase
↓
extrae y filtra archivos
↓
sincroniza por path + hash
↓
crea, actualiza o elimina ProjectFiles
↓
genera o regenera CodeChunks
↓
si hay cambios, llama al scheduler
↓
AsyncProjectIndexingScheduler lanza la indexación en background
↓
IndexProjectEmbeddingsUseCase busca los chunks del proyecto
↓
GenerateEmbeddingForCodeChunkUseCase genera embeddings
↓
GenkitEmbeddingGenerator llama a Gemini
↓
los embeddings se guardan en PostgreSQL con pgvector
↓
project_indexing_jobs actualiza el progreso
↓
cuando termina, status = completed
```

En resumen, la indexación asíncrona permite que DevMind procese proyectos grandes sin bloquear la subida del ZIP. Los embeddings se generan en segundo plano, se guardan en PostgreSQL usando pgvector y el frontend puede consultar el progreso mediante el endpoint de estado de indexación.

---

## Frase clave para memorizar

```txt
DevMind separa la subida del ZIP de la generación de embeddings. Primero guarda archivos y chunks, responde rápido al usuario y después genera los embeddings en segundo plano, actualizando el estado en project_indexing_jobs.
```




## 12. Flujo RAG de preguntas

## 13. Tests y TDD

## 14. Decisiones técnicas importantes

## 15. Limitaciones actuales

## 16. Mejoras futuras


___________________________________________


Preguntas generales
¿Qué problema resuelve DevMind?
¿Por qué hiciste este proyecto?
¿Qué diferencia hay entre DevMind y preguntarle directamente a ChatGPT?
¿Por qué necesitas guardar el proyecto en base de datos?
¿Por qué usas RAG?
¿Qué es RAG explicado sencillo?
Arquitectura
¿Por qué usas arquitectura hexagonal?
¿Qué diferencia hay entre domain, application, infrastructure y transport?
¿Por qué los casos de uso no deberían depender de Express?
¿Qué es un puerto?
¿Qué es un adaptador?
¿Por qué usas repositorios?
¿Qué ventaja tiene poder cambiar InMemory por PostgreSQL?
Autenticación
¿Cómo funciona el registro?
¿Cómo funciona el login?
¿Qué contiene el JWT?
¿Por qué usas passwordHash y no guardas la contraseña?
¿Qué hace authMiddleware?
¿Por qué usas ownerId en proyectos?
Proyectos y permisos
¿Cómo evitas que un usuario acceda al proyecto de otro?
¿Por qué cuando un proyecto no es del usuario devuelves 404 y no 403?
¿Qué significa findByIdAndOwnerId?
ZIP
¿Qué pasa cuando se sube un ZIP?
¿Por qué usas multer con memoryStorage?
¿Qué hace AdmZipExtractor?
¿Por qué no guardas todos los archivos del ZIP?
¿Qué carpetas ignoras?
¿Por qué ignoras binarios?
¿Qué problema daba el byte nulo 0x00?
¿Por qué ignoras docs y markdown ahora?
Sincronización
¿Cómo sabes si un archivo es nuevo, modificado, eliminado o igual?
¿Qué papel tiene el hash?
¿Qué pasa si un archivo se mueve de carpeta?
¿Por qué un move se interpreta como delete + create?
¿Qué pasa con los chunks cuando un archivo se actualiza?
Chunks
¿Qué es un CodeChunk?
¿Por qué no haces embeddings del archivo entero?
¿Qué ventaja tiene dividir por chunks?
¿Qué significan startLine y endLine?
¿Qué es overlap?
¿Por qué guardas projectFileId en cada chunk?
Embeddings
¿Qué es un embedding?
¿Cómo se genera un embedding?
¿Dónde se guarda?
¿Por qué usas pgvector?
¿Qué significa vector(768)?
¿Qué hace findSimilarByProjectId?
¿Por qué filtras por projectId?
¿Qué pasaría si no filtrases por projectId?
Preguntas / RAG
¿Qué pasa cuando el usuario pregunta algo?
¿Por qué generas un embedding de la pregunta?
¿Cómo eliges los chunks relevantes?
¿Qué contexto se le pasa a Gemini?
¿Por qué devuelves sources?
¿Qué pasa si no hay chunks similares?
¿Qué pasa si Gemini falla?
Indexación asíncrona
¿Por qué separaste upload de embeddings?
¿Qué problema tenías con ZIPs grandes?
¿Qué es project_indexing_jobs?
¿Qué estados puede tener la indexación?
¿Qué hace IndexProjectEmbeddingsUseCase?
¿Qué hace AsyncProjectIndexingScheduler?
¿Por qué usas NoopProjectIndexingScheduler en tests?
¿Por qué añadiste delay entre chunks?
¿Por qué el delay está en .env?
Testing / TDD
¿Qué es TDD?
¿Cómo lo has aplicado?
¿Qué tipos de tests tienes?
¿Qué diferencia hay entre test unitario e integración?
¿Por qué usas fakes en tests unitarios?
¿Por qué pruebas endpoints con Supertest?
¿Qué parte del proyecto está más cubierta por tests?
Limitaciones
¿Qué limitaciones tiene DevMind ahora?
¿Qué pasa si Gemini da 429?
¿Qué pasa si Gemini da 503?
¿Qué mejorarías en el RAG?
¿Qué mejorarías en el frontend?
¿Qué harías si quisieras soportar proyectos enormes?