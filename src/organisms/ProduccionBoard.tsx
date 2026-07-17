import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Badge, Box, Button, Center, Checkbox, Flex, Heading, HStack, IconButton, Input, Link, NativeSelect, Spinner, Switch, Text, Textarea, VStack,
} from "@chakra-ui/react";
import {
  ChevronRight, ArrowLeft, Plus, Trash2, Pencil, Check, X, Paperclip, Download, User as UserIcon, Calendar, FileText, Eye, AlertTriangle, ListChecks,
} from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { useAuth } from "../providers/AuthProvider";
import { getEquipo, type Miembro } from "../services/equipo";
import {
  listProduccion, createProduccion, updateStage, deleteProduccion, uploadProduccionArchivo, estaLista,
  STAGES, ESTADOS, type ProduccionItem, type Stage, type StageData, type Subtarea, type Estado,
} from "../services/produccion";

const fp = {
  bg: "bg.muted", border: "1px solid", borderColor: "border.subtle", borderRadius: "lg",
  color: "fg.default", size: "sm" as const, px: "3",
  _hover: { borderColor: "border.neon" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #22d3ee", outline: "none" },
};

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const isOverdue = (st: StageData) => !!st.fecha && st.fecha < todayStr() && !estaLista(st);
const estadoMeta = (e: Estado) => ESTADOS.find((x) => x.key === e) ?? ESTADOS[0];
const uid = () => Math.random().toString(36).slice(2, 10);

const PLANTILLAS: Record<Stage, string[]> = {
  idea: ["Definir tema", "Buscar invitado", "Escribir brief"],
  guion: ["Escribir gancho", "Estructurar bloques", "Revisar duración"],
  grabacion: ["Reservar estudio/lugar", "Preparar equipo", "Confirmar asistentes", "Grabar"],
  edicion: ["Cortar silencios", "Intro y cortinas", "Mezclar audio", "Exportar"],
  programado: ["Subir a plataformas", "Show notes", "Portada/miniatura", "Agendar publicación"],
  publicado: ["Publicar", "Compartir en redes", "Responder comentarios"],
};

const hechas = (item: ProduccionItem) => STAGES.filter((s) => estaLista(item.stages[s.key])).length;
const etapaActual = (item: ProduccionItem) => {
  const pend = STAGES.find((s) => !estaLista(item.stages[s.key]));
  return pend ?? { key: "publicado" as Stage, label: "Terminado", color: "brandGreen.500" };
};

const Progreso = ({ item }: { item: ProduccionItem }) => (
  <HStack gap="1">
    {STAGES.map((s) => (
      <Box key={s.key} h="6px" flex="1" borderRadius="full" bg={estaLista(item.stages[s.key]) ? s.color : "bg.elevated"} />
    ))}
  </HStack>
);

// ── Fila de una etapa (detalle) ──
const StageRow = ({ meta, data, equipo, onSave }: {
  meta: { key: Stage; label: string; color: string };
  data: StageData;
  equipo: Miembro[];
  onSave: (d: Partial<StageData>) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [showPlanilla, setShowPlanilla] = useState(false);
  const [responsableId, setResponsableId] = useState(data.responsableId ?? "");
  const [fecha, setFecha] = useState(data.fecha);
  const [contenido, setContenido] = useState(data.contenido);
  const [estado, setEstado] = useState<Estado>(data.estado);
  const [subtareas, setSubtareas] = useState<Subtarea[]>(data.subtareas ?? []);
  const [nuevaSub, setNuevaSub] = useState("");
  const [archivoKey, setArchivoKey] = useState(data.archivoKey ?? "");
  const [archivoNombre, setArchivoNombre] = useState(data.archivoNombre ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setResponsableId(data.responsableId ?? ""); setFecha(data.fecha); setContenido(data.contenido);
    setEstado(data.estado); setSubtareas(data.subtareas ?? []); setArchivoKey(data.archivoKey ?? ""); setArchivoNombre(data.archivoNombre ?? "");
    setEditing(true);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const r = await uploadProduccionArchivo(file); setArchivoKey(r.archivoKey); setArchivoNombre(r.archivoNombre); }
    catch { /* noop */ } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const save = () => {
    const miembro = equipo.find((m) => m.userId === responsableId);
    onSave({ responsableId, responsable: miembro?.nombre ?? data.responsable, fecha, contenido, estado, subtareas, archivoKey, archivoNombre });
    setEditing(false);
  };

  // Marcar/desmarcar una subtarea desde la vista (persiste al momento)
  const toggleSub = (id: string) => {
    const next = (data.subtareas ?? []).map((s) => (s.id === id ? { ...s, hecha: !s.hecha } : s));
    onSave({ subtareas: next });
  };

  const em = estadoMeta(data.estado);
  const overdue = isOverdue(data);
  const subHechas = (data.subtareas ?? []).filter((s) => s.hecha).length;
  const asignada = data.responsableId || data.contenido || data.archivoNombre || (data.subtareas ?? []).length > 0;

  return (
    <Box borderLeft="3px solid" borderColor={meta.color} bg="bg.muted" borderRadius="md" p="3.5">
      <Flex justify="space-between" align="center" gap="2" wrap="wrap">
        <HStack gap="2" minW="0" flexWrap="wrap">
          <Box w="9px" h="9px" borderRadius="full" bg={meta.color} flexShrink="0" />
          <Text fontWeight="800" fontSize="sm" fontFamily="heading">{meta.label}</Text>
          {estaLista(data) ? (
            <Badge bg="rgba(34,197,94,0.15)" color="brandGreen.400" border="1px solid" borderColor="rgba(34,197,94,0.4)" borderRadius="full" px="2">
              <HStack gap="1"><Check size={10} /><Text fontSize="0.6rem" fontWeight="700">LISTA</Text></HStack>
            </Badge>
          ) : (
            <Badge bg="bg.elevated" color={em.color} borderRadius="full" px="2" fontSize="0.6rem" fontWeight="700">{em.label}</Badge>
          )}
          {overdue && (
            <Badge bg="rgba(239,68,68,0.15)" color="red.300" border="1px solid" borderColor="rgba(239,68,68,0.4)" borderRadius="full" px="2">
              <HStack gap="1"><AlertTriangle size={10} /><Text fontSize="0.6rem" fontWeight="700">ATRASADA</Text></HStack>
            </Badge>
          )}
        </HStack>
        {!editing && (
          <HStack gap="1">
            {(data.contenido || data.archivoNombre) && (
              <IconButton aria-label="Ver planilla" size="xs" variant="ghost" color={showPlanilla ? "brand.primary" : "fg.subtle"} onClick={() => setShowPlanilla((v) => !v)} _hover={{ color: "brand.primary" }}><Eye size={15} /></IconButton>
            )}
            <Button size="xs" variant="ghost" color={asignada ? "fg.muted" : "brand.primary"} onClick={startEdit} _hover={{ color: "brand.primary" }}>
              {asignada ? <><Pencil size={13} style={{ marginRight: "4px" }} />Editar</> : <><Plus size={14} style={{ marginRight: "4px" }} />Agregar</>}
            </Button>
          </HStack>
        )}
      </Flex>

      {!editing ? (
        <VStack align="stretch" gap="1.5" mt="1.5">
          <HStack gap="3" flexWrap="wrap" fontSize="xs">
            {data.responsable ? (
              <HStack gap="1" color="fg.muted"><UserIcon size={12} /><Text>{data.responsable}</Text></HStack>
            ) : <Text color="fg.subtle">Sin asignar</Text>}
            {data.fecha && <HStack gap="1" color={overdue ? "red.300" : "fg.subtle"}><Calendar size={12} /><Text>{data.fecha}</Text></HStack>}
            {(data.subtareas ?? []).length > 0 && <HStack gap="1" color="fg.subtle"><ListChecks size={12} /><Text>{subHechas}/{data.subtareas.length}</Text></HStack>}
          </HStack>

          {(data.subtareas ?? []).length > 0 && (
            <VStack align="stretch" gap="1" mt="1">
              {data.subtareas.map((s) => (
                <Checkbox.Root key={s.id} checked={s.hecha} onCheckedChange={() => toggleSub(s.id)} size="sm">
                  <Checkbox.HiddenInput /><Checkbox.Control />
                  <Checkbox.Label fontSize="xs" color={s.hecha ? "fg.subtle" : "fg.muted"} textDecoration={s.hecha ? "line-through" : "none"}>{s.texto}</Checkbox.Label>
                </Checkbox.Root>
              ))}
            </VStack>
          )}

          {showPlanilla && (
            <VStack align="stretch" gap="2" bg="bg.canvas" borderRadius="md" p="3" mt="1">
              {data.contenido && <Text fontSize="sm" color="fg.muted" whiteSpace="pre-wrap">{data.contenido}</Text>}
              {data.archivoNombre && data.archivoUrl && (
                <Link href={data.archivoUrl} target="_blank" rel="noopener noreferrer" display="inline-flex" alignItems="center" gap="1.5" color="brand.primary" fontSize="sm" _hover={{ textDecoration: "none" }}>
                  <Download size={14} /> {data.archivoNombre}
                </Link>
              )}
            </VStack>
          )}
        </VStack>
      ) : (
        <VStack align="stretch" gap="2" mt="2">
          <HStack gap="2" flexWrap="wrap">
            <Box flex="1" minW="150px">
              <NativeSelect.Root size="sm">
                <NativeSelect.Field value={responsableId} onChange={(e) => setResponsableId(e.target.value)} {...fp}>
                  <option value="" style={{ background: "#161626" }}>Responsable…</option>
                  {equipo.map((m) => <option key={m.userId} value={m.userId} style={{ background: "#161626" }}>{m.nombre}</option>)}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} {...fp} maxW="150px" />
            <Box minW="140px">
              <NativeSelect.Root size="sm">
                <NativeSelect.Field value={estado} onChange={(e) => setEstado(e.target.value as Estado)} {...fp}>
                  {ESTADOS.map((s) => <option key={s.key} value={s.key} style={{ background: "#161626" }}>{s.label}</option>)}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>
          </HStack>

          {/* Subtareas */}
          <Box bg="bg.canvas" borderRadius="md" p="2.5">
            <Flex justify="space-between" align="center" mb="1">
              <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase">Sub-tareas</Text>
              {subtareas.length === 0 && (
                <Button size="xs" variant="plain" color="brand.primary" onClick={() => setSubtareas(PLANTILLAS[meta.key].map((t) => ({ id: uid(), texto: t, hecha: false })))}>Usar plantilla</Button>
              )}
            </Flex>
            <VStack align="stretch" gap="1">
              {subtareas.map((s) => (
                <HStack key={s.id} gap="2">
                  <Checkbox.Root checked={s.hecha} onCheckedChange={() => setSubtareas((p) => p.map((x) => x.id === s.id ? { ...x, hecha: !x.hecha } : x))} size="sm">
                    <Checkbox.HiddenInput /><Checkbox.Control /><Checkbox.Label fontSize="xs" color="fg.muted">{s.texto}</Checkbox.Label>
                  </Checkbox.Root>
                  <IconButton aria-label="Quitar" size="xs" variant="ghost" color="fg.subtle" ml="auto" onClick={() => setSubtareas((p) => p.filter((x) => x.id !== s.id))}><X size={12} /></IconButton>
                </HStack>
              ))}
              <HStack gap="2">
                <Input placeholder="Agregar sub-tarea…" value={nuevaSub} onChange={(e) => setNuevaSub(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (nuevaSub.trim()) { setSubtareas((p) => [...p, { id: uid(), texto: nuevaSub.trim(), hecha: false }]); setNuevaSub(""); } } }} {...fp} />
                <IconButton aria-label="Agregar" size="sm" variant="ghost" color="brand.primary" onClick={() => { if (nuevaSub.trim()) { setSubtareas((p) => [...p, { id: uid(), texto: nuevaSub.trim(), hecha: false }]); setNuevaSub(""); } }}><Plus size={16} /></IconButton>
              </HStack>
            </VStack>
          </Box>

          <Textarea placeholder="Planilla: qué entregas en esta etapa (brief, guion, notas…)" value={contenido} onChange={(e) => setContenido(e.target.value)} {...fp} rows={3} py="2" />
          <HStack gap="2" wrap="wrap">
            <Button size="xs" variant="outline" borderColor="border.subtle" color="fg.default" onClick={() => fileRef.current?.click()} _hover={{ borderColor: "border.neon" }}>
              {uploading ? <Spinner size="xs" /> : <Paperclip size={13} style={{ marginRight: "4px" }} />}
              {archivoNombre ? "Cambiar archivo" : "Adjuntar"}
            </Button>
            <input ref={fileRef} type="file" hidden onChange={handleFile} />
            {archivoNombre && (
              <HStack gap="1" color="fg.muted" fontSize="xs">
                <FileText size={12} /><Text lineClamp={1} maxW="140px">{archivoNombre}</Text>
                <IconButton aria-label="Quitar" size="xs" variant="ghost" color="fg.subtle" onClick={() => { setArchivoKey(""); setArchivoNombre(""); }}><X size={12} /></IconButton>
              </HStack>
            )}
          </HStack>
          <HStack justify="end" gap="1">
            <Button size="xs" variant="ghost" color="fg.subtle" onClick={() => setEditing(false)}><X size={14} style={{ marginRight: "4px" }} />Cancelar</Button>
            <Button size="xs" borderRadius="md" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)" onClick={save}><Check size={14} style={{ marginRight: "4px" }} />Guardar</Button>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

// ── Card resumen ──
const EpisodeSummary = ({ item, onOpen, onDelete }: { item: ProduccionItem; onOpen: () => void; onDelete: () => void }) => {
  const act = etapaActual(item);
  const n = hechas(item);
  const resp = item.stages[act.key]?.responsable;
  const terminado = n === STAGES.length;
  const atrasadas = STAGES.filter((s) => isOverdue(item.stages[s.key])).length;
  return (
    <GlassPanel interactive p={{ base: "4", md: "5" }} cursor="pointer" onClick={onOpen}>
      <VStack align="stretch" gap="3">
        <Flex justify="space-between" align="start" gap="3">
          <VStack align="start" gap="2" minW="0">
            <Text fontWeight="700" lineClamp={1}>{item.titulo}</Text>
            <HStack gap="2" flexWrap="wrap">
              <Badge bg="bg.elevated" color={terminado ? "brandGreen.400" : "fg.default"} border="1px solid" borderColor={act.color} borderRadius="full" px="3" py="0.5">
                <HStack gap="1.5"><Box w="7px" h="7px" borderRadius="full" bg={act.color} /><Text fontSize="0.7rem" fontWeight="700">{terminado ? "Terminado" : `En ${act.label}`}</Text></HStack>
              </Badge>
              <Text fontSize="xs" color="fg.subtle">{n}/{STAGES.length} listas</Text>
              {!terminado && resp && <Text fontSize="xs" color="fg.subtle">· {resp}</Text>}
              {atrasadas > 0 && <Badge bg="rgba(239,68,68,0.15)" color="red.300" borderRadius="full" px="2" fontSize="0.6rem">{atrasadas} atrasada{atrasadas > 1 ? "s" : ""}</Badge>}
            </HStack>
          </VStack>
          <HStack gap="1" flexShrink="0">
            <IconButton aria-label="Eliminar" size="xs" variant="ghost" color="fg.subtle" onClick={(e) => { e.stopPropagation(); onDelete(); }} _hover={{ color: "red.400", bg: "rgba(239,68,68,0.1)" }}><Trash2 size={16} /></IconButton>
            <Box color="fg.subtle"><ChevronRight size={20} /></Box>
          </HStack>
        </Flex>
        <Progreso item={item} />
      </VStack>
    </GlassPanel>
  );
};

export const ProduccionBoard = () => {
  const { profile } = useAuth();
  const myId = profile?.userId;
  const [items, setItems] = useState<ProduccionItem[] | null>(null);
  const [equipo, setEquipo] = useState<Miembro[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [idea, setIdea] = useState("");
  const [saving, setSaving] = useState(false);
  const [soloMias, setSoloMias] = useState(false);

  useEffect(() => {
    listProduccion().then(setItems).catch(() => setItems([]));
    getEquipo().then(setEquipo).catch(() => setEquipo([]));
  }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSaving(true);
    try { const it = await createProduccion({ titulo, idea }); setItems((p) => [...(p ?? []), it]); setTitulo(""); setIdea(""); setSelected(it.id); }
    catch { /* noop */ } finally { setSaving(false); }
  };
  const stageSave = async (id: string, stage: Stage, data: Partial<StageData>) => {
    try { const updated = await updateStage(id, stage, data); setItems((p) => (p ?? []).map((i) => (i.id === id ? updated : i))); }
    catch { /* noop */ }
  };
  const remove = async (id: string) => {
    setItems((p) => (p ?? []).filter((i) => i.id !== id));
    if (selected === id) setSelected(null);
    deleteProduccion(id).catch(() => {});
  };

  const current = items?.find((i) => i.id === selected) ?? null;

  if (current) {
    const act = etapaActual(current);
    const terminado = hechas(current) === STAGES.length;
    return (
      <VStack align="stretch" gap="6">
        <Button onClick={() => setSelected(null)} alignSelf="start" size="sm" variant="ghost" color="fg.muted" _hover={{ color: "brand.primary" }}>
          <ArrowLeft size={16} style={{ marginRight: "6px" }} /> Volver a la lista
        </Button>
        <VStack align="start" gap="3">
          <Heading size="lg" fontWeight="900">{current.titulo}</Heading>
          <HStack gap="3" flexWrap="wrap">
            <Badge bg="bg.elevated" color={terminado ? "brandGreen.400" : "fg.default"} border="1px solid" borderColor={act.color} borderRadius="full" px="3" py="1">
              <HStack gap="1.5"><Box w="8px" h="8px" borderRadius="full" bg={act.color} /><Text fontWeight="700" fontSize="sm">{terminado ? "Terminado" : `En ${act.label}`}</Text></HStack>
            </Badge>
            <Text fontSize="sm" color="fg.subtle">{hechas(current)}/{STAGES.length} etapas listas</Text>
          </HStack>
          <Box w="full" maxW="md"><Progreso item={current} /></Box>
        </VStack>
        <VStack align="stretch" gap="2.5">
          {STAGES.map((meta) => (
            <StageRow key={meta.key} meta={meta} data={current.stages[meta.key]} equipo={equipo} onSave={(d) => stageSave(current.id, meta.key, d)} />
          ))}
        </VStack>
      </VStack>
    );
  }

  const visibles = soloMias && myId
    ? (items ?? []).filter((i) => STAGES.some((s) => i.stages[s.key]?.responsableId === myId))
    : items;

  return (
    <VStack align="stretch" gap="6">
      <VStack align="start" gap="1">
        <Heading size="lg" fontWeight="800">Pipeline de producción</Heading>
        <Text color="fg.muted" fontSize="sm">Cada episodio es una card: entra para ver su desarrollo, responsables, sub-tareas y planillas por etapa.</Text>
      </VStack>

      <GlassPanel p={{ base: "4", md: "5" }}>
        <VStack as="form" onSubmit={add} align="stretch" gap="3">
          <Input placeholder="Título del episodio" value={titulo} onChange={(e) => setTitulo(e.target.value)} {...fp} size="md" />
          <Textarea placeholder="La idea / brief inicial (queda como planilla de la etapa Idea)" value={idea} onChange={(e) => setIdea(e.target.value)} {...fp} size="md" rows={2} py="2" />
          <Button type="submit" loading={saving} alignSelf="start" px="6" size="md" borderRadius="lg" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)" _hover={{ opacity: 0.92 }}>
            <Plus size={16} style={{ marginRight: "6px" }} /> Crear episodio
          </Button>
        </VStack>
      </GlassPanel>

      <Flex justify="end" align="center" gap="2">
        <Text fontSize="sm" color="fg.muted">Solo mis etapas</Text>
        <Switch.Root checked={soloMias} onCheckedChange={(e) => setSoloMias(e.checked)} colorPalette="cyan" size="sm">
          <Switch.HiddenInput /><Switch.Control><Switch.Thumb /></Switch.Control>
        </Switch.Root>
      </Flex>

      {items === null ? (
        <Center py="10"><Spinner color="brand.primary" size="lg" /></Center>
      ) : (visibles ?? []).length === 0 ? (
        <Text color="fg.subtle" fontSize="sm">{soloMias ? "No tienes etapas asignadas." : "Aún no hay episodios en producción. Crea el primero."}</Text>
      ) : (
        <VStack align="stretch" gap="3">
          {(visibles ?? []).map((it) => (
            <EpisodeSummary key={it.id} item={it} onOpen={() => setSelected(it.id)} onDelete={() => remove(it.id)} />
          ))}
        </VStack>
      )}
    </VStack>
  );
};
