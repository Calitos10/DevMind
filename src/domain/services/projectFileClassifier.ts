// Servicio de dominio que concentra las reglas sobre qué archivos de un proyecto
// interesa guardar/analizar y en qué lenguaje están. Antes vivían como funciones
// sueltas dentro de UploadProjectZipUseCase; aquí quedan aisladas y testeables.

const IGNORED_FOLDERS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  "docs",
]);

const BINARY_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".tar",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".db",
  ".sqlite",
  ".mp4",
  ".mov",
  ".mp3",
  ".wav",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
];

// Byte nulo (0x00); su presencia suele indicar contenido binario, no texto.
const NULL_BYTE = String.fromCharCode(0);

export class ProjectFileClassifier {
  // Permite decidir si una entrada del ZIP merece ser extraida usando solo su
  // ruta. Es importante llamar a este metodo antes de cargar su contenido en
  // memoria.
  isRelevantPath(path: string): boolean {
    return !this.isIgnored(path) && !this.hasBinaryExtension(path);
  }

  // Un archivo es relevante si no está en una carpeta ignorada ni es binario.
  isRelevant(file: { path: string; content: string }): boolean {
    return this.isRelevantPath(file.path) && !this.hasNullByte(file.content);
  }

  detectLanguage(path: string): string {
    if (path.endsWith(".ts")) return "typescript";
    if (path.endsWith(".tsx")) return "typescript";
    if (path.endsWith(".js")) return "javascript";
    if (path.endsWith(".jsx")) return "javascript";
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".md")) return "markdown";

    return "unknown";
  }

  private isIgnored(path: string): boolean {
    const pathParts = path.replaceAll("\\", "/").split("/");

    return pathParts.some((part) => IGNORED_FOLDERS.has(part));
  }

  private hasNullByte(content: string): boolean {
    return content.includes(NULL_BYTE);
  }

  private hasBinaryExtension(path: string): boolean {
    const normalizedPath = path.toLowerCase();

    return BINARY_EXTENSIONS.some((extension) =>
      normalizedPath.endsWith(extension),
    );
  }
}
