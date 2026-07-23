import { useEffect, useMemo, useState } from "react";
import {
  Box, Button, Center, Container, Flex, Heading, HStack, IconButton, Image, Input, Link,
  SimpleGrid, Spinner, Text, VStack,
} from "@chakra-ui/react";
import { Clock, ExternalLink, Globe, MapPin, Phone, Search, Star, X } from "lucide-react";
import { AppHeader } from "../organisms/AppHeader";
import { GlassPanel } from "../atoms/GlassPanel";
import { LugarCard } from "../molecules/LugarCard";
import { CATEGORIAS, listLugares, type CategoriaLugar, type Lugar } from "../services/lugares";

type Filtro = CategoriaLugar | "todos";

const fp = {
  bg: "bg.muted", border: "1px solid", borderColor: "border.subtle", borderRadius: "lg",
  color: "fg.default", size: "md" as const, px: "3",
  _hover: { borderColor: "border.brand" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #12b76a", outline: "none" },
};

const linkStyle = {
  display: "inline-flex", alignItems: "center", gap: "1.5", bg: "bg.elevated",
  border: "1px solid", borderColor: "border.subtle", borderRadius: "full",
  px: "3.5", py: "2", fontSize: "sm", fontWeight: "600", color: "fg.default",
  _hover: { borderColor: "border.brand", color: "brand.300", textDecoration: "none" },
  transition: "all 0.2s",
};

// Fecha corta YYYY-MM-DD → texto en español. Se arma en UTC para no correr el día.
const formatFecha = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
  });
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

const DetalleLugar = ({ lugar, onClose }: { lugar: Lugar; onClose: () => void }) => {
  const cat = CATEGORIAS.find((c) => c.key === lugar.categoria);
  const fotos = (lugar.fotos ?? []).filter((f) => f.url);
  const valor = Math.max(0, Math.min(5, Math.round(lugar.rating || 0)));

  return (
    <GlassPanel p={{ base: "5", md: "7" }} borderColor="border.brand" boxShadow="brandStrong">
      <Flex justify="space-between" align="start" gap="4" mb="5">
        <VStack align="start" gap="2">
          <HStack gap="2" color="brand.primary">
            <Text fontSize="sm">{cat?.emoji ?? "📍"}</Text>
            <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase">
              {cat?.label ?? "Otro"}
            </Text>
          </HStack>
          <Heading as="h2" size={{ base: "xl", md: "2xl" }} fontWeight="800" letterSpacing="tight">
            {lugar.nombre}
          </Heading>
          <HStack gap="3" flexWrap="wrap">
            <HStack gap="0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Box key={i} color={i < valor ? "accent.gold" : "ink.400"} lineHeight="0">
                  <Star size={15} fill={i < valor ? "currentColor" : "none"} />
                </Box>
              ))}
            </HStack>
            {lugar.precio && <Text fontSize="sm" fontWeight="700" color="accent.sage">{lugar.precio}</Text>}
            {lugar.recomendado && (
              <Text
                bg="rgba(18, 183, 106, 0.18)" border="1px solid" borderColor="border.brand"
                borderRadius="full" px="2.5" py="0.5" fontSize="0.6rem" fontWeight="700"
                textTransform="uppercase" letterSpacing="wide" color="brand.300"
              >
                Recomendado
              </Text>
            )}
          </HStack>
        </VStack>
        <IconButton aria-label="Cerrar" variant="ghost" color="fg.subtle" onClick={onClose} _hover={{ color: "fg.default" }}>
          <X size={18} />
        </IconButton>
      </Flex>

      {fotos.length > 0 && (
        <SimpleGrid columns={{ base: 2, md: 3 }} gap="3" mb="5">
          {fotos.map((f) => (
            <Image key={f.key} src={f.url} alt={f.nombre} w="full" h="160px" objectFit="cover" borderRadius="lg" />
          ))}
        </SimpleGrid>
      )}

      <VStack align="stretch" gap="4">
        {lugar.descripcion && (
          <Text color="fg.muted" lineHeight="tall" whiteSpace="pre-wrap">
            {lugar.descripcion}
          </Text>
        )}

        {lugar.resena && (
          <Text color="fg.muted" lineHeight="tall" whiteSpace="pre-wrap">
            {lugar.resena}
          </Text>
        )}

        {(lugar.direccion || lugar.ciudad) && (
          <HStack gap="2" color="fg.subtle" align="start">
            <Box pt="0.5"><MapPin size={15} /></Box>
            <Text fontSize="sm">
              {[lugar.direccion, lugar.ciudad].filter(Boolean).join(", ")}
            </Text>
          </HStack>
        )}

        {lugar.horario && (
          <HStack gap="2" color="fg.subtle" align="start">
            <Box pt="0.5"><Clock size={15} /></Box>
            <Text fontSize="sm" whiteSpace="pre-wrap">{lugar.horario}</Text>
          </HStack>
        )}

        {lugar.telefono && (
          <HStack gap="2" color="fg.subtle" align="start">
            <Box pt="0.5"><Phone size={15} /></Box>
            <Text fontSize="sm">{lugar.telefono}</Text>
          </HStack>
        )}

        {lugar.web && (
          <HStack gap="2" color="fg.subtle" align="start">
            <Box pt="0.5"><Globe size={15} /></Box>
            <Link href={lugar.web} target="_blank" rel="noopener noreferrer" fontSize="sm" color="brand.300" _hover={{ color: "brand.200" }}>
              {lugar.web}
            </Link>
          </HStack>
        )}

        {lugar.eventos && lugar.eventos.length > 0 && (
          <VStack align="stretch" gap="3" pt="1">
            <Text fontSize="sm" fontWeight="700" letterSpacing="wide" textTransform="uppercase" color="brand.primary">
              Próximos eventos
            </Text>
            {lugar.eventos.map((ev, i) => (
              <Box key={ev.id ?? i} p="3" borderRadius="lg" bg="bg.muted" border="1px solid" borderColor="border.subtle">
                <HStack gap="2" color="accent.gold" mb="1">
                  <Text fontSize="xs" fontWeight="700" textTransform="capitalize">{formatFecha(ev.fecha)}</Text>
                  {ev.hora && <Text fontSize="xs" color="fg.subtle">· {ev.hora}</Text>}
                </HStack>
                <Text fontWeight="600" fontSize="sm" color="fg.default">{ev.titulo}</Text>
                {ev.descripcion && (
                  <Text fontSize="sm" color="fg.muted" lineHeight="tall" mt="1" whiteSpace="pre-wrap">
                    {ev.descripcion}
                  </Text>
                )}
              </Box>
            ))}
          </VStack>
        )}

        {lugar.visitadoEl && (
          <Text fontSize="xs" color="fg.subtle">Visitado el {lugar.visitadoEl}</Text>
        )}

        {(lugar.mapsUrl || lugar.contenidoUrl) && (
          <HStack gap="2" flexWrap="wrap">
            {lugar.mapsUrl && (
              <Link href={lugar.mapsUrl} target="_blank" rel="noopener noreferrer" {...linkStyle}>
                <MapPin size={14} /> Ver en el mapa
              </Link>
            )}
            {lugar.contenidoUrl && (
              <Link href={lugar.contenidoUrl} target="_blank" rel="noopener noreferrer" {...linkStyle}>
                <ExternalLink size={14} /> Ver contenido
              </Link>
            )}
          </HStack>
        )}
      </VStack>
    </GlassPanel>
  );
};

