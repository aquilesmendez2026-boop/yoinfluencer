import { useEffect, useState, type FormEvent } from "react";
import {
  Box, Button, Center, Checkbox, Flex, Grid, Heading, HStack, IconButton, Input,
  Spinner, Text, Textarea, VStack,
} from "@chakra-ui/react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { useAuth } from "../providers/AuthProvider";
import {
  createSeccion, deleteSeccion, listSecciones, updateSeccion,
  type Seccion, type SeccionInput,
} from "../services/secciones";

const fp = {
  bg: "bg.muted", border: "1px solid", borderColor: "border.subtle", borderRadius: "lg",
  color: "fg.default", size: "md" as const, px: "3",
  _hover: { borderColor: "border.brand" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #12b76a", outline: "none" },
};

const Lbl = ({ children }: { children: string }) => (
  <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase" mb="1">{children}</Text>
);

const empty = { nombre: "", descripcion: "", color: "#12b76a", orden: "0", activa: true };

/** Devuelve un color válido para pintar el acento, con fallback al verde de marca. */
const acento = (color?: string) => (color && color.trim() ? color : "#12b76a");

export const SeccionesManager = () => {
  const { isAdmin } = useAuth();
  const [secciones, setSecciones] = useState<Seccion[] | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [porBorrar, setPorBorrar] = useState<string | null>(null);

  useEffect(() => {
    listSecciones()
      .then((s) => setSecciones([...s].sort((a, b) => a.orden - b.orden)))
      .catch((e) => { setError(e instanceof Error ? e.message : "No se pudieron cargar las secciones."); setSecciones([]); });
  }, []);

  if (!isAdmin) {
    return <Text color="fg.subtle">No tienes permisos para gestionar las secciones.</Text>;
  }

  const ordenar = (list: Seccion[]) => [...list].sort((a, b) => a.orden - b.orden);

  const reset = () => {
    setEditId(null);
    setF({ ...empty });
    setError(null);
  };

  const startEdit = (s: Seccion) => {
    setEditId(s.id);
    setF({
      nombre: s.nombre,
      descripcion: s.descripcion ?? "",
      color: s.color || "#12b76a",
      orden: String(s.orden ?? 0),
      activa: !!s.activa,
    });
    setError(null);
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    setSaving(true);
    const payload: SeccionInput = {
      nombre: f.nombre,
      descripcion: f.descripcion,
      color: f.color,
      orden: Number(f.orden) || 0,
      activa: f.activa,
    };
    try {
      if (editId) {
        const up = await updateSeccion(editId, payload);
        setSecciones((p) => ordenar((p ?? []).map((s) => (s.id === editId ? up : s))));
      } else {
        const nu = await createSeccion(payload);
        setSecciones((p) => ordenar([...(p ?? []), nu]));
      }
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la sección.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      await deleteSeccion(id);
      setSecciones((p) => (p ?? []).filter((s) => s.id !== id));
      if (editId === id) reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar la sección.");
    } finally {
      setPorBorrar(null);
    }
  };

  return (
    <VStack align="stretch" gap="6">
      <Heading size="lg" fontWeight="800">Secciones</Heading>

      <Grid templateColumns={{ base: "1fr", lg: "420px 1fr" }} gap="6" alignItems="start">
        <GlassPanel p={{ base: "5", md: "6" }}>
          <Flex justify="space-between" align="center" mb="4">
            <Heading size="sm">{editId ? "Editar sección" : "Nueva sección"}</Heading>
            {editId && (
              <Button size="xs" variant="ghost" color="fg.subtle" onClick={reset}>
                <X size={14} style={{ marginRight: "4px" }} /> Cancelar
              </Button>
            )}
          </Flex>

          <VStack as="form" onSubmit={submit} align="stretch" gap="3">
            <Box><Lbl>Nombre</Lbl><Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required {...fp} /></Box>

            <Box>
              <Lbl>Descripción</Lbl>
              <Textarea value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} rows={3} {...fp} py="2" />
            </Box>

            <Flex gap="3">
              <Box flex="1">
                <Lbl>Color (hex)</Lbl>
                <HStack gap="2">
                  <Box
                    w="9"
                    h="9"
                    flexShrink="0"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="border.subtle"
                    bg={acento(f.color)}
                  />
                  <Input placeholder="#12b76a" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} {...fp} />
                </HStack>
              </Box>
              <Box w="110px">
                <Lbl>Orden</Lbl>
                <Input type="number" value={f.orden} onChange={(e) => setF({ ...f, orden: e.target.value })} {...fp} />
              </Box>
            </Flex>

            <Checkbox.Root checked={f.activa} onCheckedChange={(e) => setF({ ...f, activa: !!e.checked })} size="sm">
              <Checkbox.HiddenInput /><Checkbox.Control />
              <Checkbox.Label fontSize="sm" color="fg.default">Activa</Checkbox.Label>
            </Checkbox.Root>

            {error && <Text color="red.400" fontSize="sm">{error}</Text>}

            <Button type="submit" loading={saving} borderRadius="lg" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)" _hover={{ opacity: 0.92 }}>
              <Plus size={16} style={{ marginRight: "6px" }} /> {editId ? "Guardar cambios" : "Crear sección"}
            </Button>
          </VStack>
        </GlassPanel>

        <GlassPanel p={{ base: "4", md: "5" }}>
          {secciones === null ? (
            <Center py="8"><Spinner color="brand.primary" /></Center>
          ) : secciones.length === 0 ? (
            <Text color="fg.subtle" fontSize="sm">No hay secciones. Crea la primera.</Text>
          ) : (
            <VStack align="stretch" gap="2">
              {secciones.map((s) => (
                <Box key={s.id} p="3" borderRadius="lg" bg="bg.muted" borderLeft="3px solid" borderLeftColor={acento(s.color)}>
                  <Flex justify="space-between" align="center" gap="3">
                    <HStack gap="3" minW="0">
                      <Box w="2.5" h="2.5" flexShrink="0" borderRadius="full" bg={acento(s.color)} />
                      <VStack align="start" gap="0" minW="0">
                        <Text fontWeight="600" fontSize="sm" lineClamp={1}>{s.nombre}</Text>
                        <Text fontSize="xs" color="fg.subtle" lineClamp={1}>
                          {["/" + s.slug, `orden ${s.orden}`, s.activa ? "Activa" : "Inactiva"].join(" · ")}
                        </Text>
                      </VStack>
                    </HStack>
                    <HStack gap="1" flexShrink="0">
                      <IconButton aria-label="Editar" size="xs" variant="ghost" color="fg.subtle" onClick={() => startEdit(s)} _hover={{ color: "brand.primary" }}><Pencil size={15} /></IconButton>
                      <IconButton aria-label="Eliminar" size="xs" variant="ghost" color="fg.subtle" onClick={() => setPorBorrar(s.id)} _hover={{ color: "red.400", bg: "rgba(239,68,68,0.1)" }}><Trash2 size={15} /></IconButton>
                    </HStack>
                  </Flex>

                  {porBorrar === s.id && (
                    <Flex justify="space-between" align="center" gap="3" mt="2.5" p="2.5" borderRadius="md" bg="rgba(239,68,68,0.08)" border="1px solid" borderColor="rgba(239,68,68,0.25)">
                      <Text fontSize="xs" color="fg.muted">¿Eliminar «{s.nombre}»? No se puede deshacer.</Text>
                      <HStack gap="2" flexShrink="0">
                        <Button size="xs" variant="ghost" color="fg.subtle" onClick={() => setPorBorrar(null)}>Cancelar</Button>
                        <Button size="xs" bg="red.500" color="fg.default" _hover={{ bg: "red.600" }} onClick={() => remove(s.id)}>Eliminar</Button>
                      </HStack>
                    </Flex>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </GlassPanel>
      </Grid>
    </VStack>
  );
};
