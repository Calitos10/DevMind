import type { EmbeddingGenerator } from "../../../application/ports/embeddingGenerator";

// Dimensión real de los embeddings, la misma que la columna vector(768).
const EMBEDDING_DIMENSIONS = 768;

// Generador de embeddings determinista para los tests. Devuelve siempre el mismo
// vector (de dimensión 768) sin llamar a Gemini. Como todos los vectores son
// idénticos, la distancia entre la pregunta y cualquier chunk es 0, por lo que la
// búsqueda por similitud es estable y no depende de la red, la API key ni la cuota.
export class TestEmbeddingGenerator implements EmbeddingGenerator {
  async generateEmbedding(): Promise<number[]> {
    return new Array(EMBEDDING_DIMENSIONS).fill(0.1);
  }
}
