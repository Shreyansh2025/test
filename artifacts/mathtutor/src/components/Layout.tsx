import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, BookOpen, MessageSquare, Swords, Trophy, Users,
  BarChart2, Award, User, Bell, LogOut, Sun, Moon, BrainCircuit, Menu, X,
  Map, GraduationCap
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "./ThemeProvider";
import { useAuthContext } from "./AuthProvider";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { path: "/practice", icon: BookOpen, labelKey: "practice" },
  { path: "/knowledge-map", icon: Map, labelKey: "knowledgeMap" },
  { path: "/courses", icon: GraduationCap, labelKey: "courses" },
  { path: "/tutor", icon: MessageSquare, labelKey: "aiTutor" },
  { path: "/battle", icon: Swords, labelKey: "battle" },
  { path: "/leaderboard", icon: Trophy, labelKey: "leaderboard" },
  { path: "/friends", icon: Users, labelKey: "friends" },
  { path: "/progress", icon: BarChart2, labelKey: "progress" },
  { path: "/badges", icon: Award, labelKey: "badges" },
] as const;

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuthContext();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: summary } = useGetDashboardSummary();

  const xpToNextLevel = (user?.level ?? 1) * 500;
  const currentLevelXp = ((user?.xp ?? 0) % xpToNextLevel);
  const xpProgress = (currentLevelXp / xpToNextLevel) * 100;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <img
          src="/assets/logo.png"
          alt="MathMind"
          className="w-9 h-9 rounded-xl object-cover shadow-sm"
          onError={e => {
            (e.target as HTMLImageElement).style.display = 'none';
            const next = (e.target as HTMLElement).nextElementSibling as HTMLElement;
            if (next) next.style.removeProperty('display');
          }}
        />
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm" style={{ display: 'none' }}>
          <BrainCircuit className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-base text-sidebar-foreground">MathMind</span>
          <p className="text-xs text-muted-foreground">AI Mentor</p>
        </div>
      </div>

      {/* User XP Bar */}
      {user && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-sidebar-foreground">Level {user.level}</span>
            <span className="text-xs text-muted-foreground">{user.xp} XP</span>
          </div>
          <div className="h-1.5 bg-sidebar-accent rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(xpProgress, 100)}%`, background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }}
            />
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-amber-500 font-semibold">🔥 {user.streak}</span>
            <span className="text-xs text-muted-foreground">day streak</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = location === item.path || location.startsWith(item.path + "/");
          const label = t(item.labelKey as any);
          return (
            <Link key={item.path} href={item.path}>
              <button
                data-testid={`nav-${item.labelKey}`}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {item.labelKey === "friends" && (summary?.pendingFriendRequests ?? 0) > 0 && (
                  <Badge className="ml-auto h-4 min-w-4 text-[10px] px-1 bg-destructive text-destructive-foreground">
                    {summary!.pendingFriendRequests}
                  </Badge>
                )}
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-3 space-y-0.5">
        <Link href="/profile">
          <button
            data-testid="nav-profile"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              location === "/profile"
                ? "bg-primary text-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <User className="w-4 h-4" />
            {t("profile")}
          </button>
        </Link>
        <button
          data-testid="btn-theme-toggle"
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-all"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === "dark" ? t("lightMode") : t("darkMode")}
        </button>
        <div className="px-0 py-0.5">
          <LanguageSwitcher compact />
        </div>
        <button
          data-testid="btn-logout"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          {t("signOut")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 bg-sidebar border-r border-sidebar-border flex flex-col">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button
            data-testid="btn-menu"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-accent/10"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">MathMind</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
