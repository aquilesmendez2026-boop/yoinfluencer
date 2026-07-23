import { useEffect, useMemo, useState } from "react";
import { AspectRatio, Box, Button, Center, Flex, HStack, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { ExternalLink, Radio, CalendarClock, Clock, Eye } from "lucide-react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { GlassPanel } from "../atoms/GlassPanel";
import { getLive, listLives, type LiveState, type LiveRealizado } from "../services/live";
import { listEventos, type Evento } from "../services/events";
import { plataformaLabel } from "../services/redes";

const two = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");

/** "2026-03-14" → "14 de marzo de 2026". Se parsea a mano para no correr la zona horaria. */
const fechaLarga = (iso: string): string => {
  const [y, m, d] = (iso || "").split("-").map(Number);
  if (!y || !m || !d) return iso || "—";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(y, m - 1, d)
  );
};

const LivesAnteriores = ({ lives }: { lives: LiveRealizado[] }) => (
  <VStack gap="8" w="full" pt={{ base: "4", md: "8" }}>
    <SectionTitle
      eyebrow="Historial"
      title="En vivos anteriores"
      subtitle="Todo lo que ya transmitimos, por si te perdiste alguno."
    />
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="5" w="full">
      {lives.map((l) => (
        <GlassPanel key={l.id} interactive p={{ base: "5", md: "6" }} h="full">
          <VStack align="start" gap="3" h="full">
            <HStack gap="2" flexWrap="wrap">
              <Text
                fontSize="xs"
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing="wide"
                color="fg.inverted"
                bg="brand.400"
                px="2"
                py="0.5"
                borderRadius="full"
              >
                {plataformaLabel(l.plataforma)}
              </Text>
              <Text fontSize="xs" color="fg.subtle">{fechaLarga(l.fecha)}</Text>
            </HStack>

            <Text fontFamily="heading" fontWeight="800" fontSize="lg" color="fg.default" lineClamp={2}>
              {l.titulo}
            </Text>

            {l.descripcion && (
              <Text fontSize="sm" color="fg.muted" lineClamp={3}>
                {l.descripcion}
              </Text>
            )}

            <HStack gap="4" color="fg.subtle" fontSize="xs" mt="auto" pt="1">
              {l.duracion && (
                <HStack gap="1"><Clock size={13} /><Text>{l.duracion}</Text></HStack>
              )}
              {l.espectadores > 0 && (
                <HStack gap="1"><Eye size={13} /><Text>{l.espectadores.toLocaleString("es-AR")}</Text></HStack>
              )}
            </HStack>

            {l.url && (
              <Button as="a"
                // @ts-expect-error anchor via as
                href={l.url} target="_blank" rel="noopener noreferrer"
                size="sm" w="full" borderRadius="full" variant="outline"
                borderColor="border.subtle" color="fg.default" _hover={{ borderColor: "border.brand", color: "fg.accent" }}>
                <ExternalLink size={15} style={{ marginRight: "6px" }} /> Ver el en vivo
              </Button>
            )}
          </VStack>
        </GlassPanel>
      ))}
    </SimpleGrid>
  </VStack>
);

const nextStreamDate = (eventos: Evento[]): { date: Date; ev: Evento } | null => {
  const now = Date.now();
  const upcoming = eventos
    .filter((e) => e.type === "en_vivo")
    .map((e) => {
      const [y, m, d] = e.date.split("-").map(Number);
      const [hh, mm] = e.time.split(":").map(Number);
      return { date: new Date(y, m - 1, d, hh || 0, mm || 0), ev: e };
    })
    .filter((x) => x.date.getTime() > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  return upcoming[0] ?? null;
};

const Countdown = ({ target }: { target: Date }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now) / 1000;
  const parts = [
    { v: diff / 86400, l: "días" },
    { v: (diff % 86400) / 3600, l: "horas" },
    { v: (diff % 3600) / 60, l: "min" },
    { v: diff % 60, l: "seg" },
  ];
  return (
    <SimpleGrid columns={4} gap="3" maxW="md" w="full">
      {parts.map((p) => (
        <VStack key={p.l} gap="0" bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="xl" py="3">
          <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="900" fontFamily="heading" color="fg.default">
            {two(p.v)}
          </Text>
          <Text fontSize="xs" color="fg.subtle" textTransform="uppercase" letterSpacing="wide">
            {p.l}
          </Text>
        </VStack>
      ))}
    </SimpleGrid>
  );
};

