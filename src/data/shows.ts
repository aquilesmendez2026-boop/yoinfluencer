// ─────────────────────────────────────────────────────────────
// DATOS DE EJEMPLO del podcast "Ni Tan Mal".
// Edita estos arreglos para cambiar el contenido del sitio.
// Más adelante se reemplazarán por datos reales / API.
// ─────────────────────────────────────────────────────────────

export type ShowType = "stream" | "charla" | "especial";

export interface ScheduleItem {
  day: string;
  time: string;
  title: string;
  type: ShowType;
  description: string;
}

export const showTypeLabels: Record<ShowType, string> = {
  stream: "Stream de juegos",
  charla: "Charla con trago",
  especial: "Especial",
};

// Horarios semanales de los shows
export const schedule: ScheduleItem[] = [
  {
    day: "Lunes",
    time: "21:00",
    title: "Locuras en vivo",
    type: "stream",
    description:
      "Arrancamos la semana jugando en vivo, con reacciones, retos y todo lo que se nos cruce antes de pensar.",
  },
  {
    day: "Miércoles",
    time: "22:00",
    title: "Modo Versus",
    type: "stream",
    description:
      "Partidas competitivas, apuestas tontas y la pregunta de siempre: ¿quién la hizo más grande?",
  },
  {
    day: "Jueves",
    time: "22:00",
    title: "Tragos y verdades",
    type: "charla",
    description:
      "Noche de conversación con un trago en la mano. Anécdotas, debates y confesiones sin filtro.",
  },
  {
    day: "Sábado",
    time: "20:00",
    title: "Especial invitados",
    type: "especial",
    description:
      "Cada sábado se suma alguien nuevo a la mesa para contar sus mejores locuras.",
  },
];

// Formatos / pilares del show
export interface Format {
  title: string;
  description: string;
  tag: string;
}

export const formats: Format[] = [
  {
    title: "Streamers de juegos",
    tag: "En vivo",
    description:
      "Partidas en directo, reacciones honestas y retos que nadie en su sano juicio aceptaría. Los juegos son la excusa; el caos es el contenido.",
  },
  {
    title: "Noches de conversación con un trago",
    tag: "Sin filtro",
    description:
      "Cuando bajan las luces y sube el trago, salen las mejores historias. Charlas relajadas sobre la vida, las decisiones impulsivas y todo lo que hacemos antes de pensar.",
  },
];

// Valores / vibra del podcast
export const values: string[] = [
  "Sin filtro",
  "Risas garantizadas",
  "Anécdotas reales",
  "Cero pretensiones",
];

// Episodios / clips destacados (placeholder)
export interface Episode {
  number: number;
  title: string;
  description: string;
  duration: string;
}

export const episodes: Episode[] = [
  {
    number: 12,
    title: "La apuesta que terminó en urgencias",
    description:
      "Una partida normal, una apuesta nada normal y una noche que nadie va a olvidar.",
    duration: "1h 14m",
  },
  {
    number: 11,
    title: "Ex, exes y otras malas ideas",
    description:
      "Noche de tragos donde revisamos las peores decisiones románticas de la mesa.",
    duration: "58m",
  },
  {
    number: 10,
    title: "Speedrun a las 3 AM",
    description:
      "Intentamos batir un récord mundial sin dormir. Spoiler: no lo logramos, pero valió la pena.",
    duration: "1h 02m",
  },
];

// Plataformas donde escuchar / ver (enlaces placeholder)
export interface Platform {
  name: string;
  url: string;
}

export const platforms: Platform[] = [
  { name: "Spotify", url: "#" },
  { name: "YouTube", url: "#" },
  { name: "Twitch", url: "#" },
  { name: "Apple Podcasts", url: "#" },
];

// Redes sociales (enlaces placeholder)
export const socials: Platform[] = [
  { name: "Instagram", url: "#" },
  { name: "TikTok", url: "#" },
  { name: "X", url: "#" },
  { name: "YouTube", url: "#" },
];
