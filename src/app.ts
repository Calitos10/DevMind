//Fichero encargado de construir la app (API) con express
//Importa y utiliza un router que se han creado para los endpoints
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { router } from "./transport/http/route";
import { errorMiddleware } from "./transport/http/middleware/errorsMiddleware";
import { env } from "./infrastructure/config/env";

export const app = express();

// En producción la API corre detrás de un proxy inverso (Railway/Render), que
// añade la cabecera X-Forwarded-For con la IP real del cliente. Sin esta línea,
// express-rate-limit vería siempre la IP del proxy y limitaría a todos los
// visitantes como si fueran uno solo. Confiamos en el primer salto de proxy.
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.cors.origin }));
app.use(express.json());

app.use(router);
app.use(errorMiddleware);
