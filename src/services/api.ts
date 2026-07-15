import { auth } from "./firebase";

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

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
    throw new Error(`API ${response.status}: ${text || response.statusText}`);
  }

  return response.json() as Promise<T>;
}
