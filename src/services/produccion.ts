import { apiFetch } from "./api";

export type Stage = "idea" | "guion" | "grabacion" | "edicion" | "programado" | "publicado";

export const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: "idea", label: "Idea", color: "neon.cyan" },
  { key: "guion", label: "Guion", color: "#8b5cf6" },
  { key: "grabacion", label: "Grabación", color: "neon.magenta" },
  { key: "edicion", label: "Edición", color: "#ec4899" },
  { key: "programado", label: "Programado", color: "neon.amber" },
  { key: "publicado", label: "Publicado", color: "brandGreen.500" },
];

export interface StageData {
  responsable: string;
  fecha: string;
  contenido: string;
  archivoKey?: string;
  archivoNombre?: string;
  archivoUrl?: string;
  done: boolean;
}

export interface ProduccionItem {
  id: string;
  titulo: string;
  createdByName?: string;
  createdAt?: string;
  stages: Record<Stage, StageData>;
}

const emptyStage = (): StageData => ({ responsable: "", fecha: "", contenido: "", archivoKey: "", archivoNombre: "", done: false });

/** Rellena etapas faltantes por seguridad (items antiguos o incompletos). */
export function normalizeStages(item: ProduccionItem): ProduccionItem {
  const stages = { ...(item.stages ?? {}) } as Record<Stage, StageData>;
  for (const s of STAGES) if (!stages[s.key]) stages[s.key] = emptyStage();
  return { ...item, stages };
}

export const listProduccion = () =>
  apiFetch<{ produccion: ProduccionItem[] }>("/produccion").then((r) => r.produccion.map(normalizeStages));

export const createProduccion = (data: { titulo: string; idea?: string }) =>
  apiFetch<{ item: ProduccionItem }>("/produccion", { method: "POST", body: JSON.stringify(data) }).then(
    (r) => normalizeStages(r.item)
  );

export const updateStage = (id: string, stage: Stage, stageData: Partial<StageData>) =>
  apiFetch<{ item: ProduccionItem }>(`/produccion/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ stage, stageData }),
  }).then((r) => normalizeStages(r.item));

export const updateTitulo = (id: string, titulo: string) =>
  apiFetch<{ item: ProduccionItem }>(`/produccion/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ titulo }),
  }).then((r) => normalizeStages(r.item));

export const deleteProduccion = (id: string) =>
  apiFetch(`/produccion/${encodeURIComponent(id)}`, { method: "DELETE" });

/** Sube un archivo adjunto de etapa a S3 y devuelve la referencia para guardar en la etapa. */
export async function uploadProduccionArchivo(file: File): Promise<{ archivoKey: string; archivoNombre: string }> {
  const { uploadUrl, key } = await apiFetch<{ uploadUrl: string; key: string }>("/produccion-upload", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream" }),
  });
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) throw new Error("No se pudo subir el archivo.");
  return { archivoKey: key, archivoNombre: file.name };
}
