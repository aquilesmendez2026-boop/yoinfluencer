import { useEffect, useRef, useState } from "react";
import { Box, Input, Spinner, Text, VStack } from "@chakra-ui/react";
import { MapPin } from "lucide-react";
import { geocode, type GeoResultado } from "../services/lugares";

interface Props {
  /** Texto de la dirección (controlado por el form). */
  value: string;
  /** Se dispara al tipear a mano. */
  onChange: (v: string) => void;
  /** Se dispara al elegir una sugerencia (con calle, ciudad, país y coordenadas). */
  onPick: (r: GeoResultado) => void;
  /** Comuna/ciudad escrita: sesga la búsqueda a esa zona (evita otras regiones). */
  contexto?: string;
  placeholder?: string;
  /** Estilos del input (mismos `fp`/`fieldProps` del form). */
  fieldProps?: Record<string, unknown>;
}

/**
 * Input de dirección con autocompletado vía /geocode (Amazon Location).
 * Al elegir una sugerencia, entrega dirección + ciudad + país + coordenadas.
 */
export const AddressAutocomplete = ({ value, onChange, onPick, contexto, placeholder, fieldProps }: Props) => {
  const [sugerencias, setSugerencias] = useState<GeoResultado[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  // Evita re-buscar cuando el cambio de `value` viene de elegir una sugerencia.
  const supprimirBusqueda = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Cierra al hacer clic fuera.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Debounce de la búsqueda al tipear.
  useEffect(() => {
    if (supprimirBusqueda.current) {
      supprimirBusqueda.current = false;
      return;
    }
    window.clearTimeout(timer.current);
    const q = value.trim();
    if (q.length < 3) {
      setSugerencias([]);
      setAbierto(false);
      return;
    }
    setCargando(true);
    // Anteponer la comuna al texto sesga la búsqueda a esa zona (ej. "…, Santiago").
    const zona = contexto?.trim();
    const consulta = zona ? `${q}, ${zona}` : q;
    timer.current = window.setTimeout(async () => {
      try {
        const rs = await geocode(consulta);
        setSugerencias(rs);
        setAbierto(rs.length > 0);
      } catch {
        setSugerencias([]);
        setAbierto(false);
      } finally {
        setCargando(false);
      }
    }, 350);
    return () => window.clearTimeout(timer.current);
  }, [value, contexto]);

  const elegir = (r: GeoResultado) => {
    supprimirBusqueda.current = true;
    onPick(r);
    setAbierto(false);
    setSugerencias([]);
  };

  return (
    <Box position="relative" ref={boxRef}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => sugerencias.length > 0 && setAbierto(true)}
        placeholder={placeholder ?? "Escribe la dirección…"}
        autoComplete="off"
        {...fieldProps}
      />
      {cargando && (
        <Box position="absolute" top="50%" right="3" transform="translateY(-50%)">
          <Spinner size="xs" color="brand.primary" />
        </Box>
      )}
      {abierto && sugerencias.length > 0 && (
        <VStack
          align="stretch"
          gap="0"
          position="absolute"
          top="calc(100% + 4px)"
          left="0"
          right="0"
          zIndex="20"
          bg="bg.elevated"
          border="1px solid"
          borderColor="border.brand"
          borderRadius="lg"
          boxShadow="glass"
          overflow="hidden"
          maxH="260px"
          overflowY="auto"
        >
          {sugerencias.map((r, i) => (
            <Box
              key={`${r.label}-${i}`}
              px="3"
              py="2.5"
              cursor="pointer"
              display="flex"
              gap="2.5"
              alignItems="start"
              _hover={{ bg: "bg.muted" }}
              onMouseDown={(e) => {
                e.preventDefault();
                elegir(r);
              }}
            >
              <Box color="brand.300" mt="0.5" flexShrink="0">
                <MapPin size={15} />
              </Box>
              <Text fontSize="sm" color="fg.default" lineClamp={2}>
                {r.label}
              </Text>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};
