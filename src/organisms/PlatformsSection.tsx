import { Wrap, WrapItem, VStack } from "@chakra-ui/react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { PlatformButton } from "../molecules/PlatformButton";
import { platforms } from "../data/shows";

export const PlatformsSection = () => {
  return (
    <Section id="platforms">
      <VStack gap="10">
        <SectionTitle
          eyebrow="Dónde ver"
          title="Sintonízanos donde quieras"
          subtitle="Escúchanos o míranos en tu plataforma favorita. Dale play y acompáñanos en la próxima locura."
        />
        <Wrap justify="center" gap="4">
          {platforms.map((platform) => (
            <WrapItem key={platform.name}>
              <PlatformButton platform={platform} />
            </WrapItem>
          ))}
        </Wrap>
      </VStack>
    </Section>
  );
};
