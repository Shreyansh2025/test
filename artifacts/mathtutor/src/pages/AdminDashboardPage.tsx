import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/components/AuthProvider";

type AdminUser = {
  id: number;
  display_name: string;
  username: string;
  email: string;
  role: "student" | "teacher" | "admin";
};

export default function AdminDashboardPage() {
  const { token, updateUser } = useAuthContext();
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    admins: 0,
    totalDoubts: 0,
    resolvedDoubts: 0,
  });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    if (!token) return;
    const res = await fetch("/api/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Admin access required.");
      return;
    }
    setError(null);
    const data = await res.json();
    setStats(data.stats ?? { students: 0, teachers: 0, admins: 0, totalDoubts: 0, resolvedDoubts: 0 });
    setUsers((data.users ?? []) as AdminUser[]);
  }

  useEffect(() => {
    if (!token) return;
    void loadData();
  }, [token]);

  async function changeRole(id: number, role: "student" | "teacher" | "admin") {
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) return;
    await loadData();
  }

  async function bootstrapAdmin() {
    const res = await fetch("/api/admin/bootstrap", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not bootstrap admin");
      return;
    }
    await res.json();
    updateUser({ role: "admin" });
    setError(null);
    await loadData();
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      {error && (
        <Card>
          <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" onClick={() => void bootstrapAdmin()}>
              Make Me First Admin
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Students</p><p className="text-2xl font-bold">{stats.students}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Teachers</p><p className="text-2xl font-bold">{stats.teachers}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Admins</p><p className="text-2xl font-bold">{stats.admins}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Total Doubts</p><p className="text-2xl font-bold">{stats.totalDoubts}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Resolved</p><p className="text-2xl font-bold">{stats.resolvedDoubts}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Users (Students / Teachers / Admins)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{u.display_name} (@{u.username})</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <div className="text-sm">Current role: <strong>{u.role}</strong></div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void changeRole(u.id, "student")}>Student</Button>
                <Button size="sm" variant="outline" onClick={() => void changeRole(u.id, "teacher")}>Teacher</Button>
                <Button size="sm" variant="outline" onClick={() => void changeRole(u.id, "admin")}>Admin</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
