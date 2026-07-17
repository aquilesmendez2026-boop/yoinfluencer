import { apiFetch } from "./api";

export type DownloadType = "audio" | "pdf" | "wallpaper" | "video" | "otro";

export interface Descarga {
  id: string;
  title: string;
  type: DownloadType;
  fileKey: string;
  size?: string;
  /** URL firmada (temporal) para descargar. */
  url?: string;
  createdAt?: string;
}

export const listDescargas = () =>
  apiFetch<{ descargas: Descarga[] }>("/descargas").then((r) => r.descargas);

/** Sube el archivo a S3 y crea el registro de descarga (admin). */
export async function uploadDescarga(
  file: File,
  meta: { title: string; type: DownloadType; size?: string }
): Promise<Descarga> {
  const { uploadUrl, key } = await apiFetch<{ uploadUrl: string; key: string }>("/descargas-upload", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream" }),
  });
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) throw new Error("No se pudo subir el archivo.");

  return apiFetch<{ descarga: Descarga }>("/descargas", {
    method: "POST",
    body: JSON.stringify({ title: meta.title, type: meta.type, fileKey: key, size: meta.size ?? "" }),
  }).then((r) => r.descarga);
}

export const deleteDescarga = (id: string) =>
  apiFetch(`/descargas/${encodeURIComponent(id)}`, { method: "DELETE" });
