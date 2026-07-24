import { Badge, Flex, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { Clock, Radio, Camera, Send, Users, Sparkles } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { WhiskyGlass } from "../atoms/WhiskyGlass";
import { showTypeLabels, type ShowType } from "../data/shows";
import type { Evento } from "../services/events";

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const typeMeta: Record<ShowType, { color: string; icon: typeof Radio }> = {
  en_vivo: { color: "brand.400", icon: Radio },
  grabacion: { color: "brand.300", icon: Camera },
  publicacion: { color: "brand.600", icon: Send },
  colaboracion: { color: "accent.sage", icon: Users },
  evento: { color: "accent.gold", icon: Sparkles },
};
// Fallback para tipos desconocidos (p. ej. datos viejos): nunca debe crashear.
const DEFAULT_META = { color: "fg.subtle", icon: Sparkles };

export const ScheduleCard = ({ evento }: { evento: Evento }) => {
  const [y, m, d] = evento.date.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const weekday = WEEKDAYS[dateObj.getDay()];
  const meta = typeMeta[evento.type] ?? DEFAULT_META;
  const Icon = meta.icon;

  return (
    <GlassPanel
      interactive
      p={{ base: "4", md: "5" }}
      h="full"
      borderColor={evento.premium ? "rgba(245, 158, 11, 0.35)" : undefined}
    >
      <Flex gap="4" align="stretch" h="full">
        {/* Tile de fecha */}
        <VStack
          gap="0"
          justify="center"
          align="center"
          minW="68px"
          borderRadius="xl"
          bg="bg.elevated"
          border="1px solid"
          borderColor="border.subtle"
          color={meta.color}
          px="2"
          py="3"
        >
          <Text fontSize="xs" fontWeight="700" color="fg.subtle" textTransform="uppercase">
            {weekday.slice(0, 3)}
          </Text>
          <Text fontSize="3xl" fontWeight="900" fontFamily="heading" color="fg.default" lineHeight="1">
            {String(d).padStart(2, "0")}
          </Text>
          <Text fontSize="xs" fontWeight="700" letterSpacing="wide">
            {MONTHS[m - 1]}
          </Text>
        </VStack>

        {/* Contenido */}
        <VStack align="start" gap="2" flex="1" minW="0">
          <HStack gap="2" flexWrap="wrap">
            <HStack gap="1.5" color={meta.color}>
              <Clock size={14} />
              <Text fontSize="sm" fontWeight="800" fontFamily="heading">
                {evento.time}
              </Text>
            </HStack>
            <Badge
              display="inline-flex"
              alignItems="center"
              gap="1"
              bg="transparent"
              color={meta.color}
              border="1px solid"
              borderColor={meta.color}
              borderRadius="full"
              px="2.5"
              fontSize="0.6rem"
              textTransform="uppercase"
            >
              <Icon size={11} />
              {showTypeLabels[evento.type]}
            </Badge>
            {evento.premium && (
              <HStack
                gap="1"
                color="amber.300"
                bg="rgba(245, 158, 11, 0.12)"
                border="1px solid"
                borderColor="rgba(245, 158, 11, 0.35)"
                borderRadius="full"
                px="2"
                py="0.5"
              >
                <WhiskyGlass size={12} />
                <Text fontSize="0.6rem" fontWeight="700" textTransform="uppercase">
                  Premium
                </Text>
              </HStack>
            )}
          </HStack>

          <Heading as="h3" size="md" color="fg.default" lineClamp={2}>
            {evento.title}
          </Heading>
          {evento.description && (
            <Text fontSize="sm" color="fg.muted" lineHeight="tall" lineClamp={3}>
              {evento.description}
            </Text>
          )}
        </VStack>
      </Flex>
    </GlassPanel>
  );
};
