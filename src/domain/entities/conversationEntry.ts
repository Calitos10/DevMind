// Una entrada de conversación es un intercambio guardado del historial de un
// proyecto: la pregunta que hizo el usuario, la respuesta de la IA y las fuentes
// (chunks) que se usaron para responder. Se guarda una fila por cada pregunta.
export type ConversationSource = {
  path: string;
  startLine: number;
  endLine: number;
};

export type ConversationEntry = {
  id: string;
  projectId: string;
  question: string;
  answer: string;
  sources: ConversationSource[];
  createdAt: Date;
};
