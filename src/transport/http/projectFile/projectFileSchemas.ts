import { z } from "zod";

export const projectFileSchema = z.object({
  path: z.string().min(1, "Path is required"),
  language: z.string().min(1, "Language is required"),
  content: z.string(),
});