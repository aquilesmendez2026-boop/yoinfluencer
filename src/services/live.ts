import { apiFetch } from "./api";

export interface LiveState {
  isLive: boolean;
  videoId: string;
  title: string;
  platform?: string;
}

/** Un en vivo ya realizado (historial), distinto del en vivo en curso. */
export interface LiveRealizado {
  id: string;
  titulo: string;
  /** Fecha ISO corta (YYYY-MM-DD). */
  fecha: string;
  plataforma: string;
  url: string;
  duracion: string;
  espectadores: number;
  descripcion: string;
  createdAt?: string;
}

export type LiveRealizadoInput = Omit<LiveRealizado, "id" | "createdAt">;

export const listLives = () =>
  apiFetch<{ lives: LiveRealizado[] }>("/lives").then((r) => r.lives);

export const createLiveRealizado = (data: Partial<LiveRealizadoInput>) =>
  apiFetch<{ live: LiveRealizado }>("/lives", { method: "POST", body: JSON.stringify(data) }).then(
    (r) => r.live
  );

export const deleteLiveRealizado = (id: string) =>
  apiFetch(`/lives/${encodeURIComponent(id)}`, { method: "DELETE" });

export const getLive = () => apiFetch<{ live: LiveState }>("/live").then((r) => r.live);

export const setLive = (data: LiveState) =>
  apiFetch<{ live: LiveState }>("/live", { method: "PUT", body: JSON.stringify(data) }).then(
    (r) => r.live
  );

/** Extrae el ID de un video de YouTube desde una URL o devuelve el texto si ya es un ID. */
export function parseYouTubeId(input: string): string {
  const s = input.trim();
  if (!s) return "";
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/|youtube\.com\/embed\/)([\w-]{11})/,
    /^([\w-]{11})$/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return s.slice(0, 40);
}
