import { Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { Play, Clock } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import type { Episode } from "../data/shows";

export const EpisodeCard = ({ episode }: { episode: Episode }) => {
  return (
    <GlassPanel interactive p={{ base: "5", md: "6" }} h="full">
      <VStack align="start" gap="3" h="full">
        <HStack justify="space-between" w="full">
          <Text
            fontSize="sm"
            fontWeight="700"
            color="brand.primary"
            letterSpacing="wider"
          >
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
          <Text>Reproducir</Text>
        </HStack>
      </VStack>
    </GlassPanel>
  );
};
