import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/components/AuthProvider";

type TeacherDoubt = {
  id: number;
  subject: string;
  message: string;
  status: string;
  student_name: string;
  reply: string | null;
};

export default function TeacherDashboardPage() {
  const { token } = useAuthContext();
  const [stats, setStats] = useState({ open: 0, assigned: 0, resolved: 0 });
  const [doubts, setDoubts] = useState<TeacherDoubt[]>([]);
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    if (!token) return;
    const [dashRes, doubtsRes] = await Promise.all([
      fetch("/api/teacher/dashboard", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/teacher/doubts", { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (dashRes.ok) {
      const d = await dashRes.json();
      setStats(d.stats ?? { open: 0, assigned: 0, resolved: 0 });
      setError(null);
    } else {
      const data = await dashRes.json().catch(() => ({}));
      setError(data.error ?? "Teacher access required.");
    }
    if (doubtsRes.ok) {
      const list = (await doubtsRes.json()) as TeacherDoubt[];
      setDoubts(list);
    }
  }

  useEffect(() => {
    if (!token) return;
    void loadData();
  }, [token]);

  async function replyToDoubt(id: number) {
    const reply = (replies[id] ?? "").trim();
    if (!reply) return;
    const res = await fetch(`/api/teacher/doubts/${id}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reply }),
    });
    if (!res.ok) return;
    setReplies((p) => ({ ...p, [id]: "" }));
    await loadData();
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Open</p><p className="text-2xl font-bold">{stats.open}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Assigned</p><p className="text-2xl font-bold">{stats.assigned}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Resolved</p><p className="text-2xl font-bold">{stats.resolved}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Doubt Inbox</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {doubts.length === 0 && <p className="text-sm text-muted-foreground">No doubts assigned yet.</p>}
          {doubts.map((d) => (
            <div key={d.id} className="border rounded-lg p-3 space-y-2">
              <p className="text-sm font-semibold">{d.subject} · {d.student_name}</p>
              <p className="text-sm">{d.message}</p>
              {d.reply ? (
                <div className="bg-muted rounded p-2 text-sm"><strong>Replied:</strong> {d.reply}</div>
              ) : (
                <>
                  <Textarea
                    rows={3}
                    placeholder="Write your guidance to student..."
                    value={replies[d.id] ?? ""}
                    onChange={(e) => setReplies((p) => ({ ...p, [d.id]: e.target.value }))}
                  />
                  <Button size="sm" onClick={() => void replyToDoubt(d.id)}>Send Reply</Button>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
