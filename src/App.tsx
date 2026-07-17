import { ChakraProvider, Center, Spinner } from "@chakra-ui/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { system } from "./theme";
import { HomePage } from "./pages/HomePage";
import { MembersPage } from "./pages/MembersPage";
import { AccountPage } from "./pages/AccountPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminPage } from "./pages/AdminPage";
import { EpisodesPage } from "./pages/EpisodesPage";
import { AgendaPage } from "./pages/AgendaPage";
import { PremiumPage } from "./pages/PremiumPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { LoginPage } from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./providers/AuthProvider";

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center minH="100vh" bg="bg.canvas">
        <Spinner size="xl" color="brand.primary" borderWidth="3px" />
      </Center>
    );
  }

  // Sin sesión → todo el sitio queda detrás del login.
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Con sesión → sitio completo.
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/miembros" element={<MembersPage />} />
      <Route path="/cuenta" element={<AccountPage />} />
      <Route path="/configuracion" element={<SettingsPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/episodios" element={<EpisodesPage />} />
      <Route path="/agenda" element={<AgendaPage />} />
      <Route path="/premium" element={<PremiumPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App = () => {
  return (
    <ChakraProvider value={system}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  );
};