export const LugaresPage = () => {
  const [lugares, setLugares] = useState<Lugar[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [detalleId, setDetalleId] = useState<string | null>(null);

  useEffect(() => {
    listLugares()
      .then(setLugares)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudieron cargar los lugares.");
        setLugares([]);
      });
  }, []);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (lugares ?? []).filter((l) => {
      if (filtro !== "todos" && l.categoria !== filtro) return false;
      if (!q) return true;
      return `${l.nombre} ${l.ciudad}`.toLowerCase().includes(q);
    });
  }, [lugares, filtro, busqueda]);

  const detalle = (lugares ?? []).find((l) => l.id === detalleId) ?? null;

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />

      <Container maxW="1200px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
        <VStack align="stretch" gap="10">
          <VStack align="start" gap="2">
            <HStack gap="2" color="brand.primary">
              <MapPin size={16} />
              <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase">
                Lugares
              </Text>
            </HStack>
            <Heading as="h1" size={{ base: "3xl", md: "5xl" }} fontWeight="900" letterSpacing="tighter">
              Todos los lugares que visitamos
            </Heading>
            <Text color="fg.muted" maxW="2xl">
              Reseñas honestas de restaurantes, cafés, bares y panoramas. Todo probado en persona.
            </Text>
          </VStack>

          <VStack align="stretch" gap="4">
            <Box position="relative" maxW="420px">
              <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="fg.subtle" zIndex="1">
                <Search size={16} />
              </Box>
              <Input
                placeholder="Buscar por nombre o ciudad…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                {...fp}
                pl="9"
              />
            </Box>

            <HStack gap="2" flexWrap="wrap">
              <ChipFiltro activo={filtro === "todos"} onClick={() => setFiltro("todos")}>Todos</ChipFiltro>
              {CATEGORIAS.map((c) => (
                <ChipFiltro key={c.key} activo={filtro === c.key} onClick={() => setFiltro(c.key)}>
                  {c.emoji} {c.label}
                </ChipFiltro>
              ))}
            </HStack>
          </VStack>

          {detalle && <DetalleLugar lugar={detalle} onClose={() => setDetalleId(null)} />}

          {lugares === null ? (
            <Center py="16">
              <Spinner color="brand.primary" size="xl" borderWidth="3px" />
            </Center>
          ) : error ? (
            <Text color="fg.subtle">{error}</Text>
          ) : visibles.length === 0 ? (
            <Text color="fg.subtle">No encontramos lugares con esos filtros.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
              {visibles.map((l) => (
                <LugarCard
                  key={l.id}
                  lugar={l}
                  onClick={() => setDetalleId((p) => (p === l.id ? null : l.id))}
                />
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Container>
    </Box>
  );
};
