import { Box, Flex, HStack, Link, Text } from "@chakra-ui/react";
import { Logo } from "../atoms/Logo";
import { socials } from "../data/shows";

export const Footer = () => {
  return (
    <Box
      as="footer"
      borderTop="1px solid"
      borderColor="border.subtle"
      bg="bg.canvas"
      px={{ base: "5", md: "8" }}
      py="10"
    >
      <Flex
        maxW="1200px"
        mx="auto"
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="space-between"
        gap="6"
      >
        <Logo fontSize="xl" />

        <HStack gap="6" flexWrap="wrap" justify="center">
          {socials.map((social) => (
            <Link
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              fontSize="sm"
              color="fg.muted"
              _hover={{ color: "brand.primary", textDecoration: "none" }}
            >
              {social.name}
            </Link>
          ))}
        </HStack>

        <Text fontSize="sm" color="fg.subtle">
          © 2026 Yo Influencer
        </Text>
      </Flex>
    </Box>
  );
};
