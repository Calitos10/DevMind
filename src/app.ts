//Fichero encargado de construir la app (API) con express
//Importa y utiliza un router que se han creado para los endpoints
import express from "express";
import cors from "cors";
import { router } from "./transport/http/route";
import { errorMiddleware } from "./transport/http/middleware/errorsMiddleware";

export const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use(router);
app.use(errorMiddleware);
