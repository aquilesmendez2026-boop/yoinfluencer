import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Badge, Box, Button, Center, Checkbox, Flex, Heading, HStack, IconButton, Input, Link, NativeSelect, Spinner, Text, Textarea, VStack,
} from "@chakra-ui/react";
import {
  ChevronRight, ChevronDown, ArrowLeft, ArrowRight, Plus, Trash2, Pencil, Check, X, Paperclip, Download, User as UserIcon, UserPlus, Clock, CalendarPlus, FileText, Eye, AlertTriangle, ListChecks, CheckCircle2, Circle, History, Inbox, RotateCcw,
} from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { ApiError } from "../services/api";
import { getEquipo, type Miembro } from "../services/equipo";
import {
  listProduccion, createProduccion, updateStage, deleteProduccion, uploadProduccionArchivo, getPlantillas, estaLista,
  STAGES, ESTADOS,
  type ProduccionItem, type Stage, type StageData, type Subtarea, type Estado,
  type Plantillas, type StageTemplate, type TemplateField, type FieldValue, type FileValue,
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

const isFileValue = (v: FieldValue): v is FileValue => !!v && typeof v === "object" && "archivoKey" in v;
const isFilled = (f: TemplateField, v: FieldValue): boolean => {
  if (f.type === "checkbox") return v === true;
  if (f.type === "numero") return v !== "" && v != null && Number.isFinite(Number(v));
  if (f.type === "file") return isFileValue(v) && !!v.archivoKey;
  return typeof v === "string" && v.trim() !== "";
};

// Fecha en lenguaje humano relativo al hoy.
const relFecha = (fecha: string, lista: boolean): { text: string; tone: string } | null => {
  if (!fecha) return null;
  const dias = Math.round((new Date(fecha + "T00:00:00").getTime() - new Date(todayStr() + "T00:00:00").getTime()) / 86400000);
  if (lista) return { text: `entregada ${fecha}`, tone: "fg.subtle" };
  if (dias < 0) return { text: `atrasada ${-dias} día${-dias > 1 ? "s" : ""}`, tone: "red.300" };
  if (dias === 0) return { text: "vence hoy", tone: "neon.amber" };
  if (dias === 1) return { text: "vence mañana", tone: "neon.amber" };
  return { text: `vence en ${dias} días`, tone: dias <= 3 ? "neon.amber" : "fg.subtle" };
};

const PLANTILLAS_SUB: Record<Stage, string[]> = {
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
const siguienteLabel = (key: Stage): string | null => {
  const idx = STAGES.findIndex((s) => s.key === key);
  return idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1].label : null;
};

// Badge LISTA legible (verde sólido, texto oscuro).
const ListaBadge = () => (
  <Badge bg="#22c55e" color="#04180c" borderRadius="full" px="2.5" py="0.5">
    <HStack gap="1"><Check size={11} strokeWidth={3} /><Text fontSize="0.62rem" fontWeight="800" letterSpacing="wide">LISTA</Text></HStack>
  </Badge>
);

const Progreso = ({ item }: { item: ProduccionItem }) => (
  <HStack gap="1">
    {STAGES.map((s) => (
      <Box key={s.key} h="6px" flex="1" borderRadius="full" bg={estaLista(item.stages[s.key]) ? s.color : "bg.elevated"} />
    ))}
  </HStack>
);

// Cuenta requisitos (campos obligatorios de la plantilla) completos.
const reqStats = (template: StageTemplate | undefined, values: Record<string, FieldValue> | undefined) => {
  const req = (template?.fields ?? []).filter((f) => f.required);
  const ok = req.filter((f) => isFilled(f, values?.[f.key])).length;
  return { req, ok, total: req.length };
};

// ── Cambiar estado directo desde la card (excepto aprobada, que pasa por "Marcar lista") ──
const EstadoControl = ({ data, onSave }: { data: StageData; onSave: (d: Partial<StageData>) => Promise<void> }) => {
  const [open, setOpen] = useState(false);
  const em = estadoMeta(data.estado);
  if (!open) {
    return (
      <Badge as="button" bg="bg.elevated" color={em.color} borderRadius="full" px="2.5" py="1" fontSize="0.6rem" fontWeight="700" cursor="pointer" onClick={(e) => { e.stopPropagation(); setOpen(true); }} _hover={{ borderColor: "border.neon" }} border="1px solid" borderColor="transparent">
        <HStack gap="1">{em.label}<ChevronDown size={10} /></HStack>
      </Badge>
    );
  }
  return (
    <Box minW="130px" onClick={(e) => e.stopPropagation()}>
      <NativeSelect.Root size="xs">
        <NativeSelect.Field defaultValue={data.estado} onChange={(e) => { onSave({ estado: e.target.value as Estado }).catch(() => {}); setOpen(false); }} {...fp}>
          {ESTADOS.filter((s) => s.key !== "aprobada").map((s) => <option key={s.key} value={s.key} style={{ background: "#161626" }}>{s.label}</option>)}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Box>
  );
};

// ── Asignar responsable directo desde la card ──
const AssignControl = ({ data, equipo, onSave }: { data: StageData; equipo: Miembro[]; onSave: (d: Partial<StageData>) => Promise<void> }) => {
  const [open, setOpen] = useState(false);
  const assign = (id: string) => {
    const m = equipo.find((x) => x.userId === id);
    onSave({ responsableId: id, responsable: m?.nombre ?? "" }).catch(() => {});
    setOpen(false);
  };
  if (data.responsable && !open) {
    return (
      <HStack gap="1.5" color="fg.muted" fontSize="xs">
        <UserIcon size={12} /><Text>{data.responsable}</Text>
        <IconButton aria-label="Reasignar" size="xs" variant="ghost" color="fg.subtle" onClick={(e) => { e.stopPropagation(); setOpen(true); }} _hover={{ color: "brand.primary" }}><Pencil size={11} /></IconButton>
      </HStack>
    );
  }
  if (!open) {
    return (
      <Button size="xs" variant="outline" borderColor="border.subtle" color="brand.primary" borderRadius="full" onClick={(e) => { e.stopPropagation(); setOpen(true); }} _hover={{ borderColor: "border.neon" }}>
        <UserPlus size={13} style={{ marginRight: "4px" }} /> Asignar
      </Button>
    );
  }
  return (
    <Box minW="160px" onClick={(e) => e.stopPropagation()}>
      <NativeSelect.Root size="xs">
        <NativeSelect.Field defaultValue={data.responsableId ?? ""} onChange={(e) => assign(e.target.value)} {...fp}>
          <option value="" style={{ background: "#161626" }}>Elegir…</option>
          {equipo.map((m) => <option key={m.userId} value={m.userId} style={{ background: "#161626" }}>{m.nombre}</option>)}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Box>
  );
};

// ── Input tipado de un campo de plantilla ──
const FieldInput = ({ field, value, onChange, onUpload }: {
  field: TemplateField;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
  onUpload: (file: File) => Promise<FileValue | null>;
}) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const r = await onUpload(file); if (r) onChange(r); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  if (field.type === "checkbox") {
    return (
      <Checkbox.Root checked={value === true} onCheckedChange={(e) => onChange(!!e.checked)} size="sm">
        <Checkbox.HiddenInput /><Checkbox.Control />
        <Checkbox.Label fontSize="xs" color="fg.muted">{field.label}{field.required && <Text as="span" color="red.300"> *</Text>}</Checkbox.Label>
      </Checkbox.Root>
    );
  }

  return (
    <VStack align="stretch" gap="1">
      <Text fontSize="xs" fontWeight="700" color="fg.muted">{field.label}{field.required && <Text as="span" color="red.300"> *</Text>}</Text>
      {field.type === "texto-largo" ? (
        <Textarea value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} {...fp} rows={3} py="2" />
      ) : field.type === "select" ? (
        <NativeSelect.Root size="sm">
          <NativeSelect.Field value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} {...fp}>
            <option value="" style={{ background: "#161626" }}>Elegir…</option>
            {(field.options ?? []).map((o) => <option key={o} value={o} style={{ background: "#161626" }}>{o}</option>)}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      ) : field.type === "file" ? (
        <HStack gap="2" wrap="wrap">
          <Button size="xs" variant="outline" borderColor="border.subtle" color="fg.default" onClick={() => fileRef.current?.click()} _hover={{ borderColor: "border.neon" }}>
            {uploading ? <Spinner size="xs" /> : <Paperclip size={13} style={{ marginRight: "4px" }} />}
            {isFileValue(value) ? "Cambiar" : "Adjuntar"}
          </Button>
          <input ref={fileRef} type="file" hidden onChange={handleFile} />
          {isFileValue(value) && (
            <HStack gap="1" color="fg.muted" fontSize="xs">
              <FileText size={12} /><Text lineClamp={1} maxW="160px">{value.archivoNombre}</Text>
              <IconButton aria-label="Quitar" size="xs" variant="ghost" color="fg.subtle" onClick={() => onChange(null)}><X size={12} /></IconButton>
            </HStack>
          )}
        </HStack>
      ) : (
        <Input
          type={field.type === "fecha" ? "date" : field.type === "numero" ? "number" : field.type === "url" ? "url" : "text"}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.type === "numero" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
          placeholder={field.type === "url" ? "https://…" : undefined}
          {...fp}
        />
      )}
    </VStack>
  );
};

