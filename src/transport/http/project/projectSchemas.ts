import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});

export const askProjectQuestionSchema = z.object({
  question: z.string().trim().min(1, "Question is required"),
});
