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

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Perfil desde el backend (apodo, foto propia, país, etc.). null mientras carga. */
  profile: Profile | null;
  role: string | null;
  isAdmin: boolean;
  /** Participante del podcast (o admin): acceso a la agenda del equipo. */
  isParticipant: boolean;
  /** Miembro premium (por pago) o admin. */
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await getProfile());
    } catch {
      setProfile({ role: "miembro" });
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        profile,
        role: profile?.role ?? null,
        isAdmin: profile?.role === "admin",
        isParticipant: profile?.role === "participante" || profile?.role === "admin",
        isPremium: profile?.plan === "premium" || profile?.role === "admin",
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
