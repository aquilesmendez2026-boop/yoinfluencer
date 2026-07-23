import { Badge, Heading, Text, VStack } from "@chakra-ui/react";
import { Gamepad2, Wine } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import type { Format } from "../data/shows";

const icons = [Gamepad2, Wine];

export const FormatCard = ({ format, index }: { format: Format; index: number }) => {
  const Icon = icons[index % icons.length];
  const accent = index % 2 === 0 ? "brand.400" : "brand.600";

  return (
    <GlassPanel interactive p={{ base: "6", md: "8" }} h="full">
      <VStack align="start" gap="4" h="full">
        <VStack
          align="center"
          justify="center"
          w="56px"
          h="56px"
          borderRadius="xl"
          bg="bg.elevated"
          color={accent}
          border="1px solid"
          borderColor="border.subtle"
        >
          <Icon size={26} />
        </VStack>
        <Badge
          bg="transparent"
          color={accent}
          border="1px solid"
          borderColor={accent}
          borderRadius="full"
          px="3"
          textTransform="uppercase"
          fontSize="0.65rem"
        >
          {format.tag}
        </Badge>
        <Heading as="h3" size="lg" color="fg.default">
          {format.title}
        </Heading>
        <Text fontSize="md" color="fg.muted" lineHeight="tall">
          {format.description}
        </Text>
      </VStack>
    </GlassPanel>
  );
};
