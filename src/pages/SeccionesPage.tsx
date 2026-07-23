import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box, Center, Container, Heading, SimpleGrid, Spinner, Text, VStack,
} from "@chakra-ui/react";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { AppHeader } from "../organisms/AppHeader";
import { GlassPanel } from "../atoms/GlassPanel";
import { listSecciones, type Seccion } from "../services/secciones";

/** Color de acento con fallback al verde de marca. */
const acento = (color?: string) => (color && color.trim() ? color : "#12b76a");

/** Índice completo de secciones (destino del bloque "Ver todas las secciones"). */
export const SeccionesPage = () => {
  const [secciones, setSecciones] = useState<Seccion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSecciones()
      .then((s) => setSecciones([...s].filter((x) => x.activa).sort((a, b) => a.orden - b.orden)))
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudieron cargar las secciones.");
        setSecciones([]);
      });
  }, []);

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />
      <Container maxW="1200px" py={{ base: "8", md: "12" }}>
        <VStack align="stretch" gap="8">
          <VStack align="start" gap="2">
            <Box display="inline-flex" alignItems="center" gap="2" color="brand.300" fontWeight="700" fontSize="sm" textTransform="uppercase" letterSpacing="widest">
              <LayoutGrid size={16} /> Secciones
            </Box>
            <Heading as="h1" size={{ base: "2xl", md: "3xl" }} fontWeight="900" letterSpacing="tighter">
              Todas las secciones
            </Heading>
            <Text color="fg.muted" maxW="2xl">
              Los temas que cubre la redacción. Entra a cualquiera para leer sus artículos.
            </Text>
          </VStack>

          {secciones === null ? (
            <Center py="16"><Spinner color="brand.primary" size="lg" /></Center>
          ) : error ? (
            <Text color="fg.subtle">{error}</Text>
          ) : secciones.length === 0 ? (
            <Text color="fg.subtle">Muy pronto abriremos nuestras secciones.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6" w="full">
              {secciones.map((s) => (
                <RouterLink key={s.id} to={`/seccion/${s.slug}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
                  <GlassPanel interactive h="full" p={{ base: "5", md: "6" }} position="relative" overflow="hidden">
                    <Box position="absolute" top="0" left="0" bottom="0" w="4px" bg={acento(s.color)} />
                    <VStack align="start" gap="3" pl="2">
                      <Box w="2.5" h="2.5" borderRadius="full" bg={acento(s.color)} />
                      <Heading as="h3" size={{ base: "xl", md: "2xl" }} fontWeight="800" letterSpacing="tight" color="fg.default">
                        {s.nombre}
                      </Heading>
                      {s.descripcion && (
                        <Text color="fg.muted" lineHeight="tall" lineClamp={3}>
                          {s.descripcion}
                        </Text>
                      )}
                      <Box display="inline-flex" alignItems="center" gap="1.5" mt="1" color="brand.300" fontSize="sm" fontWeight="700">
                        Ver artículos <ArrowRight size={15} />
                      </Box>
                    </VStack>
                  </GlassPanel>
                </RouterLink>
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Container>
    </Box>
  );
};
