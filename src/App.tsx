import { useState } from "react";
import { ChakraProvider, Center, Spinner } from "@chakra-ui/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { system } from "./theme";
import { HomePage } from "./pages/HomePage";
import { MembersPage } from "./pages/MembersPage";
import { AccountPage } from "./pages/AccountPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminPage } from "./pages/AdminPage";
import { ContenidosPage } from "./pages/ContenidosPage";
import { ArticuloPage } from "./pages/ArticuloPage";
import { SeccionesPage } from "./pages/SeccionesPage";
import { SeccionPage } from "./pages/SeccionPage";
import { InfluencersPage } from "./pages/InfluencersPage";
import { InfluencerPage } from "./pages/InfluencerPage";
import { MiPaginaPage } from "./pages/MiPaginaPage";
import { EscribirPage } from "./pages/EscribirPage";
import { MiLocalPage } from "./pages/MiLocalPage";
import { LugaresPage } from "./pages/LugaresPage";
import { AgendaPage } from "./pages/AgendaPage";
import { MiTrabajoPage } from "./pages/MiTrabajoPage";
import { PremiumPage } from "./pages/PremiumPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { LoginPage } from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import { DemoProvider, useDemo } from "./providers/DemoProvider";
import { DemoBanner } from "./organisms/DemoBanner";
import { DemoTour } from "./organisms/DemoTour";
import { AgeGate, ageConfirmada } from "./organisms/AgeGate";

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
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
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
      <Route path="/contenidos" element={<ContenidosPage />} />
      <Route path="/articulo/:id" element={<ArticuloPage />} />
      <Route path="/secciones" element={<SeccionesPage />} />
      <Route path="/seccion/:slug" element={<SeccionPage />} />
      <Route path="/influencers" element={<InfluencersPage />} />
      <Route path="/influencer/:id" element={<InfluencerPage />} />
      <Route path="/mi-pagina" element={<MiPaginaPage />} />
      <Route path="/escribir" element={<EscribirPage />} />
      <Route path="/mi-local" element={<MiLocalPage />} />
      <Route path="/lugares" element={<LugaresPage />} />
      <Route path="/agenda" element={<AgendaPage />} />
      <Route path="/mi-trabajo" element={<MiTrabajoPage />} />
      <Route path="/premium" element={<PremiumPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

/** Envuelve el sitio: en modo demo inyecta el perfil sintético, el banner y el tour. */
const Shell = () => {
  const { demo } = useDemo();
  return (
    <AuthProvider demo={demo}>
      {demo && <DemoBanner />}
      <AppRoutes />
      {demo && <DemoTour />}
    </AuthProvider>
  );
};

export const App = () => {
  // El aviso +18 va por fuera de todo: bloquea el sitio antes del login/demo.
  const [mayor, setMayor] = useState(ageConfirmada);

  return (
    <ChakraProvider value={system}>
      {!mayor ? (
        <AgeGate onConfirm={() => setMayor(true)} />
      ) : (
        <BrowserRouter>
          <DemoProvider>
            <Shell />
          </DemoProvider>
        </BrowserRouter>
      )}
    </ChakraProvider>
  );
};
