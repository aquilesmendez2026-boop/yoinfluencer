import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Flex, IconButton, Text, VStack } from "@chakra-ui/react";
import { UserPlus, X } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";

/** Aviso flotante para completar el perfil (no intrusivo, descartable). */
export const ProfileNudge = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const incompleto = profile && !(profile.apodo && profile.pais && profile.telefono);
  if (!user || !incompleto || dismissed) return null;

  return (
    <Flex
      position="fixed"
      bottom={{ base: "4", md: "6" }}
      right={{ base: "4", md: "6" }}
      left={{ base: "4", md: "auto" }}
      zIndex="200"
      maxW={{ md: "sm" }}
      gap="3"
      p="4"
      borderRadius="2xl"
      bg="bg.elevated"
      border="1px solid"
      borderColor="border.brand"
      boxShadow="brand"
      backdropFilter="blur(16px)"
      animation="fadeIn 0.4s ease-out"
    >
      <Box color="brand.primary" pt="0.5">
        <UserPlus size={22} />
      </Box>
      <VStack align="start" gap="2" flex="1">
        <Box>
          <Text fontWeight="700" fontSize="sm">
            Completa tu perfil
          </Text>
          <Text fontSize="xs" color="fg.muted">
            Agrega tu apodo, país y teléfono para personalizar tu cuenta.
          </Text>
        </Box>
        <Button
          size="xs"
          borderRadius="full"
          px="4"
          border="none"
          color="fg.inverted"
          fontWeight="700"
          backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
          onClick={() => navigate("/cuenta")}
        >
          Completar ahora
        </Button>
      </VStack>
      <IconButton
        aria-label="Descartar"
        size="xs"
        variant="ghost"
        color="fg.subtle"
        onClick={() => setDismissed(true)}
      >
        <X size={16} />
      </IconButton>
    </Flex>
  );
};
