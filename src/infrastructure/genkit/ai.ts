import { genkit } from "genkit/beta";
import { anthropic } from "@genkit-ai/anthropic";
import { googleAI } from "@genkit-ai/google-genai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not defined");
}

const anthropicKey = process.env.ANTHROPIC_API_KEY;
const googleKey = process.env.GEMINI_API_KEY;

export const ai = genkit({
  plugins: [googleAI({ apiKey: googleKey })],
});

export const codeEmbeddingEmbedder = googleAI.embedder("gemini-embedding-001");
