import { useEffect, useState, type FormEvent } from "react";
import { AspectRatio, Box, Button, Flex, Heading, HStack, Input, Switch, Text, VStack } from "@chakra-ui/react";
import { Radio, Save } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { getLive, setLive, parseYouTubeId } from "../services/live";

const fp = {
  bg: "bg.muted", border: "1px solid", borderColor: "border.subtle", borderRadius: "lg",
  color: "fg.default", size: "md" as const, px: "3",
  _hover: { borderColor: "border.neon" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #22d3ee", outline: "none" },
};
const Lbl = ({ children }: { children: string }) => (
  <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase" mb="1">{children}</Text>
);

export const LiveManager = () => {
  const [isLive, setIsLive] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    getLive().then((l) => {
      setIsLive(l.isLive);
      setVideoUrl(l.videoId);
      setTitle(l.title);
    }).catch(() => {});
  }, []);

  const videoId = parseYouTubeId(videoUrl);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      await setLive({ isLive, videoId, title });
      setMsg("✓ Guardado");
    } catch {
      setMsg("No se pudo guardar.");
    } finally { setSaving(false); }
  };

  return (
    <VStack align="stretch" gap="6">
      <VStack align="start" gap="1">
        <Heading size="lg" fontWeight="800">Transmisión en vivo</Heading>
        <Text color="fg.muted" fontSize="sm">Activa el "en vivo" y pega la URL del video/transmisión de YouTube. Aparecerá embebido en la home.</Text>
      </VStack>

      <Flex gap="6" direction={{ base: "column", lg: "row" }} align="start">
        <GlassPanel p={{ base: "5", md: "6" }} flex="1" w="full">
          <VStack as="form" onSubmit={save} align="stretch" gap="4">
            <Flex justify="space-between" align="center" p="3" borderRadius="lg" bg={isLive ? "rgba(239,68,68,0.12)" : "bg.muted"} border="1px solid" borderColor={isLive ? "rgba(239,68,68,0.4)" : "border.subtle"}>
              <HStack gap="2" color={isLive ? "red.300" : "fg.muted"}>
                <Radio size={18} />
                <Text fontWeight="700" color="fg.default">Estamos en vivo</Text>
              </HStack>
              <Switch.Root checked={isLive} onCheckedChange={(e) => setIsLive(e.checked)} colorPalette="red">
                <Switch.HiddenInput /><Switch.Control><Switch.Thumb /></Switch.Control>
              </Switch.Root>
            </Flex>
            <Box>
              <Lbl>URL o ID del video de YouTube</Lbl>
              <Input placeholder="https://youtube.com/watch?v=… o el ID" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} {...fp} />
              {videoUrl && <Text fontSize="xs" color={videoId.length === 11 ? "brand.primary" : "amber.400"} mt="1">ID detectado: {videoId || "—"}</Text>}
            </Box>
            <Box>
              <Lbl>Título del stream</Lbl>
              <Input placeholder="Ej. Locuras en vivo — Episodio especial" value={title} onChange={(e) => setTitle(e.target.value)} {...fp} />
            </Box>
            {msg && <Text fontSize="sm" color={msg.startsWith("✓") ? "brand.primary" : "red.400"}>{msg}</Text>}
            <Button type="submit" loading={saving} borderRadius="lg" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)" _hover={{ opacity: 0.92 }}>
              <Save size={16} style={{ marginRight: "6px" }} /> Guardar
            </Button>
          </VStack>
        </GlassPanel>

        <Box flex="1" w="full">
          <Lbl>Vista previa</Lbl>
          {videoId.length === 11 ? (
            <AspectRatio ratio={16 / 9} borderRadius="xl" overflow="hidden" border="1px solid" borderColor="border.subtle">
              <iframe src={`https://www.youtube.com/embed/${videoId}`} title="preview" allowFullScreen style={{ border: 0 }} />
            </AspectRatio>
          ) : (
            <Flex h="200px" align="center" justify="center" borderRadius="xl" border="1px dashed" borderColor="border.subtle" color="fg.subtle" fontSize="sm">
              Pega una URL válida para ver la vista previa
            </Flex>
          )}
        </Box>
      </Flex>
    </VStack>
  );
};
