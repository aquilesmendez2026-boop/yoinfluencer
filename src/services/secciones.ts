import { apiFetch } from "./api";

/** Sección temática del medio (como las secciones de un periódico). */
export interface Seccion {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  color: string;
  orden: number;
  activa: boolean;
  createdAt?: string;
}

export type SeccionInput = {
  nombre: string;
  descripcion?: string;
  color?: string;
  orden?: number;
  activa?: boolean;
};

export const listSecciones = () =>
  apiFetch<{ secciones: Seccion[] }>("/secciones").then((r) => r.secciones);

export const createSeccion = (data: SeccionInput) =>
  apiFetch<{ seccion: Seccion }>("/secciones", { method: "POST", body: JSON.stringify(data) }).then(
    (r) => r.seccion
  );

export const updateSeccion = (id: string, data: Partial<SeccionInput>) =>
  apiFetch<{ seccion: Seccion }>(`/secciones/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }).then((r) => r.seccion);

export const deleteSeccion = (id: string) =>
  apiFetch(`/secciones/${encodeURIComponent(id)}`, { method: "DELETE" });

/** Construye un mapa id→sección para resolver nombres al pintar artículos. */
export const seccionMap = (secciones: Seccion[]) =>
  Object.fromEntries(secciones.map((s) => [s.id, s])) as Record<string, Seccion>;
