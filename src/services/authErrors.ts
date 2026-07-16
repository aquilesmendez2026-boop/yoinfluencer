import { FirebaseError } from "firebase/app";

/** Traduce los códigos de error de Firebase Auth a mensajes en español. */
export function authErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-email":
        return "El correo no es válido.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Correo o contraseña incorrectos.";
      case "auth/email-already-in-use":
        return "Ese correo ya está registrado.";
      case "auth/weak-password":
        return "La contraseña debe tener al menos 6 caracteres.";
      case "auth/missing-password":
        return "Ingresa tu contraseña.";
      case "auth/too-many-requests":
        return "Demasiados intentos. Intenta más tarde.";
      case "auth/operation-not-allowed":
        return "El acceso por correo no está habilitado en Firebase.";
      case "auth/popup-closed-by-user":
        return "Se cerró la ventana de Google.";
      case "auth/network-request-failed":
        return "Problema de conexión. Revisa tu internet.";
      default:
        return "Ocurrió un error. Intenta de nuevo.";
    }
  }
  return "Ocurrió un error. Intenta de nuevo.";
}
