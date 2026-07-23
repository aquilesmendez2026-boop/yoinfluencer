import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Box, Button, Center, Flex, HStack, Input, Spinner, Text, VStack } from "@chakra-ui/react";
import { ArrowLeft, Lock, Check, ShieldCheck } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { crearPreferencia, pagarMock } from "../services/suscripcion";

const clp = (n: number) => `$${n.toLocaleString("es-CL")}`;

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [amount, setAmount] = useState(4990);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    crearPreferencia().then((p) => setAmount(p.amount)).catch(() => {});
  }, []);

  const pagar = async () => {
    setPaying(true);
    try {
      await pagarMock();
      await refreshProfile();
      setDone(true);
      setTimeout(() => navigate("/premium"), 1600);
    } catch {
      setPaying(false);
    }
  };

  return (
    <Center bg="bg.canvas" minH="100vh" px="4" py="10">
      <Box w="full" maxW="420px">
        {/* Barra tipo checkout */}
        <Flex justify="space-between" align="center" mb="4">
          <Button variant="plain" size="sm" color="fg.subtle" onClick={() => navigate("/premium")}>
            <ArrowLeft size={16} style={{ marginRight: "6px" }} /> Volver
          </Button>
          <Badge bg="rgba(245,158,11,0.15)" color="amber.300" border="1px solid" borderColor="rgba(245,158,11,0.4)" borderRadius="full" px="3">
            Pago simulado
          </Badge>
        </Flex>

        {/* Tarjeta estilo MercadoPago (clara) */}
        <Box bg="white" color="#1a1a2e" borderRadius="2xl" overflow="hidden" boxShadow="2xl">
          {/* Header MP */}
          <Flex bg="#009ee3" color="white" px="6" py="4" align="center" gap="2">
            <ShieldCheck size={20} />
            <Text fontWeight="800" fontSize="lg" letterSpacing="tight">MercadoPago</Text>
            <Text ml="auto" fontSize="xs" opacity={0.9}>Checkout</Text>
          </Flex>

          {done ? (
            <VStack gap="3" py="12" px="6" textAlign="center">
              <Flex align="center" justify="center" w="64px" h="64px" borderRadius="full" bg="#00a650" color="white">
                <Check size={34} />
              </Flex>
              <Text fontWeight="800" fontSize="xl">¡Pago aprobado!</Text>
              <Text color="#555" fontSize="sm">Activando tu membresía premium…</Text>
              <Spinner color="#009ee3" size="sm" mt="2" />
            </VStack>
          ) : (
            <VStack align="stretch" gap="5" p="6">
              {/* Resumen */}
              <Flex justify="space-between" align="center" bg="#f5f7fa" borderRadius="lg" p="4">
                <Box>
                  <Text fontWeight="700">Yo Influencer Premium</Text>
                  <Text fontSize="xs" color="#666">Suscripción mensual</Text>
                </Box>
                <Text fontWeight="800" fontSize="lg">{clp(amount)}</Text>
              </Flex>

              {/* Formulario decorativo (mock, no funcional) */}
              <VStack align="stretch" gap="3">
                <Text fontSize="xs" fontWeight="700" color="#666" textTransform="uppercase">Tarjeta</Text>
                <Input placeholder="1234 5678 9012 3456" bg="white" borderColor="#dcdfe4" color="#1a1a2e" _placeholder={{ color: "#aaa" }} readOnly defaultValue="4509 9535 6623 3704" />
                <HStack>
                  <Input placeholder="MM/AA" bg="white" borderColor="#dcdfe4" color="#1a1a2e" _placeholder={{ color: "#aaa" }} readOnly defaultValue="11/30" />
                  <Input placeholder="CVV" bg="white" borderColor="#dcdfe4" color="#1a1a2e" _placeholder={{ color: "#aaa" }} readOnly defaultValue="123" />
                </HStack>
                <Text fontSize="xs" color="#888">Datos de prueba precargados — no se realiza ningún cobro.</Text>
              </VStack>

              <Button onClick={pagar} loading={paying} h="12" borderRadius="lg" bg="#009ee3" color="white" fontWeight="800" _hover={{ bg: "#008ecf" }}>
                <Lock size={16} style={{ marginRight: "8px" }} />
                Pagar {clp(amount)}
              </Button>
              <HStack gap="1.5" justify="center" color="#888">
                <Lock size={12} />
                <Text fontSize="xs">Pago seguro (demostración)</Text>
              </HStack>
            </VStack>
          )}
        </Box>
      </Box>
    </Center>
  );
};
