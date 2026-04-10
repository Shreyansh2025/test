import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Lock, Circle, ChevronRight, BookOpen, Zap, Target, Star, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/components/AuthProvider";
import { useGetTopicStats } from "@workspace/api-client-react";

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

const LEARNING_TREE = [
  {
    subject: "Mathematics", icon: "∑", color: "Mathematics",
    topics: [
      { name: "Algebra Basics", nameHi: "बीजगणित की मूल बातें", level: 1, deps: [] },
      { name: "Quadratic Equations", nameHi: "द्विघात समीकरण", level: 2, deps: [0] },
      { name: "Linear Algebra", nameHi: "रेखीय बीजगणित", level: 2, deps: [0] },
      { name: "Trigonometry", nameHi: "त्रिकोणमिति", level: 2, deps: [0] },
      { name: "Calculus — Differentiation", nameHi: "कलन — अवकलन", level: 3, deps: [1, 2] },
      { name: "Probability & Statistics", nameHi: "प्रायिकता और सांख्यिकी", level: 3, deps: [1] },
      { name: "Geometry", nameHi: "ज्यामिति", level: 3, deps: [2, 3] },
      { name: "Calculus — Integration", nameHi: "कलन — समाकलन", level: 4, deps: [4] },
    ],
  },
  {
    subject: "Physics", icon: "⚡", color: "Physics",
    topics: [
      { name: "Newton's Laws", nameHi: "न्यूटन के नियम", level: 1, deps: [] },
      { name: "Kinematics", nameHi: "गतिकी", level: 1, deps: [] },
      { name: "Energy & Work", nameHi: "ऊर्जा और कार्य", level: 2, deps: [0, 1] },
      { name: "Waves & Sound", nameHi: "तरंगें और ध्वनि", level: 3, deps: [2] },
      { name: "Electrostatics", nameHi: "स्थिरवैद्युतिकी", level: 3, deps: [2] },
    ],
  },
  {
    subject: "Chemistry", icon: "⚗", color: "Chemistry",
    topics: [
      { name: "Periodic Table", nameHi: "आवर्त सारणी", level: 1, deps: [] },
      { name: "Chemical Bonding", nameHi: "रासायनिक बंधन", level: 2, deps: [0] },
      { name: "Organic Chemistry Basics", nameHi: "जैविक रसायन की मूल बातें", level: 3, deps: [1] },
    ],
  },
  {
    subject: "Programming", icon: "{}", color: "Programming",
    topics: [
      { name: "Arrays & Strings", nameHi: "सरणियाँ और तार", level: 1, deps: [] },
      { name: "Time Complexity", nameHi: "समय जटिलता", level: 2, deps: [0] },
      { name: "Recursion", nameHi: "पुनरावर्तन", level: 2, deps: [0] },
      { name: "Sorting Algorithms", nameHi: "क्रमबद्ध एल्गोरिदम", level: 3, deps: [1, 2] },
    ],
  },
  {
    subject: "Biology", icon: "🧬", color: "Biology",
    topics: [
      { name: "Cell Biology", nameHi: "कोशिका जीव विज्ञान", level: 1, deps: [] },
      { name: "Genetics & DNA", nameHi: "आनुवंशिकी और डीएनए", level: 2, deps: [0] },
      { name: "Human Anatomy", nameHi: "मानव शरीर रचना", level: 2, deps: [0] },
      { name: "Ecology & Environment", nameHi: "पारिस्थितिकी और पर्यावरण", level: 3, deps: [1] },
      { name: "Evolution", nameHi: "विकास", level: 3, deps: [1] },
    ],
  },
  {
    subject: "Economics", icon: "📈", color: "Economics",
    topics: [
      { name: "Supply & Demand", nameHi: "आपूर्ति और मांग", level: 1, deps: [] },
      { name: "Market Structures", nameHi: "बाजार संरचनाएं", level: 2, deps: [0] },
      { name: "GDP & National Income", nameHi: "जीडीपी और राष्ट्रीय आय", level: 2, deps: [0] },
      { name: "Inflation & Monetary Policy", nameHi: "मुद्रास्फीति और मौद्रिक नीति", level: 3, deps: [2] },
    ],
  },
  {
    subject: "History", icon: "🏛️", color: "History",
    topics: [
      { name: "Ancient Civilizations", nameHi: "प्राचीन सभ्यताएं", level: 1, deps: [] },
      { name: "Medieval Period", nameHi: "मध्यकालीन काल", level: 2, deps: [0] },
      { name: "World Wars", nameHi: "विश्व युद्ध", level: 3, deps: [1] },
      { name: "Indian Independence Movement", nameHi: "भारतीय स्वतंत्रता आंदोलन", level: 3, deps: [1] },
    ],
  },
  {
    subject: "English", icon: "📖", color: "English",
    topics: [
      { name: "Parts of Speech", nameHi: "भाषा के अंग", level: 1, deps: [] },
      { name: "Tenses", nameHi: "काल", level: 2, deps: [0] },
      { name: "Reading Comprehension", nameHi: "पठन बोध", level: 2, deps: [0] },
      { name: "Vocabulary & Synonyms", nameHi: "शब्द भंडार और समानार्थी", level: 3, deps: [1, 2] },
    ],
  },
  {
    subject: "Geography", icon: "🌍", color: "Geography",
    topics: [
      { name: "World Continents & Oceans", nameHi: "विश्व के महाद्वीप और महासागर", level: 1, deps: [] },
      { name: "Climate & Weather", nameHi: "जलवायु और मौसम", level: 2, deps: [0] },
      { name: "Maps & Coordinates", nameHi: "मानचित्र और निर्देशांक", level: 2, deps: [0] },
      { name: "Natural Resources", nameHi: "प्राकृतिक संसाधन", level: 3, deps: [1] },
    ],
  },
];