// ── Lectura de un valor tipado ──
const FieldRead = ({ field, value }: { field: TemplateField; value: FieldValue }) => {
  if (!isFilled(field, value)) return null;
  return (
    <VStack align="stretch" gap="0.5">
      <Text fontSize="0.65rem" fontWeight="700" color="fg.subtle" textTransform="uppercase">{field.label}</Text>
      {field.type === "file" && isFileValue(value) ? (
        value.archivoUrl ? (
          <Link href={value.archivoUrl} target="_blank" rel="noopener noreferrer" display="inline-flex" alignItems="center" gap="1.5" color="brand.primary" fontSize="sm" _hover={{ textDecoration: "none" }}>
            <Download size={14} /> {value.archivoNombre}
          </Link>
        ) : <Text fontSize="sm" color="fg.muted"><FileText size={12} style={{ display: "inline", marginRight: 4 }} />{value.archivoNombre}</Text>
      ) : field.type === "checkbox" ? (
        <Text fontSize="sm" color="brandGreen.400"><Check size={13} style={{ display: "inline", marginRight: 4 }} />Sí</Text>
      ) : field.type === "url" ? (
        <Link href={String(value)} target="_blank" rel="noopener noreferrer" color="brand.primary" fontSize="sm" wordBreak="break-all">{String(value)}</Link>
      ) : (
        <Text fontSize="sm" color="fg.muted" whiteSpace="pre-wrap">{String(value)}</Text>
      )}
    </VStack>
  );
};

