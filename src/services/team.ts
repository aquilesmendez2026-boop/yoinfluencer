import { apiFetch } from "./api";

// ── Reuniones ──
export interface Reunion {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  description?: string;
  lugar?: string;
  createdByName?: string;
  createdByUserId?: string;
  createdAt?: string;
}

export interface ReunionInput {
  date: string;
  time: string;
  title: string;
  description?: string;
  lugar?: string;
}

export const listReuniones = () =>
  apiFetch<{ reuniones: Reunion[] }>("/reuniones").then((r) => r.reuniones);

export const createReunion = (data: ReunionInput) =>
  apiFetch<{ reunion: Reunion }>("/reuniones", { method: "POST", body: JSON.stringify(data) }).then(
    (r) => r.reunion
  );

export const deleteReunion = (id: string) =>
  apiFetch(`/reuniones/${encodeURIComponent(id)}`, { method: "DELETE" });

// ── Notas / ideas ──
export interface Nota {
  id: string;
  titulo?: string;
  contenido: string;
  createdByName?: string;
  createdByUserId?: string;
  createdAt?: string;
}

export const listNotas = () => apiFetch<{ notas: Nota[] }>("/notas").then((r) => r.notas);

export const createNota = (data: { titulo?: string; contenido: string }) =>
  apiFetch<{ nota: Nota }>("/notas", { method: "POST", body: JSON.stringify(data) }).then(
    (r) => r.nota
  );

export const deleteNota = (id: string) =>
  apiFetch(`/notas/${encodeURIComponent(id)}`, { method: "DELETE" });

// ── Gestión de usuarios (admin) ──
export interface Usuario {
  userId: string;
  email?: string;
  name?: string;
  role: string;
}

export const listUsuarios = () =>
  apiFetch<{ usuarios: Usuario[] }>("/usuarios").then((r) => r.usuarios);

export const setUsuarioRole = (userId: string, role: string) =>
  apiFetch(`/usuarios/${encodeURIComponent(userId)}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
