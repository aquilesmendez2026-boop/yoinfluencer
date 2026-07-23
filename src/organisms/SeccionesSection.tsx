import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Box, Button, Center, Heading, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { GlassPanel } from "../atoms/GlassPanel";
import { listSecciones, type Seccion } from "../services/secciones";

/** Color de acento con fallback al verde de marca. */
const acento = (color?: string) => (color && color.trim() ? color : "#12b76a");

export const SeccionesSection = () => {
  const navigate = useNavigate();
  const [secciones, setSecciones] = useState<Seccion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSecciones()
      // En la home mostramos solo las 3 primeras; el resto va en /secciones.
      .then((s) => setSecciones([...s].filter((x) => x.activa).sort((a, b) => a.orden - b.orden).slice(0, 3)))
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudieron cargar las secciones.");
        setSecciones([]);
      });
  }, []);

  return (
    <Section id="secciones" bg="bg.muted">
      <VStack gap="10" w="full">
        <SectionTitle
          eyebrow="Secciones"
          title="Explora por tema"
          subtitle="Vida swinger, shibari, bondage, arte erótico y todo lo que cubre la redacción."
        />

        {secciones === null ? (
          <Center py="10">
            <Spinner color="brand.primary" size="lg" />
          </Center>
        ) : error ? (
          <Text color="fg.subtle">{error}</Text>
        ) : secciones.length === 0 ? (
          <Text color="fg.subtle">Muy pronto abriremos nuestras secciones.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6" w="full">
            {secciones.map((s) => (
              <RouterLink key={s.id} to={`/seccion/${s.slug}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
                <GlassPanel
                  interactive
                  h="full"
                  p={{ base: "5", md: "6" }}
                  position="relative"
                  overflow="hidden"
                >
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

        <Button
          onClick={() => navigate("/secciones")}
          size="lg"
          borderRadius="full"
          px="7"
          variant="outline"
          borderColor="border.brand"
          color="fg.default"
          bg="bg.surface"
          _hover={{ boxShadow: "brand", transform: "translateY(-2px)" }}
          transition="all 0.3s"
        >
          Ver todas las secciones
          <ArrowRight size={18} style={{ marginLeft: "8px" }} />
        </Button>
      </VStack>
    </Section>
  );
};
