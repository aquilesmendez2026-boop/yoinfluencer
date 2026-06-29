import { Box, Container, type BoxProps } from "@chakra-ui/react";

interface SectionProps extends BoxProps {
  id: string;
}

export const Section = ({ id, children, ...props }: SectionProps) => {
  return (
    <Box
      as="section"
      id={id}
      position="relative"
      py={{ base: "16", md: "24" }}
      px={{ base: "5", md: "8" }}
      scrollMarginTop="80px"
      {...props}
    >
      <Container maxW="1200px" px="0">
        {children}
      </Container>
    </Box>
  );
};
