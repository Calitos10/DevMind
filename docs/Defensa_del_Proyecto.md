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

## 9. Embeddings, pgvector e indexación asíncrona

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

### Por qué se separó la indexación de la subida del ZIP

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

### Cuándo se lanza la indexación

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

### AsyncProjectIndexingScheduler

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

### IndexProjectEmbeddingsUseCase

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

### Generación y guardado de embeddings

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

### Estados de la indexación

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

### Qué ocurre si se resube un ZIP actualizado

Si el usuario vuelve a subir un ZIP actualizado del mismo proyecto, DevMind vuelve a hacer la sincronización por `path` y `hash`.

Si detecta archivos nuevos, modificados o eliminados, se vuelven a generar los chunks necesarios y se programa otra indexación.

En ese caso, `IndexProjectEmbeddingsUseCase` vuelve a ejecutarse para ese proyecto.

Si el job de indexación ya existía, no se crea uno duplicado, sino que se reutiliza y se reinicia con los nuevos valores.

Además, cuando se genera un embedding para un chunk que ya tenía embedding anterior, DevMind reemplaza el embedding antiguo por el nuevo. Así se evita mantener embeddings desactualizados.

---

### Resumen del flujo completo

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

```txt
DevMind separa la subida del ZIP de la generación de embeddings. Primero guarda archivos y chunks, responde rápido al usuario y después genera los embeddings en segundo plano, actualizando el estado en project_indexing_jobs.
```


# 10. Flujo RAG de preguntas

Una vez que el usuario ha subido un ZIP, DevMind ha creado los `ProjectFiles`, ha generado los `CodeChunks` y ha indexado sus embeddings en PostgreSQL con pgvector, el usuario puede realizar preguntas en lenguaje natural sobre el código del proyecto.

El flujo de preguntas se realiza mediante el endpoint:

```txt
POST /projects/:id/ask
```

En este endpoint, `:id` representa el identificador del proyecto sobre el que se quiere preguntar.

---

## Entrada de la petición

El usuario escribe una pregunta en el frontend. Esa pregunta se envía al backend en el body de la petición.

La petición pasa primero por `authMiddleware`, que comprueba que el usuario haya enviado un token JWT válido. Si el token es correcto, el middleware extrae el `userId` del usuario autenticado y lo añade a la request.

Después, la petición pasa por el middleware de validación del body. Este middleware utiliza Zod para comprobar que la pregunta existe y que tiene un formato válido.

Una vez superados los middlewares, la petición llega al método `ask` del `ProjectController`.

---

## Llamada al caso de uso

El método `ask` del controlador recoge tres datos principales:

- el `projectId`, que viene de los parámetros de la URL;
- el `userId`, que viene del token JWT validado por `authMiddleware`;
- la `question`, que viene en el body de la petición.

Con esos datos llama al caso de uso encargado de responder preguntas sobre un proyecto, `AskProjectQuestionUseCase`.

Este caso de uso coordina todo el flujo RAG.

---

## Validación del proyecto

Lo primero que hace el caso de uso es comprobar que la pregunta no esté vacía.

Después comprueba que el proyecto existe y pertenece al usuario autenticado. Para ello busca el proyecto usando el `projectId` y el `ownerId`.

Esta comprobación es importante porque evita que un usuario pueda hacer preguntas sobre proyectos que no le pertenecen, aunque conozca su identificador.

Si el proyecto no existe o no pertenece al usuario autenticado, DevMind devuelve un error de proyecto no encontrado.

---

## Conversión de la pregunta en embedding

Una vez validado el proyecto, DevMind convierte la pregunta del usuario en un embedding.

Para ello utiliza el puerto `EmbeddingGenerator`, cuya implementación real es `GenkitEmbeddingGenerator`.

El objetivo de este paso es transformar la pregunta en un vector numérico, igual que se hizo previamente con los chunks del código.

El flujo es:

```txt
pregunta del usuario
↓
EmbeddingGenerator
↓
embedding de la pregunta
```

Esto permite comparar la pregunta con los embeddings de los chunks guardados en PostgreSQL.

---

## Búsqueda de chunks similares con pgvector

Cuando DevMind ya tiene la pregunta transformada en embedding, utiliza el repositorio de embeddings para buscar los chunks más parecidos dentro del proyecto.

Para ello llama a un método como:

```txt
findSimilarByProjectId
```

Este método recibe:

- el `projectId`;
- el embedding de la pregunta;
- un límite de resultados.

