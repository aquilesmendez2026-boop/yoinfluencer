// Control del modo demo: bandera de solo-lectura + resolución de datos de ejemplo.
// La bandera vive en sessionStorage para que `apiFetch` (que no es un hook) la
// pueda leer sin depender de React.
import { demoFixtures, demoInfluencers, demoArticulos } from "./demoData";

const KEY = "yi_demo";

export function isDemo(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setDemo(on: boolean): void {
  try {
    if (on) sessionStorage.setItem(KEY, "1");
    else sessionStorage.removeItem(KEY);
  } catch {
    /* modo privado: la demo vive solo en memoria vía el provider */
  }
}

/** Devuelve la respuesta de ejemplo para un GET. Nunca lanza. */
export function demoGet<T>(path: string): Promise<T> {
  const clean = path.split("?")[0];

  // Rutas con parámetro:
  if (clean.startsWith("/influencers/")) {
    const id = decodeURIComponent(clean.slice("/influencers/".length));
    const inf = demoInfluencers.find((i) => i.userId === id) ?? demoInfluencers[0];
    return Promise.resolve({ influencer: inf } as T);
  }
  if (clean.startsWith("/episodios/")) {
    const id = decodeURIComponent(clean.slice("/episodios/".length));
    const a = demoArticulos.find((x) => x.id === id) ?? demoArticulos[0];
    return Promise.resolve({ episodio: a } as T);
  }

  // Rutas exactas conocidas; si no está, un objeto vacío (no rompe el .then).
  const fixture = demoFixtures[clean] ?? {};
  return Promise.resolve(fixture as T);
}
