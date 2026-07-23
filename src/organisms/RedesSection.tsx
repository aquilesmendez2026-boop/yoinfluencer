import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Box, Center, Flex, Grid, HStack, Spinner, Text, VStack } from "@chakra-ui/react";
import { ExternalLink, Facebook, Instagram, Music, Music2, Radio, Star, Twitch, Twitter, Users, Youtube } from "lucide-react";
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

const RedCard = ({ red }: { red: Red }) => {
  const Icono = ICONOS[red.plataforma] ?? Radio;
  const color = colorPlataforma(red.plataforma);
  const grande = red.destacada;

  return (
    <GlassPanel
      as="a"
      // @ts-expect-error anchor via as
      href={red.url}
      target="_blank"
      rel="noopener noreferrer"
      interactive
      display="block"
      p={grande ? { base: "6", md: "7" } : { base: "5", md: "5" }}
      borderColor={grande ? "border.brand" : "border.subtle"}
      boxShadow={grande ? "brand" : "glass"}
      textDecoration="none"
    >
      <VStack align="start" gap={grande ? "4" : "3"}>
        <Flex justify="space-between" align="center" w="full">
          <HStack gap="3" minW="0">
            <Center
              w={grande ? "48px" : "38px"}
              h={grande ? "48px" : "38px"}
              borderRadius="xl"
              bg="bg.muted"
              border="1px solid"
              borderColor="border.subtle"
              color={color}
              flexShrink="0"
            >
              <Icono size={grande ? 24 : 19} />
            </Center>
            <VStack align="start" gap="0" minW="0">
              <Text
                fontFamily="heading"
                fontWeight="800"
                fontSize={grande ? { base: "lg", md: "xl" } : "md"}
                color="fg.default"
                lineClamp={1}
              >
                {plataformaLabel(red.plataforma)}
              </Text>
              <Text fontSize="sm" color="fg.subtle" lineClamp={1}>
                {red.handle}
              </Text>
            </VStack>
          </HStack>
          {grande && (
            <HStack gap="1" color="accent.gold" flexShrink="0">
              <Star size={14} />
              <Text fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="wide">
                Destacada
              </Text>
            </HStack>
          )}
        </Flex>

        <VStack align="start" gap="0">
          <Text
            fontFamily="heading"
            fontWeight="900"
            fontSize={grande ? { base: "3xl", md: "4xl" } : "2xl"}
            color="fg.accent"
            lineHeight="1.1"
          >
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

            <Grid
              w="full"
              gap="5"
              templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
            >
              {ordenadas.map((r) => (
                <Box key={r.id} gridColumn={r.destacada ? { base: "auto", sm: "span 2", lg: "span 2" } : "auto"}>
                  <RedCard red={r} />
                </Box>
              ))}
            </Grid>
          </VStack>
        )}
      </VStack>
    </Section>
  );
};
