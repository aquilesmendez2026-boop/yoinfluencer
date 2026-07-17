import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge, Box, Button, Center, Container, Flex, Heading, HStack, Spinner, Text, VStack,
} from "@chakra-ui/react";
import { Briefcase, Calendar, AlertTriangle, ChevronRight, ShieldAlert } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { AppHeader } from "../organisms/AppHeader";
import { useAuth } from "../providers/AuthProvider";
import { listProduccion, estaLista, STAGES, ESTADOS, type ProduccionItem, type Estado } from "../services/produccion";

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const estadoMeta = (e: Estado) => ESTADOS.find((x) => x.key === e) ?? ESTADOS[0];

interface Fila {
  episodioId: string;
  titulo: string;
  stageKey: string;
  stageLabel: string;
  color: string;
  estado: Estado;
  fecha: string;
  lista: boolean;
  overdue: boolean;
}

const construirFilas = (items: ProduccionItem[], myId: string): Fila[] => {
  const hoy = todayStr();
  const filas: Fila[] = [];
  for (const it of items) {
    for (const s of STAGES) {
      const st = it.stages[s.key];
      if (st?.responsableId === myId) {
        const lista = estaLista(st);
        filas.push({
          episodioId: it.id, titulo: it.titulo, stageKey: s.key, stageLabel: s.label, color: s.color,
          estado: st.estado, fecha: st.fecha ?? "", lista,
          overdue: !!st.fecha && st.fecha < hoy && !lista,
        });
      }
    }
  }
  // atrasadas primero; luego por fecha asc; sin fecha al final; las listas al final
  return filas.sort((a, b) => {
    if (a.lista !== b.lista) return a.lista ? 1 : -1;
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    if (!a.fecha) return 1;
    if (!b.fecha) return -1;
    return a.fecha.localeCompare(b.fecha);
  });
};

export const MiTrabajoPage = () => {
  const { profile, role, isParticipant } = useAuth();
  const navigate = useNavigate();
  const myId = profile?.userId;
  const [items, setItems] = useState<ProduccionItem[] | null>(null);

  useEffect(() => {
    if (!isParticipant) return;
    const load = () => listProduccion().then(setItems).catch(() => setItems((p) => p ?? []));
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [isParticipant]);

  const filas = useMemo(() => (items && myId ? construirFilas(items, myId) : []), [items, myId]);
  const pendientes = filas.filter((f) => !f.lista).length;
  const atrasadas = filas.filter((f) => f.overdue).length;

  if (role === null) {
    return <Center minH="100vh" bg="bg.canvas"><Spinner size="xl" color="brand.primary" borderWidth="3px" /></Center>;
  }
  if (!isParticipant) {
    return (
      <Box bg="bg.canvas" color="fg.default" minH="100vh">
        <AppHeader />
        <Center minH="60vh">
          <VStack gap="4" textAlign="center" px="6">
            <ShieldAlert size={48} color="#f59e0b" />
            <Heading size="lg">Solo para el equipo</Heading>
            <Text color="fg.muted" maxW="md">Esta vista muestra las etapas de producción asignadas a ti.</Text>
            <Button onClick={() => navigate("/")} borderRadius="full" variant="outline" borderColor="border.subtle">Volver al inicio</Button>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />
      <Container maxW="900px" px={{ base: "5", md: "8" }} py={{ base: "10", md: "14" }}>
        <VStack align="stretch" gap="8">
          <VStack align="start" gap="2">
            <HStack gap="2" color="brand.primary">
              <Briefcase size={16} />
              <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase">Mi trabajo</Text>
            </HStack>
            <Heading as="h1" size={{ base: "2xl", md: "3xl" }} fontWeight="900" letterSpacing="tighter">Mis etapas asignadas</Heading>
            <HStack gap="3" flexWrap="wrap">
              <Text fontSize="sm" color="fg.subtle">{pendientes} pendiente{pendientes !== 1 ? "s" : ""}</Text>
              {atrasadas > 0 && (
                <Badge bg="rgba(239,68,68,0.15)" color="red.300" border="1px solid" borderColor="rgba(239,68,68,0.4)" borderRadius="full" px="3">
                  <HStack gap="1"><AlertTriangle size={12} /><Text>{atrasadas} atrasada{atrasadas !== 1 ? "s" : ""}</Text></HStack>
                </Badge>
              )}
            </HStack>
          </VStack>

          {items === null ? (
            <Center py="12"><Spinner color="brand.primary" size="lg" /></Center>
          ) : filas.length === 0 ? (
            <Text color="fg.subtle" fontSize="sm">No tienes etapas asignadas por ahora.</Text>
          ) : (
            <VStack align="stretch" gap="3">
              {filas.map((f) => {
                const em = estadoMeta(f.estado);
                return (
                  <GlassPanel key={`${f.episodioId}-${f.stageKey}`} interactive p={{ base: "4", md: "5" }} cursor="pointer" onClick={() => navigate(`/agenda?tab=produccion&ep=${f.episodioId}`)} opacity={f.lista ? 0.6 : 1} borderColor={f.overdue ? "rgba(239,68,68,0.4)" : undefined}>
                    <Flex justify="space-between" align="center" gap="3">
                      <HStack gap="3" minW="0">
                        <Box w="9px" h="9px" borderRadius="full" bg={f.color} flexShrink="0" />
                        <VStack align="start" gap="0.5" minW="0">
                          <Text fontWeight="700" fontSize="sm" lineClamp={1}>{f.titulo}</Text>
                          <HStack gap="2" flexWrap="wrap">
                            <Text fontSize="xs" color="fg.muted">{f.stageLabel}</Text>
                            {f.lista ? (
                              <Badge bg="rgba(34,197,94,0.15)" color="brandGreen.400" borderRadius="full" px="2" fontSize="0.6rem" fontWeight="700">LISTA</Badge>
                            ) : (
                              <Badge bg="bg.elevated" color={em.color} borderRadius="full" px="2" fontSize="0.6rem" fontWeight="700">{em.label}</Badge>
                            )}
                            {f.fecha && (
                              <HStack gap="1" color={f.overdue ? "red.300" : "fg.subtle"} fontSize="xs"><Calendar size={11} /><Text>{f.fecha}</Text></HStack>
                            )}
                            {f.overdue && (
                              <Badge bg="rgba(239,68,68,0.15)" color="red.300" borderRadius="full" px="2" fontSize="0.6rem" fontWeight="700">ATRASADA</Badge>
                            )}
                          </HStack>
                        </VStack>
                      </HStack>
                      <Box color="fg.subtle" flexShrink="0"><ChevronRight size={20} /></Box>
                    </Flex>
                  </GlassPanel>
                );
              })}
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  );
};
