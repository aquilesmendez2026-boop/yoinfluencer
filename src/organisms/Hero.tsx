import { Box, Button, Flex, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { Play, ChevronDown } from "lucide-react";
import { BackgroundBlobs } from "../atoms/BackgroundBlobs";

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
        <Text
          fontSize="sm"
          fontWeight="700"
          letterSpacing="widest"
          textTransform="uppercase"
          color="brand.primary"
        >
          Un medio hecho por la comunidad
        </Text>

        <Heading
          as="h1"
          fontSize={{ base: "5xl", md: "7xl", lg: "8xl" }}
          fontWeight="900"
          letterSpacing="tighter"
          lineHeight="0.95"
        >
          <Box as="span" color="fg.default">
            SE BUSCA{" "}
          </Box>
          <Box
            as="span"
            backgroundImage="linear-gradient(135deg, #6ce9a6 0%, #12b76a 100%)"
            backgroundClip="text"
            color="transparent"
          >
            NOMBRE!!!
          </Box>
        </Heading>

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
