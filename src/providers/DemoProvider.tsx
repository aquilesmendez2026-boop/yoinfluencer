import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { isDemo, setDemo } from "../demo/demo";

interface DemoContextValue {
  /** ¿Estamos recorriendo la plataforma en modo demo (invitado, solo lectura)? */
  demo: boolean;
  /** Entra a la demo desde el login. */
  enterDemo: () => void;
  /** Sale de la demo y vuelve al login. */
  exitDemo: () => void;
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [demo, setDemoState] = useState(isDemo);
  const navigate = useNavigate();

  const enterDemo = useCallback(() => {
    setDemo(true);
    setDemoState(true);
    navigate("/");
  }, [navigate]);

  const exitDemo = useCallback(() => {
    setDemo(false);
    setDemoState(false);
    navigate("/login");
  }, [navigate]);

  return <DemoContext.Provider value={{ demo, enterDemo, exitDemo }}>{children}</DemoContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDemo = () => {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo debe usarse dentro de <DemoProvider>");
  return ctx;
};
