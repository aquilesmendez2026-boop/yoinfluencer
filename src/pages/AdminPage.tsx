import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Trash2, CalendarDays, ShieldAlert } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { WhiskyGlass } from "../atoms/WhiskyGlass";
import { AppHeader } from "../organisms/AppHeader";
import { EventForm } from "../organisms/EventForm";
import { UsersManager } from "../organisms/UsersManager";
import { MonthCalendar, typeColor } from "../organisms/MonthCalendar";
import { useAuth } from "../providers/AuthProvider";
import { showTypeLabels } from "../data/shows";
import { listEventos, deleteEvento, type Evento } from "../services/events";

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatLong = (ds: string) => {
  const [y, m, d] = ds.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

export const AdminPage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<Evento[]>([]);
  const [selected, setSelected] = useState<string>(todayStr());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== "admin") return;
    listEventos()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [role]);

  const dayEvents = useMemo(
    () => events.filter((e) => e.date === selected).sort((a, b) => a.time.localeCompare(b.time)),
    [events, selected]
  );

  const handleDelete = async (id: string) => {
    await deleteEvento(id).catch(() => {});
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Verificando rol
  if (role === null) {
    return (
      <Center minH="100vh" bg="bg.canvas">
        <Spinner size="xl" color="brand.primary" borderWidth="3px" />
      </Center>
    );
  }

  // No autorizado
  if (role !== "admin") {
    return (
      <Box bg="bg.canvas" color="fg.default" minH="100vh">
        <AppHeader />
        <Center minH="60vh">
          <VStack gap="4" textAlign="center" px="6">
            <ShieldAlert size={48} color="#f59e0b" />
            <Heading size="lg">Acceso restringido</Heading>
            <Text color="fg.muted" maxW="md">
              Esta sección es solo para administradores del sitio.
            </Text>
            <Button onClick={() => navigate("/")} borderRadius="full" variant="outline" borderColor="border.subtle">
              Volver al inicio
            </Button>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />

      <Container maxW="1200px" px={{ base: "5", md: "8" }} py={{ base: "10", md: "14" }}>
        <VStack align="stretch" gap="8">
          <VStack align="start" gap="2">
            <HStack gap="2" color="brand.primary">
              <CalendarDays size={16} />
              <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase">
                Panel de administración
              </Text>
            </HStack>
            <Heading as="h1" size={{ base: "2xl", md: "3xl" }} fontWeight="900" letterSpacing="tighter">
              Programación de shows
            </Heading>
            <Text color="fg.muted" maxW="2xl">
              Crea los eventos que transmitirás y míralos en el calendario del mes.
            </Text>
          </VStack>

          <Grid templateColumns={{ base: "1fr", lg: "380px 1fr" }} gap="6" alignItems="start">
            {/* Formulario */}
            <GlassPanel p={{ base: "6", md: "7" }}>
              <Heading size="md" mb="5">
                Nuevo evento
              </Heading>
              <EventForm
                onCreated={(e) => {
                  setEvents((prev) => [...prev, e]);
                  setSelected(e.date);
                }}
              />
            </GlassPanel>

            {/* Calendario + lista del día */}
            <VStack align="stretch" gap="6">
              <GlassPanel p={{ base: "5", md: "6" }}>
                {loading ? (
                  <Center py="10">
                    <Spinner color="brand.primary" />
                  </Center>
                ) : (
                  <MonthCalendar events={events} selected={selected} onSelect={setSelected} />
                )}
              </GlassPanel>

              <GlassPanel p={{ base: "5", md: "6" }}>
                <Heading size="sm" mb="4" textTransform="capitalize">
                  {formatLong(selected)}
                </Heading>
                {dayEvents.length === 0 ? (
                  <Text color="fg.subtle" fontSize="sm">
                    No hay eventos programados este día.
                  </Text>
                ) : (
                  <VStack align="stretch" gap="3">
                    {dayEvents.map((e) => (
                      <Flex
                        key={e.id}
                        align="center"
                        justify="space-between"
                        gap="3"
                        p="3"
                        borderRadius="lg"
                        bg="bg.muted"
                      >
                        <HStack gap="3" minW="0">
                          <Box w="8px" h="8px" borderRadius="full" bg={typeColor[e.type]} flexShrink="0" />
                          <Text fontWeight="800" fontFamily="heading" fontSize="sm" flexShrink="0">
                            {e.time}
                          </Text>
                          <VStack align="start" gap="0" minW="0">
                            <HStack gap="1.5" minW="0">
                              {e.premium && (
                                <Box color="amber.300" flexShrink="0" display="flex">
                                  <WhiskyGlass size={14} />
                                </Box>
                              )}
                              <Text fontWeight="600" fontSize="sm" lineClamp={1}>
                                {e.title}
                              </Text>
                            </HStack>
                            {e.description && (
                              <Text fontSize="xs" color="fg.subtle" lineClamp={1}>
                                {e.description}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                        <HStack gap="2" flexShrink="0">
                          <Badge
                            bg="transparent"
                            color={typeColor[e.type]}
                            border="1px solid"
                            borderColor={typeColor[e.type]}
                            borderRadius="full"
                            px="2.5"
                            fontSize="0.6rem"
                            textTransform="uppercase"
                            display={{ base: "none", md: "inline-flex" }}
                          >
                            {showTypeLabels[e.type]}
                          </Badge>
                          <IconButton
                            aria-label="Eliminar evento"
                            size="xs"
                            variant="ghost"
                            color="fg.subtle"
                            onClick={() => handleDelete(e.id)}
                            _hover={{ color: "red.400", bg: "rgba(239,68,68,0.1)" }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </HStack>
                      </Flex>
                    ))}
                  </VStack>
                )}
              </GlassPanel>
            </VStack>
          </Grid>

          <Box h="1px" bg="border.subtle" my="2" />

          <UsersManager />
        </VStack>
      </Container>
    </Box>
  );
};
