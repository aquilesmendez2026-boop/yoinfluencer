import { apiFetch } from "./api";

// NOTA: la ruta del API conserva el nombre histórico "/episodios" (y las claves
// `episodios` / `episodio` en las respuestas) aunque el dominio del producto ya
// son "artículos". No renombrar el wire hasta migrar el backend.

export type EstadoContenido = "borrador" | "publicado";

export interface ContenidoLinks {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
}

/** Un artículo de una sección, escrito por un influencer del staff. */
export interface Contenido {
  id: string;
  title: string;
  /** Id de la sección temática a la que pertenece. */
  seccion: string;
  resumen: string;
  /** Cuerpo del artículo (texto largo). */
  cuerpo: string;
  coverKey?: string;
  /** URL firmada de la portada (la genera el backend). */
  coverUrl?: string;
  estado: EstadoContenido;
  autorId: string;
  autorNombre: string;
  number?: number;
  premium: boolean;
  links: ContenidoLinks;
  createdAt?: string;
  publishedAt?: string;
}

export interface ContenidoInput {
  title: string;
  seccion: string;
  resumen?: string;
  cuerpo?: string;
  coverKey?: string;
  estado?: EstadoContenido;
  number?: number;
  premium?: boolean;
  links?: ContenidoLinks;
}

/** Lista artículos. Filtros opcionales por sección o autor. El backend ya
 *  aplica visibilidad: el público solo ve publicados; el staff, sus borradores. */
export const listContenidos = (filtros?: { seccion?: string; autor?: string }) => {
  const qs = new URLSearchParams();
  if (filtros?.seccion) qs.set("seccion", filtros.seccion);
  if (filtros?.autor) qs.set("autor", filtros.autor);
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch<{ episodios: Contenido[] }>(`/episodios${suffix}`).then((r) => r.episodios);
};

export const createContenido = (data: ContenidoInput) =>
  apiFetch<{ episodio: Contenido }>("/episodios", {
    method: "POST",
    body: JSON.stringify(data),
  }).then((r) => r.episodio);

export const updateContenido = (id: string, data: Partial<ContenidoInput>) =>
  apiFetch<{ episodio: Contenido }>(`/episodios/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }).then((r) => r.episodio);

export const deleteContenido = (id: string) =>
  apiFetch(`/episodios/${encodeURIComponent(id)}`, { method: "DELETE" });

/** Sube la portada del artículo a S3 y devuelve la key para guardar. */
export async function uploadPortada(file: File): Promise<string> {
  const contentType = file.type || "image/jpeg";
  const { uploadUrl, key } = await apiFetch<{ uploadUrl: string; key: string }>("/episodios-upload", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, contentType }),
  });
  const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
  if (!res.ok) throw new Error("No se pudo subir la portada.");
  return key;
}
