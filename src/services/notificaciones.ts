import { apiFetch } from "./api";

export interface Notificacion {
  id: string;
  sk: string;
  texto: string;
  episodioId?: string;
  episodioTitulo?: string;
  stage?: string;
  leida: boolean;
  createdAt: string;
}

export const listNotificaciones = () =>
  apiFetch<{ notificaciones: Notificacion[] }>("/notificaciones").then((r) => r.notificaciones);

export const marcarLeidas = () =>
  apiFetch("/notificaciones/leer", { method: "POST" });
