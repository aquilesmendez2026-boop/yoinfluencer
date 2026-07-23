import { Box, Center, Container, Heading, Text, VStack, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { AppHeader } from "../organisms/AppHeader";
import { ContenidosManager } from "../organisms/ContenidosManager";
import { useAuth } from "../providers/AuthProvider";

/**
 * Trastienda de redacción del staff. El editor de artículos vive también en el
 * panel de admin, pero un influencer no llega ahí (es solo admin); esta ruta le
 * da acceso a su propio editor sin abrirle la gestión del sitio.
 */
export const EscribirPage = () => {
  const { role, isInfluencer } = useAuth();
  const navigate = useNavigate();

  if (role === null) {
    return (
      <Center minH="100vh" bg="bg.canvas">
        <Box color="brand.400">Cargando…</Box>
      </Center>
    );
  }

  if (!isInfluencer) {
    return (
      <Box bg="bg.canvas" color="fg.default" minH="100vh">
        <AppHeader />
        <Center minH="60vh">
          <VStack gap="4" textAlign="center" px="6">
            <ShieldAlert size={48} color="#c9a227" />
            <Heading size="lg">Solo para el staff</Heading>
            <Text color="fg.muted" maxW="md">
              Publicar artículos es exclusivo de los creadores del medio. Si crees que deberías
              tener acceso, pídele a un administrador que te sume al staff.
            </Text>
            <Button onClick={() => navigate("/")} borderRadius="full" variant="outline" borderColor="border.subtle">
              Volver al inicio
            </Button>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />
      <Container maxW="1100px" py={{ base: "8", md: "12" }}>
        <VStack align="stretch" gap="6">
          <VStack align="start" gap="1">
            <Heading as="h1" size={{ base: "2xl", md: "3xl" }} fontWeight="900" letterSpacing="tighter">
              Escribir
            </Heading>
            <Text color="fg.muted">Crea y publica artículos en tus secciones asignadas.</Text>
          </VStack>
          <ContenidosManager />
        </VStack>
      </Container>
    </Box>
  );
};
