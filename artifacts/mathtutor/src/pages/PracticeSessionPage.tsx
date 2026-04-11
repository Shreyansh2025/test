import { useState, useEffect, useCallback, useRef } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb, ChevronRight, Timer, Zap, RefreshCw, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useListQuestions } from "@workspace/api-client-react";
import { useAuthContext } from "@/components/AuthProvider";
import { getStoredLanguage } from "@/hooks/useAuth";
import { ConfidenceRating } from "@/components/ConfidenceRating";
import { cn } from "@/lib/utils";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-emerald-500 bg-emerald-500/10",
  medium: "text-amber-500 bg-amber-500/10",
  hard: "text-rose-500 bg-rose-500/10",
};

export default function PracticeSessionPage() {
  const [, params] = useRoute("/practice/:topicId");
  const topicId = params?.topicId ? parseInt(params.topicId, 10) : undefined;
  const { token, updateUser, user } = useAuthContext();
  const { toast } = useToast();
  const lang = getStoredLanguage();
  const aiMode = new URLSearchParams(window.location.search).get("mode") === "ai";

  const { data: questions, isLoading, refetch } = useListQuestions({ topicId, limit: 10 });
  const [aiQuestions, setAiQuestions] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showWhyWrong, setShowWhyWrong] = useState(false);
  const [whyWrong, setWhyWrong] = useState<string | null>(null);
  const [loadingWhy, setLoadingWhy] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0, xpEarned: 0 });

  const activeQuestions = aiMode ? aiQuestions : (questions as any[] | undefined);
  const currentQ = activeQuestions?.[idx] as any;
  const total = activeQuestions?.length ?? 0;

  const toastRef = useRef(toast);
  toastRef.current = toast;

  const generateAiQuiz = useCallback(async () => {
    if (!topicId) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/practice/generate-ai-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topicId, language: lang }),
      });
      const raw = await res.text();
      let payload: { questions?: unknown[]; error?: string } = {};
      try {
        payload = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error("AI service returned invalid response.");
      }
      if (!res.ok) throw new Error(payload.error ?? "Failed to generate AI quiz");
      const list = Array.isArray(payload.questions) ? payload.questions : [];
      const generated = list.map((item: any, qIdx: number) => {
        const difficulty = item.difficulty === "easy" || item.difficulty === "hard" || item.difficulty === "medium"
          ? item.difficulty
          : "medium";
        const points = typeof item.points === "number"
          ? item.points
          : difficulty === "easy"
            ? 10
            : difficulty === "hard"
              ? 25
              : 15;
        const timeLimit = typeof item.timeLimit === "number"
          ? item.timeLimit
          : difficulty === "easy"
            ? 30
            : difficulty === "hard"
              ? 60
              : 45;
        return {
          /** Stable unique id per slot so timer effect tracks question changes (avoid duplicate -1…). */
          id: `ai-${topicId}-${qIdx}`,
          topicId,
          text: item.question ?? "Generated question",
          textHi: lang === "hi" ? (item.question ?? "Generated question") : null,
          options: Array.isArray(item.options) ? item.options : [],
          difficulty,
          points,
          timeLimit,
          aiMeta: {
            correctAnswer: item.correctAnswer ?? "",
            explanation: item.explanation ?? "",
            steps: Array.isArray(item.steps) ? item.steps : [],
          },
        };
      });
      setAiQuestions(generated.filter((q) => Array.isArray(q.options) && q.options.length > 0));
      setIdx(0);
      setSelected(null);
      setResult(null);
      setShowExplanation(false);
      setShowWhyWrong(false);
      setWhyWrong(null);
      setSessionStats({ correct: 0, total: 0, xpEarned: 0 });
      setShowConfidence(false);
    } catch (err: any) {
      toastRef.current({ title: err?.message ?? "Failed to generate AI quiz", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  }, [topicId, token, lang]);

  useEffect(() => {
    if (!aiMode || !topicId) return;
    void generateAiQuiz();
  }, [aiMode, topicId, generateAiQuiz]);

  const handleSubmitRef = useRef<(answer: string | null) => Promise<void>>(async () => {});

  async function handleSubmit(answer: string | null) {
    if (submitting || result) return;
    if (aiMode && currentQ?.aiMeta) {
      const isCorrect = (answer ?? "") === currentQ.aiMeta.correctAnswer;
      const xpEarned = isCorrect ? (currentQ.points ?? 10) : Math.floor((currentQ.points ?? 10) * 0.1);
      setResult({
        correct: isCorrect,
        correctAnswer: currentQ.aiMeta.correctAnswer,
        xpEarned,
        explanation: currentQ.aiMeta.explanation,
        explanationHi: lang === "hi" ? currentQ.aiMeta.explanation : null,
        steps: currentQ.aiMeta.steps ?? [],
      });
      setSessionStats(s => ({
        correct: s.correct + (isCorrect ? 1 : 0),
        total: s.total + 1,
        xpEarned: s.xpEarned + xpEarned,
      }));
      if (isCorrect) updateUser({ xp: (user?.xp ?? 0) + xpEarned });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/practice/questions/${currentQ.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ answer: answer ?? "", timeTaken: (currentQ.timeLimit ?? 30) - timeLeft }),
      });
      const data = await res.json();
      setResult(data);
      setSessionStats(s => ({
        correct: s.correct + (data.correct ? 1 : 0),
        total: s.total + 1,
        xpEarned: s.xpEarned + (data.xpEarned ?? 0),
      }));
      if (data.correct) {
        updateUser({ xp: (user?.xp ?? 0) + (data.xpEarned ?? 0) });
      }
    } catch {
      toastRef.current({ title: "Failed to submit answer", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (!currentQ || result || submitting) return;
    const limit = currentQ.timeLimit ?? 30;
    setTimeLeft(limit);
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          void handleSubmitRef.current(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [idx, currentQ?.id, result, submitting]);

  function handleOptionClick(option: string) {
    if (result || submitting) return;
    setSelected(option);
    handleSubmit(option);
  }

  function handleNext() {
    if (idx < total - 1) {
      setIdx(i => i + 1);
      setSelected(null);
      setResult(null);
      setShowExplanation(false);
      setShowWhyWrong(false);
      setWhyWrong(null);
    } else {
      setShowConfidence(true);
    }
  }

  async function handleAskWhyWrong() {
    if (!result || result.correct || !currentQ) return;
    setShowWhyWrong(true);
    if (whyWrong) return;
    setLoadingWhy(true);
    try {
      const userAnswer = selected ?? "No answer provided (timed out)";
      const res = await fetch("/api/ai/misconception", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: currentQ.text, correctAnswer: result.correctAnswer, userAnswer, explanation: result.explanation }),
      });
      if (!res.ok) {
        setWhyWrong("Could not generate AI explanation. Please try again.");
        return;
      }
      const data = await res.json();
      setWhyWrong(data.misconception ?? data.message ?? "Could not generate explanation.");
    } catch {
      setWhyWrong("Could not connect to AI. Please try again.");
    } finally {
      setLoadingWhy(false);
    }
  }

  if (isLoading || (aiMode && aiLoading)) return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]" data-no-auto-translate="true">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground">{aiMode ? "Generating AI quiz..." : "Loading questions..."}</p>
      </div>
    </div>
  );

  // Completed all questions — show confidence rating first, then results
  if (showConfidence && total > 0) {
    return (
      <div className="p-4 sm:p-6 max-w-lg mx-auto" data-no-auto-translate="true">
        <ConfidenceRating
          topicName={questions?.[0] ? `Topic #${topicId}` : "this topic"}
          sessionCorrect={sessionStats.correct}
          sessionTotal={sessionStats.total}
          topicId={topicId ?? 0}
          token={token}
          onDone={() => setShowConfidence(false)}
        />
      </div>
    );
  }

  if (!showConfidence && idx >= total && total > 0) {
    const pct = Math.round((sessionStats.correct / sessionStats.total) * 100);
    return (
      <div className="p-4 sm:p-6 max-w-lg mx-auto" data-no-auto-translate="true">
        <Card className="text-center">
          <CardContent className="py-10">
            <div className="text-5xl mb-4">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
            <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
            <div className="grid grid-cols-3 gap-4 my-6">
              <div>
                <div className="text-2xl font-bold text-foreground">{sessionStats.correct}/{sessionStats.total}</div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{pct}%</div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">+{sessionStats.xpEarned}</div>
                <div className="text-xs text-muted-foreground">XP Earned</div>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => {
                setIdx(0);
                setSelected(null);
                setResult(null);
                setShowConfidence(false);
                setSessionStats({ correct: 0, total: 0, xpEarned: 0 });
                if (aiMode) void generateAiQuiz();
                else refetch();
              }}>
                <RefreshCw className="w-4 h-4 mr-2" />Try Again
              </Button>
              <Link href="/practice"><Button variant="outline">Back to Subjects</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQ) return (
    <div className="p-6 text-center" data-no-auto-translate="true">
      <p className="text-muted-foreground">{aiMode ? "Could not generate AI quiz for this topic." : "No questions available for this topic."}</p>
      <div className="mt-4 flex items-center justify-center gap-2">
        {!aiMode && topicId && (
          <Button onClick={() => { window.location.href = `/practice/${topicId}?mode=ai`; }}>Try AI Quiz</Button>
        )}
        {aiMode && (
          <Button onClick={() => void generateAiQuiz()}>
            <RefreshCw className="w-4 h-4 mr-2" />Regenerate
          </Button>
        )}
        <Link href="/practice"><Button variant="outline">Back to Practice</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4" data-no-auto-translate="true">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/practice"><Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="w-4 h-4" />Back</Button></Link>
        <div className="flex-1">
          <Progress value={((idx + (result ? 1 : 0)) / total) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">Question {idx + 1} of {total}</p>
        </div>
        <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-mono font-semibold",
          timeLeft <= 5 ? "text-destructive bg-destructive/10 animate-pulse" : "text-muted-foreground bg-muted")}>
          <Timer className="w-3.5 h-3.5" />
          {timeLeft}s
        </div>
      </div>

      {/* Question — must stay out of GlobalAutoTranslate: it reuses text nodes and restores stale “original” text */}
      <Card key={String(currentQ.id)}>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={DIFFICULTY_COLORS[currentQ.difficulty ?? "medium"]}>{currentQ.difficulty}</Badge>
            <Badge variant="outline" className="text-xs"><Zap className="w-3 h-3 mr-1" />{currentQ.points} XP</Badge>
          </div>
          <CardTitle className="text-lg leading-relaxed font-medium" lang={lang === "hi" ? "hi" : "en"}>
            {lang === "hi" && currentQ.textHi ? currentQ.textHi : currentQ.text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(currentQ.options as string[]).map((opt: string, optIdx: number) => {
            const isSelected = selected === opt;
            const isCorrect = result && opt === result.correctAnswer;
            const isWrong = result && isSelected && !result.correct;
            return (
              <button
                key={`${String(currentQ.id)}-${optIdx}`}
                onClick={() => handleOptionClick(opt)}
                disabled={!!result || submitting}
                className={cn(
                  "w-full text-left p-3 rounded-lg border text-sm transition-all duration-150",
                  !result && "hover:border-primary/60 hover:bg-primary/5 cursor-pointer",
                  isCorrect && "border-emerald-500 bg-emerald-500/10 text-emerald-600 font-medium",
                  isWrong && "border-destructive bg-destructive/10 text-destructive",
                  isSelected && !result && "border-primary bg-primary/10",
                  !isSelected && !isCorrect && result && "opacity-50",
                  !result && !isSelected && "border-border bg-card"
                )}
              >
                <div className="flex items-center gap-3">
                  {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                  {isWrong && <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />}
                  <span>{opt}</span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className={result.correct ? "border-emerald-500/50 bg-emerald-500/5" : "border-destructive/50 bg-destructive/5"}>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              {result.correct ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />}
              <div className="flex-1">
                <p className="font-semibold text-foreground">{result.correct ? `Correct! +${result.xpEarned} XP` : "Incorrect"}</p>
                {(result.explanation || result.explanationHi) && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {lang === "hi" && result.explanationHi ? result.explanationHi : result.explanation}
                  </p>
                )}
                {result.steps && result.steps.length > 0 && (
                  <button onClick={() => setShowExplanation(!showExplanation)} className="text-xs text-primary hover:underline mt-2 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />{showExplanation ? "Hide" : "Show"} solution steps
                  </button>
                )}
                {showExplanation && result.steps && (
                  <ol className="mt-2 space-y-1">
                    {result.steps.map((step: string, i: number) => (
                      <li key={i} className="text-sm text-foreground flex gap-2">
                        <span className="text-primary font-semibold flex-shrink-0">{i + 1}.</span>{step}
                      </li>
                    ))}
                  </ol>
                )}
                {/* Why wrong? — AI misconception explainer */}
                {!result.correct && (
                  <div className="mt-3">
                    <button
                      onClick={handleAskWhyWrong}
                      className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-500 font-semibold hover:bg-amber-400/20 transition-all"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Why am I wrong? (AI explanation)
                      {showWhyWrong ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {showWhyWrong && (
                      <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-400/30 text-xs text-foreground leading-relaxed">
                        {loadingWhy ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-3 h-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                            Analyzing your mistake...
                          </div>
                        ) : whyWrong}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-3">
              {idx < total - 1 ? (
                <Button size="sm" onClick={handleNext}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleNext}>
                  Rate Confidence
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
