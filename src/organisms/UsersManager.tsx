import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Center,
  Checkbox,
  Flex,
  Heading,
  HStack,
  NativeSelect,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Users } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { useAuth } from "../providers/AuthProvider";
import { ApiError } from "../services/api";
import {
  ROLES,
  ROLE_LABELS,
  listUsuarios,
  rankOf,
  setUsuarioRole,
  setUsuarioSecciones,
  type Role,
  type Usuario,
} from "../services/team";
import { listSecciones, type Seccion } from "../services/secciones";

const roleColor: Record<string, string> = {
  miembro: "fg.subtle",
  influencer: "brand.400",
  editor: "brand.500",
  admin: "brand.600",
  super_admin: "accent.gold",
};

/** Un usuario del equipo con su selector de rol y (si aplica) sus secciones. */
const FilaUsuario = ({
  usuario,
  secciones,
  rolesDisponibles,
  onChangeRole,
  onToggleSeccion,
  saving,
  error,
}: {
  usuario: Usuario;
  secciones: Seccion[];
  rolesDisponibles: Role[];
  onChangeRole: (userId: string, role: string) => void;
  onToggleSeccion: (usuario: Usuario, seccionId: string, checked: boolean) => void;
  saving: boolean;
  error: string | null;
}) => {
  const asignables = new Set(usuario.secciones ?? []);
  // Aunque el rol actual no esté entre los asignables (p.ej. es igual/superior al tuyo),
  // lo incluimos como opción deshabilitada para que el select muestre el valor real.
  const opciones = rolesDisponibles.includes(usuario.role as Role)
    ? rolesDisponibles
    : [usuario.role as Role, ...rolesDisponibles];
  const muestraSecciones = usuario.role === "influencer" || usuario.role === "editor";

  return (
    <Box p="4" borderRadius="lg" bg="bg.muted">
      <Flex justify="space-between" align="center" gap="4" wrap="wrap">
        <HStack gap="3" minW="0">
          <Badge
            bg="transparent"
            color={roleColor[usuario.role] ?? "fg.subtle"}
            border="1px solid"
            borderColor={roleColor[usuario.role] ?? "border.subtle"}
            borderRadius="full"
            px="2.5"
            fontSize="0.6rem"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            {ROLE_LABELS[usuario.role as Role] ?? usuario.role}
          </Badge>
          <VStack align="start" gap="0" minW="0">
            <Text fontWeight="600" fontSize="sm" lineClamp={1}>
              {usuario.alias || usuario.name || "—"}
            </Text>
            <Text fontSize="xs" color="fg.subtle" lineClamp={1}>
              {usuario.email}
            </Text>
          </VStack>
        </HStack>

        <HStack gap="2" flexShrink="0">
          {saving && <Spinner size="xs" color="brand.primary" />}
          <Box w="170px">
            <NativeSelect.Root size="sm">
              <NativeSelect.Field
                value={usuario.role}
                onChange={(e) => onChangeRole(usuario.userId, e.target.value)}
                bg="bg.elevated"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="md"
                color="fg.default"
              >
                {opciones.map((r) => (
                  <option
                    key={r}
                    value={r}
                    disabled={!rolesDisponibles.includes(r)}
                    style={{ background: "#0f1210" }}
                  >
                    {ROLE_LABELS[r] ?? r}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Box>
        </HStack>
      </Flex>

      {muestraSecciones && (
        <Box mt="3.5" pt="3.5" borderTop="1px solid" borderColor="border.subtle">
          <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase" letterSpacing="wide" mb="2.5">
            Secciones donde puede publicar
          </Text>
          {secciones.length === 0 ? (
            <Text fontSize="sm" color="fg.subtle">
              No hay secciones creadas todavía.
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 2, md: 3 }} gap="2.5">
              {secciones.map((s) => (
                <Checkbox.Root
                  key={s.id}
                  size="sm"
                  checked={asignables.has(s.id)}
                  onCheckedChange={(e) => onToggleSeccion(usuario, s.id, !!e.checked)}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label fontSize="sm" color="fg.default" lineClamp={1}>
                    {s.nombre}
                  </Checkbox.Label>
                </Checkbox.Root>
              ))}
            </SimpleGrid>
          )}
        </Box>
      )}

      {error && (
        <Text mt="2.5" fontSize="sm" color="red.400">
          {error}
        </Text>
      )}
    </Box>
  );
};

export const UsersManager = () => {
  const { isSuperAdmin, role } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorPorUsuario, setErrorPorUsuario] = useState<Record<string, string>>({});

  useEffect(() => {
    listUsuarios().then(setUsuarios).catch(() => setUsuarios([]));
    listSecciones().then(setSecciones).catch(() => setSecciones([]));
  }, []);

  if (!isSuperAdmin) {
    return <Text color="fg.subtle">No tienes permisos para gestionar usuarios.</Text>;
  }

  // Solo se pueden asignar roles de rango MENOR al propio, y nunca super_admin.
  const rolesDisponibles = ROLES.filter(
    (r) => r !== "super_admin" && rankOf(r) < rankOf(role ?? undefined)
  );

  const setError = (userId: string, message: string | null) =>
    setErrorPorUsuario((prev) => {
      const next = { ...prev };
      if (message) next[userId] = message;
      else delete next[userId];
      return next;
    });

  const changeRole = async (userId: string, nuevoRol: string) => {
    setError(userId, null);
    setSavingId(userId);
    try {
      await setUsuarioRole(userId, nuevoRol);
      setUsuarios((prev) =>
        prev?.map((u) => (u.userId === userId ? { ...u, role: nuevoRol } : u)) ?? null
      );
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "No se pudo cambiar el rol.";
      setError(userId, msg);
    } finally {
      setSavingId(null);
    }
  };

  const toggleSeccion = async (usuario: Usuario, seccionId: string, checked: boolean) => {
    setError(usuario.userId, null);
    const actuales = usuario.secciones ?? [];
    const nuevas = checked
      ? [...new Set([...actuales, seccionId])]
      : actuales.filter((id) => id !== seccionId);
    // Optimista: reflejamos el cambio de inmediato.
    setUsuarios((prev) =>
      prev?.map((u) => (u.userId === usuario.userId ? { ...u, secciones: nuevas } : u)) ?? null
    );
    setSavingId(usuario.userId);
    try {
      await setUsuarioSecciones(usuario.userId, nuevas);
    } catch (e) {
      // Revertimos si falla.
      setUsuarios((prev) =>
        prev?.map((u) => (u.userId === usuario.userId ? { ...u, secciones: actuales } : u)) ?? null
      );
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "No se pudieron guardar las secciones.";
      setError(usuario.userId, msg);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <VStack align="stretch" gap="5">
      <VStack align="start" gap="2">
        <HStack gap="2" color="brand.secondary">
          <Users size={16} />
          <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase">
            Usuarios y roles
          </Text>
        </HStack>
        <Heading as="h2" size={{ base: "xl", md: "2xl" }} fontWeight="800">
          Gestión de accesos
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          Subí a alguien a <b>influencer</b> para que tenga página propia y pueda publicar, a{" "}
          <b>editor</b> para revisar todas las secciones, o a <b>admin</b> para la gestión completa.
          Solo podés asignar roles por debajo del tuyo; <b>Super Admin</b> no se asigna desde aquí.
        </Text>
        <Text color="fg.subtle" fontSize="sm">
          A los <b>influencers</b> y <b>editores</b> asignales las secciones en las que pueden
          publicar marcando las casillas.
        </Text>
      </VStack>

      <GlassPanel p={{ base: "4", md: "6" }}>
        {usuarios === null ? (
          <Center py="8">
            <Spinner color="brand.primary" />
          </Center>
        ) : usuarios.length === 0 ? (
          <Text color="fg.subtle" fontSize="sm">
            No hay usuarios todavía.
          </Text>
        ) : (
          <VStack align="stretch" gap="3">
            {usuarios.map((u) => (
              <FilaUsuario
                key={u.userId}
                usuario={u}
                secciones={secciones}
                rolesDisponibles={rolesDisponibles}
                onChangeRole={changeRole}
                onToggleSeccion={toggleSeccion}
                saving={savingId === u.userId}
                error={errorPorUsuario[u.userId] ?? null}
              />
            ))}
          </VStack>
        )}
      </GlassPanel>
    </VStack>
  );
};