export const LiveSection = () => {
  const [live, setLiveState] = useState<LiveState | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [lives, setLives] = useState<LiveRealizado[]>([]);

  useEffect(() => {
    getLive().then(setLiveState).catch(() => setLiveState({ isLive: false, videoId: "", title: "" }));
    listEventos().then(setEventos).catch(() => setEventos([]));
    listLives().then(setLives).catch(() => setLives([]));
  }, []);

  const anteriores = useMemo(
    () => [...lives].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")),
    [lives]
  );

  const next = useMemo(() => nextStreamDate(eventos), [eventos]);
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const showChat = host && host !== "localhost" && host !== "127.0.0.1";

  return (
    <Section id="envivo">
      <VStack gap={{ base: "10", md: "16" }} w="full">
      {live === null ? (
        <Center py="12">
          <Spinner color="brand.primary" size="lg" />
        </Center>
      ) : live.isLive && live.videoId ? (
        <VStack gap="8" w="full">
          <VStack gap="3">
            <HStack gap="2" bg="rgba(239,68,68,0.15)" border="1px solid" borderColor="rgba(239,68,68,0.5)" borderRadius="full" px="4" py="1.5">
              <Box w="9px" h="9px" borderRadius="full" bg="red.500" animation="glow 1.2s ease-in-out infinite" />
              <Text fontSize="sm" fontWeight="800" color="red.300" letterSpacing="wide">EN VIVO AHORA</Text>
            </HStack>
            <SectionTitle title={live.title || "Estamos transmitiendo en vivo"} />
          </VStack>

          <Flex gap="5" w="full" direction={{ base: "column", lg: showChat ? "row" : "column" }} align={{ lg: "stretch" }}>
            <Box flex={{ lg: showChat ? "2" : "1" }} w="full">
              <AspectRatio ratio={16 / 9} borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="border.brand" boxShadow="brand">
                <iframe
                  src={`https://www.youtube.com/embed/${live.videoId}?autoplay=1`}
                  title="Transmisión en vivo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: 0 }}
                />
              </AspectRatio>
            </Box>
            {showChat && (
              <Box flex="1" minW={{ lg: "320px" }} display={{ base: "none", lg: "block" }}>
                <iframe
                  title="Chat en vivo"
                  src={`https://www.youtube.com/live_chat?v=${live.videoId}&embed_domain=${host}`}
                  style={{ width: "100%", height: "100%", minHeight: "420px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)" }}
                />
              </Box>
            )}
          </Flex>

          <Button as="a"
            // @ts-expect-error anchor via as
            href={`https://www.youtube.com/watch?v=${live.videoId}`} target="_blank" rel="noopener noreferrer"
            size="lg" borderRadius="full" px="7" border="none" color="fg.inverted" fontWeight="700"
            backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)" _hover={{ opacity: 0.92, boxShadow: "brand" }}>
            <ExternalLink size={18} style={{ marginRight: "8px" }} />
            Abrir en YouTube (chat, Super Chat y suscripción)
          </Button>
        </VStack>
      ) : (
        <VStack gap="8" w="full">
          <SectionTitle
            eyebrow="En vivo"
            title="No estamos transmitiendo ahora mismo"
            subtitle={next ? "Pero se viene el próximo show. Prepárate:" : "Muy pronto anunciaremos la próxima transmisión."}
          />
          {next ? (
            <GlassPanel p={{ base: "6", md: "8" }} w="full" maxW="2xl">
              <VStack gap="5">
                <HStack gap="2" color="brand.primary">
                  <CalendarClock size={18} />
                  <Text fontWeight="700">{next.ev.title}</Text>
                </HStack>
                <Countdown target={next.date} />
                <Button as="a"
                  // @ts-expect-error anchor via as
                  href="#schedule" size="md" borderRadius="full" variant="outline" borderColor="border.subtle" color="fg.default" _hover={{ borderColor: "border.brand" }}>
                  <Radio size={16} style={{ marginRight: "6px" }} /> Ver todos los horarios
                </Button>
              </VStack>
            </GlassPanel>
          ) : null}
        </VStack>
      )}

      {anteriores.length > 0 && <LivesAnteriores lives={anteriores} />}
      </VStack>
    </Section>
  );
};
