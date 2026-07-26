import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Box, Button, Center, Container, Flex, Heading, IconButton, Image, Input,
  NativeSelect, SimpleGrid, Spinner, Text, Textarea, VStack,
} from "@chakra-ui/react";
import { CalendarPlus, ImagePlus, Save, Trash2, X } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { AppHeader } from "../organisms/AppHeader";
import { AddressAutocomplete } from "../molecules/AddressAutocomplete";
import { useAuth } from "../providers/AuthProvider";
import {
  CATEGORIAS, createLugar, getMiLocal, updateLugar, uploadFotoLugar,
  type CategoriaLugar, type EventoLocal, type FotoLugar, type Lugar,
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

/** Foto en el formulario: la `url` de preview puede ser un blob local aún no guardado. */
type FotoEnForm = FotoLugar & { previewUrl?: string };

/** Evento en la lista con id local garantizado para las keys de React. */
type EventoEnLista = EventoLocal & { _localId: string };

const empty = {
  nombre: "", categoria: "bar" as CategoriaLugar, direccion: "", ciudad: "", pais: "",
  lat: null as number | null, lng: null as number | null, mapsUrl: "",
  horario: "", telefono: "", web: "", descripcion: "", precio: "$$",
};

const formatFecha = (iso: string): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  try {
    return new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" })
      .format(new Date(y, m - 1, d));
  } catch {
    return iso;
  }
};

