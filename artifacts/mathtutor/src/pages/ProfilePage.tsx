import { useState } from "react";
import { User, Mail, Globe, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/components/AuthProvider";
import { setStoredLanguage } from "@/hooks/useAuth";
import { LANGUAGES, type Language } from "@/lib/i18n";

export default function ProfilePage() {
  const { user, token, updateUser } = useAuthContext();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{ displayName: string; language: Language }>({
    displayName: user?.displayName ?? "",
    language: user?.language ?? "en",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ displayName: form.displayName, language: form.language }),
      });
      if (!res.ok) throw new Error("Failed to update");
      updateUser({ displayName: form.displayName, language: form.language });
      setStoredLanguage(form.language);
      setEditing(false);
      toast({ title: "Profile updated!" });
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const accuracy = user && user.totalQuestionsAnswered > 0
    ? Math.round((user.totalCorrect / user.totalQuestionsAnswered) * 100)
    : 0;

  const xpToNext = (user?.level ?? 1) * 500;
  const xpProgress = Math.round(((user?.xp ?? 0) % xpToNext) / xpToNext * 100);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      {/* Avatar & Basic Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-3xl font-bold text-white shadow-lg flex-shrink-0">
              {user?.displayName?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-foreground">{user?.displayName}</h2>
              <p className="text-muted-foreground text-sm">@{user?.username}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <Badge className="bg-primary/10 text-primary border-primary/20">Level {user?.level}</Badge>
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">🔥 {user?.streak} day streak</Badge>
                <Badge variant="outline" className="text-xs">{user?.role ?? "student"}</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(!editing)} className="flex-shrink-0">
              {editing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            </Button>
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="mt-6 pt-4 border-t border-border space-y-3">
              <div className="space-y-1.5">
                <Label>Display Name</Label>
                <Input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Preferred Language</Label>
                <Select
                  value={form.language}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, language: v as Language }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.flag} {l.nativeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={saving} className="btn-glow">
                <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total XP", value: user?.xp?.toLocaleString() ?? "0", icon: "⚡" },
          { label: "Accuracy", value: `${accuracy}%`, icon: "🎯" },
          { label: "Answered", value: user?.totalQuestionsAnswered?.toLocaleString() ?? "0", icon: "📝" },
          { label: "Correct", value: user?.totalCorrect?.toLocaleString() ?? "0", icon: "✅" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="py-4 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* XP Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Level Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-foreground">Level {user?.level ?? 1}</span>
            <span className="text-muted-foreground">{xpProgress}% to Level {(user?.level ?? 1) + 1}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpProgress}%`, background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {(user?.xp ?? 0)} / {(user?.level ?? 1) * 500} XP needed for next level
          </p>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Email:</span>
            <span className="text-foreground">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Username:</span>
            <span className="text-foreground font-mono">@{user?.username}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Member since:</span>
            <span className="text-foreground">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
