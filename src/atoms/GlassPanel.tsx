import { Box, type BoxProps } from "@chakra-ui/react";

interface GlassPanelProps extends BoxProps {
  interactive?: boolean;
}

export const GlassPanel = ({ interactive, children, ...props }: GlassPanelProps) => {
  return (
    <Box
      bg="bg.surface"
      backdropFilter="blur(20px)"
      borderRadius="2xl"
      border="1px solid"
      borderColor="border.subtle"
      boxShadow="glass"
      transition="all 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={
        interactive
          ? {
              transform: "translateY(-6px)",
              borderColor: "border.brand",
              boxShadow: "brand",
            }
          : undefined
      }
      {...props}
    >
      {children}
    </Box>
  );
};
