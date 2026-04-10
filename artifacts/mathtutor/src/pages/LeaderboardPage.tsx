import { Trophy, Medal, Flame, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { useAuthContext } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

const RANK_STYLES: Record<number, string> = {
  1: "text-yellow-500",
  2: "text-gray-400",
  3: "text-amber-600",
};

const RANK_BG: Record<number, string> = {
  1: "bg-yellow-500/10 border-yellow-500/30",
  2: "bg-gray-400/10 border-gray-400/30",
  3: "bg-amber-600/10 border-amber-600/30",
};

export default function LeaderboardPage() {
  const { data, isLoading } = useGetLeaderboard({ limit: 50 });
  const { userId } = useAuthContext();

  const leaderboard = (data as any[]) ?? [];
  const userRank = leaderboard.find((u: any) => u.userId === userId);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3 shadow-lg">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Global Leaderboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Top learners ranked by total XP</p>
      </div>

      {/* Your Rank */}
      {userRank && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                #{userRank.rank}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">Your Ranking</p>
                <p className="text-xs text-muted-foreground">{userRank.xp} XP · Level {userRank.level}</p>
              </div>
              <Badge variant="secondary">
                <Flame className="w-3 h-3 mr-1 text-amber-500" />{userRank.streak}d
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Podium */}
      {!isLoading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[leaderboard[1], leaderboard[0], leaderboard[2]].filter(Boolean).map((user: any, i: number) => {
            const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
            return (
              <div key={user.userId} className={cn("rounded-xl border p-3 text-center",
                actualRank === 1 && "border-yellow-500/40 bg-yellow-500/8",
                actualRank === 2 && "border-gray-400/30 bg-gray-400/5",
                actualRank === 3 && "border-amber-600/30 bg-amber-600/5",
              )}>
                <div className={cn("text-xl font-bold mb-1", RANK_STYLES[actualRank])}>
                  {actualRank === 1 ? "🥇" : actualRank === 2 ? "🥈" : "🥉"}
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2 text-sm font-bold text-primary">
                  {user.displayName?.charAt(0) ?? "?"}
                </div>
                <p className="font-semibold text-xs text-foreground truncate">{user.displayName}</p>
                <p className="text-xs text-muted-foreground">{user.xp} XP</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Rankings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded" />)}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              No rankings yet. Be the first!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {leaderboard.map((u: any) => (
                <div key={u.userId}
                  className={cn("flex items-center gap-3 px-4 py-3 transition-colors",
                    u.userId === userId && "bg-primary/5",
                    u.rank <= 3 && RANK_BG[u.rank]
                  )}>
                  <div className={cn("w-8 font-bold text-sm flex-shrink-0 text-center",
                    RANK_STYLES[u.rank] ?? "text-muted-foreground")}>
                    {u.rank <= 3 ? (u.rank === 1 ? "🥇" : u.rank === 2 ? "🥈" : "🥉") : `#${u.rank}`}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 font-semibold text-primary text-sm">
                    {u.displayName?.charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("font-medium text-sm truncate", u.userId === userId ? "text-primary" : "text-foreground")}>
                        {u.displayName}
                        {u.userId === userId && <span className="text-xs ml-1 opacity-60">(you)</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">Lv.{u.level}</span>
                      <span className="text-xs text-amber-500 flex items-center gap-0.5">
                        <Flame className="w-3 h-3" />{u.streak}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-primary flex-shrink-0">
                    <Zap className="w-3.5 h-3.5" />{u.xp.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
