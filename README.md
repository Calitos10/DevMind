# DevMind API

DevMind es una API inteligente para equipos de desarrollo que permite indexar proyectos software y hacer preguntas en lenguaje natural sobre su código, documentación y estructura.

## Problema que resuelve

Los equipos de desarrollo pierden mucho tiempo entendiendo proyectos software existentes porque el conocimiento técnico está disperso entre código, documentación incompleta y experiencia de otros desarrolladores.

DevMind busca reducir ese tiempo convirtiendo el código y la documentación de un proyecto en una fuente consultable mediante lenguaje natural.

## Arquitectura

El proyecto sigue una arquitectura inspirada en Clean Architecture / Hexagonal Architecture.

Capas principales:

- `domain`: entidades y reglas de negocio.
- `application`: casos de uso.
- `infrastructure`: herramientas externas como base de datos, Genkit, JWT o filesystem.
- `transport`: entrada HTTP mediante Express.
- `shared`: errores, tipos y utilidades comunes.

## Stack inicial

- Node.js
- TypeScript
- Express
- Vitest
- Supertest

## Scripts

```bash
npm run dev
npm run build
npm start
npm run typecheck
npm test
npm run test:watch
```

## Endpoint inicial

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

## Fase actual

Fase 0 — Preparación del proyecto.

Objetivo:

- Crear API base.
- Configurar TypeScript.
- Crear estructura Clean Architecture.
- Crear primer test de integración.
- Implementar endpoint `/health`.
