import { useState, type FormEvent } from "react";
import { Box, Button, Text, Textarea, VStack } from "@chakra-ui/react";
import { Send, MessageCircleQuestion } from "lucide-react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { GlassPanel } from "../atoms/GlassPanel";
import { createPregunta } from "../services/preguntas";

export const BuzonSection = () => {
  const [contenido, setContenido] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contenido.trim()) return;
    setError(null);
    setSending(true);
    try {
      await createPregunta(contenido.trim());
      setContenido("");
      setDone(true);
    } catch {
      setError("No se pudo enviar. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Section id="buzon">
      <VStack gap="8" w="full">
        <SectionTitle
          eyebrow="Buzón"
          title="¿Tienes una pregunta o idea?"
          subtitle="Mándame tu pregunta, o el lugar que querés que vaya a probar. La leo y puede terminar en un contenido."
        />

        <GlassPanel p={{ base: "6", md: "8" }} w="full" maxW="2xl" mx="auto">
          {done ? (
            <VStack gap="3" py="4" textAlign="center">
              <Box color="brand.primary"><MessageCircleQuestion size={40} /></Box>
              <Text fontWeight="700" fontSize="lg">¡Gracias! Recibimos tu mensaje.</Text>
              <Button variant="plain" color="brand.primary" onClick={() => setDone(false)}>
                Enviar otra
              </Button>
            </VStack>
          ) : (
            <VStack as="form" onSubmit={submit} align="stretch" gap="4">
              <Textarea
                placeholder="Escribe tu pregunta, una idea o el lugar que querés que reseñe…"
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                rows={4}
                bg="bg.muted"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="xl"
                color="fg.default"
                px="4"
                py="3"
                _hover={{ borderColor: "border.brand" }}
                _focusVisible={{ borderColor: "brand.primary", boxShadow: "0 0 0 1px #12b76a", outline: "none" }}
                required
              />
              {error && <Text color="red.400" fontSize="sm">{error}</Text>}
              <Button
                type="submit"
                loading={sending}
                alignSelf="center"
                size="lg"
                px="8"
                borderRadius="full"
                border="none"
                color="fg.inverted"
                fontWeight="700"
                backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
                _hover={{ opacity: 0.92, boxShadow: "brand" }}
              >
                <Send size={18} style={{ marginRight: "8px" }} />
                Enviar
              </Button>
            </VStack>
          )}
        </GlassPanel>
      </VStack>
    </Section>
  );
};
