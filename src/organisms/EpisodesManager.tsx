import { useEffect, useState, type FormEvent } from "react";
import {
  Box, Button, Center, Flex, Grid, Heading, HStack, IconButton, Input, Spinner, Switch, Text, Textarea, VStack,
} from "@chakra-ui/react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { WhiskyGlass } from "../atoms/WhiskyGlass";
import { listEpisodios, createEpisodio, updateEpisodio, deleteEpisodio, type Episodio } from "../services/episodios";

const fp = {
  bg: "bg.muted", border: "1px solid", borderColor: "border.subtle", borderRadius: "lg",
  color: "fg.default", size: "md" as const, px: "3",
  _hover: { borderColor: "border.neon" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #22d3ee", outline: "none" },
};
const Lbl = ({ children }: { children: string }) => (
  <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase" mb="1">{children}</Text>
);

const empty = { number: "", title: "", duration: "", date: "", description: "", spotify: "", youtube: "", apple: "", premium: false };

export const EpisodesManager = () => {
  const [episodios, setEpisodios] = useState<Episodio[] | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState({ ...empty });
  const [saving, setSaving] = useState(false);

  useEffect(() => { listEpisodios().then(setEpisodios).catch(() => setEpisodios([])); }, []);

  const reset = () => { setEditId(null); setF({ ...empty }); };

  const startEdit = (e: Episodio) => {
    setEditId(e.id);
    setF({
      number: String(e.number), title: e.title, duration: e.duration ?? "", date: e.date ?? "",
      description: e.description ?? "", spotify: e.links?.spotify ?? "", youtube: e.links?.youtube ?? "",
      apple: e.links?.apple ?? "", premium: !!e.premium,
    });
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    const payload = {
      number: Number(f.number), title: f.title, duration: f.duration, date: f.date,
      description: f.description, premium: f.premium,
      links: { spotify: f.spotify, youtube: f.youtube, apple: f.apple },
    };
    try {
      if (editId) {
        const up = await updateEpisodio(editId, payload);
        setEpisodios((p) => (p ?? []).map((e) => (e.id === editId ? up : e)));
      } else {
        const nu = await createEpisodio(payload);
        setEpisodios((p) => [nu, ...(p ?? [])]);
      }
      reset();
    } catch { /* noop */ } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    await deleteEpisodio(id).catch(() => {});
    setEpisodios((p) => (p ?? []).filter((e) => e.id !== id));
    if (editId === id) reset();
  };

  return (
    <VStack align="stretch" gap="6">
      <Heading size="lg" fontWeight="800">Episodios</Heading>

      <Grid templateColumns={{ base: "1fr", lg: "380px 1fr" }} gap="6" alignItems="start">
        <GlassPanel p={{ base: "5", md: "6" }}>
          <Flex justify="space-between" align="center" mb="4">
            <Heading size="sm">{editId ? "Editar episodio" : "Nuevo episodio"}</Heading>
            {editId && (
              <Button size="xs" variant="ghost" color="fg.subtle" onClick={reset}>
                <X size={14} style={{ marginRight: "4px" }} /> Cancelar
              </Button>
            )}
          </Flex>
          <VStack as="form" onSubmit={submit} align="stretch" gap="3">
            <Flex gap="3">
              <Box w="90px"><Lbl># Nº</Lbl><Input type="number" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} required {...fp} /></Box>
              <Box flex="1"><Lbl>Duración</Lbl><Input placeholder="1h 14m" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} {...fp} /></Box>
            </Flex>
            <Box><Lbl>Título</Lbl><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required {...fp} /></Box>
            <Box><Lbl>Descripción</Lbl><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} {...fp} py="2" /></Box>
            <Box><Lbl>Link Spotify</Lbl><Input placeholder="https://…" value={f.spotify} onChange={(e) => setF({ ...f, spotify: e.target.value })} {...fp} /></Box>
            <Box><Lbl>Link YouTube</Lbl><Input placeholder="https://…" value={f.youtube} onChange={(e) => setF({ ...f, youtube: e.target.value })} {...fp} /></Box>
            <Box><Lbl>Link Apple</Lbl><Input placeholder="https://…" value={f.apple} onChange={(e) => setF({ ...f, apple: e.target.value })} {...fp} /></Box>
            <Flex justify="space-between" align="center" p="2.5" borderRadius="lg" bg="rgba(245,158,11,0.08)" border="1px solid" borderColor="rgba(245,158,11,0.25)">
              <HStack gap="2" color="amber.300"><WhiskyGlass size={16} /><Text fontSize="sm" fontWeight="600" color="fg.default">Premium</Text></HStack>
              <Switch.Root checked={f.premium} onCheckedChange={(e) => setF({ ...f, premium: e.checked })} colorPalette="yellow">
                <Switch.HiddenInput /><Switch.Control><Switch.Thumb /></Switch.Control>
              </Switch.Root>
            </Flex>
            <Button type="submit" loading={saving} borderRadius="lg" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)" _hover={{ opacity: 0.92 }}>
              <Plus size={16} style={{ marginRight: "6px" }} /> {editId ? "Guardar cambios" : "Crear episodio"}
            </Button>
          </VStack>
        </GlassPanel>

        <GlassPanel p={{ base: "4", md: "5" }}>
          {episodios === null ? (
            <Center py="8"><Spinner color="brand.primary" /></Center>
          ) : episodios.length === 0 ? (
            <Text color="fg.subtle" fontSize="sm">No hay episodios. Crea el primero.</Text>
          ) : (
            <VStack align="stretch" gap="2">
              {episodios.map((e) => (
                <Flex key={e.id} justify="space-between" align="center" gap="3" p="3" borderRadius="lg" bg="bg.muted">
                  <HStack gap="3" minW="0">
                    <Text fontWeight="800" fontFamily="heading" color="brand.primary" fontSize="sm" flexShrink="0">EP{e.number}</Text>
                    {e.premium && <Box color="amber.300" flexShrink="0"><WhiskyGlass size={14} /></Box>}
                    <Text fontWeight="600" fontSize="sm" lineClamp={1}>{e.title}</Text>
                  </HStack>
                  <HStack gap="1" flexShrink="0">
                    <IconButton aria-label="Editar" size="xs" variant="ghost" color="fg.subtle" onClick={() => startEdit(e)} _hover={{ color: "brand.primary" }}><Pencil size={15} /></IconButton>
                    <IconButton aria-label="Eliminar" size="xs" variant="ghost" color="fg.subtle" onClick={() => remove(e.id)} _hover={{ color: "red.400", bg: "rgba(239,68,68,0.1)" }}><Trash2 size={15} /></IconButton>
                  </HStack>
                </Flex>
              ))}
            </VStack>
          )}
        </GlassPanel>
      </Grid>
    </VStack>
  );
};
