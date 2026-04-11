import { useState, useEffect, useCallback } from "react";
import type { Language } from "@/lib/i18n";

function normalizeRole(raw: unknown): AuthUser["role"] {
  const s = String(raw ?? "student").trim().toLowerCase();
  if (s === "admin" || s === "teacher" || s === "student") return s;
  return "student";
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  language: Language;
  role: "student" | "teacher" | "admin";
  xp: number;
  level: number;
  streak: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  createdAt: string;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("mathtoken"));
  const [isAuthReady, setIsAuthReady] = useState<boolean>(() => !localStorage.getItem("mathtoken"));
  const [userId, setUserId] = useState<number | null>(() => {
    const id = localStorage.getItem("mathuserid");
    return id ? parseInt(id, 10) : null;
  });
  const [user, setUser] = useState<AuthUser | null>(() => {
    const u = localStorage.getItem("mathuser");
    if (!u) return null;
    try {
      const parsed = JSON.parse(u) as Partial<AuthUser>;
      return {
        ...(parsed as AuthUser),
        role: normalizeRole(parsed.role),
      };
    } catch {
      return null;
    }
  });

  const login = useCallback((token: string, user: AuthUser) => {
    const normalized = { ...user, role: normalizeRole(user.role) };
    localStorage.setItem("mathtoken", token);
    localStorage.setItem("mathuserid", String(normalized.id));
    localStorage.setItem("mathuser", JSON.stringify(normalized));
    setToken(token);
    setUserId(normalized.id);
    setUser(normalized);
    setIsAuthReady(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mathtoken");
    localStorage.removeItem("mathuserid");
    localStorage.removeItem("mathuser");
    setToken(null);
    setUserId(null);
    setUser(null);
    setIsAuthReady(true);
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

  useEffect(() => {
    if (!token) {
      setIsAuthReady(true);
      return;
    }
    setIsAuthReady(false);
    let cancelled = false;
    const syncMe = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const raw = (await res.json()) as Partial<AuthUser>;
        if (cancelled) return;
        const me: AuthUser = {
          ...(raw as AuthUser),
          role: normalizeRole(raw.role),
        };
        setUser(me);
        setUserId(me.id);
        localStorage.setItem("mathuserid", String(me.id));
        localStorage.setItem("mathuser", JSON.stringify(me));
      } catch {
        // Keep local auth state if refresh endpoint is temporarily unavailable.
      } finally {
        if (!cancelled) setIsAuthReady(true);
      }
    };
    void syncMe();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return { token, userId, user, isAuthenticated, isAuthReady, login, logout, updateUser };
}

export function getStoredToken() {
  return localStorage.getItem("mathtoken");
}

export function getStoredLanguage(): Language {
  return (localStorage.getItem("mathlang") as Language) ?? "en";
}

export function setStoredLanguage(lang: Language) {
  localStorage.setItem("mathlang", lang);
}
