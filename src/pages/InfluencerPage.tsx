import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Badge,
  Box,
  Center,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { MapPin } from "lucide-react";
import { AppHeader } from "../organisms/AppHeader";
import { GlassPanel } from "../atoms/GlassPanel";
import { getInfluencer, type Influencer } from "../services/influencers";
import { listContenidos, type Contenido } from "../services/contenidos";
import { listSecciones, seccionMap, type Seccion } from "../services/secciones";
import { ROLE_LABELS, type Role } from "../services/team";

const roleLabel = (role: string) => ROLE_LABELS[role as Role] ?? role;

const ArticuloCard = ({ contenido }: { contenido: Contenido }) => (
  <GlassPanel
    asChild
    interactive
    display="block"
    overflow="hidden"
    _hover={{ textDecoration: "none" }}
  >
    <RouterLink to={`/articulo/${contenido.id}`}>
    {contenido.coverUrl ? (
      <Image src={contenido.coverUrl} alt={contenido.title} w="full" h="160px" objectFit="cover" />
    ) : (
      <Box h="160px" backgroundImage="linear-gradient(135deg, #171b18 0%, #0f1210 100%)" />
    )}
    <VStack align="start" gap="2" p={{ base: "4", md: "5" }}>
      <Heading as="h3" size="sm" fontWeight="800" lineClamp={2}>
        {contenido.title}
      </Heading>
      {contenido.resumen && (
        <Text fontSize="sm" color="fg.muted" lineHeight="tall" lineClamp={3}>
          {contenido.resumen}
        </Text>
      )}
    </VStack>
    </RouterLink>
  </GlassPanel>
);

export const InfluencerPage = () => {
  const { id = "" } = useParams();
  const [inf, setInf] = useState<Influencer | null>(null);
  const [secciones, setSecciones] = useState<Record<string, Seccion>>({});
  const [articulos, setArticulos] = useState<Contenido[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let vivo = true;
    setLoading(true);
    setNotFound(false);

    Promise.all([
      getInfluencer(id),
      listContenidos({ autor: id }).catch(() => [] as Contenido[]),
      listSecciones().catch(() => [] as Seccion[]),
    ])
      .then(([perfil, contenidos, secs]) => {
        if (!vivo) return;
        setInf(perfil);
        setArticulos(contenidos);
        setSecciones(seccionMap(secs));
      })
      .catch(() => {
        if (vivo) setNotFound(true);
      })
      .finally(() => {
        if (vivo) setLoading(false);
      });

    return () => {
      vivo = false;
    };
  }, [id]);

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />

      <Container maxW="1100px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
        {loading ? (
          <Center py="20">
            <Spinner color="brand.primary" size="xl" borderWidth="3px" />
          </Center>
        ) : notFound || !inf ? (
          <VStack align="start" gap="3" py="10">
            <Heading as="h1" size="2xl" fontWeight="900">
              Perfil no encontrado
            </Heading>
            <Text color="fg.muted">
              No encontramos a esta persona en nuestra redacción.
            </Text>
          </VStack>
        ) : (
          <VStack align="stretch" gap="12">
            {/* Cabecera */}
            <GlassPanel p={{ base: "6", md: "8" }}>
              <Flex gap={{ base: "5", md: "8" }} direction={{ base: "column", sm: "row" }} align={{ base: "start", sm: "center" }}>
                {inf.photoURL ? (
                  <Image
                    src={inf.photoURL}
                    alt={inf.alias}
                    boxSize={{ base: "96px", md: "128px" }}
                    borderRadius="full"
                    objectFit="cover"
                    referrerPolicy="no-referrer"
                    flexShrink="0"
                  />
                ) : (
                  <Flex
                    align="center"
                    justify="center"
                    boxSize={{ base: "96px", md: "128px" }}
                    borderRadius="full"
                    backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
                    color="fg.inverted"
                    fontWeight="800"
                    fontSize="4xl"
                    flexShrink="0"
                  >
                    {(inf.alias || "?").charAt(0).toUpperCase()}
                  </Flex>
                )}
                <VStack align="start" gap="3" minW="0">
                  <VStack align="start" gap="1.5">
                    <Heading as="h1" size={{ base: "2xl", md: "3xl" }} fontWeight="900" letterSpacing="tight">
                      {inf.alias || "Sin alias"}
                    </Heading>
                    <HStack gap="3" flexWrap="wrap">
                      <Badge
                        bg="bg.surface"
                        color="brand.primary"
                        border="1px solid"
                        borderColor="border.brand"
                        borderRadius="full"
                        px="3"
                        fontSize="0.65rem"
                        textTransform="uppercase"
                        letterSpacing="wide"
                      >
                        {roleLabel(inf.role)}
                      </Badge>
                      {inf.pais && (
                        <HStack gap="1.5" color="fg.subtle">
                          <MapPin size={14} />
                          <Text fontSize="sm">{inf.pais}</Text>
                        </HStack>
                      )}
                    </HStack>
                  </VStack>
                  {inf.bio && (
                    <Text color="fg.muted" lineHeight="tall" whiteSpace="pre-wrap">
                      {inf.bio}
                    </Text>
                  )}
                </VStack>
              </Flex>
            </GlassPanel>

            {/* Secciones */}
            {inf.secciones?.length > 0 && (
              <VStack align="start" gap="4">
                <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase" color="brand.primary">
                  Participa en
                </Text>
                <HStack gap="2.5" flexWrap="wrap">
                  {inf.secciones.map((sid) => {
                    const s = secciones[sid];
                    const color = s?.color || "#12b76a";
                    return (
                      <HStack
                        key={sid}
                        gap="2"
                        bg="bg.surface"
                        border="1px solid"
                        borderColor="border.subtle"
                        borderRadius="full"
                        px="3.5"
                        py="1.5"
                      >
                        <Box w="2.5" h="2.5" borderRadius="full" bg={color} />
                        <Text fontSize="sm" fontWeight="600">
                          {s?.nombre ?? sid}
                        </Text>
                      </HStack>
                    );
                  })}
                </HStack>
              </VStack>
            )}

            {/* Artículos */}
            <VStack align="stretch" gap="5">
              <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase" color="brand.primary">
                Sus artículos
              </Text>
              {articulos.length === 0 ? (
                <Text color="fg.subtle">Todavía no publicó artículos.</Text>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
                  {articulos.map((c) => (
                    <ArticuloCard key={c.id} contenido={c} />
                  ))}
                </SimpleGrid>
              )}
            </VStack>
          </VStack>
        )}
      </Container>
    </Box>
  );
};
