import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Box, Button, Container, Flex, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { Check, Crown, Sparkles } from "lucide-react";
import { AppHeader } from "../organisms/AppHeader";
import { WhiskyGlass } from "../atoms/WhiskyGlass";
import { GlassPanel } from "../atoms/GlassPanel";
import { useAuth } from "../providers/AuthProvider";
import { cancelarSuscripcion } from "../services/suscripcion";

const beneficios = [
  "Episodios exclusivos sin censura",
  "Todas las descargas premium (audios, packs, guiones)",
  "Sin anuncios en el sitio",
  "Acceso anticipado a los shows",
  "Insignia de miembro premium",
];

export const PremiumPage = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [canceling, setCanceling] = useState(false);

  const cancelar = async () => {
    setCanceling(true);
    try {
      await cancelarSuscripcion();
      await refreshProfile();
    } catch { /* noop */ } finally { setCanceling(false); }
  };

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />
      <Container maxW="720px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
        <VStack align="stretch" gap="8">
          <VStack align="start" gap="2">
            <HStack gap="2" color="amber.300">
              <Crown size={16} />
              <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase">
                Membresía
              </Text>
            </HStack>
            <Heading as="h1" size={{ base: "3xl", md: "4xl" }} fontWeight="900" letterSpacing="tighter">
              Ni Tan Mal{" "}
              <Box as="span" backgroundImage="linear-gradient(135deg, #f59e0b 0%, #d946ef 100%)" backgroundClip="text" color="transparent">
                Premium
              </Box>
            </Heading>
          </VStack>

          {profile?.plan === "premium" ? (
            <GlassPanel p={{ base: "6", md: "8" }} borderColor="rgba(245,158,11,0.4)">
              <VStack gap="4" align="start">
                <HStack gap="2" color="amber.300"><Sparkles size={22} /><Heading size="lg">¡Ya eres premium! 🎉</Heading></HStack>
                <Text color="fg.muted">Tienes acceso completo al contenido exclusivo y las descargas premium. ¡Gracias por apoyar el show!</Text>
                <Button onClick={cancelar} loading={canceling} size="sm" variant="outline" borderColor="rgba(239,68,68,0.4)" color="red.400" borderRadius="full" _hover={{ bg: "rgba(239,68,68,0.1)" }}>
                  Cancelar membresía
                </Button>
              </VStack>
            </GlassPanel>
          ) : (
            <GlassPanel p={{ base: "6", md: "8" }} borderColor="rgba(245,158,11,0.35)">
              <VStack align="stretch" gap="6">
                <Flex justify="space-between" align="end" wrap="wrap" gap="3">
                  <Box>
                    <Text color="fg.subtle" fontSize="sm">Plan mensual</Text>
                    <HStack align="baseline" gap="1">
                      <Heading size="3xl" fontWeight="900">$4.990</Heading>
                      <Text color="fg.muted">CLP / mes</Text>
                    </HStack>
                  </Box>
                  <Badge bg="rgba(245,158,11,0.15)" color="amber.300" border="1px solid" borderColor="rgba(245,158,11,0.4)" borderRadius="full" px="3" py="1">
                    <HStack gap="1"><WhiskyGlass size={13} /><Text>Premium</Text></HStack>
                  </Badge>
                </Flex>

                <VStack align="stretch" gap="3">
                  {beneficios.map((b) => (
                    <HStack key={b} gap="3">
                      <Flex align="center" justify="center" w="22px" h="22px" borderRadius="full" bg="brandGreen.500" color="fg.inverted" flexShrink="0" style={{ backgroundImage: "linear-gradient(135deg,#22d3ee,#d946ef)" }}>
                        <Check size={14} />
                      </Flex>
                      <Text fontSize="sm">{b}</Text>
                    </HStack>
                  ))}
                </VStack>

                <Button onClick={() => navigate("/checkout")} size="xl" h="14" borderRadius="full" border="none" color="fg.inverted" fontWeight="800" backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)" _hover={{ opacity: 0.92, boxShadow: "neon" }} transition="all 0.3s">
                  Suscribirme con MercadoPago
                </Button>
                <Text fontSize="xs" color="fg.subtle" textAlign="center">
                  Pago procesado por MercadoPago. Puedes cancelar cuando quieras.
                </Text>
              </VStack>
            </GlassPanel>
          )}
        </VStack>
      </Container>
    </Box>
  );
};
