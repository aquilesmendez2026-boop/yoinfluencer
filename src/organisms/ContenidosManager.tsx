import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Button, Center, Checkbox, Flex, Grid, Heading, HStack, IconButton, Image, Input,
  NativeSelect, Spinner, Text, Textarea, VStack,
} from "@chakra-ui/react";
import { ImagePlus, Pencil, Save, Send, Trash2, X } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { useAuth } from "../providers/AuthProvider";
import {
  createContenido, deleteContenido, listContenidos, updateContenido, uploadPortada,
  type Contenido, type EstadoContenido,
} from "../services/contenidos";
import { listSecciones, seccionMap, type Seccion } from "../services/secciones";

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
  title: "", seccion: "", resumen: "", cuerpo: "",
  premium: false, instagram: "", tiktok: "", youtube: "",
};

export const ContenidosManager = () => {
  const { isInfluencer, isEditor, isAdmin, profile } = useAuth();

  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [contenidos, setContenidos] = useState<Contenido[] | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState({ ...empty });
  const [coverKey, setCoverKey] = useState<string | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState<EstadoContenido | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [porBorrar, setPorBorrar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listSecciones().then(setSecciones).catch(() => setSecciones([]));
    listContenidos()
      .then(setContenidos)
      .catch((e) => { setError(e instanceof Error ? e.message : "No se pudieron cargar los artículos."); setContenidos([]); });
  }, []);

  const secMap = useMemo(() => seccionMap(secciones), [secciones]);

  // Un influencer sin permisos de edición solo publica en sus secciones asignadas;
  // editores y admins pueden publicar en cualquiera.
  const disponibles = useMemo(() => {
    if (isEditor || isAdmin) return secciones;
    const mis = profile?.secciones ?? [];
    return secciones.filter((s) => mis.includes(s.id));
  }, [secciones, isEditor, isAdmin, profile]);

  if (!isInfluencer) {
    return <Text color="fg.subtle">No tienes permisos para gestionar artículos.</Text>;
  }

  const reset = () => {
    setEditId(null);
    setF({ ...empty });
    setCoverKey(undefined);
    setPreviewUrl(undefined);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const startEdit = (c: Contenido) => {
    setEditId(c.id);
    const links = c.links ?? {};
    setF({
      title: c.title,
      seccion: c.seccion,
      resumen: c.resumen ?? "",
      cuerpo: c.cuerpo ?? "",
      premium: !!c.premium,
      instagram: links.instagram ?? "",
      tiktok: links.tiktok ?? "",
      youtube: links.youtube ?? "",
    });
    setCoverKey(c.coverKey);
    setPreviewUrl(c.coverUrl);
    setError(null);
  };

  const subirPortada = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setSubiendo(true);
    try {
      const key = await uploadPortada(file);
      setCoverKey(key);
      // El backend no devuelve URL de lectura al subir: mostramos el blob local mientras tanto.
      setPreviewUrl(URL.createObjectURL(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la portada.");
    } finally {
      setSubiendo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const guardar = async (estado: EstadoContenido) => {
    if (!f.title.trim()) { setError("El título es obligatorio."); return; }
    if (!f.seccion) { setError("Elige una sección."); return; }
    setError(null);
    setSaving(estado);
    const payload = {
      title: f.title,
      seccion: f.seccion,
      resumen: f.resumen,
      cuerpo: f.cuerpo,
      coverKey,
      estado,
      premium: f.premium,
      links: { instagram: f.instagram, tiktok: f.tiktok, youtube: f.youtube },
    };
    try {
      if (editId) {
        const up = await updateContenido(editId, payload);
        setContenidos((p) => (p ?? []).map((c) => (c.id === editId ? up : c)));
      } else {
        const nu = await createContenido(payload);
        setContenidos((p) => [nu, ...(p ?? [])]);
      }
      reset();
    } catch (e) {
      // ApiError trae e.message ya legible (p.ej. 403 "No tienes permiso para publicar en esa sección").
      setError(e instanceof Error ? e.message : "No se pudo guardar el artículo.");
    } finally {
      setSaving(null);
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      await deleteContenido(id);
      setContenidos((p) => (p ?? []).filter((c) => c.id !== id));
      if (editId === id) reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar el artículo.");
    } finally {
      setPorBorrar(null);
    }
  };

  const sinSecciones = !isEditor && !isAdmin && disponibles.length === 0;

  return (
    <VStack align="stretch" gap="6">
      <Heading size="lg" fontWeight="800">Artículos</Heading>

      {sinSecciones && (
        <Box
          p="4"
          borderRadius="lg"
          bg="rgba(201, 162, 39, 0.10)"
          border="1px solid"
          borderColor="accent.gold"
        >
          <Text fontSize="sm" color="fg.muted">
            Aún no tienes secciones asignadas; pídele a un admin que te asigne una.
          </Text>
        </Box>
      )}

      <Grid templateColumns={{ base: "1fr", lg: "420px 1fr" }} gap="6" alignItems="start">
        <GlassPanel p={{ base: "5", md: "6" }}>
          <Flex justify="space-between" align="center" mb="4">
            <Heading size="sm">{editId ? "Editar artículo" : "Nuevo artículo"}</Heading>
            {editId && (
              <Button size="xs" variant="ghost" color="fg.subtle" onClick={reset}>
                <X size={14} style={{ marginRight: "4px" }} /> Cancelar
              </Button>
            )}
          </Flex>

          <VStack align="stretch" gap="3">
            <Box>
              <Lbl>Título</Lbl>
              <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required {...fp} />
            </Box>

            <Box>
              <Lbl>Sección</Lbl>
              <NativeSelect.Root size="md" disabled={disponibles.length === 0}>
                <NativeSelect.Field
                  value={f.seccion}
                  onChange={(e) => setF({ ...f, seccion: e.target.value })}
                  {...fp}
                >
                  <option value="" style={{ background: "#0f1210" }}>Elige una sección…</option>
                  {disponibles.map((s) => (
                    <option key={s.id} value={s.id} style={{ background: "#0f1210" }}>
                      {s.nombre}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>

            <Box>
              <Lbl>Resumen</Lbl>
              <Input value={f.resumen} onChange={(e) => setF({ ...f, resumen: e.target.value })} {...fp} />
            </Box>

            <Box>
              <Lbl>Cuerpo</Lbl>
              <Textarea value={f.cuerpo} onChange={(e) => setF({ ...f, cuerpo: e.target.value })} rows={10} {...fp} py="2" />
            </Box>

            <Box>
              <Lbl>Portada</Lbl>
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
                <ImagePlus size={16} style={{ marginRight: "8px" }} /> {previewUrl ? "Cambiar portada…" : "Subir portada…"}
              </Button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => subirPortada(e.target.files?.[0] ?? null)} />

              {previewUrl && (
                <Box position="relative" mt="3" borderRadius="lg" overflow="hidden" bg="bg.muted" h="150px">
                  <Image src={previewUrl} alt="Portada" w="full" h="full" objectFit="cover" />
                  <IconButton
                    aria-label="Quitar portada"
                    size="2xs"
                    variant="solid"
                    position="absolute"
                    top="2"
                    right="2"
                    bg="rgba(10, 12, 10, 0.75)"
                    color="fg.default"
                    onClick={() => { setCoverKey(undefined); setPreviewUrl(undefined); }}
                    _hover={{ color: "red.400" }}
                  >
                    <X size={12} />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Box>
              <Lbl>Link Instagram</Lbl>
              <Input placeholder="https://…" value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} {...fp} />
            </Box>
            <Box>
              <Lbl>Link TikTok</Lbl>
              <Input placeholder="https://…" value={f.tiktok} onChange={(e) => setF({ ...f, tiktok: e.target.value })} {...fp} />
            </Box>
            <Box>
              <Lbl>Link YouTube</Lbl>
              <Input placeholder="https://…" value={f.youtube} onChange={(e) => setF({ ...f, youtube: e.target.value })} {...fp} />
            </Box>

            <Checkbox.Root checked={f.premium} onCheckedChange={(e) => setF({ ...f, premium: !!e.checked })} size="sm">
              <Checkbox.HiddenInput /><Checkbox.Control />
              <Checkbox.Label fontSize="sm" color="fg.default">Contenido premium</Checkbox.Label>
            </Checkbox.Root>

            {error && <Text color="red.400" fontSize="sm">{error}</Text>}

            <Flex gap="3">
              <Button
                type="button"
                flex="1"
                onClick={() => guardar("borrador")}
                loading={saving === "borrador"}
                disabled={saving !== null}
                variant="outline"
                borderColor="border.subtle"
                borderRadius="lg"
                color="fg.default"
                _hover={{ borderColor: "border.brand" }}
              >
                <Save size={16} style={{ marginRight: "6px" }} /> Guardar borrador
              </Button>
              <Button
                type="button"
                flex="1"
                onClick={() => guardar("publicado")}
                loading={saving === "publicado"}
                disabled={saving !== null}
                borderRadius="lg"
                border="none"
                color="fg.inverted"
                fontWeight="700"
                backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
                _hover={{ opacity: 0.92 }}
              >
                <Send size={16} style={{ marginRight: "6px" }} /> Publicar
              </Button>
            </Flex>
          </VStack>
        </GlassPanel>

        <GlassPanel p={{ base: "4", md: "5" }}>
          {contenidos === null ? (
            <Center py="8"><Spinner color="brand.primary" /></Center>
          ) : contenidos.length === 0 ? (
            <Text color="fg.subtle" fontSize="sm">No hay artículos. Crea el primero.</Text>
          ) : (
            <VStack align="stretch" gap="2">
              {contenidos.map((c) => {
                const sec = secMap[c.seccion];
                const borrador = c.estado === "borrador";
                return (
                  <Box key={c.id} p="3" borderRadius="lg" bg="bg.muted">
                    <Flex justify="space-between" align="center" gap="3">
                      <VStack align="start" gap="1" minW="0">
                        <HStack gap="2" minW="0">
                          <Text fontWeight="600" fontSize="sm" lineClamp={1}>{c.title}</Text>
                          <Text
                            flexShrink="0"
                            fontSize="0.6rem"
                            fontWeight="700"
                            textTransform="uppercase"
                            letterSpacing="wide"
                            borderRadius="full"
                            px="2"
                            py="0.5"
                            bg={borrador ? "rgba(201, 162, 39, 0.15)" : "rgba(18, 183, 106, 0.16)"}
                            color={borrador ? "accent.gold" : "brand.300"}
                          >
                            {borrador ? "Borrador" : "Publicado"}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color="fg.subtle" lineClamp={1}>
                          {[sec?.nombre, c.autorNombre].filter(Boolean).join(" · ")}
                        </Text>
                      </VStack>
                      <HStack gap="1" flexShrink="0">
                        <IconButton aria-label="Editar" size="xs" variant="ghost" color="fg.subtle" onClick={() => startEdit(c)} _hover={{ color: "brand.primary" }}><Pencil size={15} /></IconButton>
                        <IconButton aria-label="Eliminar" size="xs" variant="ghost" color="fg.subtle" onClick={() => setPorBorrar(c.id)} _hover={{ color: "red.400", bg: "rgba(239,68,68,0.1)" }}><Trash2 size={15} /></IconButton>
                      </HStack>
                    </Flex>

                    {porBorrar === c.id && (
                      <Flex justify="space-between" align="center" gap="3" mt="2.5" p="2.5" borderRadius="md" bg="rgba(239,68,68,0.08)" border="1px solid" borderColor="rgba(239,68,68,0.25)">
                        <Text fontSize="xs" color="fg.muted">¿Eliminar «{c.title}»? No se puede deshacer.</Text>
                        <HStack gap="2" flexShrink="0">
                          <Button size="xs" variant="ghost" color="fg.subtle" onClick={() => setPorBorrar(null)}>Cancelar</Button>
                          <Button size="xs" bg="red.500" color="fg.default" _hover={{ bg: "red.600" }} onClick={() => remove(c.id)}>Eliminar</Button>
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
