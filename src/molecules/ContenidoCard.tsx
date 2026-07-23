import { Box, Flex, Heading, HStack, Image, Text, VStack } from "@chakra-ui/react";
import { User } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { GlassPanel } from "../atoms/GlassPanel";
import type { Contenido } from "../services/contenidos";

interface ContenidoCardProps {
  contenido: Contenido;
  seccionNombre?: string;
  seccionColor?: string;
  onClick?: () => void;
}

export const ContenidoCard = ({ contenido, seccionNombre, seccionColor, onClick }: ContenidoCardProps) => {
  const esBorrador = contenido.estado === "borrador";
  const badgeColor = seccionColor || "#12b76a";

  const card = (
    <GlassPanel interactive h="full" overflow="hidden" cursor="pointer">
      <Box position="relative" h="180px" bg="bg.muted" overflow="hidden">
        {contenido.coverUrl ? (
          <Image src={contenido.coverUrl} alt={contenido.title} w="full" h="full" objectFit="cover" />
        ) : (
          <Flex
            h="full"
            align="center"
            justify="center"
            backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
            opacity="0.85"
          />
        )}

        {seccionNombre && (
          <Text
            position="absolute"
            top="3"
            left="3"
            bg="rgba(10, 12, 10, 0.72)"
            backdropFilter="blur(8px)"
            border="1px solid"
            borderColor={badgeColor}
            borderRadius="full"
            px="2.5"
            py="1"
            fontSize="0.65rem"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="wide"
            color={badgeColor}
          >
            {seccionNombre}
          </Text>
        )}

        {esBorrador && (
          <Text
            position="absolute"
            top="3"
            right="3"
            bg="rgba(10, 12, 10, 0.72)"
            backdropFilter="blur(8px)"
            border="1px solid"
            borderColor="accent.gold"
            borderRadius="full"
            px="2.5"
            py="1"
            fontSize="0.6rem"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="wide"
            color="accent.gold"
          >
            Borrador
          </Text>
        )}
      </Box>

      <VStack align="start" gap="2.5" p={{ base: "4", md: "5" }}>
        <Heading as="h3" size="md" color="fg.default" lineClamp={2}>
          {contenido.title}
        </Heading>

        {contenido.resumen && (
          <Text fontSize="sm" color="fg.muted" lineHeight="tall" lineClamp={3}>
            {contenido.resumen}
          </Text>
        )}

        {contenido.autorNombre && (
          <HStack gap="1.5" color="fg.subtle" pt="1">
            <User size={13} />
            <Text fontSize="xs" fontWeight="600">{contenido.autorNombre}</Text>
          </HStack>
        )}
      </VStack>
    </GlassPanel>
  );

  if (onClick) {
    return (
      <Box onClick={onClick} cursor="pointer">
        {card}
      </Box>
    );
  }

  return (
    <RouterLink to={`/articulo/${contenido.id}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      {card}
    </RouterLink>
  );
};