El `projectId` es fundamental, porque la búsqueda debe limitarse únicamente a los chunks del proyecto sobre el que el usuario está preguntando.

Si no se filtrase por `projectId`, podrían mezclarse chunks de otros proyectos o incluso de otros usuarios, lo cual sería un problema grave de seguridad y de calidad de respuesta.

Internamente, PostgreSQL con pgvector compara el embedding de la pregunta con los embeddings guardados en la tabla `code_chunk_embeddings`.

El resultado es una lista de chunks ordenados por similitud. Es decir, DevMind recupera los fragmentos de código que parecen más relevantes para responder a la pregunta del usuario.

---

## Generación de la respuesta con contexto

Una vez encontrados los chunks más similares, DevMind usa esos chunks como contexto para generar la respuesta.

El caso de uso llama al puerto `AnswerGenerator`, cuya implementación real es `GenkitAnswerGenerator`.

A este generador se le pasan dos cosas:

- la pregunta original del usuario;
- los chunks de código recuperados como contexto.

Es importante destacar que al modelo de respuesta se le pasa la pregunta en texto normal, no la pregunta en formato embedding. El embedding solo se utiliza para buscar los chunks relevantes.

Después, `GenkitAnswerGenerator` construye un prompt que incluye:

- instrucciones para el modelo;
- la pregunta del usuario;
- los fragmentos de código relevantes;
- información de fuente, como archivo y líneas.

Ese prompt se envía a Genkit, que llama al modelo de IA configurado para generar la respuesta final.

---

## Respuesta al frontend

Finalmente, DevMind devuelve al frontend una respuesta con:

- la respuesta generada por la IA;
- las fuentes utilizadas para responder.

Las fuentes son importantes porque permiten saber de qué archivos y líneas ha salido la información usada para construir la respuesta.

De forma simplificada, la respuesta puede contener:

```json
{
  "answer": "Respuesta generada por la IA...",
  "sources": [
    {
      "path": "src/application/auth/registerUserUseCase.ts",
      "startLine": 1,
      "endLine": 40
    }
  ]
}
```

Esto hace que DevMind no sea solo un chat genérico, sino un asistente que responde basándose en partes concretas del proyecto.

---

## Qué pasa si no hay contexto suficiente

Si DevMind no encuentra chunks relevantes para responder la pregunta, no debería inventar una respuesta.

En ese caso, puede devolver un mensaje indicando que no tiene suficiente información del proyecto para responder.

Esto es importante porque una de las ideas del RAG es que el modelo responda usando el contexto recuperado, no inventando información que no está en el proyecto.

---

## Resumen del flujo RAG

El flujo completo de preguntas queda así:

```txt
Usuario hace una pregunta
↓
POST /projects/:id/ask
↓
authMiddleware valida el JWT
↓
validateBody valida la pregunta
↓
ProjectController.ask
↓
AskProjectQuestionUseCase
↓
comprueba que el proyecto pertenece al usuario
↓
genera embedding de la pregunta
↓
busca chunks similares en PostgreSQL con pgvector
↓
pasa pregunta + chunks al AnswerGenerator
↓
Genkit genera la respuesta final
↓
DevMind devuelve answer + sources
```

En resumen, DevMind usa RAG para no enviar todo el proyecto completo a la IA. Primero busca los fragmentos de código más relevantes mediante embeddings y pgvector, y después usa solo esos fragmentos como contexto para generar una respuesta más precisa y basada en el proyecto.

---


```txt
En el flujo RAG, DevMind convierte la pregunta en un embedding, busca en pgvector los chunks más similares del proyecto y usa esos chunks como contexto para que la IA genere una respuesta con fuentes.
```

Otra frase importante:

```txt
El embedding de la pregunta solo se usa para recuperar contexto. La respuesta final se genera con la pregunta original en texto y los chunks recuperados.
```


# 11. Tests y TDD

DevMind se ha desarrollado siguiendo **TDD (Test-Driven Development)**. La idea de TDD es escribir primero el test y después el código que lo hace pasar, en un ciclo de tres pasos:

```txt
1. Red    → escribir un test que falla (todavía no existe la funcionalidad).
2. Green  → escribir el código mínimo para que ese test pase.
3. Refactor → limpiar el código manteniendo los tests en verde.
```

Trabajar así tiene dos ventajas que se notan en el proyecto: el código nace ya pensado para ser testeable (por eso encaja tan bien con la arquitectura hexagonal y los puertos), y cada funcionalidad queda cubierta por un test desde el primer momento, lo que permite refactorizar con red de seguridad.

