import { Heading, HStack, Link, Text, VStack } from "@chakra-ui/react";
import { Clock, Play } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { WhiskyGlass } from "../atoms/WhiskyGlass";
import type { Episodio } from "../services/episodios";

const platforms: { key: keyof Episodio["links"]; label: string; color: string }[] = [
  { key: "spotify", label: "Spotify", color: "#1DB954" },
  { key: "youtube", label: "YouTube", color: "#FF0000" },
  { key: "apple", label: "Apple", color: "#c084fc" },
];

export const EpisodeCard = ({ episode }: { episode: Episodio }) => {
  const links = episode.links ?? {};
  const available = platforms.filter((p) => links[p.key]);

  return (
    <GlassPanel
      interactive
      p={{ base: "5", md: "6" }}
      h="full"
      position="relative"
      borderColor={episode.premium ? "rgba(245, 158, 11, 0.35)" : undefined}
    >
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
          {episode.duration && (
            <HStack gap="1" color="fg.subtle">
              <Clock size={14} />
              <Text fontSize="xs">{episode.duration}</Text>
            </HStack>
          )}
        </HStack>

        <Heading as="h3" size="md" color="fg.default">
          {episode.title}
        </Heading>
        <Text fontSize="sm" color="fg.muted" lineHeight="tall" flex="1">
          {episode.description}
        </Text>

        {available.length > 0 ? (
          <HStack gap="2" flexWrap="wrap">
            {available.map((p) => (
              <Link
                key={p.key}
                href={links[p.key]}
                target="_blank"
                rel="noopener noreferrer"
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
                _hover={{ borderColor: p.color, color: p.color, textDecoration: "none" }}
                transition="all 0.2s"
              >
                <Play size={12} fill="currentColor" />
                {p.label}
              </Link>
            ))}
          </HStack>
        ) : (
          <HStack gap="2" color="fg.subtle" fontSize="sm">
            <Play size={16} />
            <Text>Próximamente</Text>
          </HStack>
        )}
      </VStack>
    </GlassPanel>
  );
};
