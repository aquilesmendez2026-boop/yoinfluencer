import { Button, HStack, IconButton, Image, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { LogIn, LogOut, Star } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";

/**
 * Botón de sesión para el navbar.
 * - Sin sesión → botón "Iniciar sesión" (popup de Google).
 * - Con sesión → chip de cuenta que lleva a la Zona miembros + botón para salir.
 */
export const AuthButton = ({ full = false }: { full?: boolean }) => {
  const { user, loading, login, logout } = useAuth();
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

  const name = user.displayName?.split(" ")[0] ?? "Cuenta";

  return (
    <HStack gap="2" w={full ? "full" : undefined}>
      <Button
        onClick={() => navigate("/miembros")}
        size="sm"
        variant="outline"
        borderRadius="full"
        borderColor="border.neon"
        bg="bg.surface"
        color="fg.default"
        flex={full ? "1" : undefined}
        _hover={{ boxShadow: "neon", transform: "translateY(-1px)" }}
        transition="all 0.3s"
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
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
      </Button>
      <IconButton
        aria-label="Cerrar sesión"
        onClick={logout}
        size="xs"
        variant="ghost"
        color="fg.subtle"
        _hover={{ color: "brand.primary" }}
      >
        <LogOut size={16} />
      </IconButton>
    </HStack>
  );
};
