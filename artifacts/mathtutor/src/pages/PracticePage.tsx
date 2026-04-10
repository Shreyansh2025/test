import { useState } from "react";
import { Link } from "wouter";
import { BookOpen, ChevronRight, Lock, CheckCircle2, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListSubjects, useListTopics } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const SUBJECT_COLORS: Record<number, string> = {
  1: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  2: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  3: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  4: "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

const SUBJECT_ICONS: Record<string, string> = {
  "Mathematics": "∑",
  "Physics": "⚡",
  "Chemistry": "⚗",
  "Programming": "{ }",
  "Biology": "🧬",
  "Economics": "📈",
  "History": "🏛️",
  "English": "📖",
  "Geography": "🌍",
};

function TopicList({ subjectId }: { subjectId: number }) {
  const { data: topics, isLoading } = useListTopics(subjectId);

  if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
      {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
    </div>
  );

  if (!topics?.length) return <p className="text-sm text-muted-foreground mt-3 text-center py-4">No topics yet.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
      {(topics as any[]).map((topic: any) => (
        <Link key={topic.id} href={`/practice/${topic.id}`}>
          <div className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-150 cursor-pointer">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary truncate">{topic.name}</p>
              {topic.description && (
                <p className="text-xs text-muted-foreground truncate">{topic.description}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function PracticePage() {
  const { data: subjects, isLoading } = useListSubjects();
  const [activeSubject, setActiveSubject] = useState<number | null>(null);

  if (isLoading) return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Practice</h1>
        <p className="text-muted-foreground text-sm mt-1">Choose a subject and topic to start practicing</p>
      </div>

      {/* Subject Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {subjects && (subjects as any[]).map((subject: any) => (
          <button
            key={subject.id}
            onClick={() => setActiveSubject(activeSubject === subject.id ? null : subject.id)}
            className={cn(
              "p-4 rounded-xl border text-left transition-all duration-150",
              activeSubject === subject.id
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
            )}
          >
            <div className="text-2xl mb-2">{SUBJECT_ICONS[subject.name] ?? "📚"}</div>
            <div className="font-semibold text-sm text-foreground">{subject.name}</div>
            {subject.description && (
              <div className="text-xs text-muted-foreground mt-0.5 truncate">{subject.description}</div>
            )}
          </button>
        ))}
      </div>

      {/* Topics */}
      {activeSubject && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Topics in {(subjects as any[])?.find((s: any) => s.id === activeSubject)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopicList subjectId={activeSubject} />
          </CardContent>
        </Card>
      )}

      {/* Quick Start if no subject selected */}
      {!activeSubject && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">Select a subject above to browse topics</p>
            <p className="text-xs text-muted-foreground mt-1">Each topic has practice questions tailored to your level</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
