import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Center,
  Flex,
  Heading,
  HStack,
  NativeSelect,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Users } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { listUsuarios, setUsuarioRole, type Usuario } from "../services/team";

const ROLES = ["miembro", "participante", "admin", "superadmin"];
const roleColor: Record<string, string> = {
  miembro: "fg.subtle",
  participante: "neon.cyan",
  admin: "neon.magenta",
  superadmin: "neon.amber",
};

export const UsersManager = () => {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    listUsuarios().then(setUsuarios).catch(() => setUsuarios([]));
  }, []);

  const changeRole = async (userId: string, role: string) => {
    setSavingId(userId);
    try {
      await setUsuarioRole(userId, role);
      setUsuarios((prev) => prev?.map((u) => (u.userId === userId ? { ...u, role } : u)) ?? null);
    } catch {
      /* noop */
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
          Asigna <b>participante</b> a quienes forman parte del podcast (acceso a la agenda),{" "}
          <b>admin</b> para gestión de contenido, o <b>super admin</b> para control total
          (incluye esta gestión de usuarios). Solo el super admin ve esta sección.
        </Text>
      </VStack>

      <GlassPanel p={{ base: "4", md: "6" }}>
        {usuarios === null ? (
          <Center py="8"><Spinner color="brand.primary" /></Center>
        ) : usuarios.length === 0 ? (
          <Text color="fg.subtle" fontSize="sm">No hay usuarios todavía.</Text>
        ) : (
          <VStack align="stretch" gap="3">
            {usuarios.map((u) => (
              <Flex key={u.userId} justify="space-between" align="center" gap="4" p="3" borderRadius="lg" bg="bg.muted" wrap="wrap">
                <HStack gap="3" minW="0">
                  <Badge bg="transparent" color={roleColor[u.role] ?? "fg.subtle"} border="1px solid" borderColor={roleColor[u.role] ?? "border.subtle"} borderRadius="full" px="2.5" fontSize="0.6rem" textTransform="uppercase">
                    {u.role}
                  </Badge>
                  <VStack align="start" gap="0" minW="0">
                    <Text fontWeight="600" fontSize="sm" lineClamp={1}>{u.name || "—"}</Text>
                    <Text fontSize="xs" color="fg.subtle" lineClamp={1}>{u.email}</Text>
                  </VStack>
                </HStack>
                <HStack gap="2" flexShrink="0">
                  {savingId === u.userId && <Spinner size="xs" color="brand.primary" />}
                  <Box w="150px">
                    <NativeSelect.Root size="sm">
                      <NativeSelect.Field
                        value={u.role}
                        onChange={(e) => changeRole(u.userId, e.target.value)}
                        bg="bg.elevated"
                        border="1px solid"
                        borderColor="border.subtle"
                        borderRadius="md"
                        color="fg.default"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} style={{ background: "#161626" }}>{r}</option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Box>
                </HStack>
              </Flex>
            ))}
          </VStack>
        )}
      </GlassPanel>
    </VStack>
  );
};
