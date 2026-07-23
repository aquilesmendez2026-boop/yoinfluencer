import { useEffect, useState, type FormEvent } from "react";
import {
  Box, Button, Center, Flex, Grid, Heading, HStack, IconButton, Input, NativeSelect, Spinner, Switch, Text, VStack,
} from "@chakra-ui/react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { ApiError } from "../services/api";
import { listRedes, saveRedes, PLATAFORMAS, type Plataforma, type Red } from "../services/redes";

const fp = {
  bg: "bg.muted", border: "1px solid", borderColor: "border.subtle", borderRadius: "lg",
  color: "fg.default", size: "md" as const, px: "3",
  _hover: { borderColor: "border.brand" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #12b76a", outline: "none" },
};
const Lbl = ({ children }: { children: string }) => (
  <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase" mb="1">{children}</Text>
);

/** Fila editable en el panel: sin id, el backend reescribe la lista completa. */
interface Fila {
  plataforma: Plataforma;
  handle: string;
  url: string;
  seguidores: string;
  destacada: boolean;
}

const filaVacia = (): Fila => ({ plataforma: "instagram", handle: "", url: "", seguidores: "0", destacada: false });

const aFila = (r: Red): Fila => ({
  plataforma: r.plataforma,
  handle: r.handle ?? "",
  url: r.url ?? "",
  seguidores: String(r.seguidores ?? 0),
  destacada: !!r.destacada,
});

export const RedesManager = () => {
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    listRedes()
      .then((rs) => setFilas([...rs].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)).map(aFila)))
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.message : "No se pudieron cargar las redes.");
        setFilas([]);
      });
  }, []);

  const patch = (i: number, cambios: Partial<Fila>) =>
    setFilas((p) => (p ?? []).map((f, idx) => (idx === i ? { ...f, ...cambios } : f)));

  const agregar = () => setFilas((p) => [...(p ?? []), filaVacia()]);

  const quitar = (i: number) => setFilas((p) => (p ?? []).filter((_, idx) => idx !== i));

  const mover = (i: number, delta: number) =>
    setFilas((p) => {
      const arr = [...(p ?? [])];
      const j = i + delta;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setSaving(true);
    try {
      const payload = (filas ?? []).map((f, i) => ({
        plataforma: f.plataforma,
        handle: f.handle.trim(),
        url: f.url.trim(),
        seguidores: Number(f.seguidores) || 0,
        destacada: f.destacada,
        orden: i,
      }));
      const guardadas = await saveRedes(payload);
      setFilas([...guardadas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)).map(aFila));
      setMsg("✓ Redes guardadas");
    } catch (err: unknown) {
      if (err instanceof ApiError) setError(`Error ${err.status}: ${err.message}`);
      else setError(err instanceof Error ? err.message : "No se pudieron guardar las redes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <VStack align="stretch" gap="6">
      <VStack align="start" gap="1">
        <Heading size="lg" fontWeight="800">Redes sociales</Heading>
        <Text color="fg.muted" fontSize="sm">
          Editá la lista completa. El orden de las filas es el orden en que se muestran en la home.
        </Text>
      </VStack>

      <GlassPanel p={{ base: "4", md: "6" }}>
        {filas === null ? (
          <Center py="10"><Spinner color="brand.primary" /></Center>
        ) : (
          <VStack as="form" onSubmit={submit} align="stretch" gap="4">
            {filas.length === 0 ? (
              <Text color="fg.subtle" fontSize="sm">No hay redes todavía. Agregá la primera.</Text>
            ) : (
              <VStack align="stretch" gap="3">
                {filas.map((f, i) => (
                  <Box key={i} p={{ base: "3", md: "4" }} borderRadius="xl" bg="bg.muted" border="1px solid" borderColor={f.destacada ? "border.brand" : "border.subtle"}>
                    <Flex gap="3" align="start" direction={{ base: "column", xl: "row" }}>
                      <Grid flex="1" w="full" gap="3" templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }}>
                        <Box>
                          <Lbl>Plataforma</Lbl>
                          <NativeSelect.Root size="md">
                            <NativeSelect.Field
                              value={f.plataforma}
                              onChange={(e) => patch(i, { plataforma: e.target.value as Plataforma })}
                              {...fp}
                            >
                              {PLATAFORMAS.map((p) => (
                                <option key={p.key} value={p.key} style={{ background: "#171b18" }}>{p.label}</option>
                              ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                        </Box>
                        <Box>
                          <Lbl>Handle</Lbl>
                          <Input placeholder="@usuario" value={f.handle} onChange={(e) => patch(i, { handle: e.target.value })} {...fp} />
                        </Box>
                        <Box>
                          <Lbl>URL</Lbl>
                          <Input placeholder="https://…" value={f.url} onChange={(e) => patch(i, { url: e.target.value })} {...fp} />
                        </Box>
                        <Box>
                          <Lbl>Seguidores</Lbl>
                          <Input type="number" min={0} value={f.seguidores} onChange={(e) => patch(i, { seguidores: e.target.value })} {...fp} />
                        </Box>
                      </Grid>

                      <VStack gap="2" align="stretch" minW={{ xl: "150px" }} w={{ base: "full", xl: "auto" }}>
                        <Flex justify="space-between" align="center" gap="3" px="3" py="2" borderRadius="lg" bg="bg.surface" border="1px solid" borderColor="border.subtle">
                          <Text fontSize="sm" fontWeight="600" color="fg.default">Destacada</Text>
                          <Switch.Root checked={f.destacada} onCheckedChange={(e) => patch(i, { destacada: e.checked })} colorPalette="green">
                            <Switch.HiddenInput /><Switch.Control><Switch.Thumb /></Switch.Control>
                          </Switch.Root>
                        </Flex>
                        <HStack gap="1" justify="end">
                          <IconButton aria-label="Subir" size="xs" variant="ghost" color="fg.subtle" disabled={i === 0} onClick={() => mover(i, -1)} _hover={{ color: "brand.primary" }}>
                            <ArrowUp size={15} />
                          </IconButton>
                          <IconButton aria-label="Bajar" size="xs" variant="ghost" color="fg.subtle" disabled={i === filas.length - 1} onClick={() => mover(i, 1)} _hover={{ color: "brand.primary" }}>
                            <ArrowDown size={15} />
                          </IconButton>
                          <IconButton aria-label="Quitar" size="xs" variant="ghost" color="fg.subtle" onClick={() => quitar(i)} _hover={{ color: "red.400", bg: "rgba(239,68,68,0.1)" }}>
                            <Trash2 size={15} />
                          </IconButton>
                        </HStack>
                      </VStack>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}

            <Button type="button" onClick={agregar} variant="outline" borderColor="border.subtle" borderRadius="lg" color="fg.default" _hover={{ borderColor: "border.brand" }}>
              <Plus size={16} style={{ marginRight: "6px" }} /> Agregar red
            </Button>

            {error && <Text color="red.400" fontSize="sm">{error}</Text>}
            {msg && <Text color="brand.primary" fontSize="sm" fontWeight="600">{msg}</Text>}

            <Button type="submit" loading={saving} borderRadius="lg" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)" _hover={{ opacity: 0.92 }}>
              <Save size={16} style={{ marginRight: "6px" }} /> Guardar
            </Button>
          </VStack>
        )}
      </GlassPanel>
    </VStack>
  );
};
