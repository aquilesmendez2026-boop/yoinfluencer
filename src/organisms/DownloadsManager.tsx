import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Box, Button, Center, Flex, Grid, Heading, HStack, IconButton, Input, NativeSelect, Spinner, Text, VStack,
} from "@chakra-ui/react";
import { Trash2, Upload, FileUp } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { listDescargas, uploadDescarga, deleteDescarga, type Descarga, type DownloadType } from "../services/descargas";

const TYPES: DownloadType[] = ["audio", "pdf", "wallpaper", "video", "otro"];
const typeLabel: Record<DownloadType, string> = { audio: "Audio", pdf: "PDF", wallpaper: "Wallpaper", video: "Video", otro: "Archivo" };

const humanSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const fp = {
  bg: "bg.muted", border: "1px solid", borderColor: "border.subtle", borderRadius: "lg",
  color: "fg.default", size: "md" as const, px: "3",
  _hover: { borderColor: "border.neon" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #22d3ee", outline: "none" },
};

export const DownloadsManager = () => {
  const [descargas, setDescargas] = useState<Descarga[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DownloadType>("audio");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { listDescargas().then(setDescargas).catch(() => setDescargas([])); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Selecciona un archivo."); return; }
    setError(null);
    setUploading(true);
    try {
      const d = await uploadDescarga(file, { title: title || file.name, type, size: humanSize(file.size) });
      setDescargas((p) => [d, ...(p ?? [])]);
      setFile(null); setTitle("");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setError("No se pudo subir el archivo.");
    } finally { setUploading(false); }
  };

  const remove = async (id: string) => {
    await deleteDescarga(id).catch(() => {});
    setDescargas((p) => (p ?? []).filter((d) => d.id !== id));
  };

  return (
    <VStack align="stretch" gap="6">
      <Heading size="lg" fontWeight="800">Descargas de la zona miembros</Heading>

      <Grid templateColumns={{ base: "1fr", lg: "380px 1fr" }} gap="6" alignItems="start">
        <GlassPanel p={{ base: "5", md: "6" }}>
          <Heading size="sm" mb="4">Subir archivo</Heading>
          <VStack as="form" onSubmit={submit} align="stretch" gap="3">
            <Button type="button" onClick={() => fileRef.current?.click()} variant="outline" borderColor="border.subtle" borderRadius="lg" justifyContent="start" color="fg.default" _hover={{ borderColor: "border.neon" }}>
              <FileUp size={16} style={{ marginRight: "8px" }} />
              {file ? `${file.name} (${humanSize(file.size)})` : "Elegir archivo…"}
            </Button>
            <input ref={fileRef} type="file" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Input placeholder="Título (opcional; usa el nombre del archivo)" value={title} onChange={(e) => setTitle(e.target.value)} {...fp} />
            <NativeSelect.Root size="md">
              <NativeSelect.Field value={type} onChange={(e) => setType(e.target.value as DownloadType)} {...fp}>
                {TYPES.map((t) => <option key={t} value={t} style={{ background: "#161626" }}>{typeLabel[t]}</option>)}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            {error && <Text color="red.400" fontSize="sm">{error}</Text>}
            <Button type="submit" loading={uploading} borderRadius="lg" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)" _hover={{ opacity: 0.92 }}>
              <Upload size={16} style={{ marginRight: "6px" }} /> Subir
            </Button>
          </VStack>
        </GlassPanel>

        <GlassPanel p={{ base: "4", md: "5" }}>
          {descargas === null ? (
            <Center py="8"><Spinner color="brand.primary" /></Center>
          ) : descargas.length === 0 ? (
            <Text color="fg.subtle" fontSize="sm">No hay archivos todavía.</Text>
          ) : (
            <VStack align="stretch" gap="2">
              {descargas.map((d) => (
                <Flex key={d.id} justify="space-between" align="center" gap="3" p="3" borderRadius="lg" bg="bg.muted">
                  <HStack gap="3" minW="0">
                    <Box color="brand.primary" fontSize="xs" fontWeight="700" textTransform="uppercase" flexShrink="0">{typeLabel[d.type]}</Box>
                    <VStack align="start" gap="0" minW="0">
                      <Text fontWeight="600" fontSize="sm" lineClamp={1}>{d.title}</Text>
                      {d.size && <Text fontSize="xs" color="fg.subtle">{d.size}</Text>}
                    </VStack>
                  </HStack>
                  <IconButton aria-label="Eliminar" size="xs" variant="ghost" color="fg.subtle" onClick={() => remove(d.id)} _hover={{ color: "red.400", bg: "rgba(239,68,68,0.1)" }} flexShrink="0"><Trash2 size={15} /></IconButton>
                </Flex>
              ))}
            </VStack>
          )}
        </GlassPanel>
      </Grid>
    </VStack>
  );
};
