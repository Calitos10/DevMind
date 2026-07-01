export type ExtractedProjectFile = {
  path: string;
  content: string;
};

export interface ZipExtractor {
  extract(zipBuffer: Buffer): Promise<ExtractedProjectFile[]>;
}
