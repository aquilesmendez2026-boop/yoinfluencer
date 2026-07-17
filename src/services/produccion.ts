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

export type Estado = "pendiente" | "en_progreso" | "en_revision" | "aprobada";

export const ESTADOS: { key: Estado; label: string; color: string }[] = [
  { key: "pendiente", label: "Pendiente", color: "fg.subtle" },
  { key: "en_progreso", label: "En progreso", color: "neon.cyan" },
  { key: "en_revision", label: "En revisión", color: "neon.amber" },
  { key: "aprobada", label: "Aprobada", color: "brandGreen.400" },
];

export interface Subtarea {
  id: string;
  texto: string;
  hecha: boolean;
}

export interface StageData {
  responsable: string;
  responsableId?: string;
  fecha: string;
  contenido: string;
  archivoKey?: string;
  archivoNombre?: string;
  archivoUrl?: string;
  estado: Estado;
  subtareas: Subtarea[];
  done: boolean;
}

export const estaLista = (st?: StageData) => st?.estado === "aprobada" || !!st?.done;

export interface ProduccionItem {
  id: string;
  titulo: string;
  createdByName?: string;
  createdAt?: string;
  stages: Record<Stage, StageData>;
}

const emptyStage = (): StageData => ({ responsable: "", responsableId: "", fecha: "", contenido: "", archivoKey: "", archivoNombre: "", estado: "pendiente", subtareas: [], done: false });

/** Rellena etapas faltantes por seguridad (items antiguos o incompletos). */
export function normalizeStages(item: ProduccionItem): ProduccionItem {
  const stages = { ...(item.stages ?? {}) } as Record<Stage, StageData>;
  for (const s of STAGES) {
    const cur = stages[s.key];
    if (!cur) stages[s.key] = emptyStage();
    else stages[s.key] = {
      ...emptyStage(),
      ...cur,
      estado: cur.estado ?? (cur.done ? "aprobada" : "pendiente"),
      subtareas: Array.isArray(cur.subtareas) ? cur.subtareas : [],
    };
  }
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
