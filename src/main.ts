//Es el fichero encargado de importar la app de express y levantar el servidor con ella.
import { app } from "./app";
import { env } from "./infrastructure/config/env";

app.listen(Number(env.port), () => {
  console.log(`DevMind API running on port ${env.port}`);
});
