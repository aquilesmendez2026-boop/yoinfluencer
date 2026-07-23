import { Box, Button, HStack, Text } from "@chakra-ui/react";
import { Eye, X } from "lucide-react";
import { useDemo } from "../providers/DemoProvider";

/** Altura fija del banner; el Navbar (fixed) se desplaza por esta medida en demo. */
export const DEMO_BANNER_H = "48px";

/** Franja fija que recuerda que se está en modo demo (solo lectura) y permite salir. */
export const DemoBanner = () => {
  const { exitDemo } = useDemo();
  return (
    <Box
      position="sticky"
      top="0"
      zIndex="2000"
      h={DEMO_BANNER_H}
      display="flex"
      alignItems="center"
      bg="brand.700"
      color="fg.default"
      borderBottom="1px solid"
      borderColor="border.brand"
      px={{ base: "4", md: "6" }}
    >
      <HStack w="full" justify="center" gap="3" flexWrap="nowrap">
        <HStack gap="2" color="brand.200">
          <Eye size={15} />
          <Text fontSize="sm" fontWeight="700">
            Modo demo · solo lectura
          </Text>
        </HStack>
        <Text fontSize="sm" color="fg.muted" display={{ base: "none", md: "block" }}>
          Estás recorriendo la plataforma con datos de ejemplo. No se guarda ningún cambio.
        </Text>
        <Button
          onClick={exitDemo}
          size="xs"
          variant="outline"
          borderColor="border.brand"
          color="fg.default"
          borderRadius="full"
          _hover={{ bg: "brand.600" }}
        >
          <X size={13} style={{ marginRight: "4px" }} />
          Salir de la demo
        </Button>
      </HStack>
    </Box>
  );
};