// ── Etapa colapsada (una línea) ──
const StageCollapsed = ({ meta, data, equipo, template, onOpen, onSave }: {
  meta: { key: Stage; label: string; color: string };
  data: StageData; equipo: Miembro[]; template?: StageTemplate;
  onOpen: () => void; onSave: (d: Partial<StageData>) => Promise<void>;
}) => {
  const lista = estaLista(data);
  const overdue = isOverdue(data);
  const { ok, total } = reqStats(template, data.values);
  const rel = relFecha(data.fecha, lista);
  return (
    <Flex align="center" gap="3" bg="bg.muted" borderLeft="3px solid" borderColor={overdue ? "red.400" : lista ? "brandGreen.500" : meta.color} borderRadius="md" px="3.5" py="2.5" cursor="pointer" onClick={onOpen} _hover={{ bg: "bg.elevated" }} opacity={lista ? 0.85 : 1}>
      <Box w="8px" h="8px" borderRadius="full" bg={lista ? "#22c55e" : meta.color} flexShrink="0" />
      <Text fontWeight="700" fontSize="sm" minW="90px">{meta.label}</Text>
      <Box flex="1" minW="0" onClick={(e) => e.stopPropagation()}>
        <AssignControl data={data} equipo={equipo} onSave={onSave} />
      </Box>
      {rel && !lista && <HStack gap="1" color={rel.tone} fontSize="xs" flexShrink="0"><Clock size={11} /><Text>{rel.text}</Text></HStack>}
      {lista ? <ListaBadge /> : total > 0 && (
        <Text fontSize="xs" color={overdue ? "red.300" : "fg.subtle"} flexShrink="0" fontWeight="600">{ok}/{total} req.</Text>
      )}
      <Box color="fg.subtle" flexShrink="0"><ChevronRight size={18} /></Box>
    </Flex>
  );
};

// ── Panel de la entrega recibida de la etapa anterior (handoff) ──
const RecibidoPanel = ({ prev }: { prev: { label: string; data: StageData; template?: StageTemplate } }) => {
  const [open, setOpen] = useState(true);
  const campos = (prev.template?.fields ?? []).filter((f) => isFilled(f, prev.data.values?.[f.key]));
  if (campos.length === 0) return null;
  return (
    <Box bg="rgba(34,211,238,0.05)" border="1px solid" borderColor="rgba(34,211,238,0.2)" borderRadius="md" p="3">
      <Flex justify="space-between" align="center" cursor="pointer" onClick={() => setOpen((v) => !v)}>
        <HStack gap="1.5" color="brand.primary"><Inbox size={13} /><Text fontSize="xs" fontWeight="700" textTransform="uppercase">Recibido de {prev.label}</Text></HStack>
        <ChevronDown size={14} color="var(--chakra-colors-fg-subtle)" style={{ transform: open ? "none" : "rotate(-90deg)", transition: "transform .15s" }} />
      </Flex>
      {open && (
        <VStack align="stretch" gap="2.5" mt="2.5">
          {campos.map((f) => <FieldRead key={f.key} field={f} value={prev.data.values?.[f.key]} />)}
        </VStack>
      )}
    </Box>
  );
};

