import { Box, Button, Image, Menu, Portal, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { LogIn, LogOut, Settings, User as UserIcon, ChevronDown, Star, LayoutDashboard, CalendarClock } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";

/**
 * Botón de sesión para el navbar.
 * - Sin sesión → botón "Iniciar sesión" (popup de Google).
 * - Con sesión → chip con menú desplegable (Perfil, Configuración, Cerrar sesión).
 */
export const AuthButton = ({ full = false }: { full?: boolean }) => {
  const { user, loading, login, logout, isAdmin, isParticipant, profile } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  if (!user) {
    return (
      <Button
        onClick={login}
        size="sm"
        variant="outline"
        borderRadius="full"
        borderColor="border.subtle"
        color="fg.default"
        bg="bg.surface"
        w={full ? "full" : undefined}
        _hover={{ borderColor: "border.neon" }}
        transition="all 0.3s"
      >
        <LogIn size={16} style={{ marginRight: "6px" }} />
        Iniciar sesión
      </Button>
    );
  }

  const name = profile?.apodo || user.displayName?.split(" ")[0] || "Cuenta";
  const photo = profile?.photoURL ?? user.photoURL;

  const itemStyle = {
    gap: "2.5",
    px: "3",
    py: "2",
    borderRadius: "md",
    cursor: "pointer",
    color: "fg.default",
    _highlighted: { bg: "bg.muted" },
    _hover: { bg: "bg.muted" },
  } as const;

  return (
    <Menu.Root positioning={{ placement: "bottom-end" }}>
      <Menu.Trigger asChild>
        <Button
          size="sm"
          variant="outline"
          borderRadius="full"
          borderColor="border.neon"
          bg="bg.surface"
          color="fg.default"
          pl="2"
          pr="3"
          w={full ? "full" : undefined}
          justifyContent={full ? "start" : undefined}
          _hover={{ boxShadow: "neon", transform: "translateY(-1px)" }}
          transition="all 0.3s"
        >
          {photo ? (
            <Image
              src={photo}
              alt={name}
              boxSize="22px"
              borderRadius="full"
              mr="2"
              referrerPolicy="no-referrer"
            />
          ) : (
            <Star size={15} style={{ marginRight: "6px" }} />
          )}
          <Text as="span" fontWeight="600">
            {name}
          </Text>
          <ChevronDown size={15} style={{ marginLeft: "6px" }} />
        </Button>
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner>
          <Menu.Content
            bg="bg.elevated"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="xl"
            boxShadow="glass"
            minW="220px"
            p="1.5"
          >
            <Box px="3" py="2">
              <Text fontSize="sm" fontWeight="700" color="fg.default" lineClamp={1}>
                {user.displayName ?? "Cuenta"}
              </Text>
              {user.email && (
                <Text fontSize="xs" color="fg.subtle" lineClamp={1}>
                  {user.email}
                </Text>
              )}
            </Box>
            <Menu.Separator borderColor="border.subtle" my="1" />

            <Menu.Item value="perfil" onClick={() => navigate("/cuenta")} {...itemStyle}>
              <UserIcon size={16} />
              Perfil
            </Menu.Item>
            <Menu.Item value="config" onClick={() => navigate("/configuracion")} {...itemStyle}>
              <Settings size={16} />
              Configuración
            </Menu.Item>

            {isParticipant && (
              <Menu.Item value="agenda" onClick={() => navigate("/agenda")} {...itemStyle} color="brand.primary">
                <CalendarClock size={16} />
                Agenda del equipo
              </Menu.Item>
            )}

            {isAdmin && (
              <Menu.Item value="admin" onClick={() => navigate("/admin")} {...itemStyle} color="brand.primary">
                <LayoutDashboard size={16} />
                Panel admin
              </Menu.Item>
            )}

            <Menu.Separator borderColor="border.subtle" my="1" />

            <Menu.Item
              value="logout"
              onClick={logout}
              {...itemStyle}
              color="red.400"
              _highlighted={{ bg: "rgba(239,68,68,0.12)" }}
              _hover={{ bg: "rgba(239,68,68,0.12)" }}
            >
              <LogOut size={16} />
              Cerrar sesión
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
