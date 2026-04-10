import { useState, useEffect, useCallback } from "react";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  language: "en" | "hi";
  xp: number;
  level: number;
  streak: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  createdAt: string;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("mathtoken"));
  const [userId, setUserId] = useState<number | null>(() => {
    const id = localStorage.getItem("mathuserid");
    return id ? parseInt(id, 10) : null;
  });
  const [user, setUser] = useState<AuthUser | null>(() => {
    const u = localStorage.getItem("mathuser");
    return u ? JSON.parse(u) : null;
  });

  const login = useCallback((token: string, user: AuthUser) => {
    localStorage.setItem("mathtoken", token);
    localStorage.setItem("mathuserid", String(user.id));
    localStorage.setItem("mathuser", JSON.stringify(user));
    setToken(token);
    setUserId(user.id);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mathtoken");
    localStorage.removeItem("mathuserid");
    localStorage.removeItem("mathuser");
    setToken(null);
    setUserId(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem("mathuser", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isAuthenticated = !!token;

  return { token, userId, user, isAuthenticated, login, logout, updateUser };
}

export function getStoredToken() {
  return localStorage.getItem("mathtoken");
}

export function getStoredLanguage(): "en" | "hi" {
  return (localStorage.getItem("mathlang") as "en" | "hi") ?? "en";
}

export function setStoredLanguage(lang: "en" | "hi") {
  localStorage.setItem("mathlang", lang);
}
