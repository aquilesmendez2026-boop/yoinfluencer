import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Input,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { CalendarDays, MapPin, Plus, Trash2, Lightbulb, ShieldAlert, User as UserIcon } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { AppHeader } from "../organisms/AppHeader";
import { MonthCalendar } from "../organisms/MonthCalendar";
import { useAuth } from "../providers/AuthProvider";
import type { Evento } from "../services/events";
import {
  listReuniones, createReunion, deleteReunion, type Reunion,
  listNotas, createNota, deleteNota, type Nota,
} from "../services/team";

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const formatLong = (ds: string) => {
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
};

const fieldProps = {
  bg: "bg.muted", border: "1px solid", borderColor: "border.subtle", borderRadius: "lg",
  color: "fg.default", size: "md" as const, px: "3",
  _hover: { borderColor: "border.neon" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #22d3ee", outline: "none" },
};

export const AgendaPage = () => {
  const { role, isParticipant } = useAuth();
  const navigate = useNavigate();

  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [selected, setSelected] = useState<string>(todayStr());
  const [loading, setLoading] = useState(true);

  // Form reunión
  const [rDate, setRDate] = useState("");
  const [rTime, setRTime] = useState("");
  const [rTitle, setRTitle] = useState("");
  const [rLugar, setRLugar] = useState("");
  const [rDesc, setRDesc] = useState("");
  const [savingR, setSavingR] = useState(false);

  // Form nota
  const [nTitulo, setNTitulo] = useState("");
  const [nContenido, setNContenido] = useState("");
  const [savingN, setSavingN] = useState(false);

  useEffect(() => {
    if (!isParticipant) return;
    Promise.all([listReuniones().then(setReuniones), listNotas().then(setNotas)])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isParticipant]);

  const calItems: Evento[] = useMemo(
    () => reuniones.map((r) => ({ id: r.id, date: r.date, time: r.time, title: r.title, type: "especial", description: "", premium: false })),
    [reuniones]
  );
  const dayReuniones = useMemo(
    () => reuniones.filter((r) => r.date === selected).sort((a, b) => a.time.localeCompare(b.time)),
    [reuniones, selected]
  );

  const addReunion = async (e: FormEvent) => {
    e.preventDefault();
    setSavingR(true);
    try {
      const r = await createReunion({ date: rDate, time: rTime, title: rTitle, lugar: rLugar, description: rDesc });
      setReuniones((p) => [...p, r]);
      setSelected(r.date);
      setRTitle(""); setRLugar(""); setRDesc("");
    } catch { /* noop */ } finally { setSavingR(false); }
  };

  const removeReunion = async (id: string) => {
    await deleteReunion(id).catch(() => {});
    setReuniones((p) => p.filter((r) => r.id !== id));
  };

  const addNota = async (e: FormEvent) => {
    e.preventDefault();
    if (!nContenido.trim() && !nTitulo.trim()) return;
    setSavingN(true);
    try {
      const n = await createNota({ titulo: nTitulo, contenido: nContenido });
      setNotas((p) => [n, ...p]);
      setNTitulo(""); setNContenido("");
    } catch { /* noop */ } finally { setSavingN(false); }
  };

  const removeNota = async (id: string) => {
    await deleteNota(id).catch(() => {});
    setNotas((p) => p.filter((n) => n.id !== id));
  };

  if (role === null) {
    return (
      <Center minH="100vh" bg="bg.canvas">
        <Spinner size="xl" color="brand.primary" borderWidth="3px" />
      </Center>
    );
  }

  if (!isParticipant) {
    return (
      <Box bg="bg.canvas" color="fg.default" minH="100vh">
        <AppHeader />
        <Center minH="60vh">
          <VStack gap="4" textAlign="center" px="6">
            <ShieldAlert size={48} color="#f59e0b" />
            <Heading size="lg">Sección del equipo</Heading>
            <Text color="fg.muted" maxW="md">
              Esta agenda es solo para los participantes del podcast. Si crees que deberías tener
              acceso, pídele a un admin que te asigne el rol.
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
        <VStack align="stretch" gap="12">
          {/* ── AGENDA ── */}
          <VStack align="stretch" gap="6">
            <VStack align="start" gap="2">
              <HStack gap="2" color="brand.primary">
                <CalendarDays size={16} />
                <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase">
                  Agenda del equipo
                </Text>
              </HStack>
              <Heading as="h1" size={{ base: "2xl", md: "3xl" }} fontWeight="900" letterSpacing="tighter">
                Reuniones
              </Heading>
            </VStack>

            <Grid templateColumns={{ base: "1fr", lg: "360px 1fr" }} gap="6" alignItems="start">
              <GlassPanel p={{ base: "5", md: "6" }}>
                <Heading size="sm" mb="4">Nueva reunión</Heading>
                <VStack as="form" onSubmit={addReunion} align="stretch" gap="3">
                  <Input type="date" value={rDate} onChange={(e) => setRDate(e.target.value)} required {...fieldProps} />
                  <Input type="time" value={rTime} onChange={(e) => setRTime(e.target.value)} required {...fieldProps} />
                  <Input placeholder="Título (ej. Pauta del mes)" value={rTitle} onChange={(e) => setRTitle(e.target.value)} required {...fieldProps} />
                  <Input placeholder="Lugar / enlace (Meet, Zoom, oficina…)" value={rLugar} onChange={(e) => setRLugar(e.target.value)} {...fieldProps} />
                  <Textarea placeholder="Notas de la reunión…" value={rDesc} onChange={(e) => setRDesc(e.target.value)} rows={2} {...fieldProps} px="3" py="2" />
                  <Button type="submit" loading={savingR} borderRadius="lg" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)" _hover={{ opacity: 0.92 }}>
                    <Plus size={16} style={{ marginRight: "6px" }} /> Agregar
                  </Button>
                </VStack>
              </GlassPanel>

              <VStack align="stretch" gap="6">
                <GlassPanel p={{ base: "5", md: "6" }}>
                  {loading ? (
                    <Center py="8"><Spinner color="brand.primary" /></Center>
                  ) : (
                    <MonthCalendar events={calItems} selected={selected} onSelect={setSelected} showLegend={false} />
                  )}
                </GlassPanel>

                <GlassPanel p={{ base: "5", md: "6" }}>
                  <Heading size="sm" mb="4" textTransform="capitalize">{formatLong(selected)}</Heading>
                  {dayReuniones.length === 0 ? (
                    <Text color="fg.subtle" fontSize="sm">No hay reuniones este día.</Text>
                  ) : (
                    <VStack align="stretch" gap="3">
                      {dayReuniones.map((r) => (
                        <Flex key={r.id} justify="space-between" gap="3" p="3" borderRadius="lg" bg="bg.muted">
                          <HStack gap="3" align="start" minW="0">
                            <Text fontWeight="800" fontFamily="heading" fontSize="sm" color="brand.primary" flexShrink="0">{r.time}</Text>
                            <VStack align="start" gap="0.5" minW="0">
                              <Text fontWeight="600" fontSize="sm">{r.title}</Text>
                              {r.lugar && (
                                <HStack gap="1" color="fg.subtle"><MapPin size={12} /><Text fontSize="xs">{r.lugar}</Text></HStack>
                              )}
                              {r.description && <Text fontSize="xs" color="fg.muted">{r.description}</Text>}
                              {r.createdByName && <Text fontSize="0.65rem" color="fg.subtle">por {r.createdByName}</Text>}
                            </VStack>
                          </HStack>
                          <IconButton aria-label="Eliminar" size="xs" variant="ghost" color="fg.subtle" onClick={() => removeReunion(r.id)} _hover={{ color: "red.400", bg: "rgba(239,68,68,0.1)" }} flexShrink="0">
                            <Trash2 size={15} />
                          </IconButton>
                        </Flex>
                      ))}
                    </VStack>
                  )}
                </GlassPanel>
              </VStack>
            </Grid>
          </VStack>

          {/* ── NOTAS / IDEAS ── */}
          <VStack align="stretch" gap="6">
            <VStack align="start" gap="2">
              <HStack gap="2" color="brand.secondary">
                <Lightbulb size={16} />
                <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase">
                  Notas e ideas
                </Text>
              </HStack>
              <Heading as="h2" size={{ base: "xl", md: "2xl" }} fontWeight="800">
                Que no se pierda ninguna oportunidad
              </Heading>
            </VStack>

            <GlassPanel p={{ base: "5", md: "6" }}>
              <VStack as="form" onSubmit={addNota} align="stretch" gap="3">
                <Input placeholder="Título (opcional)" value={nTitulo} onChange={(e) => setNTitulo(e.target.value)} {...fieldProps} />
                <Textarea placeholder="Escribe tu idea, invitado potencial, tema para un show…" value={nContenido} onChange={(e) => setNContenido(e.target.value)} rows={3} {...fieldProps} px="3" py="2" />
                <Button type="submit" loading={savingN} alignSelf="start" px="6" borderRadius="lg" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #d946ef 0%, #22d3ee 100%)" _hover={{ opacity: 0.92 }}>
                  <Plus size={16} style={{ marginRight: "6px" }} /> Guardar idea
                </Button>
              </VStack>
            </GlassPanel>

            {notas.length === 0 ? (
              <Text color="fg.subtle" fontSize="sm">Aún no hay notas. ¡Anota la primera idea!</Text>
            ) : (
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
                {notas.map((n) => (
                  <GlassPanel key={n.id} p="5">
                    <Flex justify="space-between" gap="2" mb="2">
                      {n.titulo ? <Heading size="sm">{n.titulo}</Heading> : <Box />}
                      <IconButton aria-label="Eliminar" size="xs" variant="ghost" color="fg.subtle" onClick={() => removeNota(n.id)} _hover={{ color: "red.400", bg: "rgba(239,68,68,0.1)" }}>
                        <Trash2 size={15} />
                      </IconButton>
                    </Flex>
                    <Text fontSize="sm" color="fg.muted" whiteSpace="pre-wrap">{n.contenido}</Text>
                    {n.createdByName && (
                      <HStack gap="1" mt="3" color="fg.subtle">
                        <UserIcon size={12} />
                        <Text fontSize="0.65rem">{n.createdByName}</Text>
                      </HStack>
                    )}
                  </GlassPanel>
                ))}
              </Grid>
            )}
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};
