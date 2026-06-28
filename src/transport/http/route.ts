import { Router } from "express";
import { authRoutes } from "./authrutes/authRutes";

export const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "DevMind API",
    message: "API is running",
  });
});

router.use("/auth", authRoutes);
