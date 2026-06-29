export const semanticTokens = {
  colors: {
    bg: {
      canvas: { value: "{colors.ink.950}" },
      surface: { value: "rgba(22, 22, 38, 0.55)" },
      muted: { value: "{colors.ink.800}" },
      elevated: { value: "rgba(34, 34, 58, 0.65)" },
    },
    fg: {
      default: { value: "{colors.ink.50}" },
      muted: { value: "{colors.ink.200}" },
      subtle: { value: "{colors.ink.300}" },
      accent: { value: "{colors.neon.cyan}" },
      inverted: { value: "{colors.ink.950}" },
    },
    border: {
      subtle: { value: "rgba(255, 255, 255, 0.10)" },
      neon: { value: "rgba(34, 211, 238, 0.35)" },
    },
    brand: {
      primary: { value: "{colors.neon.cyan}" },
      secondary: { value: "{colors.neon.magenta}" },
      accent: { value: "{colors.neon.amber}" },
    },
  },
  shadows: {
    glass: {
      value: "0 8px 32px 0 rgba(0, 0, 0, 0.55)",
    },
    neon: {
      value: "0 0 24px rgba(34, 211, 238, 0.35)",
    },
    neonMagenta: {
      value: "0 0 24px rgba(217, 70, 239, 0.35)",
    },
  },
  gradients: {
    brand: {
      value: "linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)",
    },
    glass: {
      value:
        "linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.01) 100%)",
    },
  },
};
