import { Box, Button, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { Play, ChevronDown } from "lucide-react";
import { BackgroundBlobs } from "../atoms/BackgroundBlobs";
import { PinaLogo } from "../atoms/Pina";

export const Hero = () => {
  return (
    <Flex
      as="section"
      id="hero"
      position="relative"
      minH="100vh"
      align="center"
      justify="center"
      overflow="hidden"
      px={{ base: "5", md: "8" }}
      pt="20"
    >
      <BackgroundBlobs />

      <VStack
        position="relative"
        zIndex="1"
        gap="6"
        textAlign="center"
        maxW="4xl"
        animation="fadeIn 0.8s ease-out"
      >
        {/* Piña que entra girando y aterriza al revés (guiño swinger 🍍). */}
        <Box animation="sway 4s ease-in-out infinite" mb="-2">
          <Box
            animation="pinaFlip 1.7s cubic-bezier(0.22, 1, 0.36, 1) both"
            filter="drop-shadow(0 0 14px rgba(50, 213, 131, 0.55)) drop-shadow(0 0 22px rgba(245, 197, 24, 0.45))"
          >
            <PinaLogo size={{ base: "132px", md: "180px" }} />
          </Box>
        </Box>

        {/* El nombre aparece cuando la piña ya quedó al revés. */}
        <Box
          as="h1"
          fontFamily="heading"
          fontWeight="900"
          letterSpacing="tighter"
          lineHeight="0.95"
          fontSize={{ base: "5xl", md: "7xl", lg: "8xl" }}
          animation="nameReveal 0.7s ease-out 1.5s both"
        >
          <Box as="span" color="brand.400">modo</Box>
          <Box as="span" color="accent.gold">piña</Box>
        </Box>

        <Text
          fontSize={{ base: "lg", md: "2xl" }}
          color="fg.muted"
          maxW="2xl"
          lineHeight="tall"
        >
          Historias, cultura y experiencias del{" "}
          <Box as="span" color="fg.default" fontWeight="600">
            mundo swinger
          </Box>
          . Escrito por su propia comunidad: vida swinger, shibari, bondage, BDSM y arte erótico, sin prejuicios.
        </Text>

        <HStack gap="4" flexWrap="wrap" justify="center" pt="2">
          <Button
            as="a"
            // @ts-expect-error Chakra Button renders an anchor via `as`
            href="#secciones"
            size="xl"
            h="14"
            px="8"
            borderRadius="full"
            color="fg.inverted"
            fontWeight="700"
            backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
            _hover={{ opacity: 0.92, transform: "translateY(-2px)", boxShadow: "brand" }}
            transition="all 0.3s"
          >
            <Play size={20} style={{ marginRight: "8px" }} />
            Explorar secciones
          </Button>
          <Button
            as="a"
            // @ts-expect-error Chakra Button renders an anchor via `as`
            href="#schedule"
            size="xl"
            h="14"
            px="8"
            borderRadius="full"
            variant="outline"
            borderColor="border.subtle"
            color="fg.default"
            bg="bg.surface"
            backdropFilter="blur(12px)"
            _hover={{ borderColor: "border.brand", transform: "translateY(-2px)" }}
            transition="all 0.3s"
          >
            Ver agenda
          </Button>
        </HStack>
      </VStack>

      {/* Indicador de scroll */}
      <Box
        position="absolute"
        bottom="8"
        left="50%"
        transform="translateX(-50%)"
        color="fg.subtle"
        zIndex="1"
        animation="float 2.5s ease-in-out infinite"
      >
        <ChevronDown size={28} />
      </Box>
    </Flex>
  );
};
