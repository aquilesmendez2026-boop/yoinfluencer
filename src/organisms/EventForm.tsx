import { useState, type FormEvent } from "react";
import {
  Box,
  Button,
  Flex,
  Input,
  NativeSelect,
  Switch,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { CalendarPlus } from "lucide-react";
import { WhiskyGlass } from "../atoms/WhiskyGlass";
import { showTypeLabels, type ShowType } from "../data/shows";
import { createEvento, type Evento } from "../services/events";

const fieldProps = {
  bg: "bg.muted",
  border: "1px solid",
  borderColor: "border.subtle",
  borderRadius: "lg",
  color: "fg.default",
  _hover: { borderColor: "border.neon" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #22d3ee", outline: "none" },
};

const Label = ({ children }: { children: string }) => (
  <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase" letterSpacing="wide" mb="1.5">
    {children}
  </Text>
);

export const EventForm = ({ onCreated }: { onCreated: (e: Evento) => void }) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ShowType>("stream");
  const [description, setDescription] = useState("");
  const [premium, setPremium] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    setSubmitting(true);
    try {
      const evento = await createEvento({ date, time, title, type, description, premium });
      onCreated(evento);
      setTitle("");
      setDescription("");
      setPremium(false);
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el evento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack align="stretch" gap="4">
        <Box>
          <Label>Fecha</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required size="lg" px="4" {...fieldProps} />
        </Box>
        <Box>
          <Label>Hora</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required size="lg" px="4" {...fieldProps} />
        </Box>
        <Box>
          <Label>Título del show</Label>
          <Input
            placeholder="Ej. Locuras en vivo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            size="lg"
            px="4"
            {...fieldProps}
          />
        </Box>
        <Box>
          <Label>Tipo</Label>
          <NativeSelect.Root size="lg">
            <NativeSelect.Field
              value={type}
              onChange={(e) => setType(e.target.value as ShowType)}
              {...fieldProps}
            >
              {(Object.keys(showTypeLabels) as ShowType[]).map((t) => (
                <option key={t} value={t} style={{ background: "#161626" }}>
                  {showTypeLabels[t]}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Box>
        <Box>
          <Label>Descripción</Label>
          <Textarea
            placeholder="De qué trata el show…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            px="4"
            py="2"
            {...fieldProps}
          />
        </Box>

        {/* Premium */}
        <Flex
          justify="space-between"
          align="center"
          gap="3"
          p="3"
          borderRadius="lg"
          bg="rgba(245, 158, 11, 0.08)"
          border="1px solid"
          borderColor="rgba(245, 158, 11, 0.25)"
        >
          <Flex align="center" gap="2" color="amber.300">
            <WhiskyGlass size={18} />
            <Box>
              <Text fontSize="sm" fontWeight="700" color="fg.default">
                Contenido premium
              </Text>
              <Text fontSize="xs" color="fg.subtle">
                Solo para miembros
              </Text>
            </Box>
          </Flex>
          <Switch.Root
            checked={premium}
            onCheckedChange={(e) => setPremium(e.checked)}
            colorPalette="yellow"
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </Flex>

        {error && (
          <Text color="red.400" fontSize="sm">
            {error}
          </Text>
        )}
        {ok && (
          <Text color="brand.primary" fontSize="sm">
            ✓ Evento creado
          </Text>
        )}

        <Button
          type="submit"
          size="lg"
          h="12"
          borderRadius="xl"
          border="none"
          color="fg.inverted"
          fontWeight="700"
          backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)"
          _hover={{ opacity: 0.92, boxShadow: "neon" }}
          transition="all 0.3s"
          loading={submitting}
        >
          <CalendarPlus size={18} style={{ marginRight: "8px" }} />
          Crear evento
        </Button>
      </VStack>
    </Box>
  );
};
