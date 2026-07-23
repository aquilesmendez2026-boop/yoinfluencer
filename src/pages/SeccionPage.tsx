import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Box, Center, Container, Heading, HStack, Image, SimpleGrid, Spinner, Text, VStack,
} from "@chakra-ui/react";
import { Layers, User } from "lucide-react";
import { AppHeader } from "../organisms/AppHeader";
import { GlassPanel } from "../atoms/GlassPanel";
import { listSecciones, type Seccion } from "../services/secciones";
import { listContenidos, type Contenido } from "../services/contenidos";

/** Color de acento con fallback al verde de marca. */
const acento = (color?: string) => (color && color.trim() ? color : "#12b76a");

const ArticuloCard = ({ contenido, color }: { contenido: Contenido; color: string }) => (
  <RouterLink to={`/articulo/${contenido.id}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
    <GlassPanel interactive h="full" overflow="hidden">
      <Box h="180px" bg="bg.muted" position="relative">
      {contenido.coverUrl ? (
        <Image src={contenido.coverUrl} alt={contenido.title} w="full" h="full" objectFit="cover" />
      ) : (
        <Center h="full" bg="bg.muted">
          <Box color="ink.400"><Layers size={32} /></Box>
        </Center>
      )}
      <Box position="absolute" top="0" left="0" right="0" h="4px" bg={acento(color)} />
    </Box>
    <VStack align="start" gap="2" p={{ base: "4", md: "5" }}>
      <Heading as="h3" size="lg" fontWeight="800" letterSpacing="tight" color="fg.default" lineClamp={2}>
        {contenido.title}
      </Heading>
      {contenido.resumen && (
        <Text color="fg.muted" fontSize="sm" lineHeight="tall" lineClamp={3}>
          {contenido.resumen}
        </Text>
      )}
      {contenido.autorNombre && (
        <HStack gap="1.5" color="fg.subtle" fontSize="xs" mt="1">
          <User size={13} />
          <Text>{contenido.autorNombre}</Text>
        </HStack>
      )}
      </VStack>
    </GlassPanel>
  </RouterLink>
);

export const SeccionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [secciones, setSecciones] = useState<Seccion[] | null>(null);
  const [contenidos, setContenidos] = useState<Contenido[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const seccion = useMemo(
    () => (secciones ?? []).find((s) => s.slug === slug) ?? null,
    [secciones, slug]
  );

  useEffect(() => {
    setSecciones(null);
    setError(null);
    listSecciones()
      .then(setSecciones)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudieron cargar las secciones.");
        setSecciones([]);
      });
  }, [slug]);

  useEffect(() => {
    if (!seccion) {
      setContenidos(null);
      return;
    }
    setContenidos(null);
    listContenidos({ seccion: seccion.id })
      .then(setContenidos)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudieron cargar los artículos.");
        setContenidos([]);
      });
  }, [seccion]);

  const noExiste = secciones !== null && !seccion;

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />

      <Container maxW="1200px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
        {secciones === null ? (
          <Center py="16">
            <Spinner color="brand.primary" size="xl" borderWidth="3px" />
          </Center>
        ) : noExiste ? (
          <VStack align="start" gap="3" py="10">
            <Heading as="h1" size={{ base: "2xl", md: "3xl" }} fontWeight="900" letterSpacing="tighter">
              Sección no encontrada
            </Heading>
            <Text color="fg.muted">La sección que buscas no existe o dejó de estar disponible.</Text>
          </VStack>
        ) : (
          <VStack align="stretch" gap="10">
            <VStack align="start" gap="2">
              <HStack gap="2" color="brand.primary">
                <Box w="2.5" h="2.5" borderRadius="full" bg={acento(seccion!.color)} />
                <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase">
                  Sección
                </Text>
              </HStack>
              <Heading as="h1" size={{ base: "3xl", md: "5xl" }} fontWeight="900" letterSpacing="tighter">
                {seccion!.nombre}
              </Heading>
              {seccion!.descripcion && (
                <Text color="fg.muted" maxW="2xl">{seccion!.descripcion}</Text>
              )}
            </VStack>

            {contenidos === null ? (
              <Center py="16">
                <Spinner color="brand.primary" size="lg" />
              </Center>
            ) : error ? (
              <Text color="fg.subtle">{error}</Text>
            ) : contenidos.length === 0 ? (
              <Text color="fg.subtle">Todavía no hay artículos en esta sección.</Text>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
                {contenidos.map((c) => (
                  <ArticuloCard key={c.id} contenido={c} color={seccion!.color} />
                ))}
              </SimpleGrid>
            )}
          </VStack>
        )}
      </Container>
    </Box>
  );
};
