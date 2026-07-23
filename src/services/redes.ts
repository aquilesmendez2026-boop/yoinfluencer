import { apiFetch } from "./api";

export type Plataforma =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "twitch"
  | "x"
  | "facebook"
  | "kick"
  | "spotify";

export const PLATAFORMAS: { key: Plataforma; label: string; color: string }[] = [
  { key: "instagram", label: "Instagram", color: "#e1306c" },
  { key: "tiktok", label: "TikTok", color: "#25f4ee" },
  { key: "youtube", label: "YouTube", color: "#ff0000" },
  { key: "twitch", label: "Twitch", color: "#9146ff" },
  { key: "x", label: "X", color: "#e9ecea" },
  { key: "facebook", label: "Facebook", color: "#1877f2" },
  { key: "kick", label: "Kick", color: "#53fc18" },
  { key: "spotify", label: "Spotify", color: "#1db954" },
];

export const plataformaLabel = (k: string) =>
  PLATAFORMAS.find((p) => p.key === k)?.label ?? k;

export interface Red {
  id: string;
  plataforma: Plataforma;
  handle: string;
  url: string;
  seguidores: number;
  /** Se muestra en primer plano en la sección de redes. */
  destacada: boolean;
  orden: number;
}

export const listRedes = () => apiFetch<{ redes: Red[] }>("/redes").then((r) => r.redes);

/** Reemplaza la lista completa (el backend borra y reescribe en el orden recibido). */
export const saveRedes = (redes: Omit<Red, "id">[]) =>
  apiFetch<{ redes: Red[] }>("/redes", { method: "PUT", body: JSON.stringify({ redes }) }).then(
    (r) => r.redes
  );

/** Formatea 12500 → "12,5 K" para las tarjetas de seguidores. */
export function formatSeguidores(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",").replace(",0", "")} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".", ",").replace(",0", "")} K`;
  return String(n);
}