export const MiLocalPage = () => {
  const { ownsLocal, role } = useAuth();

  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [cargando, setCargando] = useState(true);
  const [f, setF] = useState({ ...empty });
  const [fotos, setFotos] = useState<FotoEnForm[]>([]);
  const [eventos, setEventos] = useState<EventoEnLista[]>([]);
  const [saving, setSaving] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Mini-form de nuevo evento
  const [evFecha, setEvFecha] = useState("");
  const [evHora, setEvHora] = useState("");
  const [evTitulo, setEvTitulo] = useState("");
  const [evDesc, setEvDesc] = useState("");
  const [guardandoEvento, setGuardandoEvento] = useState(false);

  const cargarEnForm = (l: Lugar) => {
    setLugar(l);
    setF({
      nombre: l.nombre ?? "", categoria: l.categoria ?? "bar", direccion: l.direccion ?? "",
      ciudad: l.ciudad ?? "", pais: l.pais ?? "", lat: l.lat ?? null, lng: l.lng ?? null,
      mapsUrl: l.mapsUrl ?? "", horario: l.horario ?? "",
      telefono: l.telefono ?? "", web: l.web ?? "", descripcion: l.descripcion ?? "",
      precio: l.precio || "$$",
    });
    setFotos((l.fotos ?? []).map((x) => ({ ...x })));
    setEventos((l.eventos ?? []).map((e) => ({ ...e, _localId: e.id ?? crypto.randomUUID() })));
  };

  useEffect(() => {
    if (!ownsLocal) {
      setCargando(false);
      return;
    }
    getMiLocal()
      .then((l) => {
        if (l) cargarEnForm(l);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar tu local."))
      .finally(() => setCargando(false));
  }, [ownsLocal]);

  // role todavía cargando
  if (role === null) {
    return (
      <Box bg="bg.canvas" color="fg.default" minH="100vh">
        <AppHeader />
        <Center py="24"><Spinner color="brand.primary" size="xl" borderWidth="3px" /></Center>
      </Box>
    );
  }

  if (!ownsLocal) {
    return (
      <Box bg="bg.canvas" color="fg.default" minH="100vh">
        <AppHeader />
        <Container maxW="720px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
          <GlassPanel p={{ base: "6", md: "8" }}>
            <VStack align="start" gap="2">
              <Heading as="h1" size="xl" fontWeight="800">
                Esta sección es para locales registrados
              </Heading>
              <Text color="fg.muted">
                Aquí los dueños de bares, saunas y clubes gestionan su ficha y sus eventos.
                Si crees que deberías tener acceso, habla con un administrador.
              </Text>
            </VStack>
          </GlassPanel>
        </Container>
      </Box>
    );
  }

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

  const guardar = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    setMsg(null);
    setSaving(true);
    const payload = {
      nombre: f.nombre,
      categoria: f.categoria,
      direccion: f.direccion,
      ciudad: f.ciudad,
      pais: f.pais,
      lat: f.lat,
      lng: f.lng,
      mapsUrl: f.mapsUrl,
      horario: f.horario,
      telefono: f.telefono,
      web: f.web,
      descripcion: f.descripcion,
      precio: f.precio,
      fotos: fotos.map(({ key, nombre, url }) => ({ key, nombre, url })),
    };
    try {
      const up = lugar ? await updateLugar(lugar.id, payload) : await createLugar(payload);
      cargarEnForm(up);
      setMsg(lugar ? "✓ Ficha actualizada" : "✓ Ficha creada. Queda pendiente de aprobación.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar tu ficha.");
    } finally {
      setSaving(false);
    }
  };

  // Persiste una lista completa de eventos (el backend reemplaza el array).
  const persistirEventos = async (lista: EventoEnLista[]) => {
    if (!lugar) return;
    setError(null);
    try {
      const up = await updateLugar(lugar.id, {
        eventos: lista.map(({ _localId: _drop, ...e }) => e),
      });
      cargarEnForm(up);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el evento.");
    }
  };

  const agregarEvento = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!evFecha || !evTitulo.trim()) {
      setError("El evento necesita al menos fecha y título.");
      return;
    }
    setGuardandoEvento(true);
    const nuevo: EventoEnLista = {
      _localId: crypto.randomUUID(),
      fecha: evFecha,
      hora: evHora || undefined,
      titulo: evTitulo.trim(),
      descripcion: evDesc.trim() || undefined,
    };
    await persistirEventos([...eventos, nuevo]);
    setEvFecha(""); setEvHora(""); setEvTitulo(""); setEvDesc("");
    setGuardandoEvento(false);
  };

  const eliminarEvento = async (localId: string) => {
    await persistirEventos(eventos.filter((e) => e._localId !== localId));
  };

  const aprobado = !!lugar?.aprobado;

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />

      <Container maxW="820px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
        <VStack align="stretch" gap="8">
          <VStack align="start" gap="2">
            <Heading as="h1" size={{ base: "2xl", md: "3xl" }} fontWeight="900" letterSpacing="tighter">
              Mi local
            </Heading>
            <Text color="fg.muted">
              Gestiona la ficha de tu local (dirección, horario, contacto y fotos) y publica tus eventos.
            </Text>
          </VStack>

          {cargando ? (
            <Center py="16"><Spinner color="brand.primary" size="xl" borderWidth="3px" /></Center>
          ) : (
            <>
              {/* Estado de aprobación (solo lectura) */}
              <GlassPanel
                p={{ base: "5", md: "6" }}
                borderColor={lugar ? (aprobado ? "border.brand" : "accent.gold") : "border.subtle"}
              >
                {!lugar ? (
                  <Text color="fg.muted">
                    Todavía no tienes ficha. Completa el formulario y créala: un administrador la revisará
                    antes de publicarla.
                  </Text>
                ) : (
                  <VStack align="start" gap="2">
                    <Text
                      fontSize={{ base: "lg", md: "xl" }}
                      fontWeight="800"
                      color={aprobado ? "brand.400" : "accent.gold"}
                    >
                      {aprobado ? "Aprobado y visible" : "Pendiente de aprobación"}
                    </Text>
                    {!aprobado && (
                      <Text fontSize="sm" color="fg.muted">
                        Un administrador revisará tu ficha antes de publicarla.
                      </Text>
                    )}
                  </VStack>
                )}
              </GlassPanel>

              {/* Formulario de la ficha */}
              <GlassPanel p={{ base: "6", md: "8" }}>
                <VStack as="form" onSubmit={guardar} align="stretch" gap="5">
                  <Heading size="md" fontWeight="800">Datos del local</Heading>

                  <Box>
                    <Lbl>Nombre</Lbl>
                    <Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required {...fp} />
                  </Box>

                  <Box>
                    <Lbl>Categoría</Lbl>
                    <NativeSelect.Root size="md">
                      <NativeSelect.Field
                        value={f.categoria}
                        onChange={(e) => setF({ ...f, categoria: e.target.value as CategoriaLugar })}
                        {...fp}
                      >
                        {CATEGORIAS.map((c) => (
                          <option key={c.key} value={c.key} style={{ background: "#0f1210" }}>
                            {c.emoji} {c.label}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Box>

                  <Box>
                    <Lbl>Dirección</Lbl>
                    <AddressAutocomplete
                      value={f.direccion}
                      onChange={(v) => setF({ ...f, direccion: v })}
                      onPick={(r) => setF({ ...f, direccion: r.direccion || r.label, ciudad: r.ciudad || f.ciudad, pais: r.pais || f.pais, lat: r.lat, lng: r.lng })}
                      fieldProps={fp}
                    />
                    <Text fontSize="xs" color="fg.subtle" mt="1">Escribe y elige de la lista: se completan ciudad, país y la ubicación en el mapa.</Text>
                  </Box>
                  <Box>
                    <Lbl>Ciudad</Lbl>
                    <Input value={f.ciudad} onChange={(e) => setF({ ...f, ciudad: e.target.value })} {...fp} />
                  </Box>
                  <Box>
                    <Lbl>Link de Google Maps</Lbl>
                    <Input placeholder="https://…" value={f.mapsUrl} onChange={(e) => setF({ ...f, mapsUrl: e.target.value })} {...fp} />
                  </Box>

                  <Box>
                    <Lbl>Horario</Lbl>
                    <Textarea
                      placeholder="Ej. Lun a Dom 20:00-04:00"
                      value={f.horario}
                      onChange={(e) => setF({ ...f, horario: e.target.value })}
                      rows={2}
                      {...fp}
                      py="2"
                    />
                  </Box>

                  <Flex gap="3" direction={{ base: "column", sm: "row" }}>
                    <Box flex="1">
                      <Lbl>Teléfono</Lbl>
                      <Input value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} {...fp} />
                    </Box>
                    <Box flex="1">
                      <Lbl>Sitio web</Lbl>
                      <Input placeholder="https://…" value={f.web} onChange={(e) => setF({ ...f, web: e.target.value })} {...fp} />
                    </Box>
                  </Flex>

                  <Box maxW={{ base: "full", sm: "160px" }}>
                    <Lbl>Precio</Lbl>
                    <NativeSelect.Root size="md">
                      <NativeSelect.Field value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} {...fp}>
                        {PRECIOS.map((p) => <option key={p} value={p} style={{ background: "#0f1210" }}>{p}</option>)}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Box>

                  <Box>
                    <Lbl>Descripción</Lbl>
                    <Textarea
                      placeholder="Contá qué ofrece tu local, el ambiente, las normas…"
                      value={f.descripcion}
                      onChange={(e) => setF({ ...f, descripcion: e.target.value })}
                      rows={5}
                      {...fp}
                      py="2"
                    />
                  </Box>

                  {/* Fotos */}
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
                      <SimpleGrid columns={{ base: 3, md: 4 }} gap="2" mt="3">
                        {fotos.map((foto) => (
                          <Box key={foto.key} position="relative" borderRadius="md" overflow="hidden" bg="bg.muted" h="80px">
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

                  {error && <Text color="red.400" fontSize="sm">{error}</Text>}
                  {msg && <Text fontSize="sm" color={msg.startsWith("✓") ? "brand.primary" : "red.400"}>{msg}</Text>}

                  <Button
                    type="submit"
                    size="lg"
                    h="12"
                    borderRadius="xl"
                    border="none"
                    color="fg.inverted"
                    fontWeight="700"
                    backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
                    _hover={{ opacity: 0.92, boxShadow: "brand" }}
                    transition="all 0.3s"
                    loading={saving}
                    alignSelf="start"
                    px="8"
                  >
                    <Save size={18} style={{ marginRight: "8px" }} />
                    {lugar ? "Guardar cambios" : "Crear ficha"}
                  </Button>
                </VStack>
              </GlassPanel>

              {/* Eventos: solo si la ficha ya existe */}
              {lugar && (
                <GlassPanel p={{ base: "6", md: "8" }}>
                  <VStack align="stretch" gap="5">
                    <Heading size="md" fontWeight="800">Mis eventos</Heading>

                    {eventos.length === 0 ? (
                      <Text fontSize="sm" color="fg.subtle">Todavía no publicaste eventos.</Text>
                    ) : (
                      <VStack align="stretch" gap="2.5">
                        {eventos.map((e) => (
                          <Flex
                            key={e._localId}
                            justify="space-between"
                            align="start"
                            gap="3"
                            p="3.5"
                            borderRadius="lg"
                            bg="bg.muted"
                            border="1px solid"
                            borderColor="border.subtle"
                          >
                            <VStack align="start" gap="1" minW="0">
                              <Text fontWeight="700" fontSize="sm" lineClamp={1}>{e.titulo}</Text>
                              <Text fontSize="xs" color="brand.300" fontWeight="600">
                                {formatFecha(e.fecha)}{e.hora ? ` · ${e.hora}` : ""}
                              </Text>
                              {e.descripcion && (
                                <Text fontSize="sm" color="fg.muted" whiteSpace="pre-wrap">{e.descripcion}</Text>
                              )}
                            </VStack>
                            <IconButton
                              aria-label="Eliminar evento"
                              size="xs"
                              variant="ghost"
                              color="fg.subtle"
                              flexShrink="0"
                              onClick={() => eliminarEvento(e._localId)}
                              _hover={{ color: "red.400", bg: "rgba(239,68,68,0.1)" }}
                            >
                              <Trash2 size={15} />
                            </IconButton>
                          </Flex>
                        ))}
                      </VStack>
                    )}

                    <Box h="1px" bg="border.subtle" />

                    {/* Mini-form nuevo evento */}
                    <VStack as="form" onSubmit={agregarEvento} align="stretch" gap="3">
                      <Text fontSize="sm" fontWeight="700" color="fg.muted">Agregar evento</Text>
                      <Flex gap="3" direction={{ base: "column", sm: "row" }}>
                        <Box flex="1">
                          <Lbl>Fecha</Lbl>
                          <Input type="date" value={evFecha} onChange={(e) => setEvFecha(e.target.value)} {...fp} />
                        </Box>
                        <Box flex="1">
                          <Lbl>Hora (opcional)</Lbl>
                          <Input type="time" value={evHora} onChange={(e) => setEvHora(e.target.value)} {...fp} />
                        </Box>
                      </Flex>
                      <Box>
                        <Lbl>Título</Lbl>
                        <Input value={evTitulo} onChange={(e) => setEvTitulo(e.target.value)} {...fp} />
                      </Box>
                      <Box>
                        <Lbl>Descripción (opcional)</Lbl>
                        <Textarea value={evDesc} onChange={(e) => setEvDesc(e.target.value)} rows={3} {...fp} py="2" />
                      </Box>
                      <Button
                        type="submit"
                        loading={guardandoEvento}
                        borderRadius="lg"
                        border="none"
                        color="fg.inverted"
                        fontWeight="700"
                        alignSelf="start"
                        px="6"
                        backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
                        _hover={{ opacity: 0.92 }}
                      >
                        <CalendarPlus size={16} style={{ marginRight: "6px" }} /> Agregar evento
                      </Button>
                    </VStack>
                  </VStack>
                </GlassPanel>
              )}
            </>
          )}
        </VStack>
      </Container>
    </Box>
  );
};
