import { Badge, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { values } from "../data/shows";

export const AboutSection = () => {
  return (
    <Section id="about">
      <VStack gap="8">
        <SectionTitle
          eyebrow="El show"
          title="Lo que pasa cuando primero se actúa y después se piensa"
          subtitle="Ni Tan Mal es la mesa donde se cuentan las historias que no contarías sobrio. Un grupo de amigos, micrófonos abiertos y la honestidad brutal de quienes ya hicieron de todo… y lo volverían a hacer."
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
          “Al final del día, ninguna locura fue tan grave. Estuvo… ni tan mal.”
        </Text>
      </VStack>
    </Section>
  );
};
