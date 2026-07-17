import { useEffect, useState, type FormEvent } from "react";
import {
  Badge, Box, Button, Center, Flex, Heading, HStack, IconButton, Input, Spinner, Text, Textarea, VStack,
} from "@chakra-ui/react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, User as UserIcon, Calendar, Check, X } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import {
  listProduccion, createProduccion, updateProduccion, deleteProduccion,
  STAGES, type ProduccionItem, type Stage,
} from "../services/produccion";

const fp = {
  bg: "bg.muted", border: "1px solid", borderColor: "border.subtle", borderRadius: "lg",
  color: "fg.default", size: "sm" as const, px: "3",
  _hover: { borderColor: "border.neon" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #22d3ee", outline: "none" },
};
const stageIdx = (s: Stage) => STAGES.findIndex((x) => x.key === s);

const ProdCard = ({
  item, onMove, onSave, onDelete,
}: {
  item: ProduccionItem;
  onMove: (id: string, stage: Stage) => void;
  onSave: (id: string, data: Partial<ProduccionItem>) => void;
  onDelete: (id: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [titulo, setTitulo] = useState(item.titulo);
  const [responsable, setResponsable] = useState(item.responsable ?? "");
  const [fecha, setFecha] = useState(item.fecha ?? "");
  const [descripcion, setDescripcion] = useState(item.descripcion ?? "");
  const idx = stageIdx(item.stage);

  if (editing) {
    return (
      <GlassPanel p="3">
        <VStack align="stretch" gap="2">
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} {...fp} placeholder="Título" />
          <Input value={responsable} onChange={(e) => setResponsable(e.target.value)} {...fp} placeholder="Responsable" />
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} {...fp} />
          <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} {...fp} rows={2} py="1.5" placeholder="Notas" />
          <HStack justify="end" gap="1">
            <IconButton aria-label="Cancelar" size="xs" variant="ghost" color="fg.subtle" onClick={() => setEditing(false)}><X size={15} /></IconButton>
            <IconButton aria-label="Guardar" size="xs" variant="ghost" color="brand.primary" onClick={() => { onSave(item.id, { titulo, responsable, fecha, descripcion }); setEditing(false); }}><Check size={16} /></IconButton>
          </HStack>
        </VStack>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel p="3">
      <VStack align="stretch" gap="2">
        <Text fontWeight="700" fontSize="sm" lineHeight="short">{item.titulo}</Text>
        {(item.responsable || item.fecha) && (
          <HStack gap="2" flexWrap="wrap">
            {item.responsable && (
              <Badge bg="bg.elevated" color="fg.muted" borderRadius="full" px="2" fontSize="0.6rem">
                <HStack gap="1"><UserIcon size={10} /><Text>{item.responsable}</Text></HStack>
              </Badge>
            )}
            {item.fecha && (
              <HStack gap="1" color="fg.subtle" fontSize="0.65rem"><Calendar size={11} /><Text>{item.fecha}</Text></HStack>
            )}
          </HStack>
        )}
        {item.descripcion && <Text fontSize="xs" color="fg.muted" lineClamp={3}>{item.descripcion}</Text>}
        <Flex justify="space-between" align="center" pt="1">
          <HStack gap="0.5">
            <IconButton aria-label="Atrás" size="xs" variant="ghost" color="fg.subtle" disabled={idx <= 0} onClick={() => onMove(item.id, STAGES[idx - 1].key)} _hover={{ color: "brand.primary" }}><ChevronLeft size={16} /></IconButton>
            <IconButton aria-label="Avanzar" size="xs" variant="ghost" color="fg.subtle" disabled={idx >= STAGES.length - 1} onClick={() => onMove(item.id, STAGES[idx + 1].key)} _hover={{ color: "brand.primary" }}><ChevronRight size={16} /></IconButton>
          </HStack>
          <HStack gap="0.5">
            <IconButton aria-label="Editar" size="xs" variant="ghost" color="fg.subtle" onClick={() => setEditing(true)} _hover={{ color: "brand.primary" }}><Pencil size={13} /></IconButton>
            <IconButton aria-label="Eliminar" size="xs" variant="ghost" color="fg.subtle" onClick={() => onDelete(item.id)} _hover={{ color: "red.400", bg: "rgba(239,68,68,0.1)" }}><Trash2 size={13} /></IconButton>
          </HStack>
        </Flex>
      </VStack>
    </GlassPanel>
  );
};

export const ProduccionBoard = () => {
  const [items, setItems] = useState<ProduccionItem[] | null>(null);
  const [titulo, setTitulo] = useState("");
  const [responsable, setResponsable] = useState("");
  const [fecha, setFecha] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { listProduccion().then(setItems).catch(() => setItems([])); }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSaving(true);
    try {
      const it = await createProduccion({ titulo, responsable, fecha });
      setItems((p) => [...(p ?? []), it]);
      setTitulo(""); setResponsable(""); setFecha("");
    } catch { /* noop */ } finally { setSaving(false); }
  };

  const move = async (id: string, stage: Stage) => {
    setItems((p) => (p ?? []).map((i) => (i.id === id ? { ...i, stage } : i)));
    updateProduccion(id, { stage }).catch(() => {});
  };
  const save = async (id: string, data: Partial<ProduccionItem>) => {
    setItems((p) => (p ?? []).map((i) => (i.id === id ? { ...i, ...data } : i)));
    updateProduccion(id, data).catch(() => {});
  };
  const remove = async (id: string) => {
    setItems((p) => (p ?? []).filter((i) => i.id !== id));
    deleteProduccion(id).catch(() => {});
  };

  return (
    <VStack align="stretch" gap="6">
      <VStack align="start" gap="1">
        <Heading size="lg" fontWeight="800">Pipeline de producción</Heading>
        <Text color="fg.muted" fontSize="sm">Planifica cada episodio y muévelo por las etapas hasta publicarlo.</Text>
      </VStack>

      {/* Agregar */}
      <GlassPanel p={{ base: "4", md: "5" }}>
        <Flex as="form" onSubmit={add} gap="3" direction={{ base: "column", md: "row" }} align={{ md: "end" }}>
          <Box flex="2"><Text fontSize="xs" fontWeight="700" color="fg.muted" mb="1" textTransform="uppercase">Nuevo episodio</Text><Input placeholder="Título o idea del episodio" value={titulo} onChange={(e) => setTitulo(e.target.value)} {...fp} size="md" /></Box>
          <Box flex="1"><Input placeholder="Responsable" value={responsable} onChange={(e) => setResponsable(e.target.value)} {...fp} size="md" /></Box>
          <Box flex="1"><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} {...fp} size="md" /></Box>
          <Button type="submit" loading={saving} size="md" borderRadius="lg" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)" _hover={{ opacity: 0.92 }} flexShrink="0">
            <Plus size={16} style={{ marginRight: "4px" }} /> Agregar
          </Button>
        </Flex>
      </GlassPanel>

      {/* Tablero */}
      {items === null ? (
        <Center py="10"><Spinner color="brand.primary" size="lg" /></Center>
      ) : (
        <Flex gap="4" overflowX="auto" pb="3" align="start">
          {STAGES.map((st) => {
            const col = items.filter((i) => i.stage === st.key);
            return (
              <VStack key={st.key} align="stretch" gap="3" minW="270px" w="270px" flexShrink="0">
                <HStack gap="2" px="1">
                  <Box w="9px" h="9px" borderRadius="full" bg={st.color} />
                  <Text fontWeight="800" fontSize="sm" fontFamily="heading">{st.label}</Text>
                  <Text fontSize="xs" color="fg.subtle">{col.length}</Text>
                </HStack>
                <VStack align="stretch" gap="3" bg="bg.muted" borderRadius="xl" p="2.5" minH="80px">
                  {col.length === 0 ? (
                    <Center py="4"><Text fontSize="xs" color="fg.subtle">—</Text></Center>
                  ) : (
                    col.map((it) => (
                      <ProdCard key={it.id} item={it} onMove={move} onSave={save} onDelete={remove} />
                    ))
                  )}
                </VStack>
              </VStack>
            );
          })}
        </Flex>
      )}
    </VStack>
  );
};