// ── Etapa expandida (activa / abierta) ──
const StageExpanded = ({ meta, data, equipo, template, prev, onSave, onCollapse }: {
  meta: { key: Stage; label: string; color: string };
  data: StageData; equipo: Miembro[]; template?: StageTemplate;
  prev?: { label: string; data: StageData; template?: StageTemplate } | null;
  onSave: (d: Partial<StageData>) => Promise<void>; onCollapse: () => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [showPlanilla, setShowPlanilla] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [fecha, setFecha] = useState(data.fecha);
  const [estado, setEstado] = useState<Estado>(data.estado);
  const [subtareas, setSubtareas] = useState<Subtarea[]>(data.subtareas ?? []);
  const [values, setValues] = useState<Record<string, FieldValue>>(data.values ?? {});
  const [nuevaSub, setNuevaSub] = useState("");
  const [quick, setQuick] = useState("");
  const [gate, setGate] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [marking, setMarking] = useState(false);
  const [discardOffer, setDiscardOffer] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);

  const lista = estaLista(data);
  const rel = relFecha(data.fecha, lista);
  const fields = template?.fields ?? [];
  const { req, ok: reqOk, total: reqTotal } = reqStats(template, data.values);
  const faltan = reqTotal - reqOk;
  const subHechas = (data.subtareas ?? []).filter((s) => s.hecha).length;
  const subAbiertas = (data.subtareas ?? []).filter((s) => !s.hecha).length;
  const filledOpt = fields.filter((f) => !f.required && isFilled(f, data.values?.[f.key]));
  const hayEntrega = reqOk > 0 || filledOpt.length > 0;
  const entrega = siguienteLabel(meta.key);
  const historial = data.historial ?? [];

  const startEdit = () => {
    setFecha(data.fecha); setEstado(data.estado); setSubtareas(data.subtareas ?? []); setValues(data.values ?? {}); setGate(null);
    setEditing(true);
  };
  const setField = (key: string, v: FieldValue) => setValues((p) => ({ ...p, [key]: v }));
  const upload = async (file: File): Promise<FileValue | null> => {
    try { const r = await uploadProduccionArchivo(file); return { archivoKey: r.archivoKey, archivoNombre: r.archivoNombre }; }
    catch { return null; }
  };

  const save = async () => {
    setSaving(true); setGate(null);
    try { await onSave({ fecha, estado, subtareas, values }); setEditing(false); }
    catch (e) {
      if (e instanceof ApiError && e.status === 400 && Array.isArray(e.body?.faltantes)) setGate(e.body.faltantes);
      else setGate(["No se pudo guardar. Intenta de nuevo."]);
    } finally { setSaving(false); }
  };

  const markReady = async () => {
    setMarking(true); setGate(null);
    try {
      await onSave({ estado: "aprobada" });
      if (subAbiertas > 0) setDiscardOffer(true); // ofrecer descartar sub-tareas abiertas
    } catch (e) {
      if (e instanceof ApiError && e.status === 400 && Array.isArray(e.body?.faltantes)) setGate(e.body.faltantes);
    } finally { setMarking(false); }
  };
  const descartarAbiertas = () => { onSave({ subtareas: (data.subtareas ?? []).filter((s) => s.hecha) }).catch(() => {}); setDiscardOffer(false); };
  const reopen = () => { setConfirmReopen(false); onSave({ estado: "en_progreso" }).catch(() => {}); };

  const toggleSub = (id: string) => onSave({ subtareas: (data.subtareas ?? []).map((s) => (s.id === id ? { ...s, hecha: !s.hecha } : s)) }).catch(() => {});
  const addQuick = () => {
    if (!quick.trim()) return;
    onSave({ subtareas: [...(data.subtareas ?? []), { id: uid(), texto: quick.trim(), hecha: false }] }).catch(() => {});
    setQuick("");
  };
  const removeSub = (id: string) => onSave({ subtareas: (data.subtareas ?? []).filter((s) => s.id !== id) }).catch(() => {});

  return (
    <Box borderLeft="3px solid" borderColor={lista ? "brandGreen.500" : meta.color} bg="bg.muted" borderRadius="md" p="4" boxShadow={lista ? undefined : "0 0 0 1px rgba(34,211,238,0.12)"}>
      {/* Header */}
      <Flex justify="space-between" align="center" gap="2" wrap="wrap">
        <HStack gap="2" minW="0" flexWrap="wrap">
          <Box cursor="pointer" onClick={onCollapse} display="inline-flex"><ChevronDown size={16} color="var(--chakra-colors-fg-subtle)" /></Box>
          <Box w="10px" h="10px" borderRadius="full" bg={lista ? "#22c55e" : meta.color} />
          <Heading size="sm" fontWeight="900" cursor="pointer" onClick={onCollapse}>{meta.label}</Heading>
          {lista ? <ListaBadge /> : <EstadoControl data={data} onSave={onSave} />}
          {rel ? (
            <HStack gap="1" color={rel.tone} fontSize="xs"><Clock size={12} /><Text fontWeight="600">{rel.text}</Text></HStack>
          ) : !lista && (
            <Button size="xs" variant="ghost" color="fg.subtle" onClick={startEdit} _hover={{ color: "brand.primary" }} px="1"><CalendarPlus size={12} style={{ marginRight: "3px" }} />Sin fecha</Button>
          )}
        </HStack>
        <HStack gap="1">
          {historial.length > 0 && (
            <IconButton aria-label="Historial" size="xs" variant="ghost" color={showHist ? "brand.primary" : "fg.subtle"} onClick={() => setShowHist((v) => !v)} _hover={{ color: "brand.primary" }}><History size={15} /></IconButton>
          )}
          {!editing && (
            <Button size="xs" variant="ghost" color="fg.muted" onClick={startEdit} _hover={{ color: "brand.primary" }}>
              <Pencil size={13} style={{ marginRight: "4px" }} />{hayEntrega ? "Editar planilla" : "Llenar planilla"}
            </Button>
          )}
        </HStack>
      </Flex>

      {!editing ? (
        <VStack align="stretch" gap="3" mt="3">
          {/* Entrega recibida de la etapa anterior (handoff, en lectura) */}
          {prev && <RecibidoPanel prev={prev} />}

          {/* Responsable + Entrega a */}
          <HStack gap="6" flexWrap="wrap" align="center">
            <HStack gap="2" align="center">
              <Text fontSize="xs" color="fg.subtle" minW="72px">Responsable</Text>
              <AssignControl data={data} equipo={equipo} onSave={onSave} />
            </HStack>
            {entrega && (
              <HStack gap="1.5" color="fg.subtle" fontSize="xs">
                <Text>Entrega a</Text><ArrowRight size={12} /><Text color="fg.muted" fontWeight="700">{entrega}</Text>
              </HStack>
            )}
          </HStack>

          {/* Requisitos (bloquean el Done) */}
          {reqTotal > 0 && (
            <Box>
              <Flex justify="space-between" align="center" mb="1.5">
                <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase">Requisitos</Text>
                <Text fontSize="xs" fontWeight="700" color={reqOk === reqTotal ? "brandGreen.400" : "fg.subtle"}>{reqOk}/{reqTotal}</Text>
              </Flex>
              <Box h="6px" bg="bg.elevated" borderRadius="full" overflow="hidden" mb="2">
                <Box h="full" w={`${reqTotal ? Math.round((reqOk / reqTotal) * 100) : 0}%`} bg="brandGreen.500" borderRadius="full" transition="width .25s" />
              </Box>
              <VStack align="stretch" gap="1">
                {req.map((f) => {
                  const done = isFilled(f, data.values?.[f.key]);
                  return (
                    <HStack key={f.key} gap="2" fontSize="xs" cursor="pointer" onClick={startEdit}>
                      {done ? <CheckCircle2 size={14} color="#22c55e" /> : <Circle size={14} color="var(--chakra-colors-fg-subtle)" />}
                      <Text color={done ? "fg.subtle" : "fg.muted"}>{f.label}</Text>
                    </HStack>
                  );
                })}
              </VStack>
            </Box>
          )}

          {/* Planilla completa (incluye campos opcionales llenos) */}
          {fields.length > 0 && (
            <Box>
              <Button size="xs" variant="ghost" disabled={!hayEntrega} color={showPlanilla ? "brand.primary" : "fg.subtle"} onClick={() => setShowPlanilla((v) => !v)} px="0" _hover={{ color: "brand.primary" }} opacity={hayEntrega ? 1 : 0.4}>
                <Eye size={13} style={{ marginRight: "4px" }} /> {hayEntrega ? (showPlanilla ? "Ocultar entrega" : "Ver entrega") : "Sin entrega aún"}
              </Button>
              {showPlanilla && hayEntrega && (
                <VStack align="stretch" gap="2.5" bg="bg.canvas" borderRadius="md" p="3" mt="1">
                  {fields.map((f) => <FieldRead key={f.key} field={f} value={data.values?.[f.key]} />)}
                </VStack>
              )}
            </Box>
          )}

          {/* Sub-tareas (personales; solo si hay responsable) */}
          {(data.responsableId || (data.subtareas ?? []).length > 0) && (
            <Box>
              <Flex justify="space-between" align="center" mb="1">
                <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase">Sub-tareas <Text as="span" color="fg.subtle" fontWeight="500" textTransform="none">(opcionales)</Text></Text>
                {(data.subtareas ?? []).length > 0 && <HStack gap="1" color="fg.subtle" fontSize="xs"><ListChecks size={12} /><Text>{subHechas}/{data.subtareas.length}</Text></HStack>}
              </Flex>
              <VStack align="stretch" gap="1">
                {(data.subtareas ?? []).map((s) => (
                  <HStack key={s.id} gap="2">
                    <Checkbox.Root checked={s.hecha} onCheckedChange={() => toggleSub(s.id)} size="sm">
                      <Checkbox.HiddenInput /><Checkbox.Control />
                      <Checkbox.Label fontSize="xs" color={s.hecha ? "fg.subtle" : "fg.muted"} textDecoration={s.hecha ? "line-through" : "none"}>{s.texto}</Checkbox.Label>
                    </Checkbox.Root>
                    <IconButton aria-label="Quitar" size="xs" variant="ghost" color="fg.subtle" ml="auto" onClick={() => removeSub(s.id)} _hover={{ color: "red.400" }}><X size={11} /></IconButton>
                  </HStack>
                ))}
                {data.responsableId && (
                  <HStack gap="1">
                    <Input size="xs" placeholder="+ agregar sub-tarea" value={quick} onChange={(e) => setQuick(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addQuick(); } }} bg="bg.canvas" border="1px solid" borderColor="border.subtle" borderRadius="md" color="fg.default" px="2.5" _focusVisible={{ borderColor: "brand.primary", outline: "none" }} />
                    <IconButton aria-label="Agregar" size="xs" variant="ghost" color="brand.primary" onClick={addQuick}><Plus size={15} /></IconButton>
                  </HStack>
                )}
              </VStack>
            </Box>
          )}

          {showHist && historial.length > 0 && (
            <VStack align="stretch" gap="1" bg="bg.canvas" borderRadius="md" p="3">
              {historial.slice().reverse().map((h, i) => (
                <HStack key={i} gap="2" fontSize="0.7rem" color="fg.subtle" flexWrap="wrap">
                  <History size={11} />
                  <Text color="fg.muted">{estadoMeta(h.de).label} → {estadoMeta(h.a).label}</Text>
                  <Text>· {h.porNombre}</Text>
                  <Text>· {new Date(h.cuando).toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Text>
                </HStack>
              ))}
            </VStack>
          )}

          {gate && (
            <Box bg="rgba(239,68,68,0.1)" border="1px solid" borderColor="rgba(239,68,68,0.4)" borderRadius="md" p="2.5">
              <Text fontSize="xs" color="fg.muted"><AlertTriangle size={13} style={{ display: "inline", marginRight: 4, color: "#fca5a5" }} />Faltan requisitos: {gate.join(", ")}.</Text>
            </Box>
          )}

          {/* Oferta de descartar sub-tareas abiertas al aprobar */}
          {discardOffer && lista && subAbiertas > 0 && (
            <Box bg="bg.canvas" border="1px solid" borderColor="border.subtle" borderRadius="md" p="2.5">
              <Flex justify="space-between" align="center" gap="2" flexWrap="wrap">
                <Text fontSize="xs" color="fg.muted">Quedaron {subAbiertas} sub-tarea{subAbiertas > 1 ? "s" : ""} sin marcar.</Text>
                <HStack gap="1">
                  <Button size="xs" variant="ghost" color="fg.subtle" onClick={() => setDiscardOffer(false)}>Dejarlas</Button>
                  <Button size="xs" variant="outline" borderColor="border.subtle" color="red.300" onClick={descartarAbiertas} _hover={{ borderColor: "red.400" }}>Descartarlas</Button>
                </HStack>
              </Flex>
            </Box>
          )}

          {/* Acción principal */}
          <Flex justify="end" align="center" gap="3" pt="1">
            {lista ? (
              confirmReopen ? (
                <HStack gap="2">
                  <Text fontSize="xs" color="fg.muted">¿Reabrir? Invalida el handoff.</Text>
                  <Button size="xs" variant="ghost" color="fg.subtle" onClick={() => setConfirmReopen(false)}>No</Button>
                  <Button size="xs" variant="outline" borderColor="rgba(245,158,11,0.4)" color="neon.amber" onClick={reopen} _hover={{ borderColor: "neon.amber" }}><RotateCcw size={12} style={{ marginRight: "4px" }} />Sí, reabrir</Button>
                </HStack>
              ) : (
                <Button size="sm" variant="ghost" color="fg.subtle" onClick={() => setConfirmReopen(true)} _hover={{ color: "neon.amber" }}><RotateCcw size={14} style={{ marginRight: "5px" }} />Reabrir etapa</Button>
              )
            ) : (
              <>
                {faltan > 0 && <Text fontSize="xs" color="fg.subtle">faltan {faltan} requisito{faltan > 1 ? "s" : ""}</Text>}
                {faltan > 0 ? (
                  <Button size="sm" disabled borderRadius="lg" bg="bg.elevated" color="fg.muted" fontWeight="700" opacity={0.4} cursor="not-allowed" _hover={{}} _disabled={{ opacity: 0.4 }}>
                    <Check size={15} style={{ marginRight: "5px" }} /> Marcar lista
                  </Button>
                ) : (
                  <Button size="sm" loading={marking} borderRadius="lg" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #22c55e 0%, #22d3ee 100%)" onClick={markReady} _hover={{ opacity: 0.92 }}>
                    <Check size={15} style={{ marginRight: "5px" }} /> Marcar lista
                  </Button>
                )}
              </>
            )}
          </Flex>
        </VStack>
      ) : (
        <VStack align="stretch" gap="3" mt="3">
          <HStack gap="2" flexWrap="wrap">
            <Box>
              <Text fontSize="0.6rem" color="fg.subtle" mb="0.5" textTransform="uppercase">Fecha límite</Text>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} {...fp} maxW="160px" />
            </Box>
            <Box minW="150px">
              <Text fontSize="0.6rem" color="fg.subtle" mb="0.5" textTransform="uppercase">Estado</Text>
              <NativeSelect.Root size="sm">
                <NativeSelect.Field value={estado} onChange={(e) => setEstado(e.target.value as Estado)} {...fp}>
                  {ESTADOS.map((s) => <option key={s.key} value={s.key} style={{ background: "#161626" }}>{s.label}</option>)}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>
          </HStack>

          {fields.length > 0 && (
            <VStack align="stretch" gap="3" bg="bg.canvas" borderRadius="md" p="3">
              <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase">Planilla de entrega{entrega ? ` — para ${entrega}` : ""}</Text>
              {fields.map((f) => (
                <FieldInput key={f.key} field={f} value={values[f.key]} onChange={(v) => setField(f.key, v)} onUpload={upload} />
              ))}
            </VStack>
          )}

          <Box bg="bg.canvas" borderRadius="md" p="2.5">
            <Flex justify="space-between" align="center" mb="1">
              <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase">Sub-tareas</Text>
              {subtareas.length === 0 && (
                <Button size="xs" variant="plain" color="brand.primary" onClick={() => setSubtareas(PLANTILLAS_SUB[meta.key].map((t) => ({ id: uid(), texto: t, hecha: false })))}>Usar plantilla</Button>
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

          {gate && (
            <Box bg="rgba(239,68,68,0.1)" border="1px solid" borderColor="rgba(239,68,68,0.4)" borderRadius="md" p="3">
              <HStack gap="1.5" color="red.300" mb="1"><AlertTriangle size={14} /><Text fontSize="xs" fontWeight="700">No se puede aprobar todavía</Text></HStack>
              <Text fontSize="xs" color="fg.muted">Completa estos requisitos: {gate.join(", ")}.</Text>
            </Box>
          )}

          <HStack justify="end" gap="1">
            <Button size="xs" variant="ghost" color="fg.subtle" onClick={() => { setEditing(false); setGate(null); }}><X size={14} style={{ marginRight: "4px" }} />Cancelar</Button>
            <Button size="xs" loading={saving} borderRadius="md" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)" onClick={save}><Check size={14} style={{ marginRight: "4px" }} />Guardar</Button>
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

export const ProduccionBoard = ({ openEpisodeId }: { openEpisodeId?: string } = {}) => {
  const [items, setItems] = useState<ProduccionItem[] | null>(null);
  const [equipo, setEquipo] = useState<Miembro[]>([]);
  const [plantillas, setPlantillas] = useState<Plantillas | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Stage | null>(null);
  const [titulo, setTitulo] = useState("");
  const [idea, setIdea] = useState("");
  const [saving, setSaving] = useState(false);
  const openedRef = useRef(false);

  useEffect(() => {
    listProduccion().then(setItems).catch(() => setItems([]));
    getEquipo().then(setEquipo).catch(() => setEquipo([]));
    getPlantillas().then(setPlantillas).catch(() => setPlantillas(null));
  }, []);

  // Deep-link: abre automáticamente el episodio indicado (una sola vez).
  useEffect(() => {
    if (openedRef.current || !openEpisodeId || !items) return;
    if (items.some((i) => i.id === openEpisodeId)) { setSelected(openEpisodeId); openedRef.current = true; }
  }, [openEpisodeId, items]);

  // Al abrir un episodio, expandir su etapa activa.
  useEffect(() => {
    if (selected === null) { setExpanded(null); return; }
    const it = items?.find((i) => i.id === selected);
    if (it) setExpanded(etapaActual(it).key as Stage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Refresco automático de la lista (no mientras se ve/edita un detalle).
  useEffect(() => {
    if (selected !== null) return;
    const id = setInterval(() => { listProduccion().then(setItems).catch(() => {}); }, 20000);
    return () => clearInterval(id);
  }, [selected]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSaving(true);
    try { const it = await createProduccion({ titulo, idea }); setItems((p) => [...(p ?? []), it]); setTitulo(""); setIdea(""); setSelected(it.id); }
    catch { /* noop */ } finally { setSaving(false); }
  };
  // Propaga el error (para que la etapa muestre el gate de Definición de Hecho).
  const stageSave = async (id: string, stage: Stage, data: Partial<StageData>) => {
    const updated = await updateStage(id, stage, data);
    setItems((p) => (p ?? []).map((i) => (i.id === id ? updated : i)));
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
        <VStack align="stretch" gap="2">
          {STAGES.map((meta, i) => (
            expanded === meta.key ? (
              <StageExpanded key={meta.key} meta={meta} data={current.stages[meta.key]} equipo={equipo} template={plantillas?.[meta.key]}
                prev={i > 0 ? { label: STAGES[i - 1].label, data: current.stages[STAGES[i - 1].key], template: plantillas?.[STAGES[i - 1].key] } : null}
                onSave={(d) => stageSave(current.id, meta.key, d)} onCollapse={() => setExpanded(null)} />
            ) : (
              <StageCollapsed key={meta.key} meta={meta} data={current.stages[meta.key]} equipo={equipo} template={plantillas?.[meta.key]}
                onOpen={() => setExpanded(meta.key)} onSave={(d) => stageSave(current.id, meta.key, d)} />
            )
          ))}
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap="6">
      <VStack align="start" gap="1">
        <Heading size="lg" fontWeight="800">Pipeline de producción</Heading>
        <Text color="fg.muted" fontSize="sm">Cada episodio es una card: entra para ver su desarrollo, responsables, sub-tareas y planillas por etapa.</Text>
      </VStack>

      <GlassPanel p={{ base: "4", md: "5" }}>
        <VStack as="form" onSubmit={add} align="stretch" gap="3">
          <Input placeholder="Título del episodio" value={titulo} onChange={(e) => setTitulo(e.target.value)} {...fp} size="md" />
          <Textarea placeholder="La idea / brief inicial (queda como el tema de la etapa Idea)" value={idea} onChange={(e) => setIdea(e.target.value)} {...fp} size="md" rows={2} py="2" />
          <Button type="submit" loading={saving} alignSelf="start" px="6" size="md" borderRadius="lg" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)" _hover={{ opacity: 0.92 }}>
            <Plus size={16} style={{ marginRight: "6px" }} /> Crear episodio
          </Button>
        </VStack>
      </GlassPanel>

      {items === null ? (
        <Center py="10"><Spinner color="brand.primary" size="lg" /></Center>
      ) : (items ?? []).length === 0 ? (
        <Text color="fg.subtle" fontSize="sm">Aún no hay episodios en producción. Crea el primero.</Text>
      ) : (
        <VStack align="stretch" gap="3">
          {(items ?? []).map((it) => (
            <EpisodeSummary key={it.id} item={it} onOpen={() => setSelected(it.id)} onDelete={() => remove(it.id)} />
          ))}
        </VStack>
      )}
    </VStack>
  );
};
