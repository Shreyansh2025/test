import { createContext, useContext } from "react";
import { useAuth, type AuthUser } from "@/hooks/useAuth";

interface AuthContextType {
  token: string | null;
  userId: number | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  userId: null,
  user: null,
  isAuthenticated: false,
  isAuthReady: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}
