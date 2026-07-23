import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Box, Button, Center, Checkbox, Flex, Grid, Heading, HStack, IconButton, Image, Input,
  NativeSelect, SimpleGrid, Spinner, Text, Textarea, VStack,
} from "@chakra-ui/react";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { useAuth } from "../providers/AuthProvider";
import {
  aprobarLugar, CATEGORIAS, createLugar, deleteLugar, listLugares, updateLugar, uploadFotoLugar,
  type CategoriaLugar, type FotoLugar, type Lugar,
} from "../services/lugares";

const PRECIOS = ["$", "$$", "$$$"];

const fp = {
  bg: "bg.muted", border: "1px solid", borderColor: "border.subtle", borderRadius: "lg",
  color: "fg.default", size: "md" as const, px: "3",
  _hover: { borderColor: "border.brand" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #12b76a", outline: "none" },
};

const Lbl = ({ children }: { children: string }) => (
  <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase" mb="1">{children}</Text>
);

const empty = {
  nombre: "", categoria: "club" as CategoriaLugar, direccion: "", ciudad: "", mapsUrl: "",
  horario: "", telefono: "", web: "", descripcion: "",
  rating: "0", precio: "$$", resena: "", recomendado: false, visitadoEl: "", contenidoUrl: "",
  aprobado: false,
};

/** Foto en el formulario: la `url` de preview puede ser un blob local aún no guardado. */
type FotoEnForm = FotoLugar & { previewUrl?: string };

export const LugaresManager = () => {
  const { isAdmin, isParticipant } = useAuth();
  const [lugares, setLugares] = useState<Lugar[] | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState({ ...empty });
  const [fotos, setFotos] = useState<FotoEnForm[]>([]);
  const [saving, setSaving] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [porBorrar, setPorBorrar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listLugares()
      .then(setLugares)
      .catch((e) => { setError(e instanceof Error ? e.message : "No se pudieron cargar los lugares."); setLugares([]); });
  }, []);

  if (!isParticipant && !isAdmin) {
    return <Text color="fg.subtle">No tienes permisos para gestionar lugares.</Text>;
  }

  const reset = () => {
    setEditId(null);
    setF({ ...empty });
    setFotos([]);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const startEdit = (l: Lugar) => {
    setEditId(l.id);
    setF({
      nombre: l.nombre, categoria: l.categoria, direccion: l.direccion ?? "", ciudad: l.ciudad ?? "",
      mapsUrl: l.mapsUrl ?? "", horario: l.horario ?? "", telefono: l.telefono ?? "", web: l.web ?? "",
      descripcion: l.descripcion ?? "", rating: String(l.rating ?? 0), precio: l.precio || "$$",
      resena: l.resena ?? "", recomendado: !!l.recomendado, visitadoEl: l.visitadoEl ?? "",
      contenidoUrl: l.contenidoUrl ?? "", aprobado: !!l.aprobado,
    });
    setFotos((l.fotos ?? []).map((x) => ({ ...x })));
    setError(null);
  };

  const addFotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setSubiendo(true);
    try {
      for (const file of Array.from(files)) {
        const subida = await uploadFotoLugar(file);
        // El backend no devuelve URL de lectura al subir: mostramos el blob local mientras tanto.
        setFotos((p) => [...p, { ...subida, previewUrl: URL.createObjectURL(file) }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la foto.");
    } finally {
      setSubiendo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const quitarFoto = (key: string) => setFotos((p) => p.filter((x) => x.key !== key));

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      nombre: f.nombre,
      categoria: f.categoria,
      direccion: f.direccion,
      ciudad: f.ciudad,
      mapsUrl: f.mapsUrl,
      horario: f.horario,
      telefono: f.telefono,
      web: f.web,
      descripcion: f.descripcion,
      rating: Number(f.rating) || 0,
      precio: f.precio,
      resena: f.resena,
      recomendado: f.recomendado,
      visitadoEl: f.visitadoEl,
      contenidoUrl: f.contenidoUrl,
      fotos: fotos.map(({ key, nombre, url }) => ({ key, nombre, url })),
    };
    try {
      if (editId) {
        const up = await updateLugar(editId, payload);
        // La aprobación no viaja en el body: si es admin y cambió, se aplica aparte.
        let saved = up;
        if (isAdmin && f.aprobado !== up.aprobado) {
          await aprobarLugar(up.id, f.aprobado);
          saved = { ...up, aprobado: f.aprobado };
        }
        setLugares((p) => (p ?? []).map((l) => (l.id === editId ? saved : l)));
      } else {
        const nu = await createLugar(payload);
        let saved = nu;
        if (isAdmin && f.aprobado) {
          await aprobarLugar(nu.id, true);
          saved = { ...nu, aprobado: true };
        }
        setLugares((p) => [saved, ...(p ?? [])]);
      }
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el lugar.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      await deleteLugar(id);
      setLugares((p) => (p ?? []).filter((l) => l.id !== id));
      if (editId === id) reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar el lugar.");
    } finally {
      setPorBorrar(null);
    }
  };

  const toggleAprobado = async (l: Lugar) => {
    setError(null);
    try {
      await aprobarLugar(l.id, !l.aprobado);
      setLugares((p) => (p ?? []).map((x) => (x.id === l.id ? { ...x, aprobado: !l.aprobado } : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar la aprobación.");
    }
  };

  return (
    <VStack align="stretch" gap="6">
      <Heading size="lg" fontWeight="800">Lugares</Heading>

      <Grid templateColumns={{ base: "1fr", lg: "420px 1fr" }} gap="6" alignItems="start">
        <GlassPanel p={{ base: "5", md: "6" }}>
          <Flex justify="space-between" align="center" mb="4">
            <Heading size="sm">{editId ? "Editar lugar" : "Nuevo lugar"}</Heading>
            {editId && (
              <Button size="xs" variant="ghost" color="fg.subtle" onClick={reset}>
                <X size={14} style={{ marginRight: "4px" }} /> Cancelar
              </Button>
            )}
          </Flex>

          <VStack as="form" onSubmit={submit} align="stretch" gap="3">
            <Box><Lbl>Nombre</Lbl><Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required {...fp} /></Box>

            <Box>
              <Lbl>Categoría</Lbl>
              <NativeSelect.Root size="md">
                <NativeSelect.Field value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value as CategoriaLugar })} {...fp}>
                  {CATEGORIAS.map((c) => (
                    <option key={c.key} value={c.key} style={{ background: "#0f1210" }}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>

            <Box><Lbl>Dirección</Lbl><Input value={f.direccion} onChange={(e) => setF({ ...f, direccion: e.target.value })} {...fp} /></Box>
            <Box><Lbl>Ciudad</Lbl><Input value={f.ciudad} onChange={(e) => setF({ ...f, ciudad: e.target.value })} {...fp} /></Box>
            <Box><Lbl>Link de Google Maps</Lbl><Input placeholder="https://…" value={f.mapsUrl} onChange={(e) => setF({ ...f, mapsUrl: e.target.value })} {...fp} /></Box>

            <Box><Lbl>Horario</Lbl><Input placeholder="Vie y sáb, 22:00–04:00" value={f.horario} onChange={(e) => setF({ ...f, horario: e.target.value })} {...fp} /></Box>

            <Flex gap="3">
              <Box flex="1"><Lbl>Teléfono</Lbl><Input value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} {...fp} /></Box>
              <Box flex="1"><Lbl>Web</Lbl><Input placeholder="https://…" value={f.web} onChange={(e) => setF({ ...f, web: e.target.value })} {...fp} /></Box>
            </Flex>

            <Box><Lbl>Descripción</Lbl><Textarea value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} rows={3} {...fp} py="2" /></Box>

            <Flex gap="3">
              <Box flex="1">
                <Lbl>Rating (0-5)</Lbl>
                <Input type="number" min="0" max="5" step="0.5" value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })} {...fp} />
              </Box>
              <Box flex="1">
                <Lbl>Precio</Lbl>
                <NativeSelect.Root size="md">
                  <NativeSelect.Field value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} {...fp}>
                    {PRECIOS.map((p) => <option key={p} value={p} style={{ background: "#0f1210" }}>{p}</option>)}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Box>
            </Flex>

            <Box><Lbl>Reseña</Lbl><Textarea value={f.resena} onChange={(e) => setF({ ...f, resena: e.target.value })} rows={4} {...fp} py="2" /></Box>
            <Box><Lbl>Visitado el</Lbl><Input type="date" value={f.visitadoEl} onChange={(e) => setF({ ...f, visitadoEl: e.target.value })} {...fp} /></Box>
            <Box><Lbl>Link al contenido</Lbl><Input placeholder="https://…" value={f.contenidoUrl} onChange={(e) => setF({ ...f, contenidoUrl: e.target.value })} {...fp} /></Box>

            <Box>
              <Lbl>Fotos</Lbl>
              <Button
                type="button"
                onClick={() => fileRef.current?.click()}
                loading={subiendo}
                variant="outline"
                borderColor="border.subtle"
                borderRadius="lg"
                justifyContent="start"
                w="full"
                color="fg.default"
                _hover={{ borderColor: "border.brand" }}
              >
                <ImagePlus size={16} style={{ marginRight: "8px" }} /> Agregar fotos…
              </Button>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFotos(e.target.files)} />

              {fotos.length > 0 && (
                <SimpleGrid columns={3} gap="2" mt="3">
                  {fotos.map((foto) => (
                    <Box key={foto.key} position="relative" borderRadius="md" overflow="hidden" bg="bg.muted" h="70px">
                      {(foto.previewUrl || foto.url) ? (
                        <Image src={foto.previewUrl ?? foto.url} alt={foto.nombre} w="full" h="full" objectFit="cover" />
                      ) : (
                        <Center h="full"><Text fontSize="xs" color="fg.subtle" px="1" lineClamp={2}>{foto.nombre}</Text></Center>
                      )}
                      <IconButton
                        aria-label="Quitar foto"
                        size="2xs"
                        variant="solid"
                        position="absolute"
                        top="1"
                        right="1"
                        bg="rgba(10, 12, 10, 0.75)"
                        color="fg.default"
                        onClick={() => quitarFoto(foto.key)}
                        _hover={{ color: "red.400" }}
                      >
                        <X size={12} />
                      </IconButton>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </Box>

            <Checkbox.Root checked={f.recomendado} onCheckedChange={(e) => setF({ ...f, recomendado: !!e.checked })} size="sm">
              <Checkbox.HiddenInput /><Checkbox.Control />
              <Checkbox.Label fontSize="sm" color="fg.default">Recomendado</Checkbox.Label>
            </Checkbox.Root>

            {isAdmin && (
              <Checkbox.Root checked={f.aprobado} onCheckedChange={(e) => setF({ ...f, aprobado: !!e.checked })} size="sm">
                <Checkbox.HiddenInput /><Checkbox.Control />
                <Checkbox.Label fontSize="sm" color="fg.default">Aprobada (visible al público)</Checkbox.Label>
              </Checkbox.Root>
            )}

            {error && <Text color="red.400" fontSize="sm">{error}</Text>}

            <Button type="submit" loading={saving} borderRadius="lg" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)" _hover={{ opacity: 0.92 }}>
              <Plus size={16} style={{ marginRight: "6px" }} /> {editId ? "Guardar cambios" : "Crear lugar"}
            </Button>
          </VStack>
        </GlassPanel>

        <GlassPanel p={{ base: "4", md: "5" }}>
          {lugares === null ? (
            <Center py="8"><Spinner color="brand.primary" /></Center>
          ) : lugares.length === 0 ? (
            <Text color="fg.subtle" fontSize="sm">No hay lugares. Crea el primero.</Text>
          ) : (
            <VStack align="stretch" gap="2">
              {lugares.map((l) => {
                const cat = CATEGORIAS.find((c) => c.key === l.categoria);
                return (
                  <Box key={l.id} p="3" borderRadius="lg" bg="bg.muted">
                    <Flex justify="space-between" align="center" gap="3">
                      <HStack gap="3" minW="0">
                        <Text fontSize="lg" flexShrink="0">{cat?.emoji ?? "📍"}</Text>
                        <VStack align="start" gap="1" minW="0">
                          <Text fontWeight="600" fontSize="sm" lineClamp={1}>{l.nombre}</Text>
                          <HStack gap="1.5" flexWrap="wrap">
                            <Text fontSize="xs" color="fg.subtle" lineClamp={1}>
                              {[l.ciudad, l.precio].filter(Boolean).join(" · ")}
                            </Text>
                            <Text
                              borderRadius="full" px="2" py="0.5" fontSize="0.6rem" fontWeight="700"
                              textTransform="uppercase" letterSpacing="wide"
                              bg={l.aprobado ? "rgba(50, 213, 131, 0.15)" : "rgba(201, 162, 39, 0.15)"}
                              color={l.aprobado ? "brand.400" : "accent.gold"}
                            >
                              {l.aprobado ? "Aprobado" : "Pendiente"}
                            </Text>
                            {l.ownerId && (
                              <Text
                                borderRadius="full" px="2" py="0.5" fontSize="0.6rem" fontWeight="700"
                                textTransform="uppercase" letterSpacing="wide"
                                bg="bg.elevated" color="fg.subtle"
                              >
                                De un local
                              </Text>
                            )}
                          </HStack>
                        </VStack>
                      </HStack>
                      <HStack gap="1" flexShrink="0">
                        {isAdmin && (
                          <Button
                            size="xs" variant="ghost" fontWeight="600"
                            color={l.aprobado ? "fg.subtle" : "brand.300"}
                            onClick={() => toggleAprobado(l)}
                            _hover={{ color: l.aprobado ? "accent.gold" : "brand.primary" }}
                          >
                            {l.aprobado ? "Quitar aprobación" : "Aprobar"}
                          </Button>
                        )}
                        <IconButton aria-label="Editar" size="xs" variant="ghost" color="fg.subtle" onClick={() => startEdit(l)} _hover={{ color: "brand.primary" }}><Pencil size={15} /></IconButton>
                        <IconButton aria-label="Eliminar" size="xs" variant="ghost" color="fg.subtle" onClick={() => setPorBorrar(l.id)} _hover={{ color: "red.400", bg: "rgba(239,68,68,0.1)" }}><Trash2 size={15} /></IconButton>
                      </HStack>
                    </Flex>

                    {porBorrar === l.id && (
                      <Flex justify="space-between" align="center" gap="3" mt="2.5" p="2.5" borderRadius="md" bg="rgba(239,68,68,0.08)" border="1px solid" borderColor="rgba(239,68,68,0.25)">
                        <Text fontSize="xs" color="fg.muted">¿Eliminar «{l.nombre}»? No se puede deshacer.</Text>
                        <HStack gap="2" flexShrink="0">
                          <Button size="xs" variant="ghost" color="fg.subtle" onClick={() => setPorBorrar(null)}>Cancelar</Button>
                          <Button size="xs" bg="red.500" color="fg.default" _hover={{ bg: "red.600" }} onClick={() => remove(l.id)}>Eliminar</Button>
                        </HStack>
                      </Flex>
                    )}
                  </Box>
                );
              })}
            </VStack>
          )}
        </GlassPanel>
      </Grid>
    </VStack>
  );
};
