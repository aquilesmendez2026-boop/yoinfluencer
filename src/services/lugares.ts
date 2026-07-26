import { apiFetch } from "./api";

export type CategoriaLugar =
  | "club"
  | "sauna"
  | "hotel"
  | "bar"
  | "evento"
  | "fiesta_privada"
  | "tienda"
  | "taller"
  | "otro";

export const CATEGORIAS: { key: CategoriaLugar; label: string; emoji: string }[] = [
  { key: "club", label: "Club", emoji: "🔥" },
  { key: "sauna", label: "Sauna", emoji: "♨️" },
  { key: "hotel", label: "Hotel", emoji: "🏨" },
  { key: "bar", label: "Bar", emoji: "🍸" },
  { key: "evento", label: "Evento", emoji: "🎉" },
  { key: "fiesta_privada", label: "Fiesta privada", emoji: "🎭" },
  { key: "tienda", label: "Tienda", emoji: "🛍️" },
  { key: "taller", label: "Taller", emoji: "🪢" },
  { key: "otro", label: "Otro", emoji: "📍" },
];

export const categoriaLabel = (k: CategoriaLugar) =>
  CATEGORIAS.find((c) => c.key === k)?.label ?? "Otro";

/** Foto de un lugar. `url` es una URL firmada de lectura que genera el backend. */
export interface FotoLugar {
  key: string;
  nombre: string;
  url?: string;
}

/** Un evento que el local publica en su ficha (y que también entra a la agenda). */
export interface EventoLocal {
  id?: string;
  /** Fecha ISO corta (YYYY-MM-DD). */
  fecha: string;
  /** Hora HH:MM (opcional). */
  hora?: string;
  titulo: string;
  descripcion?: string;
}

export interface Lugar {
  id: string;
  nombre: string;
  categoria: CategoriaLugar;
  direccion: string;
  ciudad: string;
  /** País (lo llena el autocompletado de direcciones). */
  pais: string;
  /** Coordenadas (del autocompletado); null si no se geocodificó. */
  lat: number | null;
  lng: number | null;
  mapsUrl: string;
  /** Datos que carga el propio local. */
  horario: string;
  telefono: string;
  web: string;
  descripcion: string;
  /** 0 a 5 (reseña del staff). */
  rating: number;
  resena: string;
  /** Rango de precio como "$", "$$", "$$$". */
  precio: string;
  recomendado: boolean;
  /** Fecha ISO corta (YYYY-MM-DD). */
  visitadoEl: string;
  /** Enlace al contenido publicado donde aparece el lugar. */
  contenidoId: string;
  contenidoUrl: string;
  /** userId del dueño (rol "local"). Vacío si lo curó el staff. */
  ownerId?: string;
  /** Aprobado por un admin: gate de visibilidad pública. */
  aprobado: boolean;
  eventos: EventoLocal[];
  fotos: FotoLugar[];
  createdByName?: string;
  createdAt?: string;
}

export type LugarInput = Omit<Lugar, "id" | "createdByName" | "createdAt" | "ownerId" | "aprobado">;

export const listLugares = () =>
  apiFetch<{ lugares: Lugar[] }>("/lugares").then((r) => r.lugares);

/** Un resultado de geocodificación (autocompletado de direcciones). */
export interface GeoResultado {
  label: string;
  direccion: string;
  ciudad: string;
  region: string;
  pais: string;
  lat: number | null;
  lng: number | null;
}

/** Busca direcciones (autocompletado). Devuelve candidatos con coordenadas. */
export const geocode = (q: string) =>
  apiFetch<{ resultados: GeoResultado[] }>(`/geocode?q=${encodeURIComponent(q)}`).then(
    (r) => r.resultados
  );

/** Ficha del local del usuario actual (rol "local"), o null si no tiene. */
export const getMiLocal = () =>
  apiFetch<{ lugar: Lugar | null }>("/mi-local").then((r) => r.lugar);

/** Aprueba o desaprueba un local (solo admin/super_admin). */
export const aprobarLugar = (id: string, aprobado = true) =>
  apiFetch<{ ok: boolean; aprobado: boolean }>(`/lugares/${encodeURIComponent(id)}/aprobar`, {
    method: "PUT",
    body: JSON.stringify({ aprobado }),
  });

/** Datos para crear un local desde el panel; opcionalmente con dueño y aprobado. */
export type CrearLocalInput = Partial<LugarInput> & { ownerEmail?: string; aprobado?: boolean };

/** Crea un local (admin puede asignar dueño por email y aprobarlo de una). */
export const crearLocal = (data: CrearLocalInput) =>
  apiFetch<{ lugar: Lugar }>("/lugares", { method: "POST", body: JSON.stringify(data) }).then(
    (r) => r.lugar
  );

/** Asigna (email) o quita (email vacío) el dueño de un local. Solo admin+. */
export const asignarDueno = (id: string, email: string) =>
  apiFetch<{ ok: boolean; ownerId: string; ownerNombre: string }>(
    `/lugares/${encodeURIComponent(id)}/owner`,
    { method: "PUT", body: JSON.stringify({ email }) }
  );

export const createLugar = (data: Partial<LugarInput>) =>
  apiFetch<{ lugar: Lugar }>("/lugares", { method: "POST", body: JSON.stringify(data) }).then(
    (r) => r.lugar
  );

export const updateLugar = (id: string, data: Partial<LugarInput>) =>
  apiFetch<{ lugar: Lugar }>(`/lugares/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }).then((r) => r.lugar);

export const deleteLugar = (id: string) =>
  apiFetch(`/lugares/${encodeURIComponent(id)}`, { method: "DELETE" });

/** Sube una foto a S3 vía URL firmada y devuelve la referencia para guardar en el lugar. */
export async function uploadFotoLugar(file: File): Promise<FotoLugar> {
  const contentType = file.type || "image/jpeg";
  const { uploadUrl, key } = await apiFetch<{ uploadUrl: string; key: string }>("/lugares-upload", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, contentType }),
  });
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!res.ok) throw new Error("No se pudo subir la foto.");
  return { key, nombre: file.name };
}
