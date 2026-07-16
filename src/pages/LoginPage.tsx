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
import { authErrorMessage } from "../services/authErrors";

type Mode = "login" | "register" | "forgot";

export const LoginPage = () => {
  const { login, loginWithEmail, registerWithEmail, resetPassword } = useAuth();

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
      subtitle: "Inicia sesión para entrar a la comunidad Ni Tan Mal.",
    },
    register: {
      title: "Crea tu cuenta",
      subtitle: "Únete y accede al contenido exclusivo del podcast.",
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
            size="lg"
            borderRadius="xl"
            bg="bg.muted"
            borderColor="border.subtle"
            required
          />
        )}

        <Input
          placeholder="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          size="lg"
          borderRadius="xl"
          bg="bg.muted"
          borderColor="border.subtle"
          required
        />

        {mode !== "forgot" && (
          <Box position="relative">
            <Input
              placeholder="Contraseña"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="lg"
              borderRadius="xl"
              bg="bg.muted"
              borderColor="border.subtle"
              pr="12"
              required
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
          color="fg.inverted"
          fontWeight="700"
          backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)"
          _hover={{ opacity: 0.92, boxShadow: "neon" }}
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
              _hover={{ borderColor: "border.neon" }}
              transition="all 0.3s"
            >
              <LogIn size={20} style={{ marginRight: "8px" }} />
              Ingresa con Google
            </Button>
          </>
        )}

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
      align="center"
      justify="center"
      position="relative"
      overflow="hidden"
      px={{ base: "5", md: "10" }}
      py={{ base: "10", md: "0" }}
      gap={{ base: "10", md: "8" }}
    >
      <BackgroundBlobs />

      {/* Logo arriba a la izquierda */}
      <Box position="absolute" top="6" left={{ base: "5", md: "8" }} zIndex="2">
        <Logo fontSize="xl" />
      </Box>

      {/* Hero izquierdo */}
      <Flex
        flex="1"
        direction="column"
        justify="center"
        align={{ base: "center", md: "start" }}
        textAlign={{ base: "center", md: "left" }}
        maxW={{ md: "lg" }}
        zIndex="1"
        pt={{ base: "10", md: "0" }}
      >
        <Heading
          as="h1"
          fontSize={{ base: "5xl", md: "6xl", lg: "7xl" }}
          fontWeight="900"
          letterSpacing="tighter"
          lineHeight="0.95"
        >
          <Box as="span" color="fg.default">
            NI TAN{" "}
          </Box>
          <Box
            as="span"
            backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)"
            backgroundClip="text"
            color="transparent"
          >
            MAL
          </Box>
        </Heading>
        <Box
          borderLeft={{ md: "3px solid" }}
          borderColor={{ md: "brand.primary" }}
          pl={{ md: "5" }}
          mt="6"
        >
          <Text fontSize={{ base: "md", md: "lg" }} color="fg.muted" maxW="sm">
            Entra a la comunidad: episodios exclusivos, detrás de cámaras y
            descargables solo para miembros.
          </Text>
        </Box>
      </Flex>

      {/* Tarjeta de login derecha */}
      <Flex flex="1" justify="center" align="center" w="full" zIndex="1">
        {card}
      </Flex>
    </Flex>
  );
};
