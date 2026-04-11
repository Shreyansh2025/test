import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { BrainCircuit, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/components/AuthProvider";
import { Redirect } from "wouter";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { login, logout, isAuthenticated, user, isAuthReady } = useAuthContext();
  const { toast } = useToast();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
    language: "en",
    role: "student" as "student" | "teacher" | "admin",
    inviteCode: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const routeByRole = (role?: "student" | "teacher" | "admin") =>
    role === "admin" ? "/admin-dashboard" : role === "teacher" ? "/teacher-dashboard" : "/dashboard";

  useEffect(() => {
    if (isAuthenticated && isAuthReady && !user) {
      logout();
    }
  }, [isAuthenticated, isAuthReady, user, logout]);

  if (isAuthenticated && !isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Restoring session…
      </div>
    );
  }
  if (isAuthenticated && isAuthReady && user) {
    return <Redirect to={routeByRole(user.role)} />;
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username || !form.email || !form.password || !form.displayName) {
      toast({ title: "Please fill all fields", variant: "destructive" }); return;
    }
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      login(data.token, data.user);
      toast({ title: "Welcome to AI Tutor! 🎉" });
      navigate(routeByRole(data.user?.role));
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2.5 cursor-pointer">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-foreground">AI Tutor</span>
            </div>
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>Start your personalized learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Full Name</Label>
                <Input id="displayName" placeholder="Arjun Sharma" value={form.displayName} onChange={set("displayName")} autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="arjun_math" value={form.username} onChange={set("username")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPw ? "text" : "password"} placeholder="Min. 6 characters"
                    value={form.password} onChange={set("password")} className="pr-10" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Preferred Language</Label>
                <Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="hi">🇮🇳 Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Portal Type</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, role: v as "student" | "teacher" | "admin" }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.role !== "student" && (
                <div className="space-y-1.5">
                  <Label htmlFor="inviteCode">
                    {form.role === "teacher" ? "Teacher Invite Code" : "Admin Invite Code"}
                  </Label>
                  <Input
                    id="inviteCode"
                    value={form.inviteCode}
                    onChange={set("inviteCode")}
                    placeholder="Enter invite code"
                  />
                </div>
              )}
              <Button type="submit" className="w-full btn-glow font-semibold mt-1" disabled={loading}>
                {loading ? "Creating account..." : "Create Free Account"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