function TopicNode({ topic, subjectColor, status, idx, total }: {
  topic: { name: string; nameHi: string; level: number; deps: number[] };
  subjectColor: typeof SUBJECT_COLORS[string];
  status: "mastered" | "in-progress" | "available" | "locked";
  idx: number; total: number;
}) {
  const { lang, t } = useLanguage();
  const name = lang === "hi" ? topic.nameHi : topic.name;

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

function SubjectTree({ subject, completedTopics, inProgressTopics }: {
  subject: typeof LEARNING_TREE[number];
  completedTopics: Set<string>;
  inProgressTopics: Set<string>;
}) {
  const { t } = useLanguage();
  const color = SUBJECT_COLORS[subject.color] ?? SUBJECT_COLORS["Mathematics"];
  const masteredCount = subject.topics.filter(t => completedTopics.has(t.name)).length;
  const progress = Math.round((masteredCount / subject.topics.length) * 100);

  const getStatus = (topic: typeof subject.topics[number], idx: number) => {
    if (completedTopics.has(topic.name)) return "mastered";
    const depsMastered = topic.deps.every(d => completedTopics.has(subject.topics[d]?.name ?? ""));
    if (!depsMastered) return "locked";
    if (inProgressTopics.has(topic.name)) return "in-progress";
    if (idx === 0 || (idx <= 2 && masteredCount > 0)) return "in-progress";
    return "available";
  };

  const byLevel: Record<number, typeof subject.topics[number][]> = {};
  subject.topics.forEach(t => { (byLevel[t.level] = byLevel[t.level] ?? []).push(t); });

  return (
    <Card className={cn("border transition-all", color.border, color.bg)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-lg", color.bg, "border", color.border)}>
              {subject.icon}
            </div>
            <div>
              <CardTitle className="text-sm font-bold">{subject.subject}</CardTitle>
              <p className="text-xs text-muted-foreground">{masteredCount}/{subject.topics.length} {t("mastered")}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={cn("text-lg font-bold", color.text)}>{progress}%</div>
          </div>
        </div>
        <Progress value={progress} className="h-1.5 mt-1" />
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-4">
          {Object.entries(byLevel).sort(([a], [b]) => +a - +b).map(([level, topicsAtLevel]) => (
            <div key={level}>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Level {level}</div>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="flex flex-wrap gap-3 justify-start">
                {topicsAtLevel.map((topic, i) => {
                  const globalIdx = subject.topics.indexOf(topic);
                  return (
                    <TopicNode
                      key={topic.name}
                      topic={topic}
                      subjectColor={color}
                      status={getStatus(topic, globalIdx)}
                      idx={i}
                      total={topicsAtLevel.length}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function KnowledgeMapPage() {
  const { t } = useLanguage();
  const { user, token } = useAuthContext();
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const { data: topicStatsData, isLoading: loadingStats } = useGetTopicStats({});

  const topicStats = (topicStatsData as any[]) ?? [];
  const masteredTopicNames = new Set<string>(
    topicStats.filter((s: any) => s.accuracy >= 0.8 && s.answered >= 3).map((s: any) => s.topicName)
  );
  const inProgressTopicNames = new Set<string>(
    topicStats.filter((s: any) => s.answered > 0 && s.accuracy < 0.8).map((s: any) => s.topicName)
  );

  const completedTopics = masteredTopicNames;
  const totalTopics = LEARNING_TREE.reduce((acc, s) => acc + s.topics.length, 0);
  const masteredTopics = completedTopics.size;
  const overallProgress = Math.round((masteredTopics / totalTopics) * 100);

  const filteredTree = activeSubject
    ? LEARNING_TREE.filter(s => s.subject === activeSubject)
    : LEARNING_TREE;

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
        {[{ label: "All Subjects", value: null }, ...LEARNING_TREE.map(s => ({ label: s.subject, value: s.subject }))].map(filter => (
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
        {loadingStats ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : filteredTree.map(subject => (
          <SubjectTree key={subject.subject} subject={subject} completedTopics={completedTopics} inProgressTopics={inProgressTopicNames} />
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
