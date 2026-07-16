export interface FileHashGenerator {
  generate(content: string): string;
}
