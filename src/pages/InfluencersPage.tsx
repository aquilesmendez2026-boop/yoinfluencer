import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Badge,
  Box,
  Center,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { MapPin, Users } from "lucide-react";
import { AppHeader } from "../organisms/AppHeader";
import { GlassPanel } from "../atoms/GlassPanel";
import { listInfluencers, type Influencer } from "../services/influencers";
import { ROLE_LABELS, type Role } from "../services/team";

const roleLabel = (role: string) => ROLE_LABELS[role as Role] ?? role;

const InfluencerCard = ({ inf }: { inf: Influencer }) => {
  const inicial = (inf.alias || "?").charAt(0).toUpperCase();
  return (
    <GlassPanel
      asChild
      interactive
      p={{ base: "5", md: "6" }}
      display="block"
      _hover={{ textDecoration: "none" }}
    >
      <RouterLink to={`/influencer/${inf.userId}`}>
      <VStack align="start" gap="4">
        <HStack gap="4" w="full">
          {inf.photoURL ? (
            <Image
              src={inf.photoURL}
              alt={inf.alias}
              boxSize="64px"
              borderRadius="full"
              objectFit="cover"
              referrerPolicy="no-referrer"
              flexShrink="0"
            />
          ) : (
            <Flex
              align="center"
              justify="center"
              boxSize="64px"
              borderRadius="full"
              backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
              color="fg.inverted"
              fontWeight="800"
              fontSize="2xl"
              flexShrink="0"
            >
              {inicial}
            </Flex>
          )}
          <VStack align="start" gap="1.5" minW="0">
            <Heading as="h3" size="md" fontWeight="800" lineClamp={1}>
              {inf.alias || "Sin alias"}
            </Heading>
            <Badge
              bg="bg.surface"
              color="brand.primary"
              border="1px solid"
              borderColor="border.brand"
              borderRadius="full"
              px="2.5"
              fontSize="0.6rem"
              textTransform="uppercase"
              letterSpacing="wide"
            >
              {roleLabel(inf.role)}
            </Badge>
          </VStack>
        </HStack>

        {inf.pais && (
          <HStack gap="1.5" color="fg.subtle">
            <MapPin size={14} />
            <Text fontSize="sm">{inf.pais}</Text>
          </HStack>
        )}

        {inf.bio && (
          <Text fontSize="sm" color="fg.muted" lineHeight="tall" lineClamp={3}>
            {inf.bio}
          </Text>
        )}
      </VStack>
      </RouterLink>
    </GlassPanel>
  );
};

export const InfluencersPage = () => {
  const [influencers, setInfluencers] = useState<Influencer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listInfluencers()
      .then(setInfluencers)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudo cargar el directorio.");
        setInfluencers([]);
      });
  }, []);

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />

      <Container maxW="1200px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
        <VStack align="stretch" gap="10">
          <VStack align="start" gap="2">
            <HStack gap="2" color="brand.primary">
              <Users size={16} />
              <Text fontSize="sm" fontWeight="700" letterSpacing="widest" textTransform="uppercase">
                Nuestra redacción
              </Text>
            </HStack>
            <Heading as="h1" size={{ base: "3xl", md: "5xl" }} fontWeight="900" letterSpacing="tighter">
              Las plumas de modopiña
            </Heading>
            <Text color="fg.muted" maxW="2xl">
              El staff que da vida a cada sección. Conocé a quienes escriben, editan y cuentan las
              historias del medio.
            </Text>
          </VStack>

          {influencers === null ? (
            <Center py="16">
              <Spinner color="brand.primary" size="xl" borderWidth="3px" />
            </Center>
          ) : error ? (
            <Text color="fg.subtle">{error}</Text>
          ) : influencers.length === 0 ? (
            <Text color="fg.subtle">Todavía no hay integrantes publicados.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
              {influencers.map((inf) => (
                <InfluencerCard key={inf.userId} inf={inf} />
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Container>
    </Box>
  );
};
