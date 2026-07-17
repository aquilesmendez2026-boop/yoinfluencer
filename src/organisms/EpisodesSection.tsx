import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Center, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { EpisodeCard } from "../molecules/EpisodeCard";
import { listEpisodios, type Episodio } from "../services/episodios";

export const EpisodesSection = () => {
  const navigate = useNavigate();
  const [episodios, setEpisodios] = useState<Episodio[] | null>(null);

  useEffect(() => {
    listEpisodios()
      .then((all) => setEpisodios(all.slice(0, 3)))
      .catch(() => setEpisodios([]));
  }, []);

  return (
    <Section id="episodes" bg="bg.muted">
      <VStack gap="10" w="full">
        <SectionTitle
          eyebrow="Episodios"
          title="Lo último que se nos fue de las manos"
          subtitle="Estos son los episodios más recientes. Hay muchos más esperándote."
        />

        {episodios === null ? (
          <Center py="10">
            <Spinner color="brand.primary" size="lg" />
          </Center>
        ) : episodios.length === 0 ? (
          <Text color="fg.subtle">Muy pronto publicaremos nuestros episodios.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 3 }} gap="6" w="full">
            {episodios.map((episode) => (
              <EpisodeCard key={episode.id} episode={episode} />
            ))}
          </SimpleGrid>
        )}

        <Button
          onClick={() => navigate("/episodios")}
          size="lg"
          borderRadius="full"
          px="7"
          variant="outline"
          borderColor="border.neon"
          color="fg.default"
          bg="bg.surface"
          _hover={{ boxShadow: "neon", transform: "translateY(-2px)" }}
          transition="all 0.3s"
        >
          Ve todos nuestros episodios
          <ArrowRight size={18} style={{ marginLeft: "8px" }} />
        </Button>
      </VStack>
    </Section>
  );
};
