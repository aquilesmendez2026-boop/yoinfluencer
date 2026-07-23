import { Box, Heading, Text, VStack } from "@chakra-ui/react";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "start" | "center";
}

export const SectionTitle = ({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: SectionTitleProps) => {
  return (
    <VStack
      align={align}
      gap="3"
      textAlign={align === "center" ? "center" : "start"}
      maxW={align === "center" ? "2xl" : undefined}
      mx={align === "center" ? "auto" : undefined}
    >
      {eyebrow && (
        <Text
          fontSize="sm"
          fontWeight="700"
          letterSpacing="widest"
          textTransform="uppercase"
          color="brand.primary"
        >
          {eyebrow}
        </Text>
      )}
      <Heading
        as="h2"
        size={{ base: "2xl", md: "3xl" }}
        fontWeight="800"
        letterSpacing="tight"
        color="fg.default"
      >
        {title}
      </Heading>
      {subtitle && (
        <Text fontSize={{ base: "md", md: "lg" }} color="fg.muted" maxW="2xl">
          {subtitle}
        </Text>
      )}
      <Box
        h="3px"
        w="64px"
        borderRadius="full"
        backgroundImage="linear-gradient(90deg, #6ce9a6 0%, #12b76a 100%)"
        mt="1"
        alignSelf={align === "center" ? "center" : "start"}
      />
    </VStack>
  );
};
