import { SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { EpisodeCard } from "../molecules/EpisodeCard";
import { episodes } from "../data/shows";

export const EpisodesSection = () => {
  return (
    <Section id="episodes" bg="bg.muted">
      <VStack gap="10">
        <SectionTitle
          eyebrow="Episodios"
          title="Lo último que se nos fue de las manos"
          subtitle="Un adelanto de los episodios destacados. Pronto conectaremos los episodios reales desde nuestras plataformas."
        />
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="6" w="full">
          {episodes.map((episode) => (
            <EpisodeCard key={episode.number} episode={episode} />
          ))}
        </SimpleGrid>
        <Text fontSize="sm" color="fg.subtle" textAlign="center">
          * Contenido de ejemplo — se reemplazará por los episodios reales.
        </Text>
      </VStack>
    </Section>
  );
};
