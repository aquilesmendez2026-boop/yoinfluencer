import { useEffect, useState } from "react";
import { Box, Button, Flex, HStack, IconButton, Link, Stack } from "@chakra-ui/react";
import { Menu, X } from "lucide-react";
import { Logo } from "../atoms/Logo";
import { AuthButton } from "../molecules/AuthButton";

const navLinks = [
  { label: "El show", href: "#about" },
  { label: "Formatos", href: "#formats" },
  { label: "Horarios", href: "#schedule" },
  { label: "Episodios", href: "#episodes" },
  { label: "Dónde ver", href: "#platforms" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Box
      as="header"
      position="fixed"
      top="0"
      left="0"
      right="0"
      zIndex="100"
      transition="all 0.3s"
      bg={scrolled ? "rgba(6, 6, 12, 0.8)" : "transparent"}
      backdropFilter={scrolled ? "blur(16px)" : "none"}
      borderBottom="1px solid"
      borderColor={scrolled ? "border.subtle" : "transparent"}
    >
      <Flex
        maxW="1200px"
        mx="auto"
        px={{ base: "5", md: "8" }}
        py="4"
        align="center"
        justify="space-between"
      >
        <Link href="#hero" _hover={{ textDecoration: "none" }}>
          <Logo fontSize={{ base: "xl", md: "2xl" }} />
        </Link>

        {/* Desktop nav */}
        <HStack gap="7" display={{ base: "none", md: "flex" }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              fontSize="sm"
              fontWeight="500"
              color="fg.muted"
              _hover={{ color: "brand.primary", textDecoration: "none" }}
              transition="color 0.2s"
            >
              {link.label}
            </Link>
          ))}
          <Button
            as="a"
            // @ts-expect-error Chakra Button renders an anchor via `as`
            href="#envivo"
            size="sm"
            borderRadius="full"
            px="5"
            color="fg.inverted"
            fontWeight="700"
            backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)"
            border="none"
            _hover={{ opacity: 0.9, transform: "translateY(-1px)", boxShadow: "neon" }}
            transition="all 0.3s"
          >
            Ver en vivo
          </Button>
          <AuthButton />
        </HStack>

        {/* Mobile toggle */}
        <IconButton
          aria-label="Abrir menú"
          variant="ghost"
          color="fg.default"
          display={{ base: "flex", md: "none" }}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </IconButton>
      </Flex>

      {/* Mobile menu */}
      {open && (
        <Stack
          display={{ base: "flex", md: "none" }}
          px="5"
          pb="5"
          gap="3"
          bg="rgba(6, 6, 12, 0.95)"
          backdropFilter="blur(16px)"
          borderBottom="1px solid"
          borderColor="border.subtle"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              fontSize="md"
              fontWeight="500"
              color="fg.muted"
              py="2"
              onClick={() => setOpen(false)}
              _hover={{ color: "brand.primary", textDecoration: "none" }}
            >
              {link.label}
            </Link>
          ))}
          <Button
            as="a"
            // @ts-expect-error Chakra Button renders an anchor via `as`
            href="#envivo"
            size="md"
            borderRadius="full"
            color="fg.inverted"
            fontWeight="700"
            backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)"
            border="none"
            onClick={() => setOpen(false)}
          >
            Ver en vivo
          </Button>
          <AuthButton full />
        </Stack>
      )}
    </Box>
  );
};
