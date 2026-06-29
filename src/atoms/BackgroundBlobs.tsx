import { Box } from "@chakra-ui/react";

/**
 * Orbes neón difuminados que dan la vibra nocturna de fondo.
 * Se posicionan en absoluto detrás del contenido (zIndex 0).
 */
export const BackgroundBlobs = () => {
  return (
    <Box
      aria-hidden="true"
      position="absolute"
      inset="0"
      zIndex="0"
      overflow="hidden"
      pointerEvents="none"
    >
      <Box
        position="absolute"
        top="-10%"
        left="-5%"
        w={{ base: "260px", md: "480px" }}
        h={{ base: "260px", md: "480px" }}
        bg="neon.cyan"
        opacity="0.18"
        filter="blur(90px)"
        borderRadius="full"
        animation="blob 14s ease-in-out infinite"
      />
      <Box
        position="absolute"
        bottom="-10%"
        right="-5%"
        w={{ base: "300px", md: "560px" }}
        h={{ base: "300px", md: "560px" }}
        bg="neon.magenta"
        opacity="0.16"
        filter="blur(100px)"
        borderRadius="full"
        animation="blob 18s ease-in-out infinite reverse"
      />
      <Box
        position="absolute"
        top="40%"
        left="50%"
        transform="translateX(-50%)"
        w={{ base: "200px", md: "360px" }}
        h={{ base: "200px", md: "360px" }}
        bg="neon.amber"
        opacity="0.08"
        filter="blur(90px)"
        borderRadius="full"
        animation="blob 16s ease-in-out infinite"
      />
    </Box>
  );
};
