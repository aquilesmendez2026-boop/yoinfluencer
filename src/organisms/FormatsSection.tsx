import { SimpleGrid, VStack } from "@chakra-ui/react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { FormatCard } from "../molecules/FormatCard";
import { formats } from "../data/shows";

export const FormatsSection = () => {
  return (
    <Section id="formats" bg="bg.muted">
      <VStack gap="12">
        <SectionTitle
          eyebrow="Formatos"
          title="Dos formas de meterse en problemas"
          subtitle="Cada semana alternamos entre la consola y la copa. Mismo desorden, distinto escenario."
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
