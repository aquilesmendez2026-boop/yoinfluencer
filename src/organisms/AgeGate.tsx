import { useState } from "react";
import { Box, Button, Center, Heading, Text, VStack, HStack } from "@chakra-ui/react";
import { ShieldAlert } from "lucide-react";
import { Logo } from "../atoms/Logo";
import { BackgroundBlobs } from "../atoms/BackgroundBlobs";

const CLAVE = "yi_age_ok";

/** ¿Ya confirmó ser mayor de edad en este dispositivo? */
export function ageConfirmada(): boolean {
  try {
    return localStorage.getItem(CLAVE) === "1";
  } catch {
    return false;
  }
}

/**
 * Aviso de contenido para adultos. Se muestra ANTES que nada (incluso antes del
 * login) y bloquea el sitio hasta confirmar +18. La confirmación se guarda en
 * localStorage; no reemplaza una verificación de identidad real.
 */
export const AgeGate = ({ onConfirm }: { onConfirm: () => void }) => {
  const [saliendo, setSaliendo] = useState(false);

  const confirmar = () => {
    try {
      localStorage.setItem(CLAVE, "1");
    } catch {
      /* modo privado: igual dejamos pasar en esta sesión */
    }
    onConfirm();
  };

  return (
    <Box position="relative" minH="100vh" bg="bg.canvas" color="fg.default" overflow="hidden">
      <BackgroundBlobs />
      <Center position="relative" zIndex="1" minH="100vh" px="6">
        <VStack
          gap="6"
          maxW="440px"
          textAlign="center"
          bg="bg.surface"
          backdropFilter="blur(14px)"
          border="1px solid"
          borderColor="border.brand"
          borderRadius="2xl"
          boxShadow="glass"
          p={{ base: "8", md: "10" }}
        >
          <Logo fontSize="3xl" />
          <Box color="brand.400">
            <ShieldAlert size={40} />
          </Box>
          <Heading as="h1" size="lg" fontWeight="800">
            Contenido para mayores de 18 años
          </Heading>
          <Text color="fg.muted" fontSize="sm" lineHeight="tall">
            Este sitio trata temas de sexualidad adulta, ambiente swinger y prácticas de BDSM,
            shibari y arte erótico, con fines informativos y de comunidad. Al continuar declaras
            que tienes al menos 18 años y que deseas ver este contenido.
          </Text>
          <HStack gap="3" w="full" pt="2">
            <Button
              flex="1"
              variant="outline"
              borderColor="border.subtle"
              color="fg.muted"
              opacity={saliendo ? 0.6 : 1}
              onClick={() => {
                setSaliendo(true);
                window.location.href = "https://www.google.com";
              }}
            >
              Soy menor / salir
            </Button>
            <Button
              flex="1"
              color="fg.inverted"
              fontWeight="700"
              backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
              _hover={{ opacity: 0.92, boxShadow: "brand" }}
              onClick={confirmar}
            >
              Tengo +18, entrar
            </Button>
          </HStack>
        </VStack>
      </Center>
    </Box>
  );
};
