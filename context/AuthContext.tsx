"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  authApi,
  User,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name?: string;
    email: string;
    password: string;
    interests?: string[];
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const existingToken = getStoredToken();
    if (!existingToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getProfile();
      if (res.success && res.data) {
        setUser(res.data);
        setToken(existingToken);
      } else {
        removeStoredToken();
        setUser(null);
        setToken(null);
      }
    } catch {
      removeStoredToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (res.success && res.data?.accessToken) {
      setStoredToken(res.data.accessToken);
      setToken(res.data.accessToken);

      // fetch profile immediately
      const profileRes = await authApi.getProfile();
      if (profileRes.success && profileRes.data) {
        setUser(profileRes.data);
      }
    }
  };

  const register = async (payload: {
    name?: string;
    email: string;
    password: string;
    interests?: string[];
  }) => {
    await authApi.register(payload);
    // After registration, auto-login for a seamless experience
    await login(payload.email, payload.password);
  };

  const logout = () => {
    removeStoredToken();
    setUser(null);
    setToken(null);
    window.location.href = "/login";
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

