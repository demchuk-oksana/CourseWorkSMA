import React, { createContext, useContext, useState, ReactNode } from "react";
import jwtDecode from "jwt-decode";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: { username: string; userId: number } | null;
};

type AuthContextType = {
  auth: AuthState;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): { username: string; userId: number } {
  const decoded: any = jwtDecode(token);
  return {
    username: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
    userId: Number(decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]),
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    user: null,
  });

  const login = (accessToken: string, refreshToken: string) => {
    const user = parseJwt(accessToken);
    setAuth({ accessToken, refreshToken, user });
  };

  const logout = () => {
    setAuth({ accessToken: null, refreshToken: null, user: null });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}