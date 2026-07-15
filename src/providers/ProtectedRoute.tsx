import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Center, Spinner } from "@chakra-ui/react";
import { useAuth } from "./AuthProvider";

/**
 * Envuelve una ruta que requiere sesión iniciada.
 * - Cargando → spinner.
 * - Sin sesión → redirige al inicio.
 */
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center minH="100vh" bg="bg.canvas">
        <Spinner size="xl" color="brand.primary" borderWidth="3px" />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
