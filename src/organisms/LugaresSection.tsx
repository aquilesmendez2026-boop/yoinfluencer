import { useEffect, useMemo, useState } from "react";
import { Button, Center, HStack, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { Section } from "../atoms/Section";
import { SectionTitle } from "../atoms/SectionTitle";
import { LugarCard } from "../molecules/LugarCard";
import { CATEGORIAS, listLugares, type CategoriaLugar, type Lugar } from "../services/lugares";

type Filtro = CategoriaLugar | "todos";

const ChipFiltro = ({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Button
    onClick={onClick}
    size="sm"
    borderRadius="full"
    px="4"
    variant="outline"
    bg={activo ? "rgba(18, 183, 106, 0.16)" : "bg.surface"}
    borderColor={activo ? "border.brand" : "border.subtle"}
    color={activo ? "brand.300" : "fg.muted"}
    fontWeight="600"
    _hover={{ borderColor: "border.brand", color: "fg.default" }}
    transition="all 0.2s"
  >
    {children}
  </Button>
);

export const LugaresSection = () => {
  const [lugares, setLugares] = useState<Lugar[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  useEffect(() => {
    listLugares()
      .then(setLugares)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudieron cargar los lugares.");
        setLugares([]);
      });
  }, []);

  const visibles = useMemo(
    () => (lugares ?? []).filter((l) => filtro === "todos" || l.categoria === filtro),
    [lugares, filtro]
  );

  // Solo ofrecemos filtros de categorías que realmente tienen lugares.
  const categoriasConDatos = useMemo(
    () => CATEGORIAS.filter((c) => (lugares ?? []).some((l) => l.categoria === c.key)),
    [lugares]
  );

  return (
    <Section id="lugares" bg="bg.muted">
      <VStack gap="10" w="full">
        <SectionTitle
          eyebrow="Lugares"
          title="Dónde estuvimos y qué nos pareció"
          subtitle="Restaurantes, cafés, panoramas y todo lo que probamos en primera persona."
        />

        {lugares === null ? (
          <Center py="10">
            <Spinner color="brand.primary" size="lg" />
          </Center>
        ) : error ? (
          <Text color="fg.subtle">{error}</Text>
        ) : lugares.length === 0 ? (
          <Text color="fg.subtle">Muy pronto publicaremos nuestros lugares favoritos.</Text>
        ) : (
          <>
            <HStack gap="2" flexWrap="wrap" justify="center">
              <ChipFiltro activo={filtro === "todos"} onClick={() => setFiltro("todos")}>
                Todos
              </ChipFiltro>
              {categoriasConDatos.map((c) => (
                <ChipFiltro key={c.key} activo={filtro === c.key} onClick={() => setFiltro(c.key)}>
                  {c.emoji} {c.label}
                </ChipFiltro>
              ))}
            </HStack>

            {visibles.length === 0 ? (
              <Text color="fg.subtle">No hay lugares en esta categoría.</Text>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6" w="full">
                {visibles.map((l) => (
                  <LugarCard key={l.id} lugar={l} />
                ))}
              </SimpleGrid>
            )}
          </>
        )}
      </VStack>
    </Section>
  );
};
