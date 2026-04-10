import { Link } from "wouter";
import { BookOpen, MessageSquare, Swords, Trophy, TrendingUp, Zap, Flame, Target, ChevronRight, Star, Map, GraduationCap, BrainCircuit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuthContext } from "@/components/AuthProvider";
import { useGetDashboardSummary, useGetRecommendations, useGetRecentActivity } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

function XpBar({ xp, level }: { xp: number; level: number }) {
  const xpToNext = level * 500;
  const currentLevelXp = xp % xpToNext;
  const pct = Math.min((currentLevelXp / xpToNext) * 100, 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{currentLevelXp} XP</span><span>{xpToNext} XP</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { t } = useLanguage();
  const { data: summary, isLoading: loadingSum } = useGetDashboardSummary();
  const { data: recs } = useGetRecommendations();
  const { data: activity } = useGetRecentActivity();

  const statCards = [
    {
      img: "/assets/star.png", icon: Zap, label: t("totalXP"),
      value: summary?.xp ?? user?.xp ?? 0, color: "text-primary", bg: "bg-primary/10",
    },
    {
      img: "/assets/fire.png", icon: Flame, label: t("dayStreak"),
      value: `${summary?.streak ?? user?.streak ?? 0} 🔥`, color: "text-amber-500", bg: "bg-amber-500/10",
    },
    {
      img: "/assets/growth.png", icon: Target, label: t("accuracy"),
      value: `${Math.round((summary?.overallAccuracy ?? 0) * 100)}%`, color: "text-emerald-500", bg: "bg-emerald-500/10",
    },
    {
      img: "/assets/badge.png", icon: Trophy, label: t("rank"),
      value: `#${summary?.rank ?? "–"}`, color: "text-violet-500", bg: "bg-violet-500/10",
    },
  ];

  const quickActions = [
    { img: "/assets/book.png", icon: BookOpen, label: t("practiceNow"), href: "/practice", color: "bg-primary hover:bg-primary/90 text-primary-foreground" },
    { img: "/assets/machine.webp", icon: MessageSquare, label: t("askAITutor"), href: "/tutor", color: "bg-sky-500 hover:bg-sky-600 text-white" },
    { img: "/assets/game.png", icon: Swords, label: t("startBattle"), href: "/battle", color: "bg-rose-500 hover:bg-rose-600 text-white" },
    { img: "/assets/tree.png", icon: Map, label: t("knowledgeMap"), href: "/knowledge-map", color: "bg-emerald-500 hover:bg-emerald-600 text-white" },
    { img: "/assets/books.png", icon: GraduationCap, label: t("courses"), href: "/courses", color: "bg-indigo-500 hover:bg-indigo-600 text-white" },
    { img: "/assets/badge.png", icon: Trophy, label: t("leaderboard"), href: "/leaderboard", color: "bg-amber-500 hover:bg-amber-600 text-white" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("welcomeBack")}, {user?.displayName?.split(" ")[0] ?? "Learner"}! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t("readyToLearn")}</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-card border border-border">
          <img src="/assets/star.png" alt="Level" className="w-8 h-8 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <Star className="w-4 h-4 text-primary hidden" />
          <div className="flex-1 min-w-[120px]">
            <div className="text-xs text-muted-foreground">Level {user?.level ?? 1}</div>
            <XpBar xp={user?.xp ?? 0} level={user?.level ?? 1} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => (
          <Card key={s.label} className="card-hover border-border">
            <CardContent className="pt-5 pb-4">
              {loadingSum ? (
                <Skeleton className="h-12 w-full rounded" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                    <img src={s.img} alt={s.label} className="w-6 h-6 object-contain"
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }} />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {quickActions.map(a => (
            <Link key={a.href} href={a.href}>
              <button className={`w-full flex flex-col items-center gap-2 px-2 py-3 rounded-xl font-medium text-xs transition-all duration-150 ${a.color}`}>
                <img src={a.img} alt={a.label} className="w-6 h-6 object-contain"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }} />
                <a.icon className="w-4 h-4 hidden" />
                <span className="text-center leading-tight">{a.label}</span>
              </button>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recommendations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {t("recommendations")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recs && recs.length > 0 ? recs.map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${r.priority === "high" ? "bg-destructive" : "bg-amber-500"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.description}</p>
                </div>
                {r.topicId && (
                  <Link href={`/practice/${r.topicId}`}>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs flex-shrink-0">
                      {t("practiceNow")} <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">Start practicing to get personalized recommendations!</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            {activity && activity.length > 0 ? (
              <div className="space-y-2">
                {(activity as any[]).slice(0, 5).map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{a.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</p>
                    </div>
                    {a.xpEarned > 0 && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">+{a.xpEarned} XP</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <img src="/assets/books.png" alt="Books" className="w-12 h-12 mx-auto mb-2 opacity-60 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40 hidden" />
                <p className="text-sm">No activity yet. Start practicing to see your progress!</p>
                <Link href="/practice">
                  <Button size="sm" className="mt-3">{t("practiceNow")}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Learning Paths / Subjects Banner */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-4 flex items-center gap-4">
          <img src="/assets/tree.png" alt="Knowledge" className="w-12 h-12 object-contain flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="flex-1">
            <div className="font-semibold text-foreground text-sm">Knowledge Map</div>
            <div className="text-xs text-muted-foreground mt-0.5">Track your learning journey with the skill tree</div>
          </div>
          <Link href="/knowledge-map">
            <Button size="sm" className="flex-shrink-0">Explore <ChevronRight className="w-3 h-3 ml-1" /></Button>
          </Link>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 p-4 flex items-center gap-4">
          <img src="/assets/books.png" alt="Courses" className="w-12 h-12 object-contain flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="flex-1">
            <div className="font-semibold text-foreground text-sm">Course Marketplace</div>
            <div className="text-xs text-muted-foreground mt-0.5">Find & compare top courses from Coursera, Khan Academy, PW & more</div>
          </div>
          <Link href="/courses">
            <Button size="sm" variant="outline" className="flex-shrink-0">Browse <ChevronRight className="w-3 h-3 ml-1" /></Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
