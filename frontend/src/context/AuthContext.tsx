import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../types/auth.types";

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, userData: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("auth_user");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem("access_token");
  });

  const isAuthenticated = user !== null && accessToken !== null;

  function login(token: string, userData: User) {
    setUser(userData);
    setAccessToken(token);

    localStorage.setItem("auth_user", JSON.stringify(userData));
    localStorage.setItem("access_token", token);
  }

  function logout() {
    setUser(null);
    setAccessToken(null);

    localStorage.removeItem("auth_user");
    localStorage.removeItem("access_token");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}