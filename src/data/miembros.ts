// ─────────────────────────────────────────────────────────────
// Contenido EXCLUSIVO para miembros de "Yo Influencer".
// Solo visible tras iniciar sesión. Datos de ejemplo, editables.
// ─────────────────────────────────────────────────────────────

export interface ExclusiveItem {
  title: string;
  description: string;
  badge: string; // etiqueta: "Extendido", "Detrás de cámaras", etc.
  duration: string;
}

export const exclusiveContent: ExclusiveItem[] = [
  {
    title: "Contenido 12 — versión sin censura",
    badge: "Extendido",
    duration: "1h 52m",
    description:
      "La versión completa que no subimos a plataformas públicas: 40 minutos extra de puro caos.",
  },
  {
    title: "Detrás de cámaras: la noche de la apuesta",
    badge: "Detrás de cámaras",
    duration: "27m",
    description:
      "Lo que pasó antes y después de grabar. Cámaras encendidas cuando nadie creía que grababan.",
  },
  {
    title: "Blooper reel — temporada 1",
    badge: "Solo miembros",
    duration: "18m",
    description:
      "Las tomas que no entraron al corte final: errores, risas y lo que pasa entre plano y plano.",
  },
];

export type DownloadType = "audio" | "pdf" | "wallpaper" | "video";

export interface DownloadItem {
  title: string;
  type: DownloadType;
  size: string;
  /** Ruta del archivo (se conectará a S3 con enlaces protegidos). */
  fileKey: string;
}

export const downloads: DownloadItem[] = [
  {
    title: "Contenido 12 (audio HD)",
    type: "audio",
    size: "82 MB",
    fileKey: "ep12-audio-hd.mp3",
  },
  {
    title: "Pack de wallpapers modopiña",
    type: "wallpaper",
    size: "14 MB",
    fileKey: "wallpapers-ntm.zip",
  },
  {
    title: "Guion anotado — visita a restaurante",
    type: "pdf",
    size: "3 MB",
    fileKey: "guion-especial.pdf",
  },
];

export const downloadTypeLabel: Record<DownloadType, string> = {
  audio: "Audio",
  pdf: "PDF",
  wallpaper: "Wallpapers",
  video: "Video",
};
