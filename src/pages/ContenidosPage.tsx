import { useEffect, useMemo, useState } from "react";
import {
  Box, Button, Center, Container, Heading, HStack, Input, SimpleGrid, Spinner, Text, VStack,
} from "@chakra-ui/react";
import { Newspaper, Search } from "lucide-react";
import { AppHeader } from "../organisms/AppHeader";
import { ContenidoCard } from "../molecules/ContenidoCard";
import { listContenidos, type Contenido } from "../services/contenidos";
import { listSecciones, seccionMap, type Seccion } from "../services/secciones";

const fp = {
  bg: "bg.muted", border: "1px solid", borderColor: "border.subtle", borderRadius: "lg",
  color: "fg.default", size: "md" as const, px: "3",
  _hover: { borderColor: "border.brand" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #12b76a", outline: "none" },
};

const ChipFiltro = ({
  activo, onClick, children,
}: { activo: boolean; onClick: () => void; children: React.ReactNode }) => (
  <Button
    onClick={onClick}
    size="sm"
    borderRadius="full"
    px="4"
    variant="outline"
    bg={activo ? "rgba(18, 183, 106, 0.16)" : "bg.surface"}
    borderColor={activo ? "border.brand" : "border.subtle"}
    color={activo ? "brand.300" : "fg.muted"}
    fontWeight="600"
    _hover={{ borderColor: "border.brand", color: "fg.default" }}
    transition="all 0.2s"
  >
    {children}
  </Button>
);

export const ContenidosPage = () => {
  const [contenidos, setContenidos] = useState<Contenido[] | null>(null);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    Promise.all([listContenidos(), listSecciones()])
      .then(([arts, secs]) => {
        setSecciones(secs);
        setContenidos(arts);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudieron cargar los artículos.");
        setContenidos([]);
      });
  }, []);

  const secMap = useMemo(() => seccionMap(secciones), [secciones]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (contenidos ?? []).filter((c) => {
      if (filtro !== "todas" && c.seccion !== filtro) return false;
      if (!q) return true;
      return c.title.toLowerCase().includes(q);
    });
  }, [contenidos, filtro, busqueda]);

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />

      <Container maxW="1200px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
        <VStack align="stretch" gap="10">
          <VStack align="start" gap="2">
            <HStack gap="2" color="brand.primary">
              <Newspaper size={16} />
              <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase">
                Artículos
              </Text>
            </HStack>
            <Heading as="h1" size={{ base: "3xl", md: "5xl" }} fontWeight="900" letterSpacing="tighter">
              Todos los artículos
            </Heading>
            <Text color="fg.muted" maxW="2xl">
              Crónicas, entrevistas y reportajes del staff. Explora por sección o busca por título.
            </Text>
          </VStack>

          <VStack align="stretch" gap="4">
            <Box position="relative" maxW="420px">
              <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="fg.subtle" zIndex="1">
                <Search size={16} />
              </Box>
              <Input
                placeholder="Buscar por título…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                {...fp}
                pl="9"
              />
            </Box>

            <HStack gap="2" flexWrap="wrap">
              <ChipFiltro activo={filtro === "todas"} onClick={() => setFiltro("todas")}>Todas</ChipFiltro>
              {secciones.map((s) => (
                <ChipFiltro key={s.id} activo={filtro === s.id} onClick={() => setFiltro(s.id)}>
                  {s.nombre}
                </ChipFiltro>
              ))}
            </HStack>
          </VStack>

          {contenidos === null ? (
            <Center py="16">
              <Spinner color="brand.primary" size="xl" borderWidth="3px" />
            </Center>
          ) : error ? (
            <Text color="fg.subtle">{error}</Text>
          ) : visibles.length === 0 ? (
            <Text color="fg.subtle">No encontramos artículos con esos filtros.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
              {visibles.map((c) => {
                const sec = secMap[c.seccion];
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
        </VStack>
      </Container>
    </Box>
  );
};
