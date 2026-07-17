import { useEffect, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ArrowLeft, Download, Lock, Play, FileText, Image, Music } from "lucide-react";
import { Logo } from "../atoms/Logo";
import { WhiskyGlass } from "../atoms/WhiskyGlass";
import { GlassPanel } from "../atoms/GlassPanel";
import { SectionTitle } from "../atoms/SectionTitle";
import { AuthButton } from "../molecules/AuthButton";
import { useAuth } from "../providers/AuthProvider";
import { apiFetch } from "../services/api";
import {
  exclusiveContent,
  downloads,
  downloadTypeLabel,
  type DownloadType,
} from "../data/miembros";

interface MeResponse {
  user?: { role?: string; email?: string; name?: string };
}

const downloadIcon: Record<DownloadType, typeof FileText> = {
  audio: Music,
  pdf: FileText,
  wallpaper: Image,
  video: Play,
};

export const MembersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [apiError, setApiError] = useState(false);

  const firstName = user?.displayName?.split(" ")[0] ?? "crack";

  // Verifica sesión contra el backend (bearer token) y trae el rol.
  useEffect(() => {
    apiFetch<MeResponse>("/me")
      .then((data) => setRole(data.user?.role ?? "miembro"))
      .catch(() => setApiError(true));
  }, []);

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      {/* Top bar */}
      <Flex
        as="header"
        position="sticky"
        top="0"
        zIndex="100"
        bg="rgba(6, 6, 12, 0.8)"
        backdropFilter="blur(16px)"
        borderBottom="1px solid"
        borderColor="border.subtle"
        px={{ base: "5", md: "8" }}
        py="4"
        align="center"
        justify="space-between"
      >
        <RouterLink to="/">
          <Logo fontSize={{ base: "lg", md: "xl" }} />
        </RouterLink>
        <HStack gap="4">
          <Button
            onClick={() => navigate("/")}
            size="sm"
            variant="ghost"
            color="fg.muted"
            _hover={{ color: "brand.primary" }}
          >
            <ArrowLeft size={16} style={{ marginRight: "6px" }} />
            Inicio
          </Button>
          <AuthButton />
        </HStack>
      </Flex>

      <Container maxW="1200px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
        <VStack align="stretch" gap="16">
          {/* Saludo */}
          <VStack align="start" gap="3" animation="fadeIn 0.6s ease-out">
            <HStack gap="2" color="brand.primary">
              <Lock size={16} />
              <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase">
                Zona miembros
              </Text>
            </HStack>
            <Heading as="h1" size={{ base: "3xl", md: "5xl" }} fontWeight="900" letterSpacing="tighter">
              Hola,{" "}
              <Box
                as="span"
                backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)"
                backgroundClip="text"
                color="transparent"
              >
                {firstName}
              </Box>
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="fg.muted" maxW="2xl">
              Este es tu acceso exclusivo: contenido que no verás en las plataformas públicas y
              descargables solo para la comunidad.
            </Text>
            <HStack gap="3" pt="1">
              {role && (
                <Badge
                  bg="bg.surface"
                  color="brand.primary"
                  border="1px solid"
                  borderColor="border.neon"
                  borderRadius="full"
                  px="3"
                  py="1"
                  textTransform="capitalize"
                >
                  Rol: {role}
                </Badge>
              )}
              {apiError && (
                <Text fontSize="xs" color="amber.400">
                  (No se pudo confirmar tu membresía con el servidor)
                </Text>
              )}
            </HStack>
          </VStack>

          {/* Contenido exclusivo */}
          <VStack align="stretch" gap="8">
            <SectionTitle
              align="start"
              eyebrow="Exclusivo"
              title="Contenido solo para miembros"
            />
            <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
              {exclusiveContent.map((item) => (
                <GlassPanel key={item.title} interactive p="6" h="full">
                  <VStack align="start" gap="3" h="full">
                    <HStack
                      gap="1.5"
                      alignSelf="start"
                      bg="rgba(245, 158, 11, 0.12)"
                      border="1px solid"
                      borderColor="rgba(245, 158, 11, 0.35)"
                      borderRadius="full"
                      px="2.5"
                      py="1"
                      color="amber.300"
                    >
                      <WhiskyGlass size={14} />
                      <Text
                        fontSize="0.65rem"
                        fontWeight="700"
                        textTransform="uppercase"
                        letterSpacing="wide"
                      >
                        {item.badge}
                      </Text>
                    </HStack>
                    <Heading as="h3" size="md">
                      {item.title}
                    </Heading>
                    <Text fontSize="sm" color="fg.muted" lineHeight="tall" flex="1">
                      {item.description}
                    </Text>
                    <HStack gap="2" color="brand.primary" fontWeight="600" fontSize="sm">
                      <Play size={16} />
                      <Text>Reproducir · {item.duration}</Text>
                    </HStack>
                  </VStack>
                </GlassPanel>
              ))}
            </SimpleGrid>
          </VStack>

          {/* Descargables */}
          <VStack align="stretch" gap="8">
            <SectionTitle align="start" eyebrow="Descargables" title="Descarga tu material" />
            <VStack align="stretch" gap="4">
              {downloads.map((d) => {
                const Icon = downloadIcon[d.type];
                return (
                  <GlassPanel key={d.fileKey} p={{ base: "4", md: "5" }}>
                    <Flex align="center" justify="space-between" gap="4" wrap="wrap">
                      <HStack gap="4">
                        <Flex
                          align="center"
                          justify="center"
                          w="44px"
                          h="44px"
                          borderRadius="lg"
                          bg="bg.elevated"
                          color="brand.primary"
                          border="1px solid"
                          borderColor="border.subtle"
                        >
                          <Icon size={20} />
                        </Flex>
                        <VStack align="start" gap="0.5">
                          <Text fontWeight="600">{d.title}</Text>
                          <Text fontSize="xs" color="fg.subtle">
                            {downloadTypeLabel[d.type]} · {d.size}
                          </Text>
                        </VStack>
                      </HStack>
                      <Button
                        size="sm"
                        borderRadius="full"
                        px="5"
                        color="fg.inverted"
                        fontWeight="700"
                        backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)"
                        _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
                        transition="all 0.3s"
                      >
                        <Download size={16} style={{ marginRight: "6px" }} />
                        Descargar
                      </Button>
                    </Flex>
                  </GlassPanel>
                );
              })}
            </VStack>
            <Text fontSize="sm" color="fg.subtle">
              * Los archivos reales se servirán con enlaces protegidos desde S3 (siguiente paso de
              infraestructura).
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};
