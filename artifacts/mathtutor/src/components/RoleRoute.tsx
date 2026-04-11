import { Route, Redirect } from "wouter";
import { useAuthContext } from "./AuthProvider";

type Role = "student" | "teacher" | "admin";

function normalizeRole(raw: unknown): Role {
  const s = String(raw ?? "student").trim().toLowerCase();
  if (s === "admin" || s === "teacher" || s === "student") return s;
  return "student";
}

function homeForRole(role: Role | undefined): string {
  if (role === "admin") return "/admin-dashboard";
  if (role === "teacher") return "/teacher-dashboard";
  return "/dashboard";
}

export default function RoleRoute({
  path,
  allow,
  children,
}: {
  path: string;
  allow: Role[];
  children: React.ReactNode;
}) {
  const { isAuthenticated, user, isAuthReady } = useAuthContext();
  return (
    <Route path={path}>
      {!isAuthenticated ? (
        <Redirect to="/login" />
      ) : !isAuthReady ? (
        <div className="p-6 text-sm text-muted-foreground">Checking access...</div>
      ) : !user ? (
        <Redirect to="/login" />
      ) : allow.includes(normalizeRole(user.role)) ? (
        children
      ) : (
        <Redirect to={homeForRole(normalizeRole(user.role))} />
      )}
    </Route>
  );
}

