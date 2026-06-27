import express from "express";
import cors from "cors";
import { router } from "./transport/http/route";

export const app = express();

app.use(cors());
app.use(express.json());

app.use(router);
