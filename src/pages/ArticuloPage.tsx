import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Center, Container, Heading, HStack, Image, Link, Spinner, Text, VStack,
} from "@chakra-ui/react";
import { CalendarDays, Instagram, Music, User, Youtube } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppHeader } from "../organisms/AppHeader";
import { GlassPanel } from "../atoms/GlassPanel";
import { listContenidos, type Contenido } from "../services/contenidos";
import { listSecciones, seccionMap, type Seccion } from "../services/secciones";

const plataformas: { key: "instagram" | "tiktok" | "youtube"; label: string; icon: LucideIcon }[] = [
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "tiktok", label: "TikTok", icon: Music },
  { key: "youtube", label: "YouTube", icon: Youtube },
];

const linkStyle = {
  display: "inline-flex", alignItems: "center", gap: "1.5", bg: "bg.elevated",
  border: "1px solid", borderColor: "border.subtle", borderRadius: "full",
  px: "3.5", py: "2", fontSize: "sm", fontWeight: "600", color: "fg.default",
  _hover: { borderColor: "border.brand", color: "brand.300", textDecoration: "none" },
  transition: "all 0.2s",
};

const formatearFecha = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
};

export const ArticuloPage = () => {
  const { id } = useParams<{ id: string }>();
  const [contenidos, setContenidos] = useState<Contenido[] | null>(null);
  const [secciones, setSecciones] = useState<Record<string, Seccion>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listContenidos(), listSecciones()])
      .then(([arts, secs]) => {
        setSecciones(seccionMap(secs));
        setContenidos(arts);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudo cargar el artículo.");
        setContenidos([]);
      });
  }, []);

  const articulo = useMemo(
    () => (contenidos ?? []).find((c) => c.id === id) ?? null,
    [contenidos, id]
  );

  const sec = articulo ? secciones[articulo.seccion] : undefined;
  const fecha = formatearFecha(articulo?.publishedAt ?? articulo?.createdAt);
  const links = articulo?.links ?? {};
  const disponibles = plataformas.filter((p) => links[p.key]);

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />

      <Container maxW="820px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
        {contenidos === null ? (
          <Center py="16">
            <Spinner color="brand.primary" size="xl" borderWidth="3px" />
          </Center>
        ) : error ? (
          <Text color="fg.subtle">{error}</Text>
        ) : !articulo ? (
          <VStack align="start" gap="3" py="10">
            <Heading as="h1" size="2xl" fontWeight="800">Artículo no encontrado</Heading>
            <Text color="fg.muted">Puede que se haya movido o que aún no esté publicado.</Text>
          </VStack>
        ) : (
          <VStack align="stretch" gap="7">
            <VStack align="start" gap="3">
              {sec && (
                <Text
                  fontSize="sm"
                  fontWeight="700"
                  letterSpacing="widest"
                  textTransform="uppercase"
                  color={sec.color || "brand.primary"}
                >
                  {sec.nombre}
                </Text>
              )}
              <Heading as="h1" size={{ base: "3xl", md: "4xl" }} fontWeight="900" letterSpacing="tight">
                {articulo.title}
              </Heading>

              <HStack gap="4" flexWrap="wrap" color="fg.subtle">
                {articulo.autorNombre && (
                  <HStack gap="1.5">
                    <User size={15} />
                    <Text fontSize="sm" fontWeight="600" color="fg.muted">{articulo.autorNombre}</Text>
                  </HStack>
                )}
                {fecha && (
                  <HStack gap="1.5">
                    <CalendarDays size={15} />
                    <Text fontSize="sm">{fecha}</Text>
                  </HStack>
                )}
              </HStack>
            </VStack>

            {articulo.coverUrl && (
              <Image
                src={articulo.coverUrl}
                alt={articulo.title}
                w="full"
                maxH="440px"
                objectFit="cover"
                borderRadius="2xl"
                border="1px solid"
                borderColor="border.subtle"
              />
            )}

            {articulo.resumen && (
              <Text fontSize={{ base: "lg", md: "xl" }} color="fg.default" fontWeight="500" lineHeight="tall">
                {articulo.resumen}
              </Text>
            )}

            {articulo.cuerpo && (
              <Text color="fg.muted" lineHeight="tall" fontSize="md" whiteSpace="pre-wrap">
                {articulo.cuerpo}
              </Text>
            )}

            {disponibles.length > 0 && (
              <GlassPanel p={{ base: "4", md: "5" }}>
                <VStack align="start" gap="3">
                  <Text fontSize="xs" fontWeight="700" color="fg.subtle" textTransform="uppercase" letterSpacing="wide">
                    Seguir en redes
                  </Text>
                  <HStack gap="2" flexWrap="wrap">
                    {disponibles.map((p) => {
                      const Icon = p.icon;
                      return (
                        <Link key={p.key} href={links[p.key]} target="_blank" rel="noopener noreferrer" {...linkStyle}>
                          <Icon size={14} /> {p.label}
                        </Link>
                      );
                    })}
                  </HStack>
                </VStack>
              </GlassPanel>
            )}
          </VStack>
        )}
      </Container>
    </Box>
  );
};
