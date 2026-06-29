import { HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { ScheduleCard } from "../molecules/ScheduleCard";
import { schedule, showTypeLabels, type ShowType } from "../data/shows";

const legendColor: Record<ShowType, string> = {
  stream: "neon.cyan",
  charla: "neon.magenta",
  especial: "neon.amber",
};

export const ScheduleSection = () => {
  return (
    <Section id="schedule">
      <VStack gap="10" w="full">
        <SectionTitle
          eyebrow="Horarios"
          title="¿Cuándo nos sintonizas?"
          subtitle="Estos son los horarios de los shows en vivo. Todos en hora local — guárdalos antes de que se te olvide."
        />

        {/* Leyenda de tipos */}
        <HStack gap="6" flexWrap="wrap" justify="center">
          {(Object.keys(showTypeLabels) as ShowType[]).map((type) => (
            <HStack key={type} gap="2">
              <VStack
                w="10px"
                h="10px"
                borderRadius="full"
                bg={legendColor[type]}
                boxShadow="neon"
              />
              <Text fontSize="sm" color="fg.muted">
                {showTypeLabels[type]}
              </Text>
            </HStack>
          ))}
        </HStack>

        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="5" w="full">
          {schedule.map((item) => (
            <ScheduleCard key={`${item.day}-${item.time}`} item={item} />
          ))}
        </SimpleGrid>
      </VStack>
    </Section>
  );
};
