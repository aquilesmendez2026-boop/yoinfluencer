import { apiFetch } from "./api";

export interface EpisodioLinks {
  spotify?: string;
  youtube?: string;
  apple?: string;
}

export interface Episodio {
  id: string;
  number: number;
  title: string;
  description: string;
  showNotes?: string;
  duration: string;
  date?: string;
  premium: boolean;
  links: EpisodioLinks;
}

export interface EpisodioInput {
  number: number;
  title: string;
  description?: string;
  showNotes?: string;
  duration?: string;
  date?: string;
  premium?: boolean;
  links?: EpisodioLinks;
}

export const listEpisodios = () =>
  apiFetch<{ episodios: Episodio[] }>("/episodios").then((r) => r.episodios);

export const createEpisodio = (data: EpisodioInput) =>
  apiFetch<{ episodio: Episodio }>("/episodios", { method: "POST", body: JSON.stringify(data) }).then(
    (r) => r.episodio
  );

export const updateEpisodio = (id: string, data: EpisodioInput) =>
  apiFetch<{ episodio: Episodio }>(`/episodios/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }).then((r) => r.episodio);

export const deleteEpisodio = (id: string) =>
  apiFetch(`/episodios/${encodeURIComponent(id)}`, { method: "DELETE" });
