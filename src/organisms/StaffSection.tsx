import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Box, Button, Center, Flex, Heading, HStack, Image, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { GlassPanel } from "../atoms/GlassPanel";
import { listInfluencers, type Influencer } from "../services/influencers";
import { ROLE_LABELS, type Role } from "../services/team";

const roleLabel = (r: string) => ROLE_LABELS[r as Role] ?? r;

// Card al formato del sitio: cover + nombre + reseña. Toda la card lleva al
// perfil, donde están las redes, la descripción completa y sus artículos.
const StaffCard = ({ inf }: { inf: Influencer }) => {
  const inicial = (inf.alias || "?").charAt(0).toUpperCase();
  const resena = inf.bio?.trim();

  return (
    <GlassPanel interactive h="full" overflow="hidden">
      <RouterLink to={`/influencer/${inf.userId}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
        <Box position="relative" h="180px" bg="bg.muted" overflow="hidden">
          {inf.photoURL ? (
            <Image src={inf.photoURL} alt={inf.alias} w="full" h="full" objectFit="cover" referrerPolicy="no-referrer" />
          ) : (
            <Flex
              h="full"
              align="center"
              justify="center"
              backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
              color="fg.inverted"
              fontWeight="900"
              fontSize="5xl"
            >
              {inicial}
            </Flex>
          )}
          <Text
            position="absolute"
            top="3"
            left="3"
            bg="rgba(10, 12, 10, 0.72)"
            backdropFilter="blur(8px)"
            border="1px solid"
            borderColor="border.brand"
            borderRadius="full"
            px="2.5"
            py="1"
            fontSize="0.6rem"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="wide"
            color="brand.300"
          >
            {roleLabel(inf.role)}
          </Text>
        </Box>

        <VStack align="start" gap="2.5" p={{ base: "4", md: "5" }}>
          <Heading as="h3" size="md" color="fg.default" lineClamp={1}>
            {inf.alias || "Sin alias"}
          </Heading>
          {resena ? (
            <Text fontSize="sm" color="fg.muted" lineHeight="tall" lineClamp={3}>
              {resena}
            </Text>
          ) : (
            <Text fontSize="sm" color="fg.subtle">Sin reseña todavía.</Text>
          )}
          <HStack gap="1.5" color="brand.300" fontSize="sm" fontWeight="700" pt="0.5">
            <Text>Ver perfil</Text>
            <ArrowRight size={15} />
          </HStack>
        </VStack>
      </RouterLink>
    </GlassPanel>
  );
};

/** Bloque de la home: presenta al staff con una reseña; la card lleva al perfil completo. */
export const StaffSection = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Influencer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listInfluencers()
      // En la home mostramos hasta 3; el resto en /influencers.
      .then((s) => setStaff(s.slice(0, 3)))
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudo cargar el staff.");
        setStaff([]);
      });
  }, []);

  return (
    <Section id="staff">
      <VStack gap="10" w="full">
        <SectionTitle
          eyebrow="El staff"
          title="Quiénes escriben"
          subtitle="La redacción del medio. Entra a cada perfil para ver sus redes, su historia y sus artículos."
        />

        {staff === null ? (
          <Center py="10"><Spinner color="brand.primary" size="lg" /></Center>
        ) : error ? (
          <Text color="fg.subtle">{error}</Text>
        ) : staff.length === 0 ? (
          <Text color="fg.subtle">Muy pronto presentaremos a nuestro staff.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="6" w="full">
            {staff.map((inf) => (
              <StaffCard key={inf.userId} inf={inf} />
            ))}
          </SimpleGrid>
        )}

        <Button
          onClick={() => navigate("/influencers")}
          size="lg"
          borderRadius="full"
          px="7"
          variant="outline"
          borderColor="border.brand"
          color="fg.default"
          bg="bg.surface"
          _hover={{ boxShadow: "brand", transform: "translateY(-2px)" }}
          transition="all 0.3s"
        >
          Ver todo el staff
          <ArrowRight size={18} style={{ marginLeft: "8px" }} />
        </Button>
      </VStack>
    </Section>
  );
};
