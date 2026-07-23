import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Center, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { ContenidoCard } from "../molecules/ContenidoCard";
import { listContenidos, type Contenido } from "../services/contenidos";
import { listSecciones, seccionMap, type Seccion } from "../services/secciones";

export const ContenidosSection = () => {
  const navigate = useNavigate();
  const [contenidos, setContenidos] = useState<Contenido[] | null>(null);
  const [secciones, setSecciones] = useState<Record<string, Seccion>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listContenidos(), listSecciones()])
      .then(([arts, secs]) => {
        setSecciones(seccionMap(secs));
        setContenidos(arts.slice(0, 3));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudieron cargar los artículos.");
        setContenidos([]);
      });
  }, []);

  return (
    <Section id="contenidos" bg="bg.muted">
      <VStack gap="10" w="full">
        <SectionTitle
          eyebrow="Artículos"
          title="Lo último publicado"
          subtitle="Las notas más recientes del staff. Hay muchas más esperándote."
        />

        {contenidos === null ? (
          <Center py="10">
            <Spinner color="brand.primary" size="lg" />
          </Center>
        ) : error ? (
          <Text color="fg.subtle">{error}</Text>
        ) : contenidos.length === 0 ? (
          <Text color="fg.subtle">Muy pronto publicaremos nuestros primeros artículos.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 3 }} gap="6" w="full">
            {contenidos.map((c) => {
              const sec = secciones[c.seccion];
              return (
                <ContenidoCard
                  key={c.id}
                  contenido={c}
                  seccionNombre={sec?.nombre}
                  seccionColor={sec?.color}
                />
              );
            })}
          </SimpleGrid>
        )}

        <Button
          onClick={() => navigate("/contenidos")}
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
          Ver todos los artículos
          <ArrowRight size={18} style={{ marginLeft: "8px" }} />
        </Button>
      </VStack>
    </Section>
  );
};
