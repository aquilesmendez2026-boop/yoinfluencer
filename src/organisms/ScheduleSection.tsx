import { useEffect, useState } from "react";
import { Center, HStack, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { CalendarX } from "lucide-react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { ScheduleCard } from "../molecules/ScheduleCard";
import { showTypeLabels, type ShowType } from "../data/shows";
import { listEventos, type Evento } from "../services/events";

const legendColor: Record<ShowType, string> = {
  en_vivo: "brand.400",
  grabacion: "brand.300",
  publicacion: "brand.600",
  colaboracion: "accent.sage",
  evento: "accent.gold",
};

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const ScheduleSection = () => {
  const [eventos, setEventos] = useState<Evento[] | null>(null);

  useEffect(() => {
    const hoy = todayStr();
    listEventos()
      .then((all) =>
        setEventos(
          all
            .filter((e) => e.date >= hoy)
            .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
            .slice(0, 6)
        )
      )
      .catch(() => setEventos([]));
  }, []);

  return (
    <Section id="schedule">
      <VStack gap="10" w="full">
        <SectionTitle
          eyebrow="Agenda"
          title="Qué se viene esta semana"
          subtitle="La rutina de publicaciones, grabaciones y en vivos. Anótala para no perderte ninguna."
        />

        {/* Leyenda de tipos */}
        <HStack gap="6" flexWrap="wrap" justify="center">
          {(Object.keys(showTypeLabels) as ShowType[]).map((type) => (
            <HStack key={type} gap="2">
              <VStack w="10px" h="10px" borderRadius="full" bg={legendColor[type]} boxShadow="brand" />
              <Text fontSize="sm" color="fg.muted">
                {showTypeLabels[type]}
              </Text>
            </HStack>
          ))}
        </HStack>

        {eventos === null ? (
          <Center py="12">
            <Spinner color="brand.primary" size="lg" />
          </Center>
        ) : eventos.length === 0 ? (
          <VStack gap="3" py="12" color="fg.subtle">
            <CalendarX size={40} />
            <Text fontSize="lg" fontWeight="600" color="fg.muted">
              Aún no hay shows programados
            </Text>
            <Text fontSize="sm">Muy pronto anunciaremos las próximas fechas.</Text>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap="5" w="full">
            {eventos.map((e) => (
              <ScheduleCard key={e.id} evento={e} />
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Section>
  );
};
