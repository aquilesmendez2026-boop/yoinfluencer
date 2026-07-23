import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Button, Center, Flex, Heading, Image, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { ArrowRight, Instagram } from "lucide-react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { GlassPanel } from "../atoms/GlassPanel";
import { listInfluencers, instagramUrl, instagramHandle, type Influencer } from "../services/influencers";

const StaffCard = ({ inf }: { inf: Influencer }) => {
  const inicial = (inf.alias || "?").charAt(0).toUpperCase();
  const ig = instagramUrl(inf.instagram);
  return (
    <GlassPanel p={{ base: "5", md: "6" }}>
      <VStack gap="4" textAlign="center">
        <RouterLink to={`/influencer/${inf.userId}`} style={{ textDecoration: "none" }}>
          {inf.photoURL ? (
            <Image
              src={inf.photoURL}
              alt={inf.alias}
              boxSize="88px"
              borderRadius="full"
              objectFit="cover"
              referrerPolicy="no-referrer"
              mx="auto"
            />
          ) : (
            <Flex
              align="center"
              justify="center"
              boxSize="88px"
              borderRadius="full"
              backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
              color="fg.inverted"
              fontWeight="800"
              fontSize="3xl"
              mx="auto"
            >
              {inicial}
            </Flex>
          )}
        </RouterLink>

        <Heading as="h3" size="md" fontWeight="800" lineClamp={1}>
          {inf.alias || "Sin alias"}
        </Heading>

        {/* Solo mostramos el Instagram del integrante. */}
        {ig ? (
          <Button
            asChild
            size="sm"
            borderRadius="full"
            px="5"
            variant="outline"
            borderColor="border.brand"
            color="fg.default"
            bg="bg.surface"
            _hover={{ boxShadow: "brand", color: "brand.300" }}
          >
            <a href={ig} target="_blank" rel="noopener noreferrer">
              <Instagram size={16} style={{ marginRight: "8px" }} />
              {instagramHandle(inf.instagram) || "Instagram"}
            </a>
          </Button>
        ) : (
          <Text fontSize="sm" color="fg.subtle">Sin Instagram</Text>
        )}
      </VStack>
    </GlassPanel>
  );
};

/** Bloque de la home: presenta al staff, mostrando solo su Instagram por card. */
export const StaffSection = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Influencer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listInfluencers()
      // En la home mostramos hasta 4; el resto en /influencers.
      .then((s) => setStaff(s.slice(0, 4)))
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
          subtitle="La redacción del medio. Seguí a cada creador en su Instagram."
        />

        {staff === null ? (
          <Center py="10"><Spinner color="brand.primary" size="lg" /></Center>
        ) : error ? (
          <Text color="fg.subtle">{error}</Text>
        ) : staff.length === 0 ? (
          <Text color="fg.subtle">Muy pronto presentaremos a nuestro staff.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="6" w="full">
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
