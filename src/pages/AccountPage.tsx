import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react";
import { User as UserIcon, Mail, Shield, Settings } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { AppHeader } from "../organisms/AppHeader";
import { useAuth } from "../providers/AuthProvider";
import { apiFetch } from "../services/api";

interface MeResponse {
  user?: { role?: string; email?: string; name?: string };
}

export const AccountPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<MeResponse>("/me")
      .then((data) => setRole(data.user?.role ?? "miembro"))
      .catch(() => setRole(null));
  }, []);

  const name = user?.displayName ?? "Cuenta";
  const initial = name.charAt(0).toUpperCase();

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />

      <Container maxW="720px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
        <VStack align="stretch" gap="8">
          <Heading as="h1" size={{ base: "2xl", md: "3xl" }} fontWeight="900" letterSpacing="tighter">
            Mi perfil
          </Heading>

          <GlassPanel p={{ base: "6", md: "8" }}>
            <VStack align="stretch" gap="6">
              <HStack gap="4">
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={name}
                    boxSize="64px"
                    borderRadius="full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Flex
                    align="center"
                    justify="center"
                    boxSize="64px"
                    borderRadius="full"
                    backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)"
                    color="fg.inverted"
                    fontWeight="800"
                    fontSize="2xl"
                  >
                    {initial}
                  </Flex>
                )}
                <VStack align="start" gap="1">
                  <Heading as="h2" size="lg">
                    {name}
                  </Heading>
                  {role && (
                    <Badge
                      bg="bg.surface"
                      color="brand.primary"
                      border="1px solid"
                      borderColor="border.neon"
                      borderRadius="full"
                      px="3"
                      textTransform="capitalize"
                    >
                      {role}
                    </Badge>
                  )}
                </VStack>
              </HStack>

              <VStack align="stretch" gap="3">
                <InfoRow icon={UserIcon} label="Nombre" value={name} />
                <InfoRow icon={Mail} label="Correo" value={user?.email ?? "—"} />
                <InfoRow icon={Shield} label="Rol" value={role ?? "—"} />
              </VStack>
            </VStack>
          </GlassPanel>

          <Button
            onClick={() => navigate("/configuracion")}
            size="lg"
            variant="outline"
            borderColor="border.subtle"
            color="fg.default"
            borderRadius="xl"
            alignSelf="start"
            _hover={{ borderColor: "border.neon" }}
          >
            <Settings size={18} style={{ marginRight: "8px" }} />
            Ir a configuración
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserIcon;
  label: string;
  value: string;
}) => (
  <HStack justify="space-between" gap="4">
    <HStack gap="2.5" color="fg.subtle">
      <Icon size={16} />
      <Text fontSize="sm">{label}</Text>
    </HStack>
    <Text fontSize="sm" fontWeight="600" color="fg.default" textTransform="capitalize" lineClamp={1}>
      {value}
    </Text>
  </HStack>
);
