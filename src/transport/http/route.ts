import { Router } from "express";
import { authRoutes } from "./auth/authRutes";
import { projectRoutes } from "./project/projectRoutes";

export const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "DevMind API",
    message: "API is running",
  });
});

router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
