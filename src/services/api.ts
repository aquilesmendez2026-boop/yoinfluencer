import { auth } from "./firebase";

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

/** Error del API con el status HTTP y el cuerpo ya parseado (si venía en JSON). */
export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any, fallback: string) {
    super((body && typeof body === "object" && body.error) || fallback);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Llama al backend adjuntando el Firebase ID token como Bearer.
 * Lanza si no hay sesión o si el API responde con error.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_URL) {
    throw new Error("VITE_API_URL no está configurada todavía.");
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No hay sesión iniciada.");
  }

  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let body: any = text;
    try { body = JSON.parse(text); } catch { /* texto plano */ }
    throw new ApiError(response.status, body, `API ${response.status}: ${text || response.statusText}`);
  }

  return response.json() as Promise<T>;
}
