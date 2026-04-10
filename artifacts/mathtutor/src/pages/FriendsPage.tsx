import { useState } from "react";
import { Users, UserPlus, Check, X, Swords, Zap, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useListFriends, useListFriendRequests, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest, useCreateBattle, useListSubjects } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useAuthContext } from "@/components/AuthProvider";

export default function FriendsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [sending, setSending] = useState(false);
  const [challenging, setChallenging] = useState<number | null>(null);

  const { data: friends, isLoading: loadingFriends } = useListFriends();
  const { data: requests, isLoading: loadingReqs } = useListFriendRequests();
  const { data: subjects } = useListSubjects();
  const sendReq = useSendFriendRequest();
  const acceptReq = useAcceptFriendRequest();
  const rejectReq = useRejectFriendRequest();
  const createBattle = useCreateBattle();

  async function handleChallenge(friendUserId: number) {
    const subjectList = (subjects as any[]) ?? [];
    const firstSubject = subjectList[0];
    if (!firstSubject) { toast({ title: "No subjects available", variant: "destructive" }); return; }
    setChallenging(friendUserId);
    try {
      const battle = await createBattle.mutateAsync({
        subjectId: firstSubject.id,
        questionCount: 10,
        timePerQuestion: 30,
      });
      toast({ title: `Battle created! Share code: ${(battle as any).code}` });
      navigate(`/battle/${(battle as any).id}`);
    } catch {
      toast({ title: "Failed to create battle", variant: "destructive" });
    } finally {
      setChallenging(null);
    }
  }

  const friendList = (friends as any[]) ?? [];
  const reqList = (requests as any[]) ?? [];

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setSending(true);
    try {
      await sendReq.mutateAsync({ toUsername: username.trim() });
      setUsername("");
      toast({ title: "Friend request sent! 🎉" });
    } catch (err: any) {
      toast({ title: err.message ?? "Failed to send request", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  async function handleAccept(id: number) {
    try {
      await acceptReq.mutateAsync(id);
      qc.invalidateQueries();
      toast({ title: "Friend added! 👋" });
    } catch {
      toast({ title: "Failed to accept", variant: "destructive" });
    }
  }

  async function handleReject(id: number) {
    try {
      await rejectReq.mutateAsync(id);
      qc.invalidateQueries();
    } catch {
      toast({ title: "Failed to reject", variant: "destructive" });
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />Friends
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Connect with other learners and challenge them to battles</p>
      </div>

      {/* Add Friend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><UserPlus className="w-4 h-4 text-primary" />Add Friend</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="flex gap-2">
            <Input placeholder="Enter username..." value={username} onChange={e => setUsername(e.target.value)} className="flex-1" />
            <Button type="submit" disabled={!username.trim() || sending}>
              {sending ? "Sending..." : "Send Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="friends">
        <TabsList className="w-full">
          <TabsTrigger value="friends" className="flex-1">
            Friends {friendList.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{friendList.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1">
            Requests {reqList.length > 0 && <Badge className="ml-2 text-xs bg-primary">{reqList.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-4">
          {loadingFriends ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : friendList.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No friends yet</p>
                <p className="text-xs text-muted-foreground mt-1">Send a friend request using their username</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {friendList.map((f: any) => (
                <Card key={f.id} className="card-hover">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary flex-shrink-0">
                        {f.displayName?.charAt(0) ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{f.displayName}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap className="w-3 h-3 text-primary" />{f.xp} XP
                          </span>
                          <span className="text-xs text-amber-500 flex items-center gap-1">
                            <Flame className="w-3 h-3" />{f.streak}d
                          </span>
                          <span className="text-xs text-muted-foreground">Lv.{f.level}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs flex-shrink-0"
                        onClick={() => handleChallenge(f.userId)}
                        disabled={challenging === f.userId}
                      >
                        <Swords className="w-3.5 h-3.5" />
                        {challenging === f.userId ? "Creating..." : "Challenge"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          {loadingReqs ? (
            <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : reqList.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">No pending friend requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {reqList.map((r: any) => (
                <Card key={r.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary flex-shrink-0">
                        {r.fromDisplayName?.charAt(0) ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{r.fromDisplayName}</p>
                        <p className="text-xs text-muted-foreground">Wants to be friends</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" onClick={() => handleAccept(r.id)} className="h-8 px-3">
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(r.id)} className="h-8 px-3 hover:bg-destructive/10 hover:border-destructive hover:text-destructive">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
