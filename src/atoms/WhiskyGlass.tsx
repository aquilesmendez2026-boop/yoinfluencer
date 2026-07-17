interface WhiskyGlassProps {
  size?: number | string;
}

/** Ícono de vaso de whisky (tumbler con hielo) para marcar contenido exclusivo. */
export const WhiskyGlass = ({ size = 20 }: WhiskyGlassProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* Vaso */}
    <path d="M5.5 4h13l-1.4 15.5a2 2 0 0 1-2 1.8H8.9a2 2 0 0 1-2-1.8L5.5 4Z" />
    {/* Nivel del whisky */}
    <path d="M6.3 11h11.4" />
    {/* Cubo de hielo */}
    <rect x="9.2" y="12.6" width="3.6" height="3.6" rx="0.7" transform="rotate(14 11 14.4)" />
  </svg>
);
