import { apiFetch } from "./api";

export interface Profile {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  apodo?: string;
  pais?: string;
  region?: string;
  telefono?: string;
  avatarKey?: string;
  /** Foto propia (URL firmada de S3), si el usuario subió una. */
  photoURL?: string;
}

export interface ProfileInput {
  apodo?: string;
  pais?: string;
  region?: string;
  telefono?: string;
  avatarKey?: string;
}

export const getProfile = () =>
  apiFetch<{ user: Profile }>("/me").then((r) => r.user);

export const updateProfile = (data: ProfileInput) =>
  apiFetch<{ user: Profile }>("/me", {
    method: "PUT",
    body: JSON.stringify(data),
  }).then((r) => r.user);

/** Sube la foto a S3 y devuelve el avatarKey para guardar en el perfil. */
export async function uploadAvatar(file: File): Promise<string> {
  const { uploadUrl, key, contentType } = await apiFetch<{
    uploadUrl: string;
    key: string;
    contentType: string;
  }>("/avatar-upload", {
    method: "POST",
    body: JSON.stringify({ contentType: file.type }),
  });

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!res.ok) throw new Error("No se pudo subir la imagen.");
  return key;
}
