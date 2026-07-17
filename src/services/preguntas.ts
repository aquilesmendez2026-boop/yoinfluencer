import { apiFetch } from "./api";

export interface Pregunta {
  id: string;
  contenido: string;
  fromName?: string;
  fromEmail?: string;
  answered?: boolean;
  createdAt?: string;
}

export const createPregunta = (contenido: string) =>
  apiFetch<{ pregunta: Pregunta }>("/preguntas", {
    method: "POST",
    body: JSON.stringify({ contenido }),
  }).then((r) => r.pregunta);

export const listPreguntas = () =>
  apiFetch<{ preguntas: Pregunta[] }>("/preguntas").then((r) => r.preguntas);

export const setPreguntaAnswered = (id: string, answered: boolean) =>
  apiFetch(`/preguntas/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ answered }),
  });

export const deletePregunta = (id: string) =>
  apiFetch(`/preguntas/${encodeURIComponent(id)}`, { method: "DELETE" });
