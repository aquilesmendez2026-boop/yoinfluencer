import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { getProfile, type Profile } from "../services/profile";
import { atLeast } from "../services/team";
import { DEMO_USER, DEMO_PROFILE } from "../demo/demoData";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Perfil desde el backend (alias, foto propia, secciones, etc.). null mientras carga. */
  profile: Profile | null;
  role: string | null;
  /** Único, control total. */
  isSuperAdmin: boolean;
  /** admin o super_admin: gestiona el sitio. */
  isAdmin: boolean;
  /** editor o superior: publica/edita en cualquier sección. */
  isEditor: boolean;
  /** influencer o superior: parte del staff, puede publicar. */
  isInfluencer: boolean;
  /** Rol "local": dueño de un local (bar, sauna…). */
  isLocal: boolean;
  /** Administra un local: por rol "local" o porque un admin le asignó una ficha. */
  ownsLocal: boolean;
  /** Alias de isInfluencer (compat: acceso a la trastienda del equipo). */
  isParticipant: boolean;
  /** Miembro premium (por pago) o staff. */
  isPremium: boolean;
  refreshProfile: () => Promise<void>;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children, demo = false }: { children: ReactNode; demo?: boolean }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // En modo demo no hay Firebase: usamos un usuario/perfil sintéticos.
    if (demo) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [demo]);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await getProfile());
    } catch {
      // Un fallo transitorio del backend (p. ej. un reinicio) no debe degradar
      // un perfil ya cargado: conservamos el anterior y solo caemos a "miembro"
      // si aún no teníamos ninguno.
      setProfile((prev) => prev ?? { role: "miembro" });
    }
  }, []);

  // Al iniciar sesión, obtiene el perfil del backend.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    setProfile(null);
    refreshProfile();
  }, [user, refreshProfile]);

  const login = async () => {
    await signInWithPopup(auth, googleProvider);
  };
  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };
  const registerWithEmail = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
  };
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };
  const logout = async () => {
    await signOut(auth);
  };
  const getToken = async (forceRefresh = false) => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken(forceRefresh);
  };

  // Valores efectivos: en demo, usuario y perfil sintéticos (super admin).
  const effUser = demo ? (DEMO_USER as unknown as User) : user;
  const effProfile = demo ? DEMO_PROFILE : profile;
  const effLoading = demo ? false : loading;

  return (
    <AuthContext.Provider
      value={{
        user: effUser,
        loading: effLoading,
        profile: effProfile,
        role: effProfile?.role ?? null,
        isSuperAdmin: effProfile?.role === "super_admin",
        isAdmin: atLeast(effProfile?.role, "admin"),
        isEditor: atLeast(effProfile?.role, "editor"),
        isInfluencer: atLeast(effProfile?.role, "influencer"),
        isLocal: effProfile?.role === "local",
        ownsLocal: effProfile?.role === "local" || !!effProfile?.localId,
        isParticipant: atLeast(effProfile?.role, "influencer"),
        isPremium: effProfile?.plan === "premium" || atLeast(effProfile?.role, "influencer"),
        refreshProfile,
        login,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
