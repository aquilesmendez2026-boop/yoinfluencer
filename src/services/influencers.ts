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
  /** URL firmada de la foto de perfil, si tiene. */
  photoURL?: string;
  avatarKey?: string;
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
