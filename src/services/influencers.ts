import { apiFetch } from "./api";

/** Perfil público de un integrante del staff. */
export interface Influencer {
  userId: string;
  alias: string;
  bio: string;
  role: string;
  /** Ids de las secciones en las que puede publicar. */
  secciones: string[];
  pais: string;
  /** Perfil de Instagram (handle o URL). */
  instagram?: string;
  /** Seguidores de Instagram (cargados a mano). */
  seguidores?: number;
  /** URL firmada de la foto de perfil, si tiene. */
  photoURL?: string;
  avatarKey?: string;
}

/** Formatea 12500 → "12,5 K" para mostrar los seguidores. */
export function formatSeguidores(n?: number): string {
  const v = Number(n) || 0;
  if (v <= 0) return "";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".0", "").replace(".", ",")} M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(".0", "").replace(".", ",")} K`;
  return String(v);
}

export const listInfluencers = () =>
  apiFetch<{ influencers: Influencer[] }>("/influencers").then((r) => r.influencers);

export const getInfluencer = (id: string) =>
  apiFetch<{ influencer: Influencer }>(`/influencers/${encodeURIComponent(id)}`).then(
    (r) => r.influencer
  );

/** Normaliza un handle o URL de Instagram a una URL abrible. Devuelve "" si no hay. */
export function instagramUrl(value?: string): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://instagram.com/${v.replace(/^@/, "")}`;
}

/** Muestra el handle con "@" a partir de un handle o URL. Devuelve "" si no hay. */
export function instagramHandle(value?: string): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  const m = v.match(/instagram\.com\/([^/?#]+)/i);
  const handle = (m ? m[1] : v).replace(/^@/, "").replace(/\/$/, "");
  return handle ? `@${handle}` : "";
}
