import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    globalSetup: ["./tests/globalSetup.ts"],
    // Los tests de integración comparten una única devmind_test_db, con limpieza
    // de tablas entre ejecuciones (ver globalSetup.ts). Correr los ficheros en
    // paralelo haría que unos test files pisaran los datos de otros.
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      // Valores dummy: infrastructure/genkit/ai.ts (GEMINI_API_KEY) e
      // infrastructure/config/env.ts (JWT_SECRET) lanzan al importarse si su
      // variable falta. Los tests no las usan de verdad (el container inyecta
      // fakes con NODE_ENV=test y el JWT se firma/verifica con este mismo
      // secreto de forma autoconsistente), pero definirlas aquí hace que la
      // suite no dependa de un .env presente (checkout limpio, CI, etc.).
      GEMINI_API_KEY: "test-dummy-gemini-key",
      JWT_SECRET: "test-dummy-jwt-secret",
    },
  },
});
