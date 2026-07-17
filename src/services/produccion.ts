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

export interface ProduccionItem {
  id: string;
  titulo: string;
  descripcion?: string;
  responsable?: string;
  fecha?: string;
  stage: Stage;
  createdByName?: string;
  createdByUserId?: string;
  createdAt?: string;
}

export interface ProduccionInput {
  titulo: string;
  descripcion?: string;
  responsable?: string;
  fecha?: string;
  stage?: Stage;
}

export const listProduccion = () =>
  apiFetch<{ produccion: ProduccionItem[] }>("/produccion").then((r) => r.produccion);

export const createProduccion = (data: ProduccionInput) =>
  apiFetch<{ item: ProduccionItem }>("/produccion", { method: "POST", body: JSON.stringify(data) }).then(
    (r) => r.item
  );

export const updateProduccion = (id: string, data: Partial<ProduccionInput>) =>
  apiFetch<{ item: ProduccionItem }>(`/produccion/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }).then((r) => r.item);

export const deleteProduccion = (id: string) =>
  apiFetch(`/produccion/${encodeURIComponent(id)}`, { method: "DELETE" });
