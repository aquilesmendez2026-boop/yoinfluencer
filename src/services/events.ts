import { apiFetch } from "./api";
import type { ShowType } from "../data/shows";

export interface EventoInput {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  type: ShowType;
  description?: string;
}

export interface Evento extends EventoInput {
  id: string;
  createdBy?: string;
  createdAt?: string;
}

export const listEventos = () =>
  apiFetch<{ eventos: Evento[] }>("/eventos").then((r) => r.eventos);

export const createEvento = (e: EventoInput) =>
  apiFetch<{ evento: Evento }>("/eventos", {
    method: "POST",
    body: JSON.stringify(e),
  }).then((r) => r.evento);

export const deleteEvento = (id: string) =>
  apiFetch(`/eventos/${encodeURIComponent(id)}`, { method: "DELETE" });
