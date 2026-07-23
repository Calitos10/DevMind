import { describe, expect, it } from "vitest";

import { LineCodeChunker } from "../../../../src/application/codeChunk/lineCodeChunker";

describe("LineCodeChunker", () => {
  it("returns a single chunk when the file has fewer lines than the maximum", () => {
    const chunker = new LineCodeChunker();

    const content = ["line 1", "line 2", "line 3"].join("\n");

    const chunks = chunker.chunk({
      content,
      maxLinesPerChunk: 5,
      overlapLines: 1,
    });

    expect(chunks).toEqual([
      {
        content: ["line 1", "line 2", "line 3"].join("\n"),
        startLine: 1,
        endLine: 3,
        index: 0,
      },
    ]);
  });

  it("splits a file into multiple chunks when it has more lines than the maximum", () => {
    const chunker = new LineCodeChunker();

    const content = [
      "line 1",
      "line 2",
      "line 3",
      "line 4",
      "line 5",
      "line 6",
      "line 7",
    ].join("\n");

    const chunks = chunker.chunk({
      content,
      maxLinesPerChunk: 3,
      overlapLines: 0,
    });

    expect(chunks).toEqual([
      {
        content: ["line 1", "line 2", "line 3"].join("\n"),
        startLine: 1,
        endLine: 3,
        index: 0,
      },
      {
        content: ["line 4", "line 5", "line 6"].join("\n"),
        startLine: 4,
        endLine: 6,
        index: 1,
      },
      {
        content: "line 7",
        startLine: 7,
        endLine: 7,
        index: 2,
      },
    ]);
  });

  it("applies overlap between chunks", () => {
    const chunker = new LineCodeChunker();

    const content = [
      "line 1",
      "line 2",
      "line 3",
      "line 4",
      "line 5",
      "line 6",
      "line 7",
    ].join("\n");

    const chunks = chunker.chunk({
      content,
      maxLinesPerChunk: 3,
      overlapLines: 1,
    });

    expect(chunks).toEqual([
      {
        content: ["line 1", "line 2", "line 3"].join("\n"),
        startLine: 1,
        endLine: 3,
        index: 0,
      },
      {
        content: ["line 3", "line 4", "line 5"].join("\n"),
        startLine: 3,
        endLine: 5,
        index: 1,
      },
      {
        content: ["line 5", "line 6", "line 7"].join("\n"),
        startLine: 5,
        endLine: 7,
        index: 2,
      },
    ]);
  });

  it("returns no chunks when the content is empty", () => {
    const chunker = new LineCodeChunker();

    const chunks = chunker.chunk({
      content: "",
      maxLinesPerChunk: 3,
      overlapLines: 1,
    });

    expect(chunks).toEqual([]);
  });

  it("throws an error when overlap lines is greater than or equal to max lines per chunk", () => {
    const chunker = new LineCodeChunker();

    expect(() =>
      chunker.chunk({
        content: ["line 1", "line 2", "line 3"].join("\n"),
        maxLinesPerChunk: 3,
        overlapLines: 3,
      }),
    ).toThrow("overlapLines must be lower than maxLinesPerChunk");
  });
});
