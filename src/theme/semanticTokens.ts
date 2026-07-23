export const semanticTokens = {
  colors: {
    bg: {
      canvas: { value: "{colors.ink.950}" },
      surface: { value: "rgba(23, 27, 24, 0.55)" },
      muted: { value: "{colors.ink.800}" },
      elevated: { value: "rgba(35, 40, 35, 0.65)" },
    },
    fg: {
      default: { value: "{colors.ink.50}" },
      muted: { value: "{colors.ink.200}" },
      subtle: { value: "{colors.ink.300}" },
      accent: { value: "{colors.brand.400}" },
      inverted: { value: "{colors.ink.950}" },
    },
    border: {
      subtle: { value: "rgba(255, 255, 255, 0.10)" },
      brand: { value: "rgba(50, 213, 131, 0.28)" },
    },
    brand: {
      primary: { value: "{colors.brand.500}" },
      secondary: { value: "{colors.brand.700}" },
      accent: { value: "{colors.accent.gold}" },
    },
  },
  shadows: {
    glass: {
      value: "0 8px 32px 0 rgba(0, 0, 0, 0.55)",
    },
    // Realce suave en verde: halo contenido, no glow de neón.
    brand: {
      value: "0 4px 20px rgba(18, 183, 106, 0.22)",
    },
    brandStrong: {
      value: "0 6px 28px rgba(18, 183, 106, 0.34)",
    },
  },
  gradients: {
    brand: {
      value: "linear-gradient(135deg, #12b76a 0%, #054f31 100%)",
    },
    glass: {
      value:
        "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
    },
  },
};
