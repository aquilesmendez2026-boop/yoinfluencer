import { chakra } from "@chakra-ui/react";

const Svg = chakra("svg", { base: { display: "inline-block", flexShrink: 0 } });

type Size = string | number | Record<string, string | number>;

const VERDE = "#3be081";
const ORO = "#f5c518";

/** Red de rombos del cuerpo (patrón de piña), recortada al óvalo. */
const crosshatch = () => {
  const lineas: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let c = -80; c <= 200; c += 15) {
    lineas.push({ x1: c, y1: 40, x2: c + 92, y2: 220 }); // diagonal \
    lineas.push({ x1: c, y1: 220, x2: c + 92, y2: 40 }); // diagonal /
  }
  return lineas;
};

interface PinaProps {
  size?: Size;
  /** Añade halo neón (glow verde + dorado). */
  neon?: boolean;
}

/**
 * Piña de modo piña en estilo neón: hojas verdes de contorno + cuerpo dorado
 * con red de rombos. Escala con `size` (boxSize).
 */
export const PinaLogo = ({ size = "1em", neon }: PinaProps) => (
  <Svg
    viewBox="0 0 120 208"
    boxSize={size}
    aria-hidden
    focusable="false"
    filter={
      neon
        ? "drop-shadow(0 0 6px rgba(59,224,129,0.7)) drop-shadow(0 0 10px rgba(245,197,24,0.5))"
        : undefined
    }
  >
    <defs>
      <clipPath id="pina-body">
        <ellipse cx="60" cy="132" rx="44" ry="56" />
      </clipPath>
    </defs>

    {/* Cuerpo: óvalo + red de rombos recortada */}
    <ellipse cx="60" cy="132" rx="44" ry="56" fill="none" stroke={ORO} strokeWidth="3" />
    <g clipPath="url(#pina-body)" stroke={ORO} strokeWidth="1.6" opacity="0.9" strokeLinecap="round">
      {crosshatch().map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
      ))}
    </g>

    {/* Hojas: contornos verdes que salen del pivote (60, 80) */}
    <g
      fill="none"
      stroke={VERDE}
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {[-62, -38, -15, 0, 15, 38, 62].map((r, i) => {
        const largo = Math.abs(r) > 45 ? 46 : Math.abs(r) > 20 ? 58 : 66;
        return (
          <path
            key={i}
            transform={`translate(60 82) rotate(${r})`}
            d={`M0 0 C -7 ${-largo * 0.35}, -6 ${-largo * 0.72}, 0 ${-largo} C 6 ${-largo * 0.72}, 7 ${-largo * 0.35}, 0 0 Z`}
          />
        );
      })}
    </g>
  </Svg>
);
