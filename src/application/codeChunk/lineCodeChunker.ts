export type ChunkInput = {
  content: string;
  maxLinesPerChunk: number;
  overlapLines: number;
};

export type ChunkResult = {
  content: string;
  startLine: number;
  endLine: number;
  index: number;
};

export class LineCodeChunker {
  chunk(input: ChunkInput): ChunkResult[] {
    if (input.overlapLines >= input.maxLinesPerChunk) {
      throw new Error("overlapLines must be lower than maxLinesPerChunk");
    }

    if (input.content.trim().length === 0) {
      return [];
    }

    const lines = input.content.split("\n");

    const chunks: ChunkResult[] = [];

    const step = input.maxLinesPerChunk - input.overlapLines;

    for (let startIndex = 0; startIndex < lines.length; startIndex += step) {
      const endIndex = Math.min(
        startIndex + input.maxLinesPerChunk,
        lines.length,
      );

      const chunkLines = lines.slice(startIndex, endIndex);

      chunks.push({
        content: chunkLines.join("\n"),
        startLine: startIndex + 1,
        endLine: endIndex,
        index: chunks.length,
      });

      if (endIndex === lines.length) {
        break;
      }
    }

    return chunks;
  }
}
