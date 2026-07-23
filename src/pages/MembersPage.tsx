import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge, Box, Button, Center, Container, Flex, Heading, HStack, Link, SimpleGrid, Spinner, Text, VStack,
} from "@chakra-ui/react";
import { Download, Lock, Play, FileText, Image as ImageIcon, Music, File, Crown } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { WhiskyGlass } from "../atoms/WhiskyGlass";
import { SectionTitle } from "../atoms/SectionTitle";
import { AppHeader } from "../organisms/AppHeader";
import { useAuth } from "../providers/AuthProvider";
import { exclusiveContent } from "../data/miembros";
import { listDescargas, type Descarga, type DownloadType } from "../services/descargas";

const downloadIcon: Record<DownloadType, typeof FileText> = {
  audio: Music,
  pdf: FileText,
  wallpaper: ImageIcon,
  video: Play,
  otro: File,
};
const typeLabel: Record<DownloadType, string> = {
  audio: "Audio", pdf: "PDF", wallpaper: "Wallpaper", video: "Video", otro: "Archivo",
};

export const MembersPage = () => {
  const { user, profile, role, isPremium } = useAuth();
  const navigate = useNavigate();
  const [descargas, setDescargas] = useState<Descarga[] | null>(null);

  const firstName = profile?.apodo || user?.displayName?.split(" ")[0] || "crack";

  useEffect(() => {
    listDescargas().then(setDescargas).catch(() => setDescargas([]));
  }, []);

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />

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
              <Box as="span" backgroundImage="linear-gradient(135deg, #6ce9a6 0%, #12b76a 100%)" backgroundClip="text" color="transparent">
                {firstName}
              </Box>
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="fg.muted" maxW="2xl">
              Contenido que no verás en las plataformas públicas y descargables solo para la comunidad.
            </Text>
            <HStack gap="3">
              {role && (
                <Badge bg="bg.surface" color="brand.primary" border="1px solid" borderColor="border.brand" borderRadius="full" px="3" py="1" textTransform="capitalize">
                  Rol: {role}
                </Badge>
              )}
              {isPremium && (
                <Badge bg="rgba(245,158,11,0.15)" color="amber.300" border="1px solid" borderColor="rgba(245,158,11,0.4)" borderRadius="full" px="3" py="1">
                  <HStack gap="1"><Crown size={12} /><Text>Premium</Text></HStack>
                </Badge>
              )}
            </HStack>
          </VStack>

          {!isPremium && (
            <Flex gap="4" align="center" justify="space-between" wrap="wrap" p="5" borderRadius="2xl" bg="rgba(245,158,11,0.1)" border="1px solid" borderColor="rgba(245,158,11,0.35)">
              <HStack gap="3" color="amber.200">
                <Crown size={26} />
                <Box>
                  <Text fontWeight="700" color="fg.default">Desbloquea todo con Premium</Text>
                  <Text fontSize="sm" color="fg.muted">Descargas premium, contenidos exclusivos y sin anuncios.</Text>
                </Box>
              </HStack>
              <Button onClick={() => navigate("/premium")} borderRadius="full" px="6" border="none" color="fg.inverted" fontWeight="700" backgroundImage="linear-gradient(135deg, #c9a227, #12b76a)" _hover={{ opacity: 0.92 }}>
                Hazte Premium
              </Button>
            </Flex>
          )}

          {/* Contenido exclusivo */}
          <VStack align="stretch" gap="8">
            <SectionTitle align="start" eyebrow="Exclusivo" title="Contenido solo para miembros" />
            <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
              {exclusiveContent.map((item) => (
                <GlassPanel key={item.title} interactive p="6" h="full">
                  <VStack align="start" gap="3" h="full">
                    <HStack gap="1.5" alignSelf="start" bg="rgba(245, 158, 11, 0.12)" border="1px solid" borderColor="rgba(245, 158, 11, 0.35)" borderRadius="full" px="2.5" py="1" color="amber.300">
                      <WhiskyGlass size={14} />
                      <Text fontSize="0.65rem" fontWeight="700" textTransform="uppercase" letterSpacing="wide">{item.badge}</Text>
                    </HStack>
                    <Heading as="h3" size="md">{item.title}</Heading>
                    <Text fontSize="sm" color="fg.muted" lineHeight="tall" flex="1">{item.description}</Text>
                    <HStack gap="2" color="brand.primary" fontWeight="600" fontSize="sm">
                      <Play size={16} /><Text>Reproducir · {item.duration}</Text>
                    </HStack>
                  </VStack>
                </GlassPanel>
              ))}
            </SimpleGrid>
          </VStack>

          {/* Descargables */}
          <VStack align="stretch" gap="8">
            <SectionTitle align="start" eyebrow="Descargables" title="Descarga tu material" />
            {descargas === null ? (
              <Center py="8"><Spinner color="brand.primary" /></Center>
            ) : descargas.length === 0 ? (
              <Text color="fg.subtle" fontSize="sm">Aún no hay archivos para descargar. ¡Pronto!</Text>
            ) : (
              <VStack align="stretch" gap="4">
                {descargas.map((d) => {
                  const Icon = downloadIcon[d.type] ?? File;
                  return (
                    <GlassPanel key={d.id} p={{ base: "4", md: "5" }}>
                      <Flex align="center" justify="space-between" gap="4" wrap="wrap">
                        <HStack gap="4">
                          <Flex align="center" justify="center" w="44px" h="44px" borderRadius="lg" bg="bg.elevated" color="brand.primary" border="1px solid" borderColor="border.subtle">
                            <Icon size={20} />
                          </Flex>
                          <VStack align="start" gap="0.5">
                            <HStack gap="1.5">
                              {d.premium && <Box color="amber.300" flexShrink="0"><WhiskyGlass size={14} /></Box>}
                              <Text fontWeight="600">{d.title}</Text>
                            </HStack>
                            <Text fontSize="xs" color="fg.subtle">
                              {typeLabel[d.type] ?? "Archivo"}{d.size ? ` · ${d.size}` : ""}
                            </Text>
                          </VStack>
                        </HStack>
                        {d.premium && !isPremium ? (
                          <Button
                            onClick={() => navigate("/premium")}
                            size="sm"
                            borderRadius="full"
                            px="5"
                            variant="outline"
                            borderColor="rgba(245,158,11,0.5)"
                            color="amber.300"
                            _hover={{ bg: "rgba(245,158,11,0.1)" }}
                          >
                            <Lock size={15} style={{ marginRight: "6px" }} /> Premium
                          </Button>
                        ) : (
                          <Link
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            display="inline-flex"
                            alignItems="center"
                            gap="2"
                            borderRadius="full"
                            px="5"
                            py="2"
                            color="fg.inverted"
                            fontWeight="700"
                            fontSize="sm"
                            backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
                            _hover={{ opacity: 0.9, transform: "translateY(-1px)", textDecoration: "none" }}
                            transition="all 0.3s"
                          >
                            <Download size={16} /> Descargar
                          </Link>
                        )}
                      </Flex>
                    </GlassPanel>
                  );
                })}
              </VStack>
            )}
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};
