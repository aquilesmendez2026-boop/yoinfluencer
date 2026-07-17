import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  NativeSelect,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Camera, Mail, Shield, Save } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { AppHeader } from "../organisms/AppHeader";
import { useAuth } from "../providers/AuthProvider";
import { updateProfile, uploadAvatar } from "../services/profile";
import { paises } from "../data/paises";

const fieldProps = {
  bg: "bg.muted",
  border: "1px solid",
  borderColor: "border.subtle",
  borderRadius: "lg",
  color: "fg.default",
  size: "lg" as const,
  px: "4",
  _hover: { borderColor: "border.neon" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #22d3ee", outline: "none" },
};

const Label = ({ children }: { children: string }) => (
  <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase" letterSpacing="wide" mb="1.5">
    {children}
  </Text>
);

export const AccountPage = () => {
  const { user, profile, role, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [apodo, setApodo] = useState("");
  const [pais, setPais] = useState("");
  const [region, setRegion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setApodo(profile?.apodo ?? "");
    setPais(profile?.pais ?? "");
    setRegion(profile?.region ?? "");
    setTelefono(profile?.telefono ?? "");
  }, [profile]);

  const name = user?.displayName ?? "Cuenta";
  const initial = (profile?.apodo || name).charAt(0).toUpperCase();
  const avatarSrc = profile?.photoURL ?? user?.photoURL ?? null;
  const incompleto = !(profile?.apodo && profile?.pais && profile?.telefono);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      await updateProfile({ apodo, pais, region, telefono });
      await refreshProfile();
      setMsg("✓ Perfil actualizado");
    } catch {
      setMsg("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    setUploading(true);
    try {
      const key = await uploadAvatar(file);
      await updateProfile({ avatarKey: key });
      await refreshProfile();
      setMsg("✓ Foto actualizada");
    } catch {
      setMsg("No se pudo subir la foto.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Box bg="bg.canvas" color="fg.default" minH="100vh">
      <AppHeader />

      <Container maxW="720px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
        <VStack align="stretch" gap="8">
          <Heading as="h1" size={{ base: "2xl", md: "3xl" }} fontWeight="900" letterSpacing="tighter">
            Mi perfil
          </Heading>

          {incompleto && (
            <Flex
              gap="3"
              align="center"
              p="4"
              borderRadius="xl"
              bg="rgba(245, 158, 11, 0.1)"
              border="1px solid"
              borderColor="rgba(245, 158, 11, 0.3)"
            >
              <Text fontSize="sm" color="amber.200">
                Completa tu perfil (apodo, país y teléfono) para una mejor experiencia.
              </Text>
            </Flex>
          )}

          <GlassPanel p={{ base: "6", md: "8" }}>
            <VStack as="form" onSubmit={handleSave} align="stretch" gap="6">
              {/* Avatar */}
              <HStack gap="5">
                <Box position="relative">
                  {avatarSrc ? (
                    <Image src={avatarSrc} alt={name} boxSize="88px" borderRadius="full" objectFit="cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Flex
                      align="center"
                      justify="center"
                      boxSize="88px"
                      borderRadius="full"
                      backgroundImage="linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)"
                      color="fg.inverted"
                      fontWeight="800"
                      fontSize="3xl"
                    >
                      {initial}
                    </Flex>
                  )}
                  <IconButton
                    aria-label="Cambiar foto"
                    onClick={() => fileRef.current?.click()}
                    position="absolute"
                    bottom="0"
                    right="0"
                    boxSize="30px"
                    minW="30px"
                    borderRadius="full"
                    bg="brand.primary"
                    color="fg.inverted"
                    border="2px solid"
                    borderColor="bg.canvas"
                    _hover={{ opacity: 0.9 }}
                  >
                    {uploading ? <Spinner size="xs" /> : <Camera size={15} />}
                  </IconButton>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
                </Box>
                <VStack align="start" gap="1">
                  <Heading as="h2" size="lg">
                    {profile?.apodo || name}
                  </Heading>
                  {role && (
                    <Badge bg="bg.surface" color="brand.primary" border="1px solid" borderColor="border.neon" borderRadius="full" px="3" textTransform="capitalize">
                      {role}
                    </Badge>
                  )}
                  <Text fontSize="xs" color="fg.subtle">
                    Toca la cámara para cambiar tu foto.
                  </Text>
                </VStack>
              </HStack>

              <Box h="1px" bg="border.subtle" />

              {/* Campos editables */}
              <Box>
                <Label>Apodo</Label>
                <Input placeholder="¿Cómo te dicen?" value={apodo} onChange={(e) => setApodo(e.target.value)} {...fieldProps} />
              </Box>
              <Flex gap="4" direction={{ base: "column", sm: "row" }}>
                <Box flex="1">
                  <Label>País</Label>
                  <NativeSelect.Root size="lg">
                    <NativeSelect.Field value={pais} onChange={(e) => setPais(e.target.value)} {...fieldProps}>
                      <option value="" style={{ background: "#161626" }}>Selecciona…</option>
                      {paises.map((p) => (
                        <option key={p} value={p} style={{ background: "#161626" }}>
                          {p}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Box>
                <Box flex="1">
                  <Label>Región</Label>
                  <Input placeholder="Región / estado" value={region} onChange={(e) => setRegion(e.target.value)} {...fieldProps} />
                </Box>
              </Flex>
              <Box>
                <Label>Teléfono</Label>
                <Input placeholder="+56 9 1234 5678" value={telefono} onChange={(e) => setTelefono(e.target.value)} {...fieldProps} />
              </Box>

              {/* Solo lectura */}
              <VStack align="stretch" gap="2" pt="1">
                <HStack justify="space-between">
                  <HStack gap="2" color="fg.subtle"><Mail size={15} /><Text fontSize="sm">Correo</Text></HStack>
                  <Text fontSize="sm" color="fg.muted">{user?.email ?? "—"}</Text>
                </HStack>
                <HStack justify="space-between">
                  <HStack gap="2" color="fg.subtle"><Shield size={15} /><Text fontSize="sm">Rol</Text></HStack>
                  <Text fontSize="sm" color="fg.muted" textTransform="capitalize">{role ?? "—"}</Text>
                </HStack>
              </VStack>

              {msg && (
                <Text fontSize="sm" color={msg.startsWith("✓") ? "brand.primary" : "red.400"}>
                  {msg}
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
                loading={saving}
                alignSelf="start"
                px="8"
              >
                <Save size={18} style={{ marginRight: "8px" }} />
                Guardar cambios
              </Button>
            </VStack>
          </GlassPanel>
        </VStack>
      </Container>
    </Box>
  );
};
