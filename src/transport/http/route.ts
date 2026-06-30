import { Router } from "express";
import { authRoutes } from "./auth/authRoutes";
import { projectRoutes } from "./project/projectRoutes";
import { projectFileRoutes } from "./projectFile/projectFileRoutes";

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
router.use("/projects", projectFileRoutes);
