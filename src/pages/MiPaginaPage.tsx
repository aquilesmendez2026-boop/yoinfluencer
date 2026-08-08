import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
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
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Camera, ExternalLink, Save } from "lucide-react";
import { GlassPanel } from "../atoms/GlassPanel";
import { AppHeader } from "../organisms/AppHeader";
import { useAuth } from "../providers/AuthProvider";
import { updateProfile, uploadAvatar } from "../services/profile";
import { listSecciones, type Seccion } from "../services/secciones";
import { paises } from "../data/paises";

const fieldProps = {
  bg: "bg.muted",
  border: "1px solid",
  borderColor: "border.subtle",
  borderRadius: "lg",
  color: "fg.default",
  size: "lg" as const,
  px: "4",
  _hover: { borderColor: "border.brand" },
  _focusVisible: { borderColor: "brand.primary", boxShadow: "0 0 0 1px #12b76a", outline: "none" },
};

const Label = ({ children }: { children: string }) => (
  <Text fontSize="xs" fontWeight="700" color="fg.muted" textTransform="uppercase" letterSpacing="wide" mb="1.5">
    {children}
  </Text>
);

export const MiPaginaPage = () => {
  const { user, profile, isInfluencer, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [alias, setAlias] = useState("");
  const [bio, setBio] = useState("");
  const [pais, setPais] = useState("");
  const [instagram, setInstagram] = useState("");
  const [seguidores, setSeguidores] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [secciones, setSecciones] = useState<Seccion[]>([]);

  useEffect(() => {
    setAlias(profile?.alias ?? "");
    setBio(profile?.bio ?? "");
    setPais(profile?.pais ?? "");
    setInstagram(profile?.instagram ?? "");
    setSeguidores(profile?.seguidores != null ? String(profile.seguidores) : "");
  }, [profile]);

  useEffect(() => {
    listSecciones()
      .then(setSecciones)
      .catch(() => setSecciones([]));
  }, []);

  if (!isInfluencer) {
    return (
      <Box bg="bg.canvas" color="fg.default" minH="100vh">
        <AppHeader />
        <Container maxW="720px" px={{ base: "5", md: "8" }} py={{ base: "12", md: "16" }}>
          <GlassPanel p={{ base: "6", md: "8" }}>
            <VStack align="start" gap="2">
              <Heading as="h1" size="xl" fontWeight="800">
                Solo para el staff
              </Heading>
              <Text color="fg.muted">
                Esta sección es para el equipo de modopiña. Si crees que deberías tener acceso,
                habla con un administrador.
              </Text>
            </VStack>
          </GlassPanel>
        </Container>
      </Box>
    );
  }

  const name = user?.displayName ?? "Mi página";
  const initial = (profile?.alias || name).charAt(0).toUpperCase();
  const avatarSrc = profile?.photoURL ?? user?.photoURL ?? null;

  const misSecciones = (profile?.secciones ?? [])
    .map((id) => secciones.find((s) => s.id === id) ?? { id, nombre: id, color: "#12b76a" })
    .filter(Boolean);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      await updateProfile({ alias, bio, pais, instagram, seguidores: seguidores === "" ? 0 : Number(seguidores) });
      await refreshProfile();
      setMsg("✓ Página actualizada");
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
          <VStack align="start" gap="2">
            <Heading as="h1" size={{ base: "2xl", md: "3xl" }} fontWeight="900" letterSpacing="tighter">
              Mi página
            </Heading>
            <Text color="fg.muted">
              Así te ve el público en modopiña. Cuida tu alias, tu foto y tu biografía.
            </Text>
            {user?.uid && (
              <Button
                asChild
                size="sm"
                variant="outline"
                borderColor="border.subtle"
                borderRadius="full"
                color="fg.default"
                _hover={{ borderColor: "border.brand", color: "brand.300", textDecoration: "none" }}
              >
                <RouterLink to={`/influencer/${user.uid}`}>
                  <ExternalLink size={15} style={{ marginRight: "6px" }} /> Ver mi página pública
                </RouterLink>
              </Button>
            )}
          </VStack>

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
                      backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
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
                    {profile?.alias || name}
                  </Heading>
                  <Text fontSize="xs" color="fg.subtle">
                    Toca la cámara para cambiar tu foto.
                  </Text>
                </VStack>
              </HStack>

              <Box h="1px" bg="border.subtle" />

              {/* Campos editables */}
              <Box>
                <Label>Alias público</Label>
                <Input placeholder="Tu nombre en el medio" value={alias} onChange={(e) => setAlias(e.target.value)} {...fieldProps} />
              </Box>
              <Box>
                <Label>Biografía</Label>
                <Textarea
                  placeholder="Contá quién sos y de qué escribís…"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  {...fieldProps}
                  py="3"
                />
              </Box>
              <Box>
                <Label>Instagram</Label>
                <Input placeholder="@tu_usuario o link a tu perfil" value={instagram} onChange={(e) => setInstagram(e.target.value)} {...fieldProps} />
              </Box>
              <Box>
                <Label>Seguidores de Instagram</Label>
                <Input type="number" min={0} placeholder="Ej. 12500" value={seguidores} onChange={(e) => setSeguidores(e.target.value)} {...fieldProps} />
                <Text fontSize="xs" color="fg.subtle" mt="1.5">Se muestra en tu card. Lo cargas a mano (Instagram ya no permite leerlo automáticamente).</Text>
              </Box>
              <Box>
                <Label>País</Label>
                <NativeSelect.Root size="lg">
                  <NativeSelect.Field value={pais} onChange={(e) => setPais(e.target.value)} {...fieldProps}>
                    <option value="" style={{ background: "#0f1210" }}>Selecciona…</option>
                    {paises.map((p) => (
                      <option key={p} value={p} style={{ background: "#0f1210" }}>
                        {p}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Box>

              <Box h="1px" bg="border.subtle" />

              {/* Secciones asignadas (solo lectura) */}
              <VStack align="start" gap="2.5">
                <Label>Mis secciones</Label>
                {misSecciones.length === 0 ? (
                  <Text fontSize="sm" color="fg.subtle">
                    Todavía no tienes secciones asignadas.
                  </Text>
                ) : (
                  <HStack gap="2.5" flexWrap="wrap">
                    {misSecciones.map((s) => (
                      <HStack
                        key={s.id}
                        gap="2"
                        bg="bg.muted"
                        border="1px solid"
                        borderColor="border.subtle"
                        borderRadius="full"
                        px="3.5"
                        py="1.5"
                      >
                        <Box w="2.5" h="2.5" borderRadius="full" bg={s.color || "#12b76a"} />
                        <Text fontSize="sm" fontWeight="600">
                          {s.nombre}
                        </Text>
                      </HStack>
                    ))}
                  </HStack>
                )}
                <Text fontSize="xs" color="fg.subtle">
                  Las secciones las asigna un administrador.
                </Text>
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
                backgroundImage="linear-gradient(135deg, #12b76a 0%, #054f31 100%)"
                _hover={{ opacity: 0.92, boxShadow: "brand" }}
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
