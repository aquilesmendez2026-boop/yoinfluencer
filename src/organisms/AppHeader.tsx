import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Button, Flex, HStack } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "../atoms/Logo";
import { AuthButton } from "../molecules/AuthButton";
import { NotificationBell } from "../molecules/NotificationBell";

/** Cabecera fija reutilizable para las páginas internas (miembros, cuenta, configuración). */
export const AppHeader = () => {
  const navigate = useNavigate();
  return (
    <Flex
      as="header"
      position="sticky"
      top="0"
      zIndex="100"
      bg="rgba(6, 6, 12, 0.8)"
      backdropFilter="blur(16px)"
      borderBottom="1px solid"
      borderColor="border.subtle"
      px={{ base: "5", md: "8" }}
      py="4"
      align="center"
      justify="space-between"
    >
      <RouterLink to="/">
        <Logo fontSize={{ base: "lg", md: "xl" }} />
      </RouterLink>
      <HStack gap="4">
        <Button
          onClick={() => navigate("/")}
          size="sm"
          variant="ghost"
          color="fg.muted"
          _hover={{ color: "brand.primary" }}
        >
          <ArrowLeft size={16} style={{ marginRight: "6px" }} />
          Inicio
        </Button>
        <NotificationBell />
        <AuthButton />
      </HStack>
    </Flex>
  );
};
