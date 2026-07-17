import { useEffect, useState } from "react";
import { Box, Center, Flex, Heading, HStack, IconButton, Spinner, Text, VStack } from "@chakra-ui/react";
import { Check, Trash2, Inbox, MessageCircleQuestion } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { listPreguntas, setPreguntaAnswered, deletePregunta, type Pregunta } from "../services/preguntas";

export const QuestionsPanel = () => {
  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null);

  useEffect(() => { listPreguntas().then(setPreguntas).catch(() => setPreguntas([])); }, []);

  const toggle = async (p: Pregunta) => {
    const answered = !p.answered;
    await setPreguntaAnswered(p.id, answered).catch(() => {});
    setPreguntas((prev) => prev?.map((x) => (x.id === p.id ? { ...x, answered } : x)) ?? null);
  };
  const remove = async (id: string) => {
    await deletePregunta(id).catch(() => {});
    setPreguntas((prev) => prev?.filter((x) => x.id !== id) ?? null);
  };

  return (
    <VStack align="stretch" gap="6">
      <VStack align="start" gap="2">
        <HStack gap="2" color="brand.secondary">
          <Inbox size={16} />
          <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase">
            Buzón del público
          </Text>
        </HStack>
        <Heading as="h2" size={{ base: "xl", md: "2xl" }} fontWeight="800">
          Preguntas e ideas recibidas
        </Heading>
      </VStack>

      {preguntas === null ? (
        <Center py="8"><Spinner color="brand.primary" /></Center>
      ) : preguntas.length === 0 ? (
        <GlassPanel p="8">
          <VStack gap="2" color="fg.subtle">
            <MessageCircleQuestion size={32} />
            <Text fontSize="sm">Aún no hay preguntas del público.</Text>
          </VStack>
        </GlassPanel>
      ) : (
        <VStack align="stretch" gap="3">
          {preguntas.map((p) => (
            <GlassPanel key={p.id} p="4" opacity={p.answered ? 0.6 : 1}>
              <Flex justify="space-between" gap="3">
                <Box minW="0">
                  <Text fontSize="sm" whiteSpace="pre-wrap" textDecoration={p.answered ? "line-through" : "none"}>
                    {p.contenido}
                  </Text>
                  {p.fromName && (
                    <Text fontSize="0.65rem" color="fg.subtle" mt="1.5">— {p.fromName}</Text>
                  )}
                </Box>
                <HStack gap="1" flexShrink="0">
                  <IconButton aria-label="Marcar" size="xs" variant="ghost" color={p.answered ? "brand.primary" : "fg.subtle"} onClick={() => toggle(p)} _hover={{ color: "brand.primary" }}>
                    <Check size={16} />
                  </IconButton>
                  <IconButton aria-label="Eliminar" size="xs" variant="ghost" color="fg.subtle" onClick={() => remove(p.id)} _hover={{ color: "red.400", bg: "rgba(239,68,68,0.1)" }}>
                    <Trash2 size={15} />
                  </IconButton>
                </HStack>
              </Flex>
            </GlassPanel>
          ))}
        </VStack>
      )}
    </VStack>
  );
};