En total, el proyecto tiene **142 tests repartidos en 36 archivos** (31 de tests unitarios y 5 de integración), todos en verde.

## Tipos de tests

En DevMind se distinguen dos tipos de tests, con propósitos distintos:

- **Tests unitarios**: prueban una pieza aislada (un caso de uso o un adaptador) sin depender de nada externo. Son rápidos y deterministas.
- **Tests de integración**: prueban el sistema de punta a punta, lanzando peticiones HTTP reales contra la aplicación Express y usando una base de datos PostgreSQL real de test.

## Tests unitarios y uso de fakes

Los tests unitarios de la capa de aplicación (casos de uso) no usan la base de datos ni servicios externos. En su lugar usan **fakes**: implementaciones falsas y en memoria de los puertos del dominio. Esto es posible precisamente porque los casos de uso dependen de interfaces (`ProjectRepository`, `EmbeddingGenerator`, `TokenService`…) y no de implementaciones concretas.

Los fakes viven en `tests/fakes/` y están compartidos entre los distintos tests para evitar duplicación:

```txt
fakeUserRepository.ts               fakeCodeChunkRepository.ts
fakeProjectRepository.ts            fakeCodeChunkEmbeddingRepository.ts
fakeProjectFileRepository.ts        fakeEmbeddingGenerator.ts
fakePasswordHasher.ts               fakeIdGenerator.ts
fakeTokenService.ts                 fakeSequentialIdGenerator.ts
```

Por ejemplo, `LoginUserUseCase` se puede testear con un `FakeUserRepository` (con un usuario en memoria), un `FakePasswordHasher` y un `FakeTokenService`, comprobando toda la lógica de login sin tocar PostgreSQL ni generar un JWT real. La consolidación de estos fakes compartidos se hizo en la Fase 11.3, corrigiendo además un bug de tipado que arrastraba un fake local.

Además de los casos de uso, también hay tests unitarios de los **adaptadores de infraestructura** (bcrypt, JWT, generador de ids, y los repositorios de PostgreSQL), que sí comprueban el comportamiento real de cada tecnología.

## Tests de integración

Los tests de integración usan **Supertest** para lanzar peticiones HTTP reales contra la app (`request(app).post("/auth/login")...`) y una base de datos PostgreSQL de test (`devmind_test_db`). Cubren los flujos completos: autenticación, proyectos, archivos, subida de ZIP, indexación y preguntas (RAG).

La preparación del entorno de test se hace en `tests/globalSetup.ts`, que antes de la suite ejecuta todas las migraciones y limpia las tablas. Un detalle importante de seguridad: ese setup **se niega a truncar la base de datos si no es `devmind_test_db`**, para no borrar por accidente datos de desarrollo.

```txt
if (!connectionString.includes("devmind_test_db")) {
  throw new Error("Tests must run against devmind_test_db. Refusing to truncate another database.");
}
```

## Dobles de test en el container (tests herméticos)

Un problema que se resolvió en la Fase 11 es que algunos tests de integración (indexación y preguntas) llamaban a la **API real de Gemini**, lo que hacía la suite lenta y dependiente de la red y la cuota. Para evitarlo, el `container` sustituye en entorno de test las implementaciones que hablan con el exterior:

```txt
answerGenerator    → TestAnswerGenerator          (respuesta fija, sin llamar a Gemini)
scheduler          → NoopProjectIndexingScheduler (no lanza indexación de fondo)
embeddingGenerator → TestEmbeddingGenerator        (vector determinista de 768, sin red)
```

Gracias a esto, toda la suite es **hermética**: se ejecuta sin conexión a Internet, sin consumir cuota de Gemini y con resultados reproducibles.

## Casos de seguridad y casos límite cubiertos

Los tests no solo comprueban el "camino feliz". También verifican explícitamente:

- **Aislamiento entre usuarios**: un usuario que intenta acceder, indexar, subir o preguntar sobre un proyecto de otro recibe un `404` (probado en integración para proyectos, archivos, `/index`, `/indexing-status` y `/ask`).
- **Autenticación**: las rutas protegidas devuelven `401` sin token.
- **Validación**: body inválido o pregunta vacía devuelven `400`.
- **Casos límite del RAG**: proyecto sin indexar todavía devuelve la respuesta de fallback con fuentes vacías.

# 12. Decisiones técnicas importantes

A lo largo del proyecto se han tomado varias decisiones de diseño de forma consciente. Aquí se recogen las más relevantes, con su motivo y la alternativa que se descartó.

