import { Target, TrendingUp, BookOpen, CheckCircle2, XCircle, BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProgress, useGetTopicStats, useGetAccuracyHistory } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

const STRENGTH_COLORS: Record<string, string> = {
  strong: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  average: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  weak: "text-rose-500 bg-rose-500/10 border-rose-500/30",
};

export default function ProgressPage() {
  const { data: progress, isLoading: loadingProg } = useGetProgress({});
  const { data: topicStats, isLoading: loadingStats } = useGetTopicStats({});
  const { data: accuracyHistory } = useGetAccuracyHistory({ days: 7 });

  const p = progress as any;
  const ts = (topicStats as any[]) ?? [];
  const ah = (accuracyHistory as any[]) ?? [];

  const statCards = [
    { icon: BookOpen, label: "Questions Answered", value: p?.totalAnswered ?? 0, color: "text-primary" },
    { icon: CheckCircle2, label: "Correct Answers", value: p?.totalCorrect ?? 0, color: "text-emerald-500" },
    { icon: Target, label: "Overall Accuracy", value: `${Math.round((p?.overallAccuracy ?? 0) * 100)}%`, color: "text-sky-500" },
    { icon: TrendingUp, label: "Current Streak", value: `${p?.streak ?? 0}d`, color: "text-amber-500" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Learning Progress</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your performance across all subjects</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => (
          <Card key={s.label} className="card-hover">
            <CardContent className="pt-5 pb-4">
              {loadingProg ? <Skeleton className="h-12 w-full" /> : (
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-current/10`} style={{ color: undefined }}>
                    <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
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

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Accuracy History */}
        {ah.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Accuracy This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={ah.map(a => ({ date: a.date?.slice(5), accuracy: Math.round((a.accuracy ?? 0) * 100) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip formatter={(v: any) => [`${v}%`, "Accuracy"]} />
                  <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Topic Accuracy */}
        {ts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                Topic Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ts.slice(0, 6).map(t => ({ name: t.topicName?.substring(0, 8), accuracy: Math.round((t.accuracy ?? 0) * 100) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip formatter={(v: any) => [`${v}%`, "Accuracy"]} />
                  <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Topic Stats Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Topic Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingStats ? (
            <div className="p-4 space-y-2">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 rounded" />)}
            </div>
          ) : ts.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              No data yet. Start practicing to see your topic stats!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {ts.map((t: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.topicName}</p>
                    <p className="text-xs text-muted-foreground">{t.subjectName} · {t.answered} questions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{Math.round((t.accuracy ?? 0) * 100)}%</p>
                    <p className="text-xs text-muted-foreground">{t.correct}/{t.answered}</p>
                  </div>
                  <Badge className={cn("text-xs flex-shrink-0", STRENGTH_COLORS[t.strength ?? "average"])}>
                    {t.strength}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weak vs Strong */}
      {p && (p.weakTopics?.length > 0 || p.strongTopics?.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {p.weakTopics?.length > 0 && (
            <Card className="border-rose-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-rose-500">
                  <XCircle className="w-4 h-4" /> Needs Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {p.weakTopics.map((t: string, i: number) => (
                    <Badge key={i} className="bg-rose-500/10 text-rose-500 border-rose-500/20">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {p.strongTopics?.length > 0 && (
            <Card className="border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" /> Strong Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {p.strongTopics.map((t: string, i: number) => (
                    <Badge key={i} className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
