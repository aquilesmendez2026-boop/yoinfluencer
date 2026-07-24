import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Box, Center, Flex, HStack, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { ExternalLink, Facebook, Instagram, Music, Music2, Radio, Twitch, Twitter, Users, Youtube } from "lucide-react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { GlassPanel } from "../atoms/GlassPanel";
import { listRedes, formatSeguidores, plataformaLabel, PLATAFORMAS, type Plataforma, type Red } from "../services/redes";

type IconoRed = ComponentType<{ size?: number | string }>;

const ICONOS: Record<Plataforma, IconoRed> = {
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
  twitch: Twitch,
  x: Twitter,
  facebook: Facebook,
  kick: Radio,
  spotify: Music,
};

const colorPlataforma = (p: Plataforma) => PLATAFORMAS.find((x) => x.key === p)?.color ?? "#32d583";

// Card uniforme (mismo tamaño para todas); la destacada solo lleva un badge.
const RedCard = ({ red }: { red: Red }) => {
  const Icono = ICONOS[red.plataforma] ?? Radio;
  const color = colorPlataforma(red.plataforma);

  return (
    <GlassPanel
      as="a"
      // @ts-expect-error anchor via as
      href={red.url}
      target="_blank"
      rel="noopener noreferrer"
      interactive
      display="flex"
      flexDirection="column"
      h="full"
      p={{ base: "5", md: "6" }}
      borderColor={red.destacada ? "border.brand" : "border.subtle"}
      textDecoration="none"
    >
      <VStack align="start" gap="4" h="full" w="full">
        <Flex justify="space-between" align="start" w="full" gap="2">
          <HStack gap="3" minW="0">
            <Center
              w="42px"
              h="42px"
              borderRadius="xl"
              bg="bg.muted"
              border="1px solid"
              borderColor="border.subtle"
              color={color}
              flexShrink="0"
            >
              <Icono size={20} />
            </Center>
            <VStack align="start" gap="0" minW="0">
              <Text fontFamily="heading" fontWeight="800" fontSize="md" color="fg.default" lineClamp={1}>
                {plataformaLabel(red.plataforma)}
              </Text>
              <Text fontSize="sm" color="fg.subtle" lineClamp={1}>
                {red.handle}
              </Text>
            </VStack>
          </HStack>
          {red.destacada && (
            <Text
              flexShrink="0"
              bg="rgba(201,162,39,0.15)"
              color="accent.gold"
              border="1px solid"
              borderColor="accent.gold"
              borderRadius="full"
              px="2.5"
              py="1"
              fontSize="0.55rem"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="wide"
            >
              Destacada
            </Text>
          )}
        </Flex>

        <VStack align="start" gap="0">
          <Text fontFamily="heading" fontWeight="900" fontSize="3xl" color="fg.accent" lineHeight="1.1">
            {formatSeguidores(red.seguidores)}
          </Text>
          <Text fontSize="xs" color="fg.subtle" textTransform="uppercase" letterSpacing="wide">
            Seguidores
          </Text>
        </VStack>

        <HStack
          gap="2"
          px="4"
          py="2"
          mt="auto"
          borderRadius="full"
          w="full"
          justify="center"
          color="fg.inverted"
          fontWeight="700"
          fontSize="sm"
          backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
        >
          <Text>Seguir</Text>
          <ExternalLink size={15} />
        </HStack>
      </VStack>
    </GlassPanel>
  );
};

export const RedesSection = () => {
  const [redes, setRedes] = useState<Red[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRedes()
      .then((r) => setRedes(r))
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "No se pudieron cargar las redes.");
        setRedes([]);
      });
  }, []);

  const ordenadas = useMemo(() => {
    if (!redes) return [];
    return [...redes].sort((a, b) => {
      if (a.destacada !== b.destacada) return a.destacada ? -1 : 1;
      return (a.orden ?? 0) - (b.orden ?? 0);
    });
  }, [redes]);

  const total = useMemo(
    () => (redes ?? []).reduce((acc, r) => acc + (Number(r.seguidores) || 0), 0),
    [redes]
  );

  return (
    <Section id="redes">
      <VStack gap="10" w="full">
        <SectionTitle
          eyebrow="Redes"
          title="Seguime donde vivas"
          subtitle="Todo el contenido, en la plataforma que uses todos los días."
        />

        {redes === null ? (
          <Center py="12">
            <Spinner color="brand.primary" size="lg" />
          </Center>
        ) : error ? (
          <GlassPanel p="6" maxW="lg" w="full">
            <Text color="red.400" fontSize="sm" textAlign="center">
              {error}
            </Text>
          </GlassPanel>
        ) : ordenadas.length === 0 ? (
          <GlassPanel p="8" maxW="lg" w="full">
            <VStack gap="2">
              <Box color="fg.subtle">
                <Users size={26} />
              </Box>
              <Text color="fg.muted" fontWeight="600">
                Todavía no hay redes cargadas.
              </Text>
              <Text color="fg.subtle" fontSize="sm" textAlign="center">
                Muy pronto vas a poder seguirnos desde acá.
              </Text>
            </VStack>
          </GlassPanel>
        ) : (
          <VStack gap="8" w="full">
            {total > 0 && (
              <GlassPanel px={{ base: "6", md: "10" }} py={{ base: "5", md: "6" }} borderColor="border.brand" boxShadow="brandStrong">
                <VStack gap="1">
                  <Text
                    fontFamily="heading"
                    fontWeight="900"
                    fontSize={{ base: "4xl", md: "5xl" }}
                    color="fg.accent"
                    lineHeight="1"
                  >
                    {formatSeguidores(total)}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" textTransform="uppercase" letterSpacing="widest" fontWeight="700">
                    Seguidores en total
                  </Text>
                </VStack>
              </GlassPanel>
            )}

            <SimpleGrid w="full" gap="5" columns={{ base: 1, sm: 2, lg: 3 }}>
              {ordenadas.map((r) => (
                <RedCard key={r.id} red={r} />
              ))}
            </SimpleGrid>
          </VStack>
        )}
      </VStack>
    </Section>
  );
};
