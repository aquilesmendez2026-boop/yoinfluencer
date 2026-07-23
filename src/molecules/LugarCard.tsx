import { Box, Flex, Heading, HStack, Image, Link, Text, VStack } from "@chakra-ui/react";
import { Clock, ExternalLink, Images, MapPin, Star } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { CATEGORIAS, type Lugar } from "../services/lugares";

const Estrellas = ({ rating }: { rating: number }) => {
  // El rating viene libre del API: lo acotamos a 0-5 para no dibujar de más.
  const valor = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return (
    <HStack gap="0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Box key={i} color={i < valor ? "accent.gold" : "ink.400"} lineHeight="0">
          <Star size={14} fill={i < valor ? "currentColor" : "none"} />
        </Box>
      ))}
    </HStack>
  );
};

export const LugarCard = ({ lugar, onClick }: { lugar: Lugar; onClick?: () => void }) => {
  const cat = CATEGORIAS.find((c) => c.key === lugar.categoria);
  const fotos = lugar.fotos ?? [];
  const portada = fotos[0]?.url;
  const extra = fotos.length - 1;

  return (
    <GlassPanel
      interactive
      h="full"
      overflow="hidden"
      onClick={onClick}
      cursor={onClick ? "pointer" : undefined}
    >
      <Box position="relative" h="180px" bg="bg.muted" overflow="hidden">
        {portada ? (
          <Image src={portada} alt={lugar.nombre} w="full" h="full" objectFit="cover" />
        ) : (
          <Flex h="full" align="center" justify="center" color="ink.400" fontSize="3xl">
            {cat?.emoji ?? "📍"}
          </Flex>
        )}

        <HStack
          position="absolute"
          top="3"
          left="3"
          gap="1.5"
          bg="rgba(10, 12, 10, 0.72)"
          backdropFilter="blur(8px)"
          border="1px solid"
          borderColor="border.brand"
          borderRadius="full"
          px="2.5"
          py="1"
        >
          <Text fontSize="xs">{cat?.emoji ?? "📍"}</Text>
          <Text fontSize="0.65rem" fontWeight="700" textTransform="uppercase" letterSpacing="wide" color="fg.default">
            {cat?.label ?? "Otro"}
          </Text>
        </HStack>

        {lugar.recomendado && (
          <Text
            position="absolute"
            top="3"
            right="3"
            bg="rgba(18, 183, 106, 0.18)"
            border="1px solid"
            borderColor="border.brand"
            borderRadius="full"
            px="2.5"
            py="1"
            fontSize="0.6rem"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="wide"
            color="brand.300"
          >
            Recomendado
          </Text>
        )}

        {extra > 0 && (
          <HStack
            position="absolute"
            bottom="3"
            right="3"
            gap="1"
            bg="rgba(10, 12, 10, 0.72)"
            backdropFilter="blur(8px)"
            borderRadius="full"
            px="2.5"
            py="1"
            color="fg.muted"
          >
            <Images size={12} />
            <Text fontSize="xs" fontWeight="600">+{extra} fotos</Text>
          </HStack>
        )}
      </Box>

      <VStack align="start" gap="2.5" p={{ base: "4", md: "5" }}>
        <Heading as="h3" size="md" color="fg.default" lineClamp={1}>
          {lugar.nombre}
        </Heading>

        <HStack gap="3" flexWrap="wrap">
          {lugar.ciudad && (
            <HStack gap="1" color="fg.subtle">
              <MapPin size={13} />
              <Text fontSize="xs">{lugar.ciudad}</Text>
            </HStack>
          )}
          {lugar.precio && (
            <Text fontSize="xs" fontWeight="700" color="accent.sage">
              {lugar.precio}
            </Text>
          )}
        </HStack>

        <Estrellas rating={lugar.rating} />

        {lugar.horario && (
          <HStack gap="1" color="fg.subtle">
            <Clock size={13} />
            <Text fontSize="xs" lineClamp={1}>{lugar.horario}</Text>
          </HStack>
        )}

        {lugar.resena && (
          <Text fontSize="sm" color="fg.muted" lineHeight="tall" lineClamp={3}>
            {lugar.resena}
          </Text>
        )}

        {(lugar.mapsUrl || lugar.contenidoUrl) && (
          <HStack gap="2" flexWrap="wrap" pt="1">
            {lugar.mapsUrl && (
              <Link
                href={lugar.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                // La card entera puede ser clickeable: el link no debe abrir además el detalle.
                onClick={(e) => e.stopPropagation()}
                display="inline-flex"
                alignItems="center"
                gap="1.5"
                bg="bg.elevated"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="full"
                px="3"
                py="1.5"
                fontSize="xs"
                fontWeight="600"
                color="fg.default"
                _hover={{ borderColor: "border.brand", color: "brand.300", textDecoration: "none" }}
                transition="all 0.2s"
              >
                <MapPin size={12} /> Cómo llegar
              </Link>
            )}
            {lugar.contenidoUrl && (
              <Link
                href={lugar.contenidoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                display="inline-flex"
                alignItems="center"
                gap="1.5"
                bg="bg.elevated"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="full"
                px="3"
                py="1.5"
                fontSize="xs"
                fontWeight="600"
                color="fg.default"
                _hover={{ borderColor: "border.brand", color: "brand.300", textDecoration: "none" }}
                transition="all 0.2s"
              >
                <ExternalLink size={12} /> Ver contenido
              </Link>
            )}
          </HStack>
        )}
      </VStack>
    </GlassPanel>
  );
};
