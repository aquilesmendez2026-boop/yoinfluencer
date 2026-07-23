import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Box, Button, Center, Flex, Grid, Heading, HStack, IconButton, Input, NativeSelect, Spinner, Text, Textarea, VStack,
} from "@chakra-ui/react";
import { Clock, Eye, ExternalLink, Plus, Trash2, X } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { ApiError } from "../services/api";
import { PLATAFORMAS } from "../services/redes";
import { listLives, createLiveRealizado, deleteLiveRealizado, type LiveRealizado } from "../services/live";

const fp = {
  bg: "bg.muted", border: "1px solid", borderColor: "border.subtle", borderRadius: "lg",
  color: "fg.default", size: "md" as const, px: "3",
  _hover: { borderColor: "border.brand" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #12b76a", outline: "none" },
};
const Lbl = ({ children }: { children: string }) => (
  <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase" mb="1">{children}</Text>
);

/** "2026-03-14" → "14 de marzo de 2026". Se parsea a mano para no correr la zona horaria. */
export const formatFechaLarga = (iso: string): string => {
  const [y, m, d] = (iso || "").split("-").map(Number);
  if (!y || !m || !d) return iso || "—";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(y, m - 1, d)
  );
};

const vacio = {
  titulo: "", fecha: "", plataforma: "youtube", url: "", duracion: "", espectadores: "", descripcion: "",
};

