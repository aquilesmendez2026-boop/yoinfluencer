import { useEffect, useMemo, useState } from "react";
import {
  Badge, Box, Button, Center, Checkbox, Flex, Heading, HStack, IconButton, Input, NativeSelect,
  Spinner, Text, Textarea, VStack,
} from "@chakra-ui/react";
import {
  Check, Clock, Globe, MapPin, Phone, Plus, Store, Trash2, UserMinus, UserPlus, X, CalendarDays,
} from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { useAuth } from "../providers/AuthProvider";
import {
  listLugares, aprobarLugar, deleteLugar, crearLocal, asignarDueno, categoriaLabel, CATEGORIAS,
  type CategoriaLugar, type Lugar,
} from "../services/lugares";
import { ApiError } from "../services/api";

const emoji = (k: string) => CATEGORIAS.find((c) => c.key === k)?.emoji ?? "📍";

const PRECIOS = ["$", "$$", "$$$"];

type Filtro = "todos" | "pendientes" | "aprobados";

const fp = {
  bg: "bg.muted", border: "1px solid", borderColor: "border.subtle", borderRadius: "lg",
  color: "fg.default", size: "md" as const, px: "3",
  _hover: { borderColor: "border.brand" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #12b76a", outline: "none" },
};

const Lbl = ({ children }: { children: string }) => (
  <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase" mb="1">{children}</Text>
);

const emptyForm = {
  nombre: "", categoria: "club" as CategoriaLugar, ciudad: "", direccion: "",
  horario: "", telefono: "", web: "", descripcion: "", precio: "$$",
  ownerEmail: "", aprobado: false,
};

const ChipFiltro = ({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) => (
  <Button
    onClick={onClick}
    size="sm"
    borderRadius="full"
    px="4"
    variant="outline"
    bg={activo ? "rgba(18, 183, 106, 0.16)" : "bg.surface"}
    borderColor={activo ? "border.brand" : "border.subtle"}
    color={activo ? "brand.300" : "fg.muted"}
    fontWeight="600"
    _hover={{ borderColor: "border.brand", color: "fg.default" }}
  >
    {children}
  </Button>
);

/** Registro de locales para el admin/super admin: estado, dueño, contacto y aprobación. */
export const LocalesAdmin = () => {
  const { isAdmin } = useAuth();
  const [lugares, setLugares] = useState<Lugar[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [soloLocales, setSoloLocales] = useState(true);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [f, setF] = useState({ ...emptyForm });
  const [creando, setCreando] = useState(false);
  const [emailDueno, setEmailDueno] = useState("");
  const [asignBusy, setAsignBusy] = useState(false);

  const cargar = () => {
    listLugares()
      .then(setLugares)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudieron cargar los locales.");
        setLugares([]);
      });
  };
  useEffect(cargar, []);

  const visibles = useMemo(() => {
    let ls = lugares ?? [];
    if (soloLocales) ls = ls.filter((l) => l.ownerId);
    if (filtro === "pendientes") ls = ls.filter((l) => !l.aprobado);
    if (filtro === "aprobados") ls = ls.filter((l) => l.aprobado);
    // Pendientes primero, luego por nombre.
    return [...ls].sort((a, b) => Number(a.aprobado) - Number(b.aprobado) || a.nombre.localeCompare(b.nombre));
  }, [lugares, filtro, soloLocales]);

  const pendientes = (lugares ?? []).filter((l) => l.ownerId && !l.aprobado).length;

  const toggleAprobado = async (l: Lugar) => {
    setBusy(l.id);
    setError(null);
    try {
      await aprobarLugar(l.id, !l.aprobado);
      setLugares((prev) => (prev ?? []).map((x) => (x.id === l.id ? { ...x, aprobado: !l.aprobado } : x)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo actualizar la aprobación.");
    } finally {
      setBusy(null);
    }
  };

  const crear = async () => {
    if (!f.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setCreando(true);
    setError(null);
    setOk(null);
    try {
      const nuevo = await crearLocal({
        nombre: f.nombre.trim(),
        categoria: f.categoria,
        ciudad: f.ciudad,
        direccion: f.direccion,
        horario: f.horario,
        telefono: f.telefono,
        web: f.web,
        descripcion: f.descripcion,
        precio: f.precio,
        ownerEmail: f.ownerEmail.trim() || undefined,
        aprobado: f.aprobado,
      });
      setLugares((prev) => [nuevo, ...(prev ?? [])]);
      setF({ ...emptyForm });
      setCrearAbierto(false);
      setOk(`Local «${nuevo.nombre}» creado.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo crear el local.");
    } finally {
      setCreando(false);
    }
  };

  const asignar = async (l: Lugar) => {
    const email = emailDueno.trim();
    if (!email) return;
    setAsignBusy(true);
    setError(null);
    setOk(null);
    try {
      const r = await asignarDueno(l.id, email);
      setLugares((prev) => (prev ?? []).map((x) => (x.id === l.id ? { ...x, ownerId: r.ownerId } : x)));
      setEmailDueno("");
      setOk(`Dueño asignado: ${r.ownerNombre}.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo asignar el dueño.");
    } finally {
      setAsignBusy(false);
    }
  };

  const quitarDueno = async (l: Lugar) => {
    setAsignBusy(true);
    setError(null);
    setOk(null);
    try {
      await asignarDueno(l.id, "");
      setLugares((prev) => (prev ?? []).map((x) => (x.id === l.id ? { ...x, ownerId: undefined } : x)));
      setOk("Dueño quitado.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo quitar el dueño.");
    } finally {
      setAsignBusy(false);
    }
  };

  const borrar = async (l: Lugar) => {
    if (!window.confirm(`¿Eliminar el local "${l.nombre}"? Esta acción no se puede deshacer.`)) return;
    setBusy(l.id);
    try {
      await deleteLugar(l.id);
      setLugares((prev) => (prev ?? []).filter((x) => x.id !== l.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo eliminar.");
    } finally {
      setBusy(null);
    }
  };

  if (!isAdmin) {
    return <Text color="fg.subtle">Solo administradores pueden ver el registro de locales.</Text>;
  }

  return (
    <VStack align="stretch" gap="6">
      <Flex align="center" justify="space-between" gap="4" wrap="wrap">
        <HStack gap="2" color="brand.primary">
          <Store size={18} />
          <Heading size="md">Registro de locales</Heading>
          {pendientes > 0 && (
            <Badge bg="rgba(201,162,39,0.15)" color="accent.gold" borderRadius="full" px="2.5">
              {pendientes} pendiente{pendientes === 1 ? "" : "s"}
            </Badge>
          )}
        </HStack>
        <HStack gap="2" wrap="wrap">
          <ChipFiltro activo={soloLocales} onClick={() => setSoloLocales((v) => !v)}>Solo locales</ChipFiltro>
          <Box w="1px" h="20px" bg="border.subtle" />
          <ChipFiltro activo={filtro === "todos"} onClick={() => setFiltro("todos")}>Todos</ChipFiltro>
          <ChipFiltro activo={filtro === "pendientes"} onClick={() => setFiltro("pendientes")}>Pendientes</ChipFiltro>
          <ChipFiltro activo={filtro === "aprobados"} onClick={() => setFiltro("aprobados")}>Aprobados</ChipFiltro>
        </HStack>
      </Flex>

      <Box>
        <Button
          size="sm"
          borderRadius="full"
          variant={crearAbierto ? "outline" : "solid"}
          borderColor="border.brand"
          bg={crearAbierto ? "transparent" : "brand.500"}
          color={crearAbierto ? "brand.300" : "fg.inverted"}
          fontWeight="700"
          onClick={() => { setCrearAbierto((v) => !v); setError(null); setOk(null); }}
          _hover={crearAbierto ? { color: "fg.default", borderColor: "border.brand" } : { opacity: 0.9 }}
        >
          {crearAbierto ? <><X size={15} style={{ marginRight: 5 }} />Cerrar</> : <><Plus size={15} style={{ marginRight: 5 }} />Crear local</>}
        </Button>

        {crearAbierto && (
          <GlassPanel p={{ base: "5", md: "6" }} mt="3">
            <Heading size="sm" mb="4">Nuevo local</Heading>
            <VStack align="stretch" gap="3">
              <Box><Lbl>Nombre</Lbl><Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required {...fp} /></Box>

              <Flex gap="3" wrap="wrap">
                <Box flex="1" minW="180px">
                  <Lbl>Categoría</Lbl>
                  <NativeSelect.Root size="md">
                    <NativeSelect.Field value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value as CategoriaLugar })} {...fp}>
                      {CATEGORIAS.map((c) => (
                        <option key={c.key} value={c.key} style={{ background: "#0f1210" }}>{c.emoji} {c.label}</option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Box>
                <Box flex="1" minW="120px">
                  <Lbl>Precio</Lbl>
                  <NativeSelect.Root size="md">
                    <NativeSelect.Field value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} {...fp}>
                      {PRECIOS.map((p) => <option key={p} value={p} style={{ background: "#0f1210" }}>{p}</option>)}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Box>
              </Flex>

              <Flex gap="3" wrap="wrap">
                <Box flex="1" minW="180px"><Lbl>Ciudad</Lbl><Input value={f.ciudad} onChange={(e) => setF({ ...f, ciudad: e.target.value })} {...fp} /></Box>
                <Box flex="1" minW="180px"><Lbl>Dirección</Lbl><Input value={f.direccion} onChange={(e) => setF({ ...f, direccion: e.target.value })} {...fp} /></Box>
              </Flex>

              <Box><Lbl>Horario</Lbl><Textarea placeholder="Vie y sáb, 22:00–04:00" value={f.horario} onChange={(e) => setF({ ...f, horario: e.target.value })} rows={2} {...fp} py="2" /></Box>

              <Flex gap="3" wrap="wrap">
                <Box flex="1" minW="180px"><Lbl>Teléfono</Lbl><Input value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} {...fp} /></Box>
                <Box flex="1" minW="180px"><Lbl>Web</Lbl><Input placeholder="https://…" value={f.web} onChange={(e) => setF({ ...f, web: e.target.value })} {...fp} /></Box>
              </Flex>

              <Box><Lbl>Descripción</Lbl><Textarea value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} rows={3} {...fp} py="2" /></Box>

              <Box>
                <Lbl>Email del dueño (opcional)</Lbl>
                <Input type="email" placeholder="dueno@ejemplo.com" value={f.ownerEmail} onChange={(e) => setF({ ...f, ownerEmail: e.target.value })} {...fp} />
                <Text fontSize="xs" color="fg.subtle" mt="1.5">
                  El usuario debe haber iniciado sesión al menos una vez. Podrá administrar este local desde «Mi local».
                </Text>
              </Box>

              <Checkbox.Root checked={f.aprobado} onCheckedChange={(e) => setF({ ...f, aprobado: !!e.checked })} size="sm">
                <Checkbox.HiddenInput /><Checkbox.Control />
                <Checkbox.Label fontSize="sm" color="fg.default">Aprobado (visible al público)</Checkbox.Label>
              </Checkbox.Root>

              <Button
                onClick={crear}
                loading={creando}
                borderRadius="lg"
                border="none"
                color="fg.inverted"
                fontWeight="700"
                backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
                _hover={{ opacity: 0.92 }}
                alignSelf="start"
                px="6"
              >
                <Plus size={16} style={{ marginRight: 6 }} /> Crear
              </Button>
            </VStack>
          </GlassPanel>
        )}
      </Box>

      {error && <Text color="red.400" fontSize="sm">{error}</Text>}
      {ok && <Text color="brand.300" fontSize="sm">{ok}</Text>}

      {lugares === null ? (
        <Center py="10"><Spinner color="brand.primary" size="lg" /></Center>
      ) : visibles.length === 0 ? (
        <Text color="fg.subtle">No hay locales que coincidan con el filtro.</Text>
      ) : (
        <VStack align="stretch" gap="3">
          {visibles.map((l) => {
            const open = abierto === l.id;
            return (
              <GlassPanel key={l.id} p={{ base: "4", md: "5" }}>
                <Flex align="start" justify="space-between" gap="4" wrap="wrap">
                  <HStack gap="3" align="start" minW="0" flex="1">
                    <Box fontSize="2xl" lineHeight="1">{emoji(l.categoria)}</Box>
                    <VStack align="start" gap="1" minW="0">
                      <HStack gap="2" wrap="wrap">
                        <Heading size="sm" lineClamp={1}>{l.nombre}</Heading>
                        <Badge
                          bg={l.aprobado ? "rgba(50,213,131,0.15)" : "rgba(201,162,39,0.15)"}
                          color={l.aprobado ? "brand.400" : "accent.gold"}
                          borderRadius="full" px="2.5" fontSize="0.6rem" textTransform="uppercase"
                        >
                          {l.aprobado ? "Aprobado" : "Pendiente"}
                        </Badge>
                        {l.ownerId ? (
                          <Badge bg="bg.muted" color="fg.muted" borderRadius="full" px="2.5" fontSize="0.6rem">De un local</Badge>
                        ) : (
                          <Badge bg="bg.muted" color="fg.subtle" borderRadius="full" px="2.5" fontSize="0.6rem">Del staff</Badge>
                        )}
                      </HStack>
                      <Text fontSize="xs" color="fg.subtle">
                        {[categoriaLabel(l.categoria), l.ciudad].filter(Boolean).join(" · ")}
                        {l.createdByName ? ` · por ${l.createdByName}` : ""}
                        {l.eventos?.length ? ` · ${l.eventos.length} evento${l.eventos.length === 1 ? "" : "s"}` : ""}
                      </Text>
                    </VStack>
                  </HStack>

                  <HStack gap="2" flexShrink="0">
                    <Button
                      size="sm"
                      borderRadius="full"
                      loading={busy === l.id}
                      onClick={() => toggleAprobado(l)}
                      variant={l.aprobado ? "outline" : "solid"}
                      borderColor="border.subtle"
                      bg={l.aprobado ? "transparent" : "brand.500"}
                      color={l.aprobado ? "fg.muted" : "fg.inverted"}
                      _hover={l.aprobado ? { borderColor: "accent.gold", color: "accent.gold" } : { opacity: 0.9 }}
                    >
                      {l.aprobado ? <><X size={14} style={{ marginRight: 5 }} />Quitar</> : <><Check size={14} style={{ marginRight: 5 }} />Aprobar</>}
                    </Button>
                    <Button size="sm" variant="ghost" color="fg.muted" onClick={() => { setAbierto(open ? null : l.id); setEmailDueno(""); setOk(null); }}>
                      {open ? "Ocultar" : "Ver"}
                    </Button>
                    <IconButton aria-label="Eliminar" size="sm" variant="ghost" color="fg.subtle" onClick={() => borrar(l)} _hover={{ color: "red.400", bg: "rgba(239,68,68,0.1)" }}>
                      <Trash2 size={16} />
                    </IconButton>
                  </HStack>
                </Flex>

                {open && (
                  <VStack align="stretch" gap="2" mt="4" pt="4" borderTop="1px solid" borderColor="border.subtle" fontSize="sm" color="fg.muted">
                    {l.direccion && <HStack gap="2"><MapPin size={14} /><Text>{l.direccion}</Text></HStack>}
                    {l.horario && <HStack gap="2" align="start"><Clock size={14} style={{ marginTop: 3 }} /><Text whiteSpace="pre-wrap">{l.horario}</Text></HStack>}
                    {l.telefono && <HStack gap="2"><Phone size={14} /><Text>{l.telefono}</Text></HStack>}
                    {l.web && <HStack gap="2"><Globe size={14} /><a href={l.web} target="_blank" rel="noopener noreferrer" style={{ color: "var(--chakra-colors-brand-300)" }}>{l.web}</a></HStack>}
                    {l.descripcion && <Text color="fg.subtle">{l.descripcion}</Text>}
                    {l.eventos?.length > 0 && (
                      <Box pt="2">
                        <HStack gap="2" mb="2" color="fg.default"><CalendarDays size={14} /><Text fontWeight="700">Eventos</Text></HStack>
                        <VStack align="stretch" gap="1.5" pl="1">
                          {l.eventos.map((ev, i) => (
                            <Text key={ev.id ?? i} fontSize="xs" color="fg.subtle">
                              <Text as="span" color="brand.300" fontWeight="700">{ev.fecha}{ev.hora ? ` ${ev.hora}` : ""}</Text>
                              {" — "}{ev.titulo}{ev.descripcion ? ` · ${ev.descripcion}` : ""}
                            </Text>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    <Box pt="2">
                      <HStack gap="2" mb="2" color="fg.default"><UserPlus size={14} /><Text fontWeight="700">Dueño</Text></HStack>
                      <HStack gap="2" wrap="wrap" mb="2">
                        {l.ownerId ? (
                          <>
                            <Text fontSize="xs" color="brand.300">Administrado por un usuario</Text>
                            <Button
                              size="xs" variant="outline" borderRadius="full" borderColor="border.subtle"
                              color="fg.muted" loading={asignBusy} onClick={() => quitarDueno(l)}
                              _hover={{ borderColor: "accent.gold", color: "accent.gold" }}
                            >
                              <UserMinus size={13} style={{ marginRight: 5 }} />Quitar dueño
                            </Button>
                          </>
                        ) : (
                          <Text fontSize="xs" color="fg.subtle">Sin dueño asignado</Text>
                        )}
                      </HStack>
                      <Flex gap="2" wrap="wrap">
                        <Input
                          type="email" placeholder="dueno@ejemplo.com" value={emailDueno}
                          onChange={(e) => setEmailDueno(e.target.value)} flex="1" minW="200px" {...fp}
                        />
                        <Button
                          size="md" borderRadius="lg" loading={asignBusy} onClick={() => asignar(l)}
                          bg="brand.500" color="fg.inverted" fontWeight="700" _hover={{ opacity: 0.9 }}
                        >
                          <UserPlus size={14} style={{ marginRight: 5 }} />Asignar dueño
                        </Button>
                      </Flex>
                      <Text fontSize="xs" color="fg.subtle" mt="1.5">
                        Le da acceso a ese usuario para administrar la ficha y sus eventos, sin cambiar su rol.
                      </Text>
                    </Box>
                  </VStack>
                )}
              </GlassPanel>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
};
