import { useEffect, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ArrowLeft, User as UserIcon, Mail, Shield, LogOut } from "lucide-react";
import { Logo } from "../atoms/Logo";
import { GlassPanel } from "../atoms/GlassPanel";
import { AuthButton } from "../molecules/AuthButton";
import { useAuth } from "../providers/AuthProvider";
import { apiFetch } from "../services/api";

interface MeResponse {
  user?: { role?: string; email?: string; name?: string };
}

export const AccountPage = () => {
  const { user, logout } = useAuth();
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
      {/* Top bar */}
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
          <AuthButton />
        </HStack>
      </Flex>

      <Container maxW="720px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
        <VStack align="stretch" gap="10">
          <Heading as="h1" size={{ base: "2xl", md: "3xl" }} fontWeight="900" letterSpacing="tighter">
            Mi cuenta
          </Heading>

          {/* Perfil */}
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

          {/* Configuración */}
          <VStack align="stretch" gap="4" id="config" scrollMarginTop="80px">
            <Heading as="h2" size="lg">
              Configuración
            </Heading>
            <GlassPanel p={{ base: "6", md: "8" }}>
              <VStack align="stretch" gap="5">
                <SettingRow
                  title="Notificaciones por correo"
                  desc="Recibe avisos de nuevos episodios y shows en vivo."
                />
                <Box h="1px" bg="border.subtle" />
                <SettingRow
                  title="Contenido para adultos"
                  desc="Mostrar episodios sin censura."
                  defaultChecked
                />
                <Box h="1px" bg="border.subtle" />
                <Text fontSize="sm" color="fg.subtle">
                  Más opciones de configuración muy pronto.
                </Text>
              </VStack>
            </GlassPanel>

            <Button
              onClick={logout}
              size="lg"
              variant="outline"
              borderColor="rgba(239,68,68,0.4)"
              color="red.400"
              borderRadius="xl"
              alignSelf="start"
              _hover={{ bg: "rgba(239,68,68,0.1)" }}
            >
              <LogOut size={18} style={{ marginRight: "8px" }} />
              Cerrar sesión
            </Button>
          </VStack>
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

const SettingRow = ({
  title,
  desc,
  defaultChecked,
}: {
  title: string;
  desc: string;
  defaultChecked?: boolean;
}) => (
  <Flex justify="space-between" align="center" gap="4">
    <VStack align="start" gap="0.5">
      <Text fontWeight="600">{title}</Text>
      <Text fontSize="sm" color="fg.muted">
        {desc}
      </Text>
    </VStack>
    <Switch.Root defaultChecked={defaultChecked} colorPalette="cyan">
      <Switch.HiddenInput />
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
    </Switch.Root>
  </Flex>
);
