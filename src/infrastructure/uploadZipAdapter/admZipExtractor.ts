import AdmZip from "adm-zip";

import {
  ExtractedProjectFile,
  ZipExtractor,
} from "../../application/ports/zipExtractor";
import { env } from "../config/env";
import { ZipTooLargeError } from "../../shared/errors/zipTooLargeError";

const BYTES_PER_MB = 1024 * 1024;

export class AdmZipExtractor implements ZipExtractor {
  async extract(zipBuffer: Buffer): Promise<ExtractedProjectFile[]> {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries().filter((entry) => !entry.isDirectory);

    const totalUncompressedSize = entries.reduce(
      (total, entry) => total + entry.header.size,
      0,
    );

    const maxUncompressedBytes =
      env.upload.maxZipUncompressedSizeMb * BYTES_PER_MB;

    if (totalUncompressedSize > maxUncompressedBytes) {
      throw new ZipTooLargeError();
    }

    return entries.map((entry) => ({
      path: entry.entryName.replaceAll("\\", "/"),
      content: entry.getData().toString("utf8"),
    }));
  }
}