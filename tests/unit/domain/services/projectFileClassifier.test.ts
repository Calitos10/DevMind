import { describe, expect, it } from "vitest";

import { ProjectFileClassifier } from "../../../../src/domain/services/projectFileClassifier";

describe("ProjectFileClassifier", () => {
  const classifier = new ProjectFileClassifier();

  describe("isRelevant", () => {
    it("keeps normal source files", () => {
      expect(
        classifier.isRelevant({
          path: "src/index.ts",
          content: "console.log('hello');",
        }),
      ).toBe(true);
    });

    it("ignores files inside ignored folders", () => {
      const ignoredPaths = [
        "node_modules/express/index.js",
        ".git/config",
        "dist/index.js",
        "build/main.js",
        "coverage/report.html",
        ".next/server/app.js",
        "docs/guide.md",
      ];

      for (const path of ignoredPaths) {
        expect(classifier.isRelevant({ path, content: "whatever" })).toBe(false);
      }
    });

    it("ignores binary files by extension", () => {
      expect(
        classifier.isRelevant({ path: "assets/logo.png", content: "..." }),
      ).toBe(false);
      expect(
        classifier.isRelevant({ path: "fonts/font.woff2", content: "..." }),
      ).toBe(false);
    });

    it("ignores files that contain a null byte", () => {
      const contentWithNullByte = `text with a ${String.fromCharCode(0)} null byte`;

      expect(
        classifier.isRelevant({
          path: "weird.txt",
          content: contentWithNullByte,
        }),
      ).toBe(false);
    });
  });

  describe("isRelevantPath", () => {
    it("rejects ignored folders and binary extensions without file content", () => {
      expect(classifier.isRelevantPath("node_modules/library/index.js")).toBe(
        false,
      );
      expect(classifier.isRelevantPath("src/assets/logo.png")).toBe(false);
      expect(classifier.isRelevantPath("src/index.ts")).toBe(true);
    });
  });

  describe("detectLanguage", () => {
    it("detects the language from the file extension", () => {
      expect(classifier.detectLanguage("a.ts")).toBe("typescript");
      expect(classifier.detectLanguage("a.tsx")).toBe("typescript");
      expect(classifier.detectLanguage("a.js")).toBe("javascript");
      expect(classifier.detectLanguage("a.jsx")).toBe("javascript");
      expect(classifier.detectLanguage("a.json")).toBe("json");
      expect(classifier.detectLanguage("a.md")).toBe("markdown");
    });

    it("returns 'unknown' for unrecognised extensions", () => {
      expect(classifier.detectLanguage("a.py")).toBe("unknown");
      expect(classifier.detectLanguage("Makefile")).toBe("unknown");
    });
  });
});
