import { apiFetch } from "./api";

export interface Miembro {
  userId: string;
  nombre: string;
}

export const getEquipo = () =>
  apiFetch<{ equipo: Miembro[] }>("/equipo").then((r) => r.equipo);
