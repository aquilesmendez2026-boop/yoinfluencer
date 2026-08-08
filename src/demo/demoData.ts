// ─────────────────────────────────────────────────────────────
// Datos de EJEMPLO para el modo demo (invitado, solo lectura).
// No salen del navegador ni tocan la base real. El contenido es
// ficticio y sobrio, pensado para mostrar la plataforma.
// ─────────────────────────────────────────────────────────────
import type { Profile } from "../services/profile";

/** Usuario sintético de la demo (sin Firebase). */
export const DEMO_USER = {
  uid: "demo-user",
  email: "demo@modopina.cl",
  displayName: "Invitado Demo",
  photoURL: null as string | null,
};

/** Perfil de la demo: super admin + dueño de un local, para poder recorrer todo. */
export const DEMO_PROFILE: Profile = {
  userId: "demo-user",
  email: "demo@modopina.cl",
  name: "Invitado Demo",
  role: "super_admin",
  alias: "Invitado Demo",
  bio: "Cuenta de demostración para recorrer la plataforma.",
  secciones: [],
  localId: "loc-demo-1",
  plan: "premium",
};

const secciones = [
  { id: "sec-1", nombre: "Vida Swinger", slug: "vida-swinger", descripcion: "Historias, códigos y cultura del ambiente.", color: "#12b76a", orden: 0, activa: true },
  { id: "sec-2", nombre: "Shibari", slug: "shibari", descripcion: "Arte del atado japonés: técnica, estética y seguridad.", color: "#c4614a", orden: 1, activa: true },
  { id: "sec-3", nombre: "Bondage", slug: "bondage", descripcion: "Ataduras y juego con cuerdas, siempre consensuado.", color: "#7f9c8b", orden: 2, activa: true },
  { id: "sec-4", nombre: "BDSM", slug: "bdsm", descripcion: "Dinámicas de poder, roles y práctica segura.", color: "#c9a227", orden: 3, activa: true },
  { id: "sec-5", nombre: "Arte Erótico", slug: "arte-erotico", descripcion: "Fotografía, ilustración y performance del cuerpo.", color: "#6ce9a6", orden: 4, activa: true },
  { id: "sec-6", nombre: "Clubs y Eventos", slug: "clubs-y-eventos", descripcion: "Reseñas de locales, fiestas privadas y encuentros.", color: "#32d583", orden: 5, activa: true },
];

const cuerpo = (t: string) =>
  `${t}\n\nEste es un artículo de ejemplo del modo demo. Sirve para mostrar cómo se lee el contenido, ` +
  `cómo se navega por secciones y cómo se ve la página de cada autor.\n\nTodo lo que se publica en la plataforma ` +
  `es entre adultos, consensuado y con respeto. Reemplaza este texto por contenido real cuando salgas de la demo.`;

const art = (id: string, title: string, sec: string, autorId: string, autorNombre: string, resumen: string) => ({
  id, title, seccion: sec, resumen, cuerpo: cuerpo(title),
  coverUrl: "", estado: "publicado", autorId, autorNombre,
  premium: false, links: { instagram: "", tiktok: "", youtube: "" },
  createdAt: "2026-07-10T12:00:00Z", publishedAt: "2026-07-10T12:00:00Z",
});

const articulos = [
  art("art-1", "Primeros pasos en el ambiente", "sec-1", "inf-1", "Valentina", "Qué esperar de tu primera fiesta de parejas."),
  art("art-2", "Shibari para principiantes: seguridad ante todo", "sec-2", "inf-2", "Mateo", "Los nudos básicos y qué zonas evitar."),
  art("art-3", "Consentimiento y negociación de escena", "sec-4", "inf-1", "Valentina", "Cómo acordar límites antes de empezar."),
  art("art-4", "Fotografía de desnudo artístico: luz y pose", "sec-5", "inf-3", "Renata", "Ideas para retratar el cuerpo con respeto."),
  art("art-5", "Reseña: los mejores clubs de la ciudad", "sec-6", "inf-2", "Mateo", "Recorrimos los locales del momento."),
];

const influencers = [
  { userId: "inf-1", alias: "Valentina", bio: "Escribe sobre vida swinger y BDSM. Comunidad y consenso ante todo.", role: "editor", secciones: ["sec-1", "sec-4"], pais: "Chile", instagram: "@valentina.demo", seguidores: 48200, photoURL: "" },
  { userId: "inf-2", alias: "Mateo", bio: "Rigger y reseñador de clubs. Técnica, estética y seguridad.", role: "influencer", secciones: ["sec-2", "sec-6"], pais: "Chile", instagram: "@mateo.demo", seguidores: 15700, photoURL: "" },
  { userId: "inf-3", alias: "Renata", bio: "Fotógrafa de arte erótico.", role: "influencer", secciones: ["sec-5"], pais: "Argentina", instagram: "@renata.demo", seguidores: 9300, photoURL: "" },
];

const evento = (id: string, fecha: string, hora: string, titulo: string, descripcion: string) => ({ id, fecha, hora, titulo, descripcion });

