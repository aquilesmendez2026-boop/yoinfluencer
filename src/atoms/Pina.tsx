import { chakra } from "@chakra-ui/react";

/**
 * Piña de modopiña: hojas verdes + cuerpo dorado con textura de rombos.
 * Trazo estilo neón. Escala con `boxSize`/`fontSize` (usa currentColor libre).
 */
export const Pina = chakra("svg", {
  base: { display: "inline-block", flexShrink: 0 },
});

interface PinaProps {
  size?: string | number | Record<string, string | number>;
}

export const PinaLogo = ({ size = "1em" }: PinaProps) => (
  <Pina viewBox="0 0 48 72" boxSize={size} aria-hidden focusable="false">
    <defs>
      <linearGradient id="pina-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f7d038" />
        <stop offset="1" stopColor="#e8a317" />
      </linearGradient>
      <linearGradient id="pina-leaf" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6ce9a6" />
        <stop offset="1" stopColor="#12b76a" />
      </linearGradient>
    </defs>

    {/* Cuerpo */}
    <ellipse cx="24" cy="46" rx="17" ry="22" fill="url(#pina-body)" />
    {/* Textura de rombos */}
    <g stroke="#b9791a" strokeWidth="1.4" fill="none" opacity="0.85" strokeLinecap="round">
      <path d="M10 38 L24 30 L38 38 M10 50 L24 42 L38 50 M13 62 L24 55 L35 62" />
      <path d="M17 34 L17 46 M31 34 L31 46 M24 42 L24 55 M11 44 L11 56 M37 44 L37 56" />
    </g>

    {/* Corona de hojas */}
    <g fill="url(#pina-leaf)" stroke="#0a3d24" strokeWidth="1">
      <path d="M24 2 C21 10 21 18 24 26 C27 18 27 10 24 2 Z" />
      <path d="M24 26 C18 22 13 18 9 12 C13 20 17 24 24 27 Z" />
      <path d="M24 26 C30 22 35 18 39 12 C35 20 31 24 24 27 Z" />
      <path d="M24 27 C16 26 9 25 4 21 C10 27 16 29 24 29 Z" />
      <path d="M24 27 C32 26 39 25 44 21 C38 27 32 29 24 29 Z" />
    </g>
  </Pina>
);
