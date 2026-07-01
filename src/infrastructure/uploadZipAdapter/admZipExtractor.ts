import AdmZip from "adm-zip";

import {
  ExtractedProjectFile,
  ZipExtractor,
} from "../../application/ports/zipExtractor";

export class AdmZipExtractor implements ZipExtractor {
  async extract(zipBuffer: Buffer): Promise<ExtractedProjectFile[]> {
    const zip = new AdmZip(zipBuffer);

    return zip
      .getEntries()
      .filter((entry) => !entry.isDirectory)
      .map((entry) => ({
        path: entry.entryName.replaceAll("\\", "/"),
        content: entry.getData().toString("utf8"),
      }));
  }
}