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

// ── Roles del medio (jerarquía; el índice mayor = más permisos) ──
export const ROLES = ["miembro", "local", "influencer", "editor", "admin", "super_admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  miembro: "Miembro",
  local: "Local",
  influencer: "Influencer",
  editor: "Editor",
  admin: "Admin",
  super_admin: "Super Admin",
};

const RANK: Record<string, number> = Object.fromEntries(ROLES.map((r, i) => [r, i]));
export const rankOf = (role?: string) => RANK[role ?? "miembro"] ?? 0;
/** ¿`role` alcanza al menos el rango pedido? */
export const atLeast = (role: string | undefined, min: Role) => rankOf(role) >= rankOf(min);

// ── Gestión de usuarios (admin) ──
export interface Usuario {
  userId: string;
  email?: string;
  name?: string;
  alias?: string;
  role: string;
  secciones?: string[];
}

export const listUsuarios = () =>
  apiFetch<{ usuarios: Usuario[] }>("/usuarios").then((r) => r.usuarios);

export const setUsuarioRole = (userId: string, role: string) =>
  apiFetch(`/usuarios/${encodeURIComponent(userId)}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });

/** Asigna a un influencer las secciones en las que puede publicar. */
export const setUsuarioSecciones = (userId: string, secciones: string[]) =>
  apiFetch(`/usuarios/${encodeURIComponent(userId)}/secciones`, {
    method: "PUT",
    body: JSON.stringify({ secciones }),
  });