## Arquitectura hexagonal (puertos y adaptadores)

La decisión más transversal del proyecto. El dominio y los casos de uso dependen de **interfaces (puertos)**, no de tecnologías concretas, y la infraestructura proporciona los **adaptadores** que las implementan. Se eligió así para mantener la lógica de negocio desacoplada de Express, PostgreSQL, Genkit o JWT, y para poder testear con fakes. La alternativa —meter la lógica directamente en los controladores o en los repositorios— habría sido más rápida de escribir al principio, pero mucho más difícil de testear y de mantener.

## Inyección de dependencias con un container manual

Todas las piezas se ensamblan en un único `container`, que decide qué implementación concreta se inyecta en cada caso de uso. Se optó por un container **hecho a mano** en lugar de un framework de inyección de dependencias (como NestJS o tsyringe) para mantener el proyecto ligero y explícito: se ve de un vistazo qué depende de qué. El mismo container es el que sustituye implementaciones reales por dobles en entorno de test.

## Repositorios intercambiables (InMemory ↔ PostgreSQL)

Cada repositorio tiene una implementación en memoria y otra en PostgreSQL, ambas cumpliendo la misma interfaz del dominio. Esto permitió empezar a desarrollar y testear la lógica sin depender de la base de datos, y cambiar a PostgreSQL después sin tocar los casos de uso. Es la demostración práctica de la ventaja de la arquitectura hexagonal.

## Autenticación stateless con JWT y contraseñas con bcrypt

El login devuelve un **JWT** firmado (HS256, con expiración) que el cliente envía en cada petición protegida. Se eligió un enfoque *stateless* (sin sesiones en servidor) por simplicidad y escalabilidad. Las contraseñas **nunca se guardan en texto plano**: se almacena solo un hash con `bcrypt`. La alternativa de guardar la contraseña directamente se descartó por motivos obvios de seguridad.

## Seguridad por `ownerId` y respuesta 404 en lugar de 403

El `userId` nunca se recibe del cliente: se extrae del JWT ya validado. Y los repositorios no buscan solo por `id`, sino por `id` + `ownerId` (`findByIdAndOwnerId`). Además, cuando un usuario pide un recurso que no le pertenece, se devuelve **404 (no encontrado)** en vez de **403 (prohibido)**. Esto es deliberado: un 403 confirmaría que ese proyecto existe (aunque sea de otro), mientras que el 404 no revela nada. Así se evita filtrar la existencia de recursos ajenos.

## Separar la generación de embeddings de la subida del ZIP

Al principio los embeddings se generaban dentro de la propia petición de subida del ZIP, lo que la bloqueaba durante mucho tiempo en proyectos grandes y podía disparar errores de cuota en Gemini. Se decidió **separar** ambas fases: la subida guarda archivos y chunks y responde rápido, y la generación de embeddings se lanza en segundo plano (indexación asíncrona), con un endpoint para consultar su progreso.

## Sincronización por `path` + `hash` en lugar de borrar y recrear

Cuando se resube un ZIP, DevMind no borra todo y vuelve a empezar. Compara cada archivo por su `path` (para saber si ya existía) y su `hash` (para saber si cambió), y clasifica en creados, actualizados, eliminados y sin cambios. Así solo se regeneran los chunks de lo que realmente ha cambiado, ahorrando trabajo. La alternativa de borrar y recrear todo era más simple pero mucho más costosa.

## pgvector dentro del mismo PostgreSQL

Los embeddings se guardan como vectores en la extensión **pgvector**, en la misma base de datos que el resto de los datos. Se descartó usar una base de datos vectorial dedicada (Pinecone, Weaviate…) para no añadir otra pieza de infraestructura: con pgvector se resuelve la búsqueda por similitud sin salir de PostgreSQL.

## Genkit como capa de abstracción de IA

Toda la comunicación con el modelo de IA (embeddings y generación de respuestas) pasa por **Genkit**, usando Gemini como proveedor. Genkit se envuelve además tras los puertos `EmbeddingGenerator` y `AnswerGenerator`, de modo que el resto del sistema no sabe qué proveedor de IA hay detrás y se podría cambiar sin tocar los casos de uso.

## Subida de ZIP en memoria y filtrado defensivo

El ZIP se recibe con **multer en memoria** (`memoryStorage`), como un `Buffer` que nunca se escribe a disco. Esto, además de ser más simple, evita de raíz ataques de *path traversal* al sistema de archivos. Sobre el contenido se aplican varios filtros: se ignoran carpetas ruidosas (`node_modules`, `.git`, `dist`…), archivos binarios (por extensión y por bytes nulos) y se limita el tamaño comprimido y descomprimido del ZIP para protegerse de *zip bombs*.

