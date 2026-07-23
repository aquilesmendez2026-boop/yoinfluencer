import { Badge, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { values } from "../data/shows";

export const AboutSection = () => {
  return (
    <Section id="about">
      <VStack gap="8" w="full">
        <SectionTitle
          eyebrow="El medio"
          title="Un periódico del ambiente, escrito por quienes lo viven"
          subtitle="Un staff de creadores publica en secciones temáticas: vida swinger, shibari, bondage, BDSM, spanking, arte erótico y reseñas de clubs. Información, cultura y experiencia real, con respeto y sin prejuicios."
        />

        <Wrap justify="center" gap="3">
          {values.map((value) => (
            <WrapItem key={value}>
              <Badge
                bg="bg.surface"
                backdropFilter="blur(10px)"
                color="fg.default"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="full"
                px="5"
                py="2"
                fontSize="sm"
                fontWeight="600"
              >
                {value}
              </Badge>
            </WrapItem>
          ))}
        </Wrap>

        <Text
          fontSize={{ base: "md", md: "lg" }}
          color="fg.subtle"
          textAlign="center"
          maxW="2xl"
          fontStyle="italic"
        >
          “Todo consensuado, seguro y sin prejuicios.”
        </Text>
      </VStack>
    </Section>
  );
};
