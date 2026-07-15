import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { system } from "./theme";
import { HomePage } from "./pages/HomePage";
import { MembersPage } from "./pages/MembersPage";
import { AuthProvider } from "./providers/AuthProvider";
import { ProtectedRoute } from "./providers/ProtectedRoute";

export const App = () => {
  return (
    <ChakraProvider value={system}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/miembros"
              element={
                <ProtectedRoute>
                  <MembersPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  );
};
