// ─────────────────────────────────────────────────────────────
// DATOS DE EJEMPLO de "Yo Influencer".
// Edita estos arreglos para cambiar el contenido del sitio.
// Los lugares, las redes y los en vivos ya vienen del API
// (services/lugares.ts, services/redes.ts, services/live.ts).
// ─────────────────────────────────────────────────────────────

/** Tipos de actividad en la agenda. Debe coincidir con TYPES del backend. */
export type ShowType = "en_vivo" | "grabacion" | "publicacion" | "colaboracion" | "evento";

export interface ScheduleItem {
  day: string;
  time: string;
  title: string;
  type: ShowType;
  description: string;
}

export const showTypeLabels: Record<ShowType, string> = {
  en_vivo: "En vivo",
  grabacion: "Grabación",
  publicacion: "Publicación",
  colaboracion: "Colaboración",
  evento: "Evento",
};

// Rutina semanal de contenido
export const schedule: ScheduleItem[] = [
  {
    day: "Lunes",
    time: "20:00",
    title: "Nuevos artículos",
    type: "publicacion",
    description:
      "El staff publica los artículos de la semana en cada sección: vida swinger, shibari, BDSM y más.",
  },
  {
    day: "Miércoles",
    time: "21:00",
    title: "Taller en vivo",
    type: "en_vivo",
    description:
      "Directo temático: técnica de shibari, seguridad en BDSM o conversación abierta con la comunidad.",
  },
  {
    day: "Viernes",
    time: "23:00",
    title: "Noche de club",
    type: "evento",
    description:
      "Cobertura y reseñas de clubs, saunas y fiestas privadas del ambiente.",
  },
  {
    day: "Domingo",
    time: "19:00",
    title: "Colaboración",
    type: "colaboracion",
    description:
      "Contenido en conjunto entre creadores del staff o con invitados de la comunidad.",
  },
];

// Pilares de contenido
export interface Format {
  title: string;
  description: string;
  tag: string;
}

export const formats: Format[] = [
  {
    title: "Artículos por sección",
    tag: "Editorial",
    description:
      "Cada creador del staff escribe en las secciones que le asignaron: vida swinger, shibari, bondage, BDSM, spanking o arte erótico.",
  },
  {
    title: "Reseñas de clubs y eventos",
    tag: "Ambiente",
    description:
      "Clubs, saunas, hoteles y fiestas privadas contados en primera persona, con datos reales y sin adornos.",
  },
  {
    title: "En vivos y talleres",
    tag: "Directo",
    description:
      "Sesiones en directo sobre técnica, seguridad y cultura del ambiente, con preguntas de la comunidad.",
  },
  {
    title: "Creadores",
    tag: "Comunidad",
    description:
      "Cada creador tiene su página pública con su bio, sus secciones y todo lo que ha publicado.",
  },
];

// Valores / vibra del proyecto
export const values: string[] = [
  "Consenso ante todo",
  "Sin prejuicios",
  "Comunidad real",
  "Seguridad primero",
];

// Plataformas donde ver el contenido (enlaces placeholder)
export interface Platform {
  name: string;
  url: string;
}

export const platforms: Platform[] = [
  { name: "Instagram", url: "#" },
  { name: "TikTok", url: "#" },
  { name: "YouTube", url: "#" },
  { name: "Twitch", url: "#" },
];

// Redes sociales (enlaces placeholder — el listado real llega de /redes)
export const socials: Platform[] = [
  { name: "Instagram", url: "#" },
  { name: "TikTok", url: "#" },
  { name: "YouTube", url: "#" },
  { name: "X", url: "#" },
];
