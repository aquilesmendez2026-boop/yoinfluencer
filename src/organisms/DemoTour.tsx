import { useEffect, useState } from "react";
import { Box, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { ArrowLeft, ArrowRight, Compass, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Paso {
  ruta: string;
  titulo: string;
  texto: string;
}

const PASOS: Paso[] = [
  {
    ruta: "/",
    titulo: "Bienvenido a la demo",
    texto:
      "Estás recorriendo modo piña con datos de ejemplo. Nada de lo que veas acá es real y no se guarda ningún cambio. Te muestro lo que se puede hacer.",
  },
  {
    ruta: "/",
    titulo: "La portada",
    texto:
      "La home reúne lo último del medio: secciones, artículos recientes, el staff y la agenda.",
  },
  {
    ruta: "/secciones",
    titulo: "Secciones temáticas",
    texto:
      "El contenido se organiza por secciones, como un periódico: vida swinger, shibari, bondage, BDSM, arte erótico y clubs.",
  },
  {
    ruta: "/contenidos",
    titulo: "Artículos",
    texto:
      "Cada artículo pertenece a una sección y lo escribe un creador del staff. Acá se listan todos los publicados.",
  },
  {
    ruta: "/influencers",
    titulo: "El staff",
    texto:
      "Los creadores del medio. Cada uno tiene su página pública con su bio, sus secciones y sus artículos.",
  },
  {
    ruta: "/lugares",
    titulo: "Clubs y locales",
    texto:
      "Un directorio de clubs, saunas y bares del ambiente, con horario, contacto y sus eventos.",
  },
  {
    ruta: "/agenda",
    titulo: "Agenda",
    texto:
      "Todos los eventos en un calendario, incluidos los que publican los propios locales.",
  },
  {
    ruta: "/escribir",
    titulo: "Escribir (staff)",
    texto:
      "Los creadores publican y editan sus artículos desde acá, en las secciones que les asignaron.",
  },
  {
    ruta: "/mi-local",
    titulo: "Mi local (dueños)",
    texto:
      "Un dueño de local administra su ficha y carga sus fechas de eventos, sin ser parte del staff.",
  },
  {
    ruta: "/admin",
    titulo: "Panel de administración",
    texto:
      "Admins y super admin gestionan secciones, aprueban locales y publican en la agenda. El super admin además gestiona los usuarios y sus roles.",
  },
  {
    ruta: "/",
    titulo: "Eso es todo",
    texto:
      "Cuando quieras usarlo de verdad, sal de la demo e inicia sesión. ¡Gracias por el paseo!",
  },
];

/**
 * Paseo guiado del modo demo. Es un tour "narrado por pasos": cambia de ruta en
 * cada paso y explica qué se ve, sin anclarse a un elemento concreto del DOM.
 * El overlay atenúa el fondo pero deja pasar los clics/scroll (pointer-events:none);
 * solo el panel es interactivo. Cerrarlo no sale de la demo: el banner sigue.
 */
export const DemoTour = () => {
  const navigate = useNavigate();
  const [indice, setIndice] = useState(0);
  const [cerrado, setCerrado] = useState(false);

  const paso = PASOS[indice];
  const esUltimo = indice === PASOS.length - 1;
  const esPrimero = indice === 0;

  // Al cambiar de paso, navegamos a su ruta con un pequeño delay para que cargue.
  useEffect(() => {
    if (cerrado) return;
    const t = window.setTimeout(() => navigate(paso.ruta), 120);
    return () => window.clearTimeout(t);
  }, [indice, cerrado, navigate, paso.ruta]);

  if (cerrado) return null;

  const cerrar = () => setCerrado(true);

  return (
    <Box
      position="fixed"
      inset="0"
      zIndex="2500"
      bg="rgba(0, 0, 0, 0.55)"
      pointerEvents="none"
      display="flex"
      alignItems={{ base: "flex-end", md: "flex-end" }}
      justifyContent="center"
      p={{ base: "4", md: "8" }}
    >
      <VStack
        pointerEvents="auto"
        align="stretch"
        gap="4"
        w="full"
        maxW="440px"
        bg="bg.surface"
        backdropFilter="blur(14px)"
        border="1px solid"
        borderColor="border.brand"
        borderRadius="2xl"
        boxShadow="glass"
        color="fg.default"
        p={{ base: "5", md: "6" }}
      >
        <HStack justify="space-between" align="center">
          <HStack gap="2" color="brand.400">
            <Compass size={16} />
            <Text fontSize="xs" fontWeight="700" letterSpacing="wide" textTransform="uppercase">
              Paseo guiado
            </Text>
          </HStack>
          <HStack gap="3">
            <Text fontSize="xs" color="fg.subtle" fontWeight="600">
              {indice + 1} / {PASOS.length}
            </Text>
            <Button
              onClick={cerrar}
              size="xs"
              variant="ghost"
              color="fg.muted"
              px="1"
              minW="auto"
              _hover={{ color: "fg.default", bg: "border.subtle" }}
              aria-label="Saltar tour"
            >
              <X size={15} />
            </Button>
          </HStack>
        </HStack>

        <VStack align="stretch" gap="2">
          <Heading as="h2" size="md" fontWeight="800">
            {paso.titulo}
          </Heading>
          <Text color="fg.muted" fontSize="sm" lineHeight="tall">
            {paso.texto}
          </Text>
        </VStack>

        <HStack justify="space-between" align="center" pt="1" gap="3">
          <Button
            onClick={cerrar}
            size="sm"
            variant="ghost"
            color="fg.subtle"
            px="2"
            _hover={{ color: "fg.muted" }}
          >
            Saltar tour
          </Button>
          <HStack gap="2">
            <Button
              onClick={() => setIndice((i) => Math.max(0, i - 1))}
              size="sm"
              variant="outline"
              borderColor="border.subtle"
              color="fg.default"
              borderRadius="full"
              disabled={esPrimero}
              _hover={{ bg: "border.subtle" }}
            >
              <ArrowLeft size={14} style={{ marginRight: "4px" }} />
              Atrás
            </Button>
            {esUltimo ? (
              <Button
                onClick={cerrar}
                size="sm"
                color="fg.inverted"
                fontWeight="700"
                borderRadius="full"
                backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
                _hover={{ opacity: 0.92, boxShadow: "brand" }}
              >
                Terminar
              </Button>
            ) : (
              <Button
                onClick={() => setIndice((i) => Math.min(PASOS.length - 1, i + 1))}
                size="sm"
                color="fg.inverted"
                fontWeight="700"
                borderRadius="full"
                backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
                _hover={{ opacity: 0.92, boxShadow: "brand" }}
              >
                Siguiente
                <ArrowRight size={14} style={{ marginLeft: "4px" }} />
              </Button>
            )}
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
};