## Validación de entrada con Zod

Los datos que llegan por HTTP se validan en la capa de transporte con **Zod** y un middleware (`validateBody`) antes de llegar a los casos de uso. Así la lógica de negocio siempre recibe datos con el formato correcto, y los errores de validación se devuelven de forma uniforme como `400`.

## Umbral de relevancia en el RAG

En la búsqueda semántica no basta con recuperar los chunks "más cercanos": si ninguno es realmente relevante, DevMind responde que no tiene información en lugar de inventar. Para ello se filtra por un **umbral de distancia** configurable (`RAG_MAX_DISTANCE`). Esta decisión prioriza la honestidad de las respuestas sobre responder siempre a toda costa.

# 13. Limitaciones actuales

## La indexación de embeddings no es incremental

La generación de `CodeChunks` sí es selectiva: solo se regeneran los chunks de los archivos que se han creado o actualizado en esa subida de ZIP. Los archivos `unchanged` no se tocan.

Sin embargo, `IndexProjectEmbeddingsUseCase` no sigue esa misma lógica. Cuando se dispara la indexación, este caso de uso busca **todos** los `CodeChunks` del proyecto con `codeChunkRepository.findByProjectId(projectId)`, sin filtrar por qué archivos cambiaron en esa subida concreta. Después recorre esa lista completa y llama a `GenerateEmbeddingForCodeChunkUseCase` para cada uno, y este a su vez llama siempre al generador real de embeddings (Gemini vía Genkit) y siempre borra y vuelve a crear el embedding, sin comprobar antes si el chunk ya tenía uno vigente.

En la práctica, esto significa que si se resube un ZIP en el que solo ha cambiado un archivo (por ejemplo, 3 chunks nuevos o actualizados de un proyecto con 500 chunks en total), la indexación en segundo plano vuelve a generar embeddings para los 500 chunks, no solo para los 3 que realmente cambiaron.

Esto tiene tres consecuencias:

- Llamadas innecesarias a la API de Gemini para chunks que no han cambiado, con el coste y consumo de cuota que eso implica.
- Tiempo total de indexación mucho mayor del necesario, multiplicado además por el delay configurado entre chunks (`INDEXING_DELAY_BETWEEN_CHUNKS_MS`).
- El estado `processing`/`completed` de `project_indexing_jobs` refleja el progreso sobre todos los chunks del proyecto, no sobre los cambios reales de esa subida.

La mejora natural sería que `IndexProjectEmbeddingsUseCase` solo procesase los chunks pertenecientes a los `ProjectFile` marcados como `created`/`updated` en esa subida (esa información ya la calcula `UploadProjectZipUseCase`), o que `GenerateEmbeddingForCodeChunkUseCase` comprobara si el chunk ya tiene un embedding vigente antes de volver a llamar a Gemini.

## Faltan índices en las claves foráneas de la base de datos

En PostgreSQL, declarar una `FOREIGN KEY` **no** crea automáticamente un índice sobre esa columna (solo se indexan solas las `PRIMARY KEY` y las columnas `UNIQUE`). En las migraciones actuales, las tablas `project_files` y `code_chunks` no tienen un índice explícito sobre sus claves foráneas:

- `project_files(project_id)`
- `code_chunks(project_id)`
- `code_chunks(project_file_id)`

Justo sobre esas columnas se apoyan las consultas más frecuentes del sistema: `findByProjectId`, `deleteByProjectFileId` y el `JOIN` de la búsqueda semántica del RAG. Sin índice, PostgreSQL recorre la tabla entera (*seq scan*) en cada consulta, y ese coste crece linealmente con el tamaño total de la base de datos.

**Por qué se ha dejado como limitación consciente y no se ha implementado:** el uso previsto de DevMind en el contexto de este TFM es muy pequeño (del orden de 3 usuarios y 2 proyectos por usuario). Con ese volumen, la diferencia entre un *seq scan* y una búsqueda por índice es imperceptible, y añadir los índices no aportaría ninguna mejora observable. Se documenta aquí de forma explícita para dejar claro que es una decisión tomada con conocimiento del *trade-off*, no un descuido.

La mejora natural, si el proyecto creciera a un volumen real de datos, sería añadir una migración con `CREATE INDEX` sobre esas tres columnas. Cabe destacar que en la tabla de embeddings (`code_chunk_embeddings`) sí se crearon índices manualmente, por lo que el patrón ya está aplicado donde el rendimiento importaba desde el principio.

