import { useEffect, useState } from "react";
import { Box, Center, Container, Heading, HStack, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { Mic } from "lucide-react";
import { AppHeader } from "../organisms/AppHeader";
import { EpisodeCard } from "../molecules/EpisodeCard";
import { listEpisodios, type Episodio } from "../services/episodios";

export const EpisodesPage = () => {
  const [episodios, setEpisodios] = useState<Episodio[] | null>(null);

  useEffect(() => {
    listEpisodios().then(setEpisodios).catch(() => setEpisodios([]));
  }, []);

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
              Puro caos, risas y decisiones cuestionables. Los marcados con el vaso son exclusivos
              para miembros.
            </Text>
          </VStack>

          {episodios === null ? (
            <Center py="16">
              <Spinner color="brand.primary" size="xl" borderWidth="3px" />
            </Center>
          ) : episodios.length === 0 ? (
            <Text color="fg.subtle">Muy pronto publicaremos nuestros episodios.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
              {episodios.map((episode) => (
                <EpisodeCard key={episode.id} episode={episode} />
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Container>
    </Box>
  );
};
