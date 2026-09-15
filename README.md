# DevMind — entiende cualquier codebase preguntándole

**Sube un proyecto en ZIP, pregunta en lenguaje natural y recibe respuestas basadas en su código, con el archivo y las líneas exactas que las justifican.**

> «¿Dónde se gestiona la autenticación?» → DevMind recupera los fragmentos relevantes, responde con contexto y cita sus fuentes.

**[Probar la aplicación](https://devmind-frontend.vercel.app)** · **[Ver presentación PDF](docs/DevMind_Slides.pdf)**

```text
1. Sube el ZIP  →  2. Indexa el código  →  3. Pregunta y verifica las fuentes
```

DevMind es la API backend construida con **TypeScript, arquitectura hexagonal y RAG** sobre código fuente.

## Qué aporta

- **Respuestas basadas en el proyecto:** recupera código relevante antes de consultar al LLM.
- **Fuentes verificables:** devuelve el archivo y el rango de líneas usados.
- **Control de alucinaciones:** descarta contexto irrelevante y admite cuando no puede responder.
- **Indexación incremental:** sincroniza archivos por ruta y hash antes de generar embeddings.
- **Modo invitado:** permite probar el flujo completo sin registro.
- **Aislamiento por usuario:** todos los recursos se consultan junto con su propietario.

## Arquitectura y flujo RAG

```mermaid
flowchart LR
    U[Usuario] -->|HTTP + JWT| API[Express API<br/>Transport]
    API --> UC[Casos de uso<br/>Application]

    subgraph IDX[1. Indexación]
        ZIP[Proyecto ZIP] --> EXT[Extraer y filtrar]
        EXT --> CHUNK[Crear chunks]
        CHUNK --> EMB1[Generar embeddings]
    end

    subgraph ASK[2. Consulta]
        Q[Pregunta] --> EMB2[Embedding de la pregunta]
        EMB2 --> SEARCH[Búsqueda semántica]
        SEARCH --> LLM[Respuesta con contexto]
        LLM --> OUT[Respuesta + fuentes]
    end

    UC --> ZIP
    UC --> Q
    EMB1 -->|Gemini| DB[(PostgreSQL<br/>+ pgvector)]
    SEARCH <-->|5 chunks más cercanos| DB
    OUT --> API

    ADAPTERS[Adaptadores<br/>PostgreSQL · Gemini · ZIP · JWT] -. implementan puertos .-> UC

    classDef core fill:#ede9fe,stroke:#7c3aed,color:#2e1065
    classDef storage fill:#dbeafe,stroke:#2563eb,color:#172554
    classDef output fill:#dcfce7,stroke:#16a34a,color:#14532d
    class UC core
    class DB storage
    class OUT output
```

Las dependencias apuntan hacia el núcleo: `transport → application → domain`. La infraestructura implementa los puertos que necesitan los casos de uso, por lo que Express, PostgreSQL y Gemini pueden sustituirse sin modificar la lógica de negocio.

## Stack

| Área | Tecnologías |
| ---- | ----------- |
| Backend | Node.js 20+, TypeScript, Express 5 |
| IA | Genkit, `gemini-embedding-001`, `gemini-2.5-flash` |
| Datos | PostgreSQL 16, pgvector |
| Seguridad | JWT, bcrypt, Zod, Helmet, CORS, rate limiting |
| Testing | Vitest, Supertest |
| Infraestructura | Docker Compose, Railway |

## Inicio rápido

### Requisitos

- Node.js 20 o superior.
- Docker y Docker Compose.
- Una API key de Google Gemini.

### Instalación

```bash
git clone https://github.com/Calitos10/DevMind.git
cd DevMind
npm install
cp .env.example .env
docker compose up -d
npm run migrate
npm run dev
```

Configura al menos estas variables en `.env`:

```dotenv
JWT_SECRET=replace-with-a-long-random-secret
GEMINI_API_KEY=your-gemini-api-key
DATABASE_URL=postgresql://devmind:devmind_password@localhost:5432/devmind_db
```

La API estará disponible en `http://localhost:3000`. Comprueba el arranque con:

```bash
curl http://localhost:3000/health
```

La [referencia técnica](docs/TECHNICAL_REFERENCE.md#3-instalación-y-ejecución) contiene todas las variables de entorno, comandos de Docker y una prueba completa mediante `curl`.

## API resumida

Salvo las rutas de salud y autenticación, todas requieren `Authorization: Bearer <token>`.

| Método | Ruta | Función |
| ------ | ---- | ------- |
| `GET` | `/health` | Comprueba el estado de la API |
| `POST` | `/auth/guest` | Crea una sesión temporal sin registro |
| `POST` | `/auth/register` | Registra un usuario |
| `POST` | `/auth/login` | Devuelve un token JWT |
| `POST` | `/projects` | Crea un proyecto |
| `POST` | `/projects/:id/upload` | Sube y procesa un ZIP |
| `POST` | `/projects/:id/index` | Genera los embeddings del proyecto |
| `GET` | `/projects/:id/indexing-status` | Consulta el estado de indexación |
| `POST` | `/projects/:id/ask` | Responde usando el código indexado |
| `GET` | `/projects/:id/history` | Recupera el historial del usuario registrado |

Consulta todos los endpoints, cuerpos y respuestas en la [referencia de la API](docs/TECHNICAL_REFERENCE.md#8-api-referencia-de-endpoints).

## Engineering decisions

| Decisión | Beneficio | Trade-off |
| -------- | --------- | --------- |
| **Arquitectura hexagonal** | Casos de uso independientes y fáciles de probar | Más interfaces y composición |
| **PostgreSQL + pgvector** | Datos y vectores con integridad referencial en una sola base | Menos especialización vectorial |
| **Subida e indexación separadas** | La subida no espera al proveedor de embeddings | El cliente coordina dos operaciones |
| **Umbral `RAG_MAX_DISTANCE`** | Evita responder con contexto irrelevante | Necesita calibración empírica |
| **Chunks por líneas 80/10** | Compatible con cualquier lenguaje y fuentes precisas | Menos semántico que utilizar AST |
| **Recursos ajenos devuelven `404`** | No revela si un identificador existe | No distingue ausencia de falta de acceso |

El razonamiento completo está documentado en [Engineering decisions](docs/TECHNICAL_REFERENCE.md#13-engineering-decisions).

## Calidad y seguridad

- Tests unitarios con adaptadores en memoria y tests HTTP de integración con PostgreSQL.
- Integración continua con GitHub Actions en cada push y pull request a `main`, ejecutando typecheck, tests y build.
- Validación de entrada con Zod y errores de dominio tipados.
- Hash de contraseñas con bcrypt y autenticación JWT.
- Límites específicos para autenticación, subida, indexación y preguntas.
- Protección frente a ZIP bombs, binarios y rutas no relevantes.
- Verificación de propiedad antes de acceder a proyectos y archivos.

```bash
npm test
npm run typecheck
npm run build
```

## Limitaciones principales

- La indexación se ejecuta dentro de la petición HTTP; proyectos grandes pueden provocar timeouts.
- El umbral de relevancia todavía no está calibrado con un conjunto de evaluación.
- El chunking se basa en líneas, no en unidades sintácticas.
- La limpieza de invitados debe programarse externamente.

Consulta la lista completa y los próximos pasos en [limitaciones y trabajo futuro](docs/TECHNICAL_REFERENCE.md#14-limitaciones-conocidas-y-trabajo-futuro).

## Documentación

| Recurso | Contenido |
| ------- | --------- |
| [Referencia técnica](docs/TECHNICAL_REFERENCE.md) | Instalación detallada, despliegue, estructura, API, RAG, seguridad, tests y decisiones |
| [Presentación](docs/DevMind_Slides.pdf) | Diapositivas del proyecto |
| [Frontend](https://github.com/Calitos10/Devmind-Frontend) | Repositorio de la interfaz web |

## Licencia

ISC
