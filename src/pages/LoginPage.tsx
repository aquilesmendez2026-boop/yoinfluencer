import { useState, type FormEvent } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Mail, Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react";
import { BackgroundBlobs } from "../atoms/BackgroundBlobs";
import { Logo } from "../atoms/Logo";
import { useAuth } from "../providers/AuthProvider";
import { useDemo } from "../providers/DemoProvider";
import { authErrorMessage } from "../services/authErrors";

type Mode = "login" | "register" | "forgot";

// Estilo compartido de los inputs (con padding interno correcto).
const inputProps = {
  size: "lg" as const,
  borderRadius: "xl",
  bg: "bg.muted",
  border: "1px solid",
  borderColor: "border.subtle",
  px: "4",
  color: "fg.default",
  _placeholder: { color: "fg.subtle" },
  _hover: { borderColor: "border.brand" },
  _focusVisible: {
    borderColor: "brand.primary",
    boxShadow: "0 0 0 1px #12b76a",
    outline: "none",
  },
};

export const LoginPage = () => {
  const { login, loginWithEmail, registerWithEmail, resetPassword } = useAuth();
  const { enterDemo } = useDemo();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const switchMode = (m: Mode) => {
    resetMessages();
    setMode(m);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else if (mode === "register") {
        await registerWithEmail(name, email, password);
      } else {
        await resetPassword(email);
        setInfo("Te enviamos un correo para restablecer tu contraseña.");
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    resetMessages();
    setSubmitting(true);
    try {
      await login();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const titles: Record<Mode, { title: string; subtitle: string }> = {
    login: {
      title: "Ingresa con tus credenciales",
      subtitle: "Inicia sesión para entrar a la comunidad.",
    },
    register: {
      title: "Crea tu cuenta",
      subtitle: "Regístrate para leer y ser parte de la comunidad.",
    },
    forgot: {
      title: "Recupera tu acceso",
      subtitle: "Te enviaremos un enlace para restablecer tu contraseña.",
    },
  };

  const card = (
    <Box
      as="form"
      onSubmit={handleSubmit}
      w="full"
      maxW="md"
      p={{ base: "7", md: "9" }}
      bg="bg.surface"
      backdropFilter="blur(20px)"
      borderRadius="2xl"
      border="1px solid"
      borderColor="border.subtle"
      boxShadow="glass"
    >
      <VStack gap="4" align="stretch">
        <VStack gap="1" textAlign="center">
          <Heading size="lg" fontWeight="800">
            {titles[mode].title}
          </Heading>
          <Text fontSize="sm" color="fg.muted">
            {titles[mode].subtitle}
          </Text>
        </VStack>

        {mode === "register" && (
          <Input
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            {...inputProps}
          />
        )}

        <Input
          placeholder="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          {...inputProps}
        />

        {mode !== "forgot" && (
          <Box position="relative">
            <Input
              placeholder="Contraseña"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              pr="12"
              {...inputProps}
            />
            <Button
              position="absolute"
              right="2"
              top="50%"
              transform="translateY(-50%)"
              variant="ghost"
              size="sm"
              color="fg.subtle"
              onClick={() => setShowPassword((v) => !v)}
              type="button"
              zIndex="1"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </Box>
        )}

        {mode === "login" && (
          <Flex justify="flex-end">
            <Button
              variant="plain"
              size="xs"
              color="brand.primary"
              onClick={() => switchMode("forgot")}
              type="button"
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </Flex>
        )}

        {error && (
          <Text color="red.400" fontSize="sm" textAlign="center">
            {error}
          </Text>
        )}
        {info && (
          <Text color="brand.primary" fontSize="sm" textAlign="center">
            {info}
          </Text>
        )}

        <Button
          type="submit"
          size="xl"
          h="14"
          borderRadius="xl"
          border="none"
          color="fg.inverted"
          fontWeight="700"
          backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
          _hover={{ opacity: 0.92, boxShadow: "brand" }}
          _focusVisible={{ outline: "none", boxShadow: "brand" }}
          transition="all 0.3s"
          loading={submitting}
        >
          {mode === "login" && (
            <>
              <Mail size={20} style={{ marginRight: "8px" }} />
              Iniciar sesión con Email
            </>
          )}
          {mode === "register" && "Crear cuenta"}
          {mode === "forgot" && "Enviar enlace"}
        </Button>

        {mode !== "forgot" && (
          <>
            <Flex align="center" gap="4" py="1">
              <Box flex="1" h="1px" bg="border.subtle" />
              <Text fontSize="xs" color="fg.subtle">
                o
              </Text>
              <Box flex="1" h="1px" bg="border.subtle" />
            </Flex>

            <Button
              size="xl"
              h="14"
              borderRadius="xl"
              variant="outline"
              borderColor="border.subtle"
              color="fg.default"
              bg="bg.elevated"
              onClick={handleGoogle}
              type="button"
              disabled={submitting}
              _hover={{ borderColor: "border.brand", bg: "bg.elevated" }}
              transition="all 0.3s"
            >
              <LogIn size={20} style={{ marginRight: "8px" }} />
              Ingresa con Google
            </Button>
          </>
        )}

        {/* Recorrer la plataforma sin cuenta (solo lectura). */}
        <Button
          onClick={enterDemo}
          type="button"
          h="12"
          borderRadius="xl"
          variant="outline"
          borderColor="border.brand"
          color="brand.300"
          bg="bg.surface"
          _hover={{ boxShadow: "brand", color: "brand.200" }}
          transition="all 0.3s"
        >
          <Eye size={18} style={{ marginRight: "8px" }} />
          Ver demo — recorrer sin cuenta
        </Button>

        <Box textAlign="center" pt="1">
          {mode === "login" && (
            <Button variant="plain" size="sm" color="fg.muted" onClick={() => switchMode("register")} type="button">
              ¿No tienes cuenta? <Text as="span" color="brand.primary" ml="1" fontWeight="600">Regístrate</Text>
            </Button>
          )}
          {mode === "register" && (
            <Button variant="plain" size="sm" color="fg.muted" onClick={() => switchMode("login")} type="button">
              ¿Ya tienes cuenta? <Text as="span" color="brand.primary" ml="1" fontWeight="600">Inicia sesión</Text>
            </Button>
          )}
          {mode === "forgot" && (
            <Button variant="plain" size="sm" color="fg.muted" onClick={() => switchMode("login")} type="button">
              <ArrowLeft size={14} style={{ marginRight: "6px" }} />
              Volver a iniciar sesión
            </Button>
          )}
        </Box>
      </VStack>
    </Box>
  );

  return (
    <Flex
      minH="100vh"
      bg="bg.canvas"
      color="fg.default"
      direction={{ base: "column", md: "row" }}
      position="relative"
      overflow="hidden"
    >
      <BackgroundBlobs />

      {/* Logo arriba a la izquierda */}
      <Box position="absolute" top="6" left={{ base: "5", md: "8" }} zIndex="2">
        <Logo fontSize="xl" />
      </Box>

      {/* Mitad izquierda: hero centrado */}
      <Flex
        flex="1"
        align="center"
        justify="center"
        px={{ base: "6", md: "10" }}
        py={{ base: "24", md: "10" }}
        zIndex="1"
      >
        <VStack align="center" textAlign="center" gap="6" maxW="md">
          <Heading
            as="h1"
            fontSize={{ base: "5xl", md: "6xl", lg: "7xl" }}
            fontWeight="900"
            letterSpacing="tighter"
            lineHeight="0.95"
          >
            <Box as="span" color="fg.default">
              SE BUSCA{" "}
            </Box>
            <Box
              as="span"
              backgroundImage="linear-gradient(135deg, #6ce9a6 0%, #12b76a 100%)"
              backgroundClip="text"
              color="transparent"
            >
              NOMBRE!!!
            </Box>
          </Heading>
          <Box
            h="3px"
            w="72px"
            borderRadius="full"
            backgroundImage="linear-gradient(90deg, #6ce9a6 0%, #12b76a 100%)"
          />
          <Text fontSize={{ base: "md", md: "lg" }} color="fg.muted" maxW="sm">
            Entra a la comunidad: artículos por sección, creadores y contenido exclusivo,
            descargables solo para miembros.
          </Text>
        </VStack>
      </Flex>

      {/* Mitad derecha: tarjeta centrada */}
      <Flex
        flex="1"
        align="center"
        justify="center"
        px={{ base: "6", md: "10" }}
        pb={{ base: "16", md: "10" }}
        pt={{ base: "0", md: "10" }}
        zIndex="1"
      >
        {card}
      </Flex>
    </Flex>
  );
};