export const LivesManager = () => {
  const [lives, setLives] = useState<LiveRealizado[] | null>(null);
  const [f, setF] = useState({ ...vacio });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    listLives()
      .then(setLives)
      .catch(() => setLives([]));
  }, []);

  const ordenados = useMemo(
    () => [...(lives ?? [])].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")),
    [lives]
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setSaving(true);
    try {
      const nuevo = await createLiveRealizado({
        titulo: f.titulo.trim(),
        fecha: f.fecha,
        plataforma: f.plataforma,
        url: f.url.trim(),
        duracion: f.duracion.trim(),
        espectadores: Number(f.espectadores) || 0,
        descripcion: f.descripcion.trim(),
      });
      setLives((p) => [nuevo, ...(p ?? [])]);
      setF({ ...vacio });
      setMsg("✓ En vivo agregado al historial");
    } catch (err: unknown) {
      if (err instanceof ApiError) setError(`Error ${err.status}: ${err.message}`);
      else setError(err instanceof Error ? err.message : "No se pudo guardar el en vivo.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      await deleteLiveRealizado(id);
      setLives((p) => (p ?? []).filter((l) => l.id !== id));
      setConfirmId(null);
    } catch (err: unknown) {
      if (err instanceof ApiError) setError(`Error ${err.status}: ${err.message}`);
      else setError("No se pudo eliminar el en vivo.");
    }
  };

  return (
    <VStack align="stretch" gap="6">
      <VStack align="start" gap="1">
        <Heading size="lg" fontWeight="800">Historial de en vivos</Heading>
        <Text color="fg.muted" fontSize="sm">
          Los en vivos ya realizados. Se muestran en la home debajo de la transmisión actual.
        </Text>
      </VStack>

      <Grid templateColumns={{ base: "1fr", lg: "380px 1fr" }} gap="6" alignItems="start">
        <GlassPanel p={{ base: "5", md: "6" }}>
          <Heading size="sm" mb="4">Nuevo en vivo realizado</Heading>
          <VStack as="form" onSubmit={submit} align="stretch" gap="3">
            <Box>
              <Lbl>Título</Lbl>
              <Input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} required {...fp} />
            </Box>
            <Flex gap="3">
              <Box flex="1">
                <Lbl>Fecha</Lbl>
                <Input type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} required {...fp} />
              </Box>
              <Box flex="1">
                <Lbl>Duración</Lbl>
                <Input placeholder="1h 20m" value={f.duracion} onChange={(e) => setF({ ...f, duracion: e.target.value })} {...fp} />
              </Box>
            </Flex>
            <Box>
              <Lbl>Plataforma</Lbl>
              <NativeSelect.Root size="md">
                <NativeSelect.Field value={f.plataforma} onChange={(e) => setF({ ...f, plataforma: e.target.value })} {...fp}>
                  {PLATAFORMAS.map((p) => (
                    <option key={p.key} value={p.key} style={{ background: "#171b18" }}>{p.label}</option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>
            <Box>
              <Lbl>URL del video</Lbl>
              <Input placeholder="https://…" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} {...fp} />
            </Box>
            <Box>
              <Lbl>Espectadores</Lbl>
              <Input type="number" min={0} value={f.espectadores} onChange={(e) => setF({ ...f, espectadores: e.target.value })} {...fp} />
            </Box>
            <Box>
              <Lbl>Descripción</Lbl>
              <Textarea value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} rows={3} {...fp} py="2" />
            </Box>

            {error && <Text color="red.400" fontSize="sm">{error}</Text>}
            {msg && <Text color="brand.primary" fontSize="sm" fontWeight="600">{msg}</Text>}

            <Button type="submit" loading={saving} borderRadius="lg" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)" _hover={{ opacity: 0.92 }}>
              <Plus size={16} style={{ marginRight: "6px" }} /> Agregar al historial
            </Button>
          </VStack>
        </GlassPanel>

        <GlassPanel p={{ base: "4", md: "5" }}>
          {lives === null ? (
            <Center py="8"><Spinner color="brand.primary" /></Center>
          ) : ordenados.length === 0 ? (
            <Text color="fg.subtle" fontSize="sm">Todavía no hay en vivos en el historial.</Text>
          ) : (
            <VStack align="stretch" gap="2">
              {ordenados.map((l) => (
                <Box key={l.id} p="3" borderRadius="lg" bg="bg.muted" border="1px solid" borderColor="border.subtle">
                  <Flex justify="space-between" align="start" gap="3">
                    <VStack align="start" gap="1" minW="0">
                      <Text fontWeight="700" fontSize="sm" color="fg.default" lineClamp={1}>{l.titulo}</Text>
                      <HStack gap="3" flexWrap="wrap" color="fg.subtle" fontSize="xs">
                        <Text>{formatFechaLarga(l.fecha)}</Text>
                        <Text color="fg.accent" fontWeight="600" textTransform="capitalize">{l.plataforma}</Text>
                        {l.duracion && <HStack gap="1"><Clock size={12} /><Text>{l.duracion}</Text></HStack>}
                        {l.espectadores > 0 && <HStack gap="1"><Eye size={12} /><Text>{l.espectadores}</Text></HStack>}
                      </HStack>
                    </VStack>
                    <HStack gap="1" flexShrink="0">
                      {l.url && (
                        <IconButton aria-label="Abrir" size="xs" variant="ghost" color="fg.subtle" asChild _hover={{ color: "brand.primary" }}>
                          <a href={l.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /></a>
                        </IconButton>
                      )}
                      {confirmId === l.id ? (
                        <HStack gap="1">
                          <Button size="xs" borderRadius="md" bg="red.500" color="fg.default" fontWeight="700" onClick={() => remove(l.id)} _hover={{ bg: "red.600" }}>
                            Confirmar
                          </Button>
                          <IconButton aria-label="Cancelar" size="xs" variant="ghost" color="fg.subtle" onClick={() => setConfirmId(null)}>
                            <X size={15} />
                          </IconButton>
                        </HStack>
                      ) : (
                        <IconButton aria-label="Eliminar" size="xs" variant="ghost" color="fg.subtle" onClick={() => setConfirmId(l.id)} _hover={{ color: "red.400", bg: "rgba(239,68,68,0.1)" }}>
                          <Trash2 size={15} />
                        </IconButton>
                      )}
                    </HStack>
                  </Flex>
                </Box>
              ))}
            </VStack>
          )}
        </GlassPanel>
      </Grid>
    </VStack>
  );
};
