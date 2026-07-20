export type ExtractedProjectFile = {
  path: string;
  content: string;
};

export type ZipSource = Buffer | string;

export interface ZipExtractor {
  extract(zipSource: ZipSource): Promise<ExtractedProjectFile[]>;
}