## El caso de uso `UploadProjectZipUseCase` concentra demasiadas responsabilidades

`UploadProjectZipUseCase` es el caso de uso más complejo del proyecto (en torno a 200 líneas) y mezcla en un único `execute` varias responsabilidades: comprobar la propiedad del proyecto, extraer el ZIP, filtrar los archivos, detectar el lenguaje, calcular el hash, sincronizar por `path` + `hash` (crear/actualizar/borrar/mantener), y programar la indexación en segundo plano.

Además, reglas que en realidad son de **dominio** viven como funciones sueltas al final del archivo del caso de uso: `detectLanguageFromPath`, `isIgnoredProjectFilePath` e `isBinaryProjectFile`. Es decir, conocimiento de negocio ("qué carpetas se ignoran", "qué se considera un archivo binario", "cómo se detecta el lenguaje a partir de la extensión") está incrustado en un caso de uso cuya función principal debería ser **orquestar**, no contener esas reglas.

A esto se suma un detalle de tipado: los casos de uso anidados (generación de chunks y de embeddings) se declaran como dependencias mediante un `type` local anónimo del estilo `{ execute(input): Promise<unknown> }`, en lugar de un puerto explícito en `application/ports`. Eso acopla de forma implícita y hace perder el tipado del resultado (`Promise<unknown>`).

**Por qué se ha dejado como limitación consciente y no se ha refactorizado:** el caso de uso funciona correctamente y está bien cubierto por tests de integración (subida y sincronización por `path` + `hash`). Un refactor de esta pieza es el cambio con más riesgo de todos los detectados, porque toca lógica central que ya está en producción, y su beneficio es sobre todo de mantenibilidad y limpieza arquitectónica, no de comportamiento. Para el alcance de este TFM se ha priorizado la estabilidad, dejándolo documentado como deuda técnica asumida de forma deliberada.

La mejora natural sería extraer las reglas de dominio a un servicio propio (por ejemplo un `ProjectFileClassifier` / `LanguageDetector`) y, opcionalmente, un `ProjectFilesSynchronizer` para el diff de sincronización, además de definir puertos explícitos para los casos de uso anidados. Así el `UploadProjectZipUseCase` quedaría como un orquestador delgado, más fácil de leer y de testear por partes.

## Chunking basado en AST (sintáctico) en lugar de por líneas

**Estado actual:** `LineCodeChunker` divide el contenido **por número de líneas** (bloques de 80 líneas con 10 de solapamiento), sin tener en cuenta la estructura del código. Esto significa que un chunk puede cortar una función o una clase por la mitad, lo que puede empeorar la calidad de la recuperación semántica: un fragmento partido representa peor "una idea completa".

**Mejora:** implementar un chunking **sintáctico** que use el AST del lenguaje (por ejemplo con `tree-sitter`) para cortar por unidades semánticas —función, clase, método— en lugar de por líneas. Los chunks resultantes serían más coherentes y mejorarían la relevancia de lo que recupera el RAG. Encaja como una **nueva implementación del puerto `CodeChunker`**, sin tocar el resto del flujo de chunks.

# 14. Mejoras futuras

## Reintentos con backoff ante fallos transitorios del proveedor de embeddings

### El problema

La generación de embeddings depende de un servicio externo (Gemini vía Genkit). Como todo servicio externo, ese proveedor puede fallar de forma **puntual y transitoria**: un `503 Service Unavailable` (servicio momentáneamente saturado o caído unos segundos) o un `429 Resource Exhausted` (se ha superado el límite de peticiones por minuto). Estos fallos no significan que la petición esté mal, sino que "ahora mismo no puedo, inténtalo de nuevo en un momento".

Actualmente, `IndexProjectEmbeddingsUseCase` tiene el bloque `try/catch` envolviendo **todo el bucle** que recorre los chunks. Esto tiene una consecuencia dura: en cuanto **un solo chunk** falla al generar su embedding, se lanza una excepción que aborta la indexación entera. El job se marca como `failed`, y todo el progreso anterior de esa ejecución se pierde. No hay ningún intento de reintentar el chunk que ha fallado antes de rendirse.

### Qué me pasó realmente (caso que motivó esta mejora)

Al subir un proyecto real, la indexación en segundo plano arrancó correctamente y empezó a generar embeddings. En el chunk número 82 de un total de 397, Gemini devolvió:

```txt
GenkitError: UNAVAILABLE: Error fetching from
https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent:
[503 Service Unavailable] The service is currently unavailable.
```

Fue un fallo transitorio: el endpoint de embeddings de Gemini estaba caído durante unos instantes. Pero como no hay reintentos, ese único 503 **tumbó la indexación completa**: el estado quedó en `failed · progreso 21% · procesados 82 · fallidos 1`. Para continuar, tuve que relanzar la indexación manualmente con `POST /projects/:id/index`, lo que **volvió a empezar desde 0** los 397 chunks (relacionado con la limitación de "indexación no incremental" del apartado 13).

Lo frustrante es que, si hubiera reintentado ese chunk una o dos veces esperando un poco, lo más probable es que el segundo intento hubiera funcionado y no se habría perdido nada.

### Cómo se soluciona: reintentos con backoff exponencial

La técnica estándar para fallos transitorios de un servicio externo es **reintentar la operación esperando cada vez un poco más** antes de rendirse. A esa espera creciente se le llama *exponential backoff*:

```txt
Intento 1 → falla 503 → espera ~1s
Intento 2 → falla 503 → espera ~2s
Intento 3 → falla 503 → espera ~4s
Intento 4 → sigue fallando → ahora sí, se da por fallido
```

La espera creciente es importante: si el proveedor está saturado, machacarlo con reintentos inmediatos solo empeora la situación; darle un margen cada vez mayor le da tiempo a recuperarse. Y solo se considera un fallo definitivo cuando el servicio está realmente caído (no un simple parpadeo).

Un matiz clave: **no todos los errores deben reintentarse**. Solo tiene sentido reintentar los **transitorios** (`503 UNAVAILABLE`, `429 RESOURCE_EXHAUSTED`). Un error "de verdad" —por ejemplo una API key inválida (`401`) o una petición malformada (`400`)— no se va a arreglar reintentando, así que debe fallar de inmediato sin gastar reintentos.

### Cómo se implementaría en el proyecto

Respetando la arquitectura hexagonal, el reintento vive en la **capa de infraestructura** (es un detalle de cómo se habla con el proveedor externo), no en los casos de uso:

```txt
1. Utilidad reutilizable de reintentos
   - Nuevo helper retryWithBackoff(fn, opciones) en infraestructura.
   - Recibe una función asíncrona y la ejecuta; si lanza un error transitorio,
     espera (backoff) y reintenta hasta agotar el número máximo de intentos.
   - Reutiliza el mismo puerto Delay que ya usa IndexProjectEmbeddingsUseCase
     para las esperas (así sigue siendo testeable sin esperas reales).

2. Aplicarlo en GenkitEmbeddingGenerator
   - src/infrastructure/genkit/genkitEmbeddingGenerator.ts envuelve la llamada
     a ai.embed(...) con retryWithBackoff.
   - Detecta si el error es transitorio (503/UNAVAILABLE, 429/RESOURCE_EXHAUSTED)
     mirando el status/code del GenkitError. Si lo es, reintenta; si no, relanza.

3. Configuración por entorno (.env)
   - EMBEDDING_MAX_RETRIES (p. ej. 3)
   - EMBEDDING_RETRY_BASE_MS (p. ej. 1000)
   - Igual que ya se hace con INDEXING_DELAY_BETWEEN_CHUNKS_MS, para poder
     ajustar el comportamiento sin tocar código.

4. Error tipado como red de seguridad (cuando se agotan los reintentos)
   - Si tras todos los reintentos el proveedor sigue caído (caída real, no un
     parpadeo), se lanza un error de dominio tipado, p. ej.
     EmbeddingProviderUnavailableError (extiende AppError, código 503), con un
     mensaje claro tipo: "Ha habido un problema con el proveedor de embeddings
     y la indexación ha fallado. Vuelve a lanzar la indexación manualmente."
   - Como IndexProjectEmbeddingsUseCase ya guarda error.message en el
     errorMessage del job, ese texto amigable quedaría reflejado en el estado.
   - En la ruta manual POST /:id/index, el errorMiddleware ya sabe manejar
     AppError, así que devolvería un 503 con ese mensaje en vez del 500 genérico.

5. Exponer errorMessage en el estado de indexación
   - getProjectIndexingStatusUseCase actualmente NO devuelve el campo
     errorMessage. Añadirlo permitiría que el frontend, cuando el estado es
     "failed", muestre el motivo y un botón de "Reintentar indexación".
```

En resumen, esta mejora tiene dos capas complementarias: los **reintentos con backoff** hacen que la mayoría de fallos transitorios (como el 503 que me ocurrió) se resuelvan solos sin perder progreso; y el **error tipado + errorMessage en el estado** cubren el caso en que el proveedor esté caído de verdad, informando al usuario con un mensaje claro en lugar de un fallo mudo. Son cambios independientes entre sí y del resto del sistema, por lo que pueden implementarse por separado.

### Cola de indexación real (workers, reintentos y persistencia)

**Estado actual:** la indexación en segundo plano se lanza con un patrón "fire-and-forget" dentro del propio proceso de la API (`AsyncProjectIndexingScheduler` hace `void useCase.execute().catch(console.error)`). Esto implica que, si el servidor se reinicia a mitad de una indexación, el trabajo se pierde; no hay reintentos automáticos; no hay control de concurrencia si llegan varias subidas a la vez; y un job puede quedarse en estado `processing` para siempre si el proceso muere.

**Mejora:** sustituir ese scheduler por una **cola persistente** con workers, reintentos y recuperación de trabajos colgados. Una opción muy natural es `pg-boss`, que usa el **propio PostgreSQL** como cola (sin añadir infraestructura nueva); otra es `BullMQ` con Redis. Lo importante es que la arquitectura ya está preparada: existe el puerto `ProjectIndexingScheduler`, así que bastaría con crear un nuevo adaptador (`QueueProjectIndexingScheduler`) e inyectarlo desde el `container`, **sin tocar ningún caso de uso**.

### Índice ANN de pgvector (HNSW) para la búsqueda semántica

**Estado actual:** la búsqueda de similitud del RAG (`embedding <-> $consulta`) hace un KNN **exacto**: recorre todos los embeddings del proyecto para ordenarlos por distancia. Es correcto y suficiente para el volumen actual, pero su coste crece linealmente con el número de embeddings.

**Mejora:** crear un índice aproximado **HNSW** (o `IVFFlat`) sobre la columna `code_chunk_embeddings.embedding`. El *trade-off* es claro: la búsqueda pasa a ser **aproximada** (una precisión ligeramente menor) a cambio de una velocidad mucho mayor cuando hay muchos vectores. Es la mejora de rendimiento natural del RAG si el sistema creciera a proyectos grandes o a muchos proyectos.

### Transacciones en la subida de ZIP

**Estado actual:** `UploadProjectZipUseCase` realiza muchas escrituras encadenadas (crear, actualizar y borrar `ProjectFiles` y sus `CodeChunks`) **sin envolverlas en una transacción**. Si una de esas operaciones falla a mitad del proceso, la base de datos puede quedar en un estado inconsistente: parte de los archivos sincronizados y parte no.

**Mejora:** envolver todo el proceso de sincronización en una **transacción de PostgreSQL** (`BEGIN` / `COMMIT` / `ROLLBACK`), de forma que la subida sea **atómica**: o se aplica entera o no se aplica nada. Requiere que los repositorios implicados puedan recibir un cliente o contexto de transacción compartido, en lugar de usar cada uno una conexión suelta del pool.

### Observabilidad: logs estructurados y métricas

**Estado actual:** la aplicación solo tiene `console.log` / `console.error` sueltos. No hay **logs estructurados** (JSON con nivel, timestamp y contexto de la petición), ni **métricas** (número de indexaciones, latencia de las llamadas a Gemini, tasa de fallos, etc.), ni trazas distribuidas. Esto hace difícil diagnosticar qué está pasando en un entorno real.

**Mejora:** introducir un **logger estructurado** (por ejemplo `pino`) con niveles configurables por entorno, sustituir los `console.*` por ese logger, y exponer métricas mediante Prometheus u OpenTelemetry. Con eso se podría, por ejemplo, monitorizar cuántas indexaciones fallan por errores de Gemini o cuánto tarda de media generar un embedding.


### Despliegue y CI/CD

**Estado actual:** el proyecto se ejecuta en local y solo existe un `docker-compose.yml` para levantar PostgreSQL. No hay un despliegue real de la API ni un pipeline de integración continua.

**Mejora:** contenerizar la API con un `Dockerfile`, y desplegarla en un PaaS (Railway, Render, Fly.io…) o con un `docker-compose` completo, usando una base de datos PostgreSQL gestionada y variables de entorno seguras. Además, montar un pipeline de **CI/CD** que ejecute `npm run typecheck` y `npm test` en cada push, de modo que ningún cambio que rompa los tests o el tipado llegue a la rama principal.


___________________________________________


## Preguntas generales
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