import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Lock, Circle, BookOpen, Star, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useGetTopicStats, useListSubjects, useListTopics } from "@workspace/api-client-react";

const SUBJECT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  "Mathematics": { bg: "bg-violet-500/10", border: "border-violet-500/40", text: "text-violet-400", glow: "shadow-violet-500/20" },
  "Physics": { bg: "bg-sky-500/10", border: "border-sky-500/40", text: "text-sky-400", glow: "shadow-sky-500/20" },
  "Chemistry": { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400", glow: "shadow-emerald-500/20" },
  "Programming": { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-400", glow: "shadow-amber-500/20" },
  "Biology": { bg: "bg-green-500/10", border: "border-green-500/40", text: "text-green-400", glow: "shadow-green-500/20" },
  "Economics": { bg: "bg-orange-500/10", border: "border-orange-500/40", text: "text-orange-400", glow: "shadow-orange-500/20" },
  "History": { bg: "bg-purple-500/10", border: "border-purple-500/40", text: "text-purple-400", glow: "shadow-purple-500/20" },
  "English": { bg: "bg-pink-500/10", border: "border-pink-500/40", text: "text-pink-400", glow: "shadow-pink-500/20" },
  "Geography": { bg: "bg-cyan-500/10", border: "border-cyan-500/40", text: "text-cyan-400", glow: "shadow-cyan-500/20" },
};

const SUBJECT_ICONS: Record<string, string> = {
  Mathematics: "∑",
  Physics: "⚡",
  Chemistry: "⚗",
  Programming: "{ }",
  Biology: "🧬",
  Economics: "📈",
  History: "🏛️",
  English: "📖",
  Geography: "🌍",
};

function TopicNode({ topic, subjectColor, status }: {
  topic: { name: string; nameHi?: string };
  subjectColor: typeof SUBJECT_COLORS[string];
  status: "mastered" | "in-progress" | "available" | "locked";
}) {
  const { lang, t } = useLanguage();
  const name = lang === "hi" ? topic.nameHi ?? topic.name : topic.name;

  const statusConfig = {
    mastered: { icon: CheckCircle2, iconClass: "text-emerald-400", badge: t("mastered"), badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", ring: "ring-2 ring-emerald-500/50" },
    "in-progress": { icon: Circle, iconClass: "text-amber-400 animate-pulse", badge: t("inProgress"), badgeClass: "bg-amber-500/20 text-amber-400 border-amber-500/30", ring: "ring-2 ring-amber-500/50" },
    available: { icon: BookOpen, iconClass: subjectColor.text, badge: "", badgeClass: "", ring: "" },
    locked: { icon: Lock, iconClass: "text-muted-foreground/50", badge: t("locked"), badgeClass: "bg-muted/50 text-muted-foreground border-muted/30", ring: "" },
  }[status];

  const Icon = statusConfig.icon;

  return (
    <div className={cn(
      "relative flex flex-col items-center gap-1.5 group",
      status === "locked" && "opacity-50"
    )}>
      <div className={cn(
        "w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg",
        subjectColor.bg, subjectColor.border, statusConfig.ring,
        status !== "locked" && `hover:shadow-xl hover:${subjectColor.glow} hover:scale-110`
      )}>
        <Icon className={cn("w-6 h-6", statusConfig.iconClass)} />
      </div>
      <div className="text-center max-w-[80px]">
        <p className="text-[10px] font-medium text-foreground leading-tight line-clamp-2">{name}</p>
        {statusConfig.badge && (
          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border mt-0.5 inline-block", statusConfig.badgeClass)}>
            {statusConfig.badge}
          </span>
        )}
      </div>
    </div>
  );
}

function SubjectTree({
  subject,
  completedTopics,
  inProgressTopics,
}: {
  subject: { id: number; name: string; icon?: string };
  completedTopics: Set<string>;
  inProgressTopics: Set<string>;
}) {
  const { t } = useLanguage();
  const color = SUBJECT_COLORS[subject.name] ?? SUBJECT_COLORS["Mathematics"];
  const { data: topicsData, isLoading } = useListTopics(subject.id);
  const topics = (topicsData as any[]) ?? [];
  const masteredCount = topics.filter((t) => completedTopics.has(t.name)).length;
  const progress = topics.length ? Math.round((masteredCount / topics.length) * 100) : 0;

  return (
    <Card className={cn("border transition-all", color.border, color.bg)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-lg", color.bg, "border", color.border)}>
              {subject.icon ?? SUBJECT_ICONS[subject.name] ?? "📚"}
            </div>
            <div>
              <CardTitle className="text-sm font-bold">{subject.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {masteredCount}/{topics.length} {t("mastered")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={cn("text-lg font-bold", color.text)}>{progress}%</div>
          </div>
        </div>
        <Progress value={progress} className="h-1.5 mt-1" />
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex flex-wrap gap-3 justify-start">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-20 rounded-xl" />)
          ) : (
            topics.map((topic: any) => {
              const status = completedTopics.has(topic.name)
                ? "mastered"
                : inProgressTopics.has(topic.name)
                ? "in-progress"
                : "available";
              return (
                <TopicNode
                  key={topic.id}
                  topic={{ name: topic.name, nameHi: topic.nameHi }}
                  subjectColor={color}
                  status={status}
                />
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function KnowledgeMapPage() {
  const { t } = useLanguage();
  const { data: subjectsData, isLoading: loadingSubjects } = useListSubjects();
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const { data: topicStatsData, isLoading: loadingStats } = useGetTopicStats({});
  const subjects = ((subjectsData as any[]) ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    icon: SUBJECT_ICONS[s.name] ?? "📚",
  }));

  const topicStats = (topicStatsData as any[]) ?? [];
  const masteredTopicNames = new Set<string>(
    topicStats.filter((s: any) => s.accuracy >= 0.8 && s.answered >= 3).map((s: any) => s.topicName)
  );
  const inProgressTopicNames = new Set<string>(
    topicStats.filter((s: any) => s.answered > 0 && s.accuracy < 0.8).map((s: any) => s.topicName)
  );

  const completedTopics = masteredTopicNames;
  const totalTopics = topicStats.length > 0 ? topicStats.length : 1;
  const masteredTopics = completedTopics.size;
  const overallProgress = Math.round((masteredTopics / totalTopics) * 100);

  const filteredTree = activeSubject
    ? subjects.filter((s) => s.name === activeSubject)
    : subjects;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("knowledgeMap")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your personal learning skill tree</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-card border">
          <Star className="w-4 h-4 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">{t("yourProgress")}</div>
            <div className="text-sm font-bold">{masteredTopics}/{totalTopics} topics • {overallProgress}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[{ label: "All Subjects", value: null }, ...subjects.map((s) => ({ label: s.name, value: s.name }))].map(filter => (
          <button
            key={filter.label}
            onClick={() => setActiveSubject(filter.value)}
            className={cn(
              "px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
              activeSubject === filter.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loadingStats || loadingSubjects ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : filteredTree.map((subject) => (
          <SubjectTree key={subject.id} subject={subject} completedTopics={completedTopics} inProgressTopics={inProgressTopicNames} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: CheckCircle2, label: t("mastered"), color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
          { icon: Circle, label: t("inProgress"), color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
          { icon: Lock, label: t("locked"), color: "text-muted-foreground", bg: "bg-muted/30", border: "border-muted/30" },
        ].map(item => (
          <div key={item.label} className={cn("flex items-center gap-2 p-2.5 rounded-xl border text-xs", item.bg, item.border)}>
            <item.icon className={cn("w-4 h-4 flex-shrink-0", item.color)} />
            <span className="font-medium text-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-4 flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-foreground">Continue your journey</div>
          <div className="text-sm text-muted-foreground mt-0.5">Pick up where you left off — practice unlocked topics</div>
        </div>
        <Link href="/practice">
          <Button size="sm" className="flex-shrink-0">
            {t("practiceNow")} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
