import { Box, Container, Heading, HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { Mic } from "lucide-react";
import { AppHeader } from "../organisms/AppHeader";
import { EpisodeCard } from "../molecules/EpisodeCard";
import { episodes } from "../data/shows";

export const EpisodesPage = () => {
  const all = [...episodes].sort((a, b) => b.number - a.number);

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />

      <Container maxW="1200px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
        <VStack align="stretch" gap="10">
          <VStack align="start" gap="2">
            <HStack gap="2" color="brand.primary">
              <Mic size={16} />
              <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase">
                Episodios
              </Text>
            </HStack>
            <Heading as="h1" size={{ base: "3xl", md: "5xl" }} fontWeight="900" letterSpacing="tighter">
              Todos nuestros episodios
            </Heading>
            <Text color="fg.muted" maxW="2xl">
              {all.length} episodios de puro caos, risas y decisiones cuestionables. Los marcados con
              el vaso son exclusivos para miembros.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
            {all.map((episode) => (
              <EpisodeCard key={episode.number} episode={episode} />
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};
