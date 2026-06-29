import { Button } from "@chakra-ui/react";
import { ExternalLink } from "lucide-react";
import type { Platform } from "../data/shows";

export const PlatformButton = ({ platform }: { platform: Platform }) => {
  return (
    <Button
      as="a"
      // @ts-expect-error Chakra Button renders an anchor via `as`
      href={platform.url}
      target="_blank"
      rel="noopener noreferrer"
      size="lg"
      variant="outline"
      borderColor="border.subtle"
      color="fg.default"
      borderRadius="xl"
      px="6"
      h="14"
      bg="bg.surface"
      backdropFilter="blur(12px)"
      _hover={{
        borderColor: "border.neon",
        boxShadow: "neon",
        transform: "translateY(-2px)",
      }}
      transition="all 0.3s"
    >
      {platform.name}
      <ExternalLink size={16} style={{ marginLeft: "8px" }} />
    </Button>
  );
};