const lugares = [
  {
    id: "loc-demo-1", nombre: "Club Éxtasis", categoria: "club", direccion: "Av. Ejemplo 4000", ciudad: "Santiago",
    mapsUrl: "", horario: "Vie y Sáb 23:00 - 05:00 · Entrada solo en pareja", telefono: "+56 9 5555 4444", web: "https://ejemplo.cl",
    descripcion: "Club de ambiente para parejas. Discreto, con música y áreas privadas.", rating: 0, resena: "", precio: "$$$",
    recomendado: true, visitadoEl: "", contenidoId: "", contenidoUrl: "", ownerId: "demo-user", aprobado: true,
    eventos: [evento("ev-1", "2026-08-01", "23:30", "Noche de máscaras", "Dress code: antifaz obligatorio."), evento("ev-2", "2026-08-15", "23:00", "Aniversario", "Barra libre hasta la 01:00.")],
    fotos: [],
  },
  {
    id: "loc-demo-2", nombre: "Sauna Central", categoria: "sauna", direccion: "Calle Ejemplo 123", ciudad: "Santiago",
    mapsUrl: "", horario: "Lun a Dom 20:00 - 04:00", telefono: "+56 9 1111 2222", web: "",
    descripcion: "Sauna mixta con áreas de relajación.", rating: 4, resena: "Ambiente cuidado y limpio.", precio: "$$",
    recomendado: false, visitadoEl: "2026-06-20", contenidoId: "", contenidoUrl: "", ownerId: "", aprobado: true,
    eventos: [], fotos: [],
  },
  {
    id: "loc-demo-3", nombre: "Bar La Reserva", categoria: "bar", direccion: "Pasaje Ejemplo 50", ciudad: "Valparaíso",
    mapsUrl: "", horario: "Jue a Sáb 21:00 - 03:00", telefono: "", web: "",
    descripcion: "Bar temático con noches de ambiente.", rating: 0, resena: "", precio: "$$",
    recomendado: false, visitadoEl: "", contenidoId: "", contenidoUrl: "", ownerId: "otro-user", aprobado: false,
    eventos: [evento("ev-3", "2026-08-10", "22:00", "Noche de estreno", "Primera fiesta del local.")], fotos: [],
  },
];

const eventosAgenda = [
  { id: "ag-1", date: "2026-08-01", time: "23:30", title: "Club Éxtasis: Noche de máscaras", type: "evento", description: "Evento del local.", premium: false, source: "local", lugarId: "loc-demo-1", lugarNombre: "Club Éxtasis" },
  { id: "ag-2", date: "2026-07-28", time: "20:00", title: "Nuevos artículos", type: "publicacion", description: "El staff publica los artículos de la semana.", premium: false },
  { id: "ag-3", date: "2026-07-30", time: "21:00", title: "Taller de shibari en vivo", type: "en_vivo", description: "Técnica y seguridad, en directo.", premium: false },
];

const usuarios = [
  { userId: "demo-user", email: "demo@modopina.cl", name: "Invitado Demo", alias: "Invitado Demo", role: "super_admin", secciones: [] },
  { userId: "inf-1", email: "valentina@demo.cl", name: "Valentina", alias: "Valentina", role: "editor", secciones: ["sec-1", "sec-4"] },
  { userId: "inf-2", email: "mateo@demo.cl", name: "Mateo", alias: "Mateo", role: "influencer", secciones: ["sec-2", "sec-6"] },
  { userId: "inf-3", email: "renata@demo.cl", name: "Renata", alias: "Renata", role: "influencer", secciones: ["sec-5"] },
  { userId: "u-5", email: "lector@demo.cl", name: "Lector", alias: "", role: "miembro", secciones: [] },
];

const redes = [
  { id: "instagram", plataforma: "instagram", handle: "@modopina", url: "https://instagram.com/modopina", seguidores: 48200, destacada: true, orden: 0 },
  { id: "tiktok", plataforma: "tiktok", handle: "@modopina", url: "https://tiktok.com/@modopina", seguidores: 31500, destacada: true, orden: 1 },
  { id: "x", plataforma: "x", handle: "@modopina", url: "https://x.com/modopina", seguidores: 9800, destacada: false, orden: 2 },
];

const lives = [
  { id: "lv-1", titulo: "Charla abierta con la comunidad", fecha: "2026-07-15", plataforma: "youtube", url: "https://youtube.com", duracion: "1h 20m", espectadores: 640, descripcion: "Preguntas y respuestas en vivo." },
];

/** Respuestas por ruta (pathname exacto → objeto de respuesta del servicio). */
export const demoFixtures: Record<string, unknown> = {
  "/me": { user: DEMO_PROFILE },
  "/secciones": { secciones },
  "/episodios": { episodios: articulos },
  "/influencers": { influencers },
  "/lugares": { lugares },
  "/mi-local": { lugar: lugares[0] },
  "/eventos": { eventos: eventosAgenda },
  "/redes": { redes },
  "/live": { live: { isLive: false, videoId: "", title: "", platform: "youtube" } },
  "/lives": { lives },
  "/usuarios": { usuarios },
  "/equipo": { equipo: influencers.map((i) => ({ userId: i.userId, nombre: i.alias })) },
  "/descargas": { descargas: [] },
  "/preguntas": { preguntas: [] },
  "/reuniones": { reuniones: [] },
  "/notas": { notas: [] },
  "/produccion": { produccion: [] },
  "/plantillas": { plantillas: {} },
  "/notificaciones": { notificaciones: [] },
};

export const demoArticulos = articulos;
export const demoInfluencers = influencers;
