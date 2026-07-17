import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LogOut } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { AppHeader } from "../organisms/AppHeader";
import { useAuth } from "../providers/AuthProvider";

export const SettingsPage = () => {
  const { logout } = useAuth();

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />

      <Container maxW="720px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
        <VStack align="stretch" gap="8">
          <Heading as="h1" size={{ base: "2xl", md: "3xl" }} fontWeight="900" letterSpacing="tighter">
            Configuración
          </Heading>

          <GlassPanel p={{ base: "6", md: "8" }}>
            <VStack align="stretch" gap="5">
              <SettingRow
                title="Notificaciones por correo"
                desc="Recibe avisos de nuevos episodios y shows en vivo."
                defaultChecked
              />
              <Box h="1px" bg="border.subtle" />
              <SettingRow
                title="Contenido para adultos"
                desc="Mostrar episodios sin censura."
                defaultChecked
              />
              <Box h="1px" bg="border.subtle" />
              <SettingRow
                title="Boletín semanal"
                desc="Un resumen con lo mejor de la semana."
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
      </Container>
    </Box>
  );
};

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
