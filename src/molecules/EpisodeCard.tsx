import { Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { Play, Clock } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { WhiskyGlass } from "../atoms/WhiskyGlass";
import type { Episode } from "../data/shows";

export const EpisodeCard = ({ episode }: { episode: Episode }) => {
  return (
    <GlassPanel
      interactive
      p={{ base: "5", md: "6" }}
      h="full"
      position="relative"
      borderColor={episode.premium ? "rgba(245, 158, 11, 0.35)" : undefined}
    >
      {/* Insignia premium (vaso de whisky) */}
      {episode.premium && (
        <HStack
          position="absolute"
          top="4"
          right="4"
          gap="1"
          bg="rgba(245, 158, 11, 0.12)"
          border="1px solid"
          borderColor="rgba(245, 158, 11, 0.35)"
          borderRadius="full"
          px="2.5"
          py="1"
          color="amber.300"
        >
          <WhiskyGlass size={13} />
          <Text fontSize="0.6rem" fontWeight="700" textTransform="uppercase" letterSpacing="wide">
            Premium
          </Text>
        </HStack>
      )}

      <VStack align="start" gap="3" h="full">
        <HStack justify="space-between" w="full" pr={episode.premium ? "24" : "0"}>
          <Text fontSize="sm" fontWeight="700" color="brand.primary" letterSpacing="wider">
            EP. {episode.number}
          </Text>
          <HStack gap="1" color="fg.subtle">
            <Clock size={14} />
            <Text fontSize="xs">{episode.duration}</Text>
          </HStack>
        </HStack>

        <Heading as="h3" size="md" color="fg.default">
          {episode.title}
        </Heading>
        <Text fontSize="sm" color="fg.muted" lineHeight="tall" flex="1">
          {episode.description}
        </Text>

        <HStack gap="2" color="brand.secondary" fontWeight="600" fontSize="sm">
          <Play size={16} />
          <Text>{episode.premium ? "Solo miembros" : "Reproducir"}</Text>
        </HStack>
      </VStack>
    </GlassPanel>
  );
};
