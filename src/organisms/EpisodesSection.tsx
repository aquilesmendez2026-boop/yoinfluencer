import { useNavigate } from "react-router-dom";
import { Button, SimpleGrid, VStack } from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { EpisodeCard } from "../molecules/EpisodeCard";
import { episodes } from "../data/shows";

export const EpisodesSection = () => {
  const navigate = useNavigate();
  const latest = [...episodes].sort((a, b) => b.number - a.number).slice(0, 3);

  return (
    <Section id="episodes" bg="bg.muted">
      <VStack gap="10" w="full">
        <SectionTitle
          eyebrow="Episodios"
          title="Lo último que se nos fue de las manos"
          subtitle="Estos son los episodios más recientes. Hay muchos más esperándote."
        />
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="6" w="full">
          {latest.map((episode) => (
            <EpisodeCard key={episode.number} episode={episode} />
          ))}
        </SimpleGrid>
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
