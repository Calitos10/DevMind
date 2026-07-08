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
    },
  },
});
