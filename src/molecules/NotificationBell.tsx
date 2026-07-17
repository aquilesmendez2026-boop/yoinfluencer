import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, IconButton, Menu, Portal, Text, VStack } from "@chakra-ui/react";
import { Bell } from "lucide-react";
import { listNotificaciones, marcarLeidas, type Notificacion } from "../services/notificaciones";

const cuando = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
};

export const NotificationBell = () => {
  const navigate = useNavigate();
  const [notis, setNotis] = useState<Notificacion[]>([]);

  useEffect(() => {
    const load = () => listNotificaciones().then(setNotis).catch(() => {});
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, []);

  const unread = notis.filter((n) => !n.leida).length;

  const onOpen = (open: boolean) => {
    if (open && unread > 0) {
      marcarLeidas().catch(() => {});
      setNotis((p) => p.map((n) => ({ ...n, leida: true })));
    }
  };

  return (
    <Menu.Root positioning={{ placement: "bottom-end" }} onOpenChange={(e) => onOpen(e.open)}>
      <Menu.Trigger asChild>
        <Box position="relative" display="inline-flex">
          <IconButton aria-label="Notificaciones" variant="ghost" color="fg.muted" _hover={{ color: "brand.primary" }}>
            <Bell size={20} />
          </IconButton>
          {unread > 0 && (
            <Box position="absolute" top="0.5" right="0.5" bg="red.500" color="white" borderRadius="full" fontSize="0.55rem" fontWeight="800" minW="16px" h="16px" px="1" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
              {unread > 9 ? "9+" : unread}
            </Box>
          )}
        </Box>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content bg="bg.elevated" border="1px solid" borderColor="border.subtle" borderRadius="xl" boxShadow="glass" minW="300px" maxW="360px" p="1.5" maxH="420px" overflowY="auto">
            <Box px="3" py="2">
              <Text fontSize="sm" fontWeight="800">Notificaciones</Text>
            </Box>
            <Menu.Separator borderColor="border.subtle" my="1" />
            {notis.length === 0 ? (
              <Box px="3" py="6" textAlign="center">
                <Text fontSize="sm" color="fg.subtle">Sin notificaciones</Text>
              </Box>
            ) : (
              notis.map((n) => (
                <Menu.Item
                  key={n.id}
                  value={n.id}
                  onClick={() => navigate("/agenda")}
                  px="3" py="2.5" borderRadius="md" cursor="pointer"
                  _highlighted={{ bg: "bg.muted" }} _hover={{ bg: "bg.muted" }}
                >
                  <VStack align="start" gap="0.5" w="full">
                    <Text fontSize="sm" color="fg.default" whiteSpace="normal">{n.texto}</Text>
                    <Text fontSize="0.65rem" color="fg.subtle">{cuando(n.createdAt)}</Text>
                  </VStack>
                </Menu.Item>
              ))
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
