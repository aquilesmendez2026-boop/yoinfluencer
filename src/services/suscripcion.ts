import { apiFetch } from "./api";
import type { Profile } from "./profile";

export interface Preferencia {
  preferenceId: string;
  amount: number;
  currency: string;
  plan: string;
  mock?: boolean;
}

/** Crea la "preferencia" de pago (mock; en real la crea MercadoPago). */
export const crearPreferencia = () =>
  apiFetch<Preferencia>("/suscripcion/preferencia", { method: "POST" });

/** Confirma el pago (MOCK). En producción lo dispara el webhook de MercadoPago. */
export const pagarMock = () =>
  apiFetch<{ user: Profile }>("/suscripcion/pagar", { method: "POST" }).then((r) => r.user);

export const cancelarSuscripcion = () =>
  apiFetch<{ user: Profile }>("/suscripcion/cancelar", { method: "POST" }).then((r) => r.user);
