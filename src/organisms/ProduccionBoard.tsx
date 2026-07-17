import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Badge, Box, Button, Center, Flex, Heading, HStack, IconButton, Input, Link, Spinner, Switch, Text, Textarea, VStack,
} from "@chakra-ui/react";
import {
  ChevronRight, ArrowLeft, Plus, Trash2, Pencil, Check, X, Paperclip, Download, User as UserIcon, Calendar, FileText, Eye,
} from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import {
  listProduccion, createProduccion, updateStage, deleteProduccion, uploadProduccionArchivo,
  STAGES, type ProduccionItem, type Stage, type StageData,
} from "../services/produccion";

const fp = {
  bg: "bg.muted", border: "1px solid", borderColor: "border.subtle", borderRadius: "lg",
  color: "fg.default", size: "sm" as const, px: "3",
  _hover: { borderColor: "border.neon" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #22d3ee", outline: "none" },
};

const hechas = (item: ProduccionItem) => STAGES.filter((s) => item.stages[s.key]?.done).length;
// Etapa actual = primera no terminada; si están todas listas → "Terminado".
const etapaActual = (item: ProduccionItem) => {
  const pend = STAGES.find((s) => !item.stages[s.key]?.done);
  return pend ?? { key: "publicado" as Stage, label: "Terminado", color: "brandGreen.500" };
};

// Barra de 6 puntos con el color de cada etapa terminada.
const Progreso = ({ item }: { item: ProduccionItem }) => (
  <HStack gap="1">
    {STAGES.map((s) => (
      <Box key={s.key} h="6px" flex="1" borderRadius="full" bg={item.stages[s.key]?.done ? s.color : "bg.elevated"} />
    ))}
  </HStack>
);

// ── Fila de una etapa (detalle) ──
const StageRow = ({
  meta, data, onSave,
}: {
  meta: { key: Stage; label: string; color: string };
  data: StageData;
  onSave: (d: Partial<StageData>) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [showPlanilla, setShowPlanilla] = useState(false);
  const [responsable, setResponsable] = useState(data.responsable);
  const [fecha, setFecha] = useState(data.fecha);
  const [contenido, setContenido] = useState(data.contenido);
  const [done, setDone] = useState(data.done);
  const [archivoKey, setArchivoKey] = useState(data.archivoKey ?? "");
  const [archivoNombre, setArchivoNombre] = useState(data.archivoNombre ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setResponsable(data.responsable); setFecha(data.fecha); setContenido(data.contenido);
    setDone(data.done); setArchivoKey(data.archivoKey ?? ""); setArchivoNombre(data.archivoNombre ?? "");
    setEditing(true);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const r = await uploadProduccionArchivo(file);
      setArchivoKey(r.archivoKey); setArchivoNombre(r.archivoNombre);
    } catch { /* noop */ } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const save = () => { onSave({ responsable, fecha, contenido, archivoKey, archivoNombre, done }); setEditing(false); };
  const asignada = data.responsable || data.contenido || data.archivoNombre;

  return (
    <Box borderLeft="3px solid" borderColor={meta.color} bg="bg.muted" borderRadius="md" p="3.5">
      <Flex justify="space-between" align="center" gap="2" wrap="wrap">
        <HStack gap="2" minW="0">
          <Box w="9px" h="9px" borderRadius="full" bg={meta.color} flexShrink="0" />
          <Text fontWeight="800" fontSize="sm" fontFamily="heading">{meta.label}</Text>
          {data.done && (
            <Badge bg="rgba(34,197,94,0.15)" color="brandGreen.400" border="1px solid" borderColor="rgba(34,197,94,0.4)" borderRadius="full" px="2">
              <HStack gap="1"><Check size={10} /><Text fontSize="0.6rem" fontWeight="700">LISTA</Text></HStack>
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
          <HStack gap="3" flexWrap="wrap" fontSize="xs" color="fg.subtle">
            {data.responsable ? (
              <HStack gap="1"><UserIcon size={12} /><Text color="fg.muted">{data.responsable}</Text></HStack>
            ) : <Text>Sin asignar</Text>}
            {data.fecha && <HStack gap="1"><Calendar size={12} /><Text>{data.fecha}</Text></HStack>}
          </HStack>
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
          <HStack gap="2">
            <Input placeholder="Responsable" value={responsable} onChange={(e) => setResponsable(e.target.value)} {...fp} />
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} {...fp} maxW="150px" />
          </HStack>
          <Textarea placeholder="Planilla: qué entregas en esta etapa (brief, guion, notas…)" value={contenido} onChange={(e) => setContenido(e.target.value)} {...fp} rows={3} py="2" />
          <HStack gap="2" justify="space-between" wrap="wrap">
            <HStack gap="2">
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
            <HStack gap="2">
              <Text fontSize="xs" color="fg.subtle">¿Lista?</Text>
              <Switch.Root checked={done} onCheckedChange={(e) => setDone(e.checked)} colorPalette="green" size="sm">
                <Switch.HiddenInput /><Switch.Control><Switch.Thumb /></Switch.Control>
              </Switch.Root>
            </HStack>
          </HStack>
          <HStack justify="end" gap="1">
            <Button size="xs" variant="ghost" color="fg.subtle" onClick={() => setEditing(false)}><X size={14} style={{ marginRight: "4px" }} />Cancelar</Button>
            <Button size="xs" borderRadius="md" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)" onClick={save}>
              <Check size={14} style={{ marginRight: "4px" }} />Guardar
            </Button>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

// ── Card resumen de un episodio ──
const EpisodeSummary = ({ item, onOpen, onDelete }: { item: ProduccionItem; onOpen: () => void; onDelete: () => void }) => {
  const act = etapaActual(item);
  const n = hechas(item);
  const resp = item.stages[act.key]?.responsable;
  const terminado = n === STAGES.length;
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
  const [items, setItems] = useState<ProduccionItem[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [idea, setIdea] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { listProduccion().then(setItems).catch(() => setItems([])); }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSaving(true);
    try {
      const it = await createProduccion({ titulo, idea });
      setItems((p) => [...(p ?? []), it]);
      setTitulo(""); setIdea("");
      setSelected(it.id);
    } catch { /* noop */ } finally { setSaving(false); }
  };

  const stageSave = async (id: string, stage: Stage, data: Partial<StageData>) => {
    try {
      const updated = await updateStage(id, stage, data);
      setItems((p) => (p ?? []).map((i) => (i.id === id ? updated : i)));
    } catch { /* noop */ }
  };
  const remove = async (id: string) => {
    setItems((p) => (p ?? []).filter((i) => i.id !== id));
    if (selected === id) setSelected(null);
    deleteProduccion(id).catch(() => {});
  };

  const current = items?.find((i) => i.id === selected) ?? null;

  // ── Vista detalle de un episodio ──
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
            <StageRow key={meta.key} meta={meta} data={current.stages[meta.key]} onSave={(d) => stageSave(current.id, meta.key, d)} />
          ))}
        </VStack>
      </VStack>
    );
  }

  // ── Vista lista ──
  return (
    <VStack align="stretch" gap="6">
      <VStack align="start" gap="1">
        <Heading size="lg" fontWeight="800">Pipeline de producción</Heading>
        <Text color="fg.muted" fontSize="sm">Cada episodio es una card: entra para ver su desarrollo, responsables y planillas por etapa.</Text>
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

      {items === null ? (
        <Center py="10"><Spinner color="brand.primary" size="lg" /></Center>
      ) : items.length === 0 ? (
        <Text color="fg.subtle" fontSize="sm">Aún no hay episodios en producción. Crea el primero.</Text>
      ) : (
        <VStack align="stretch" gap="3">
          {items.map((it) => (
            <EpisodeSummary key={it.id} item={it} onOpen={() => setSelected(it.id)} onDelete={() => remove(it.id)} />
          ))}
        </VStack>
      )}
    </VStack>
  );
};
