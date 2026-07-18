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
  desc?: string;
  hecha: boolean;
}

// ── Plantillas tipadas ──
export type FieldType = "texto" | "texto-largo" | "fecha" | "numero" | "select" | "checkbox" | "url" | "file";

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

export interface StageTemplate {
  version: number;
  entrega: string;
  fields: TemplateField[];
}

export type Plantillas = Record<Stage, StageTemplate>;

/** Valor de un campo tipo `file` guardado en values. */
export interface FileValue {
  archivoKey: string;
  archivoNombre: string;
  archivoUrl?: string;
}

/** Valor de un campo tipado: string | number | boolean | FileValue. */
export type FieldValue = string | number | boolean | FileValue | null | undefined;

export interface HistItem {
  de: Estado;
  a: Estado;
  porUserId: string;
  porNombre: string;
  cuando: string;
}

export interface StageData {
  responsable: string;
  responsableId?: string;
  fecha: string;
  estado: Estado;
  subtareas: Subtarea[];
  done: boolean;
  values: Record<string, FieldValue>;
  templateVersion?: number;
  historial?: HistItem[];
  // Compat (adjunto legacy a nivel de etapa)
  archivoKey?: string;
  archivoNombre?: string;
  archivoUrl?: string;
  contenido?: string;
}

export const estaLista = (st?: StageData) => st?.estado === "aprobada" || !!st?.done;

export const getPlantillas = () =>
  apiFetch<{ plantillas: Plantillas }>("/plantillas").then((r) => r.plantillas);

export interface ProduccionItem {
  id: string;
  titulo: string;
  createdByName?: string;
  createdAt?: string;
  stages: Record<Stage, StageData>;
}

const emptyStage = (): StageData => ({ responsable: "", responsableId: "", fecha: "", estado: "pendiente", subtareas: [], done: false, values: {}, historial: [] });

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
      values: cur.values && typeof cur.values === "object" ? cur.values : {},
      historial: Array.isArray(cur.historial) ? cur.historial : [],
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
