import { Award, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useListBadges, useGetMyBadges } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const RARITY_COLORS: Record<string, string> = {
  common: "text-gray-500 border-gray-500/20 bg-gray-500/10",
  rare: "text-sky-500 border-sky-500/20 bg-sky-500/10",
  epic: "text-violet-500 border-violet-500/20 bg-violet-500/10",
  legendary: "text-amber-500 border-amber-500/20 bg-amber-500/10",
};

const DEFAULT_BADGES = [
  { id: 1, name: "First Steps", description: "Answer your first question", icon: "🎯", rarity: "common", condition: "answer_1" },
  { id: 2, name: "Quick Learner", description: "Answer 10 questions", icon: "⚡", rarity: "common", condition: "answer_10" },
  { id: 3, name: "Math Enthusiast", description: "Answer 50 questions", icon: "📚", rarity: "rare", condition: "answer_50" },
  { id: 4, name: "Streak Starter", description: "Maintain a 3-day streak", icon: "🔥", rarity: "common", condition: "streak_3" },
  { id: 5, name: "On Fire", description: "Maintain a 7-day streak", icon: "🌟", rarity: "rare", condition: "streak_7" },
  { id: 6, name: "Unstoppable", description: "Maintain a 30-day streak", icon: "💎", rarity: "legendary", condition: "streak_30" },
  { id: 7, name: "Sharpshooter", description: "Get 10 correct answers in a row", icon: "🎯", rarity: "rare", condition: "correct_10" },
  { id: 8, name: "Battle Winner", description: "Win your first math battle", icon: "⚔️", rarity: "rare", condition: "battle_win_1" },
  { id: 9, name: "Battle Champion", description: "Win 10 math battles", icon: "🏆", rarity: "epic", condition: "battle_win_10" },
  { id: 10, name: "Speed Demon", description: "Answer correctly in under 5 seconds", icon: "💨", rarity: "rare", condition: "speed_5" },
  { id: 11, name: "XP Collector", description: "Earn 1000 XP", icon: "⭐", rarity: "rare", condition: "xp_1000" },
  { id: 12, name: "Math Legend", description: "Reach Level 10", icon: "👑", rarity: "legendary", condition: "level_10" },
];

export default function BadgesPage() {
  const { data: allBadges, isLoading: loadingAll } = useListBadges();
  const { data: myBadges, isLoading: loadingMy } = useGetMyBadges();

  const earnedIds = new Set(((myBadges as any[]) ?? []).map((mb: any) => mb.badgeId));
  const badges = (allBadges as any[])?.length > 0 ? (allBadges as any[]) : DEFAULT_BADGES;
  const earnedCount = badges.filter((b: any) => earnedIds.has(b.id)).length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" />Badges
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Earn badges by achieving goals and milestones</p>
      </div>

      {/* Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-2xl shadow-md">🏅</div>
            <div>
              <p className="text-2xl font-bold text-foreground">{earnedCount}<span className="text-muted-foreground text-base font-normal">/{badges.length}</span></p>
              <p className="text-sm text-muted-foreground">Badges earned</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-lg font-bold text-primary">{Math.round((earnedCount / badges.length) * 100)}%</p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badge Grid */}
      {loadingAll || loadingMy ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {badges.map((badge: any) => {
            const earned = earnedIds.has(badge.id);
            const earnedBadge = (myBadges as any[])?.find((mb: any) => mb.badgeId === badge.id);
            return (
              <Card key={badge.id} className={cn("transition-all duration-200", earned ? "card-hover" : "opacity-60")}>
                <CardContent className="pt-5 pb-4 text-center">
                  <div className={cn("text-3xl mb-3 transition-all", earned ? "" : "grayscale")}>
                    {earned ? badge.icon : <Lock className="w-7 h-7 mx-auto text-muted-foreground" />}
                  </div>
                  <Badge className={cn("text-[10px] mb-2", RARITY_COLORS[badge.rarity ?? "common"] ?? RARITY_COLORS.common)}>
                    {badge.rarity ?? "common"}
                  </Badge>
                  <h3 className="font-semibold text-xs text-foreground mt-1">{badge.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{badge.description}</p>
                  {earned && earnedBadge?.earnedAt && (
                    <p className="text-[10px] text-primary mt-2">
                      ✓ {new Date(earnedBadge.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
