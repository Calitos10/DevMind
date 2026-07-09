//Fichero encargado de construir la app (API) con express
//Importa y utiliza un router que se han creado para los endpoints
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { router } from "./transport/http/route";
import { errorMiddleware } from "./transport/http/middleware/errorsMiddleware";
import { env } from "./infrastructure/config/env";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.cors.origin }));
app.use(express.json());

app.use(router);
app.use(errorMiddleware);
