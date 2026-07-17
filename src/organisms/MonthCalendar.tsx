import { useState } from "react";
import { Box, Flex, Grid, HStack, IconButton, Text, VStack } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ShowType } from "../data/shows";
import type { Evento } from "../services/events";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const typeColor: Record<ShowType, string> = {
  stream: "neon.cyan",
  charla: "neon.magenta",
  especial: "neon.amber",
};

const pad = (n: number) => String(n).padStart(2, "0");
const dateStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

interface MonthCalendarProps {
  events: Evento[];
  selected: string | null;
  onSelect: (date: string) => void;
}

export const MonthCalendar = ({ events, selected, onSelect }: MonthCalendarProps) => {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const todayStr = dateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const firstDay = new Date(view.year, view.month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const move = (delta: number) => {
    const m = view.month + delta;
    setView({
      year: view.year + Math.floor(m / 12),
      month: ((m % 12) + 12) % 12,
    });
  };

  return (
    <Box>
      {/* Cabecera del mes */}
      <Flex align="center" justify="space-between" mb="4">
        <Text fontWeight="800" fontSize="lg" fontFamily="heading">
          {MONTHS[view.month]} {view.year}
        </Text>
        <HStack gap="1">
          <IconButton aria-label="Mes anterior" size="sm" variant="ghost" onClick={() => move(-1)}>
            <ChevronLeft size={18} />
          </IconButton>
          <IconButton aria-label="Mes siguiente" size="sm" variant="ghost" onClick={() => move(1)}>
            <ChevronRight size={18} />
          </IconButton>
        </HStack>
      </Flex>

      {/* Días de la semana */}
      <Grid templateColumns="repeat(7, 1fr)" gap="1" mb="1">
        {WEEKDAYS.map((d, i) => (
          <Text key={i} textAlign="center" fontSize="xs" color="fg.subtle" fontWeight="700">
            {d}
          </Text>
        ))}
      </Grid>

      {/* Celdas */}
      <Grid templateColumns="repeat(7, 1fr)" gap="1">
        {cells.map((day, i) => {
          if (day === null) return <Box key={i} />;
          const ds = dateStr(view.year, view.month, day);
          const dayEvents = events.filter((e) => e.date === ds);
          const isToday = ds === todayStr;
          const isSelected = ds === selected;

          return (
            <VStack
              key={i}
              gap="1"
              minH="52px"
              p="1"
              borderRadius="lg"
              cursor="pointer"
              onClick={() => onSelect(ds)}
              bg={isSelected ? "brand.primary" : "transparent"}
              border="1px solid"
              borderColor={isSelected ? "brand.primary" : isToday ? "border.neon" : "transparent"}
              _hover={{ bg: isSelected ? "brand.primary" : "bg.muted" }}
              transition="all 0.15s"
            >
              <Text
                fontSize="sm"
                fontWeight={isToday ? "800" : "500"}
                color={isSelected ? "fg.inverted" : isToday ? "brand.primary" : "fg.default"}
              >
                {day}
              </Text>
              <HStack gap="0.5" minH="6px">
                {dayEvents.slice(0, 3).map((e) => (
                  <Box
                    key={e.id}
                    w="5px"
                    h="5px"
                    borderRadius="full"
                    bg={isSelected ? "white" : typeColor[e.type]}
                  />
                ))}
              </HStack>
            </VStack>
          );
        })}
      </Grid>
    </Box>
  );
};
