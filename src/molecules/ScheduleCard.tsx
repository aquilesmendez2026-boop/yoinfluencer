import { Badge, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { Clock } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { showTypeLabels, type ScheduleItem } from "../data/shows";

const typeColor: Record<ScheduleItem["type"], string> = {
  stream: "neon.cyan",
  charla: "neon.magenta",
  especial: "neon.amber",
};

export const ScheduleCard = ({ item }: { item: ScheduleItem }) => {
  const accent = typeColor[item.type];

  return (
    <GlassPanel interactive p={{ base: "5", md: "6" }} h="full">
      <VStack align="start" gap="3" h="full">
        <HStack justify="space-between" w="full">
          <Text
            fontSize="xs"
            fontWeight="700"
            letterSpacing="wider"
            textTransform="uppercase"
            color="fg.subtle"
          >
            {item.day}
          </Text>
          <Badge
            bg="transparent"
            color={accent}
            border="1px solid"
            borderColor={accent}
            borderRadius="full"
            px="3"
            fontSize="0.65rem"
            textTransform="uppercase"
          >
            {showTypeLabels[item.type]}
          </Badge>
        </HStack>

        <HStack gap="2" color={accent}>
          <Clock size={18} />
          <Text fontSize="2xl" fontWeight="800" fontFamily="heading" color="fg.default">
            {item.time}
          </Text>
        </HStack>

        <Heading as="h3" size="md" color="fg.default">
          {item.title}
        </Heading>
        <Text fontSize="sm" color="fg.muted" lineHeight="tall">
          {item.description}
        </Text>
      </VStack>
    </GlassPanel>
  );
};
