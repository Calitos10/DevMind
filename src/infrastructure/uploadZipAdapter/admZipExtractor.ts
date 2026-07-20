import AdmZip from "adm-zip";

import {
  ExtractedProjectFile,
  ZipExtractor,
} from "../../application/ports/zipExtractor";
import { env } from "../config/env";
import { ZipTooLargeError } from "../../shared/errors/zipTooLargeError";
import { ProjectFileClassifier } from "../../domain/services/projectFileClassifier";

const BYTES_PER_MB = 1024 * 1024;

export class AdmZipExtractor implements ZipExtractor {
  private readonly fileClassifier = new ProjectFileClassifier();

  async extract(zipBuffer: Buffer): Promise<ExtractedProjectFile[]> {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries().filter((entry) => {
      if (entry.isDirectory) return false;

      const normalizedPath = entry.entryName.replaceAll("\\", "/");
      return this.fileClassifier.isRelevantPath(normalizedPath);
    });

    const totalUncompressedSize = entries.reduce(
      (total, entry) => total + entry.header.size,
      0,
    );

    const maxUncompressedBytes =
      env.upload.maxZipUncompressedSizeMb * BYTES_PER_MB;

    if (totalUncompressedSize > maxUncompressedBytes) {
      throw new ZipTooLargeError();
    }

    return entries
      .map((entry) => ({
        path: entry.entryName.replaceAll("\\", "/"),
        content: entry.getData().toString("utf8"),
      }))
      .filter((file) => this.fileClassifier.isRelevant(file));
  }
}
