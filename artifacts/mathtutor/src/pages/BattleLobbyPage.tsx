import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Swords, Plus, Users, Clock, ChevronRight, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useListBattles, useCreateBattle, useListSubjects } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BattleLobbyPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [form, setForm] = useState({ subjectId: "", questionCount: "10", timePerQuestion: "30" });

  const { data: battles, isLoading } = useListBattles();
  const { data: subjects } = useListSubjects();
  const createBattle = useCreateBattle();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subjectId) { toast({ title: "Select a subject", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const b = await createBattle.mutateAsync({
        subjectId: parseInt(form.subjectId),
        questionCount: parseInt(form.questionCount),
        timePerQuestion: parseInt(form.timePerQuestion),
      });
      navigate(`/battle/${(b as any).id}`);
    } catch {
      toast({ title: "Failed to create battle", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    const battleList = (battles as any[]) ?? [];
    const battle = battleList.find((b: any) => b.code === joinCode.toUpperCase());
    if (!battle) { toast({ title: "Battle not found", variant: "destructive" }); return; }
    navigate(`/battle/${battle.id}`);
  }

  const battleList = (battles as any[]) ?? [];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Swords className="w-6 h-6 text-rose-500" />Math Battles
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Challenge other students to real-time math duels</p>
      </div>

      <Tabs defaultValue="join">
        <TabsList className="w-full">
          <TabsTrigger value="join" className="flex-1">Join Battle</TabsTrigger>
          <TabsTrigger value="create" className="flex-1">Create Battle</TabsTrigger>
        </TabsList>

        <TabsContent value="join" className="mt-4 space-y-4">
          {/* Join by code */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Hash className="w-4 h-4 text-primary" />Join by Code</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoin} className="flex gap-2">
                <Input
                  placeholder="Enter 6-character battle code..."
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 font-mono"
                  maxLength={6}
                />
                <Button type="submit" disabled={joinCode.length < 4}>Join</Button>
              </form>
            </CardContent>
          </Card>

          {/* Open battles */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Open Battles</h2>
            {isLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
            ) : battleList.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                  <Swords className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No open battles right now</p>
                  <p className="text-xs text-muted-foreground mt-1">Create a battle and invite friends!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {battleList.map((b: any) => (
                  <Link key={b.id} href={`/battle/${b.id}`}>
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">{b.subjectName}</p>
                          <Badge className="bg-emerald-500/10 text-emerald-500 text-xs">Open</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />{b.currentParticipants}/{b.maxParticipants}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{b.timePerQuestion}s/q</span>
                          <span className="text-xs font-mono text-primary font-semibold">{b.code}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">by {b.hostName}</p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="create" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Plus className="w-4 h-4 text-primary" />Create New Battle</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Select value={form.subjectId} onValueChange={v => setForm(f => ({ ...f, subjectId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select a subject..." /></SelectTrigger>
                    <SelectContent>
                      {(subjects as any[])?.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Questions</Label>
                    <Select value={form.questionCount} onValueChange={v => setForm(f => ({ ...f, questionCount: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["5","10","15","20"].map(n => <SelectItem key={n} value={n}>{n} questions</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Time per Question</Label>
                    <Select value={form.timePerQuestion} onValueChange={v => setForm(f => ({ ...f, timePerQuestion: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["15","30","45","60"].map(n => <SelectItem key={n} value={n}>{n} seconds</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full btn-glow" disabled={creating}>
                  <Swords className="w-4 h-4 mr-2" />
                  {creating ? "Creating..." : "Create Battle Room"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
