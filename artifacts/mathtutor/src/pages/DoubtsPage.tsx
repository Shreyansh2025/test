import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/components/AuthProvider";

type Doubt = {
  id: number;
  subject: string;
  message: string;
  reply: string | null;
  status: string;
  createdAt: string;
};

export default function DoubtsPage() {
  const { token } = useAuthContext();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [doubts, setDoubts] = useState<Doubt[]>([]);

  async function loadMine() {
    const res = await fetch("/api/doubts/mine", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as Doubt[];
    setDoubts(data);
  }

  useEffect(() => {
    void loadMine();
  }, []);

  async function submitDoubt() {
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/doubts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, message }),
      });
      if (!res.ok) return;
      setSubject("");
      setMessage("");
      await loadMine();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Doubt Solver</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Teacher</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (e.g. Algebra)"
          />
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your doubt in detail..."
            rows={5}
          />
          <Button onClick={submitDoubt} disabled={loading}>
            {loading ? "Sending..." : "Send to Teacher"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Doubts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {doubts.length === 0 && (
            <p className="text-sm text-muted-foreground">No doubts submitted yet.</p>
          )}
          {doubts.map((d) => (
            <div key={d.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{d.subject}</p>
                <p className="text-xs text-muted-foreground">{d.status}</p>
              </div>
              <p className="text-sm">{d.message}</p>
              {d.reply && (
                <div className="rounded-md bg-muted p-2 text-sm">
                  <strong>Teacher reply:</strong> {d.reply}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
