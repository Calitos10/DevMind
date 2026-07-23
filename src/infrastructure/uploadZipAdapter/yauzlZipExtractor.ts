import yauzl, { type Entry, type ZipFile } from "yauzl";

import {
  ExtractedProjectFile,
  ZipExtractor,
} from "../../application/ports/zipExtractor";
import { ProjectFileClassifier } from "../../domain/services/projectFileClassifier";
import { ZipTooLargeError } from "../../shared/errors/zipTooLargeError";
import { env } from "../config/env";

const BYTES_PER_MB = 1024 * 1024;

function openZip(zipSource: Buffer | string): Promise<ZipFile> {
  const options = { lazyEntries: true, autoClose: false };

  return new Promise((resolve, reject) => {
    const callback = (error: Error | null, zipFile?: ZipFile) => {
      if (error || !zipFile) {
        reject(error ?? new Error("Could not open zip file"));
        return;
      }

      resolve(zipFile);
    };

    if (typeof zipSource === "string") {
      yauzl.open(zipSource, options, callback);
      return;
    }

    yauzl.fromBuffer(zipSource, options, callback);
  });
}

function readNextEntry(zipFile: ZipFile): Promise<Entry | null> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      zipFile.off("entry", onEntry);
      zipFile.off("end", onEnd);
      zipFile.off("error", onError);
    };
    const onEntry = (entry: Entry) => {
      cleanup();
      resolve(entry);
    };
    const onEnd = () => {
      cleanup();
      resolve(null);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    zipFile.once("entry", onEntry);
    zipFile.once("end", onEnd);
    zipFile.once("error", onError);
    zipFile.readEntry();
  });
}

function openEntryStream(
  zipFile: ZipFile,
  entry: Entry,
): Promise<NodeJS.ReadableStream> {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error || !stream) {
        reject(error ?? new Error("Could not read zip entry"));
        return;
      }

      resolve(stream);
    });
  });
}

async function readEntryContent(
  zipFile: ZipFile,
  entry: Entry,
): Promise<string> {
  const stream = await openEntryStream(zipFile, entry);
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

export class YauzlZipExtractor implements ZipExtractor {
  private readonly fileClassifier = new ProjectFileClassifier();

  async *extract(
    zipSource: Buffer | string,
  ): AsyncIterable<ExtractedProjectFile> {
    const zipFile = await openZip(zipSource);
    const maxUncompressedBytes =
      env.upload.maxZipUncompressedSizeMb * BYTES_PER_MB;
    let totalUncompressedSize = 0;

    try {
      while (true) {
        const entry = await readNextEntry(zipFile);

        if (!entry) break;
        if (entry.fileName.endsWith("/")) continue;

        const path = entry.fileName.replaceAll("\\", "/");

        if (!this.fileClassifier.isRelevantPath(path)) continue;

        totalUncompressedSize += entry.uncompressedSize;

        if (totalUncompressedSize > maxUncompressedBytes) {
          throw new ZipTooLargeError();
        }

        const file = {
          path,
          content: await readEntryContent(zipFile, entry),
        };

        if (this.fileClassifier.isRelevant(file)) {
          yield file;
        }
      }
    } finally {
      zipFile.close();
    }
  }
}
