import { SimpleGrid, VStack } from "@chakra-ui/react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { FormatCard } from "../molecules/FormatCard";
import { formats } from "../data/shows";

export const FormatsSection = () => {
  return (
    <Section id="formats" bg="bg.muted">
      <VStack gap="12" w="full">
        <SectionTitle
          eyebrow="Cómo funciona"
          title="Un medio hecho entre varias voces"
          subtitle="Cada creador del staff participa en una o varias secciones y publica artículos, reseñas y experiencias. El equipo edita, tú lees."
        />
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="6" w="full">
          {formats.map((format, index) => (
            <FormatCard key={format.title} format={format} index={index} />
          ))}
        </SimpleGrid>
      </VStack>
    </Section>
  );
};
