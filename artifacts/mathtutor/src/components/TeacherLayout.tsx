import { Link, useLocation } from "wouter";
import { School, LogOut } from "lucide-react";
import { useAuthContext } from "./AuthProvider";
import { cn } from "@/lib/utils";

const ITEMS = [
  { path: "/teacher-dashboard", label: "Teacher Dashboard", icon: School },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuthContext();

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r border-border bg-card p-3">
        <div className="px-3 py-4 border-b border-border mb-3">
          <p className="font-bold text-foreground">Teacher Portal</p>
          <p className="text-xs text-muted-foreground">Handle student doubts</p>
        </div>
        <nav className="space-y-1">
          {ITEMS.map((item) => {
            const active = location === item.path || location.startsWith(item.path + "/");
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="mt-4 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

