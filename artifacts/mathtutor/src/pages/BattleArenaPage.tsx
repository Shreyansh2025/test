import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Swords, Timer, CheckCircle2, XCircle, Hash, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useGetBattle, useJoinBattle, useSubmitBattleAnswer } from "@workspace/api-client-react";
import { useAuthContext } from "@/components/AuthProvider";
import { getStoredLanguage } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

function normalizeOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(o => String(o)).filter(Boolean);
  }
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) return p.map(o => String(o)).filter(Boolean);
    } catch {
      return raw ? [raw] : [];
    }
  }
  return [];
}

export default function BattleArenaPage() {
  const [, params] = useRoute("/battle/:id");
  const battleId = params?.id ? parseInt(params.id, 10) : 0;
  const { token, userId } = useAuthContext();
  const { toast } = useToast();
  const lang = getStoredLanguage();

  const { data: battleData, isLoading, refetch } = useGetBattle(battleId);
  const joinBattle = useJoinBattle();
  const submitAnswer = useSubmitBattleAnswer();

  const [joined, setJoined] = useState(false);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [myScore, setMyScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const timeLeftRef = useRef(timeLeft);
  const submittingRef = useRef(false);
  const battle = battleData as any;
  const questions: any[] = battle?.questions ?? [];
  const participants = battle?.participants ?? [];
  const currentQ = questions[questionIdx];
  const optionList = useMemo(() => normalizeOptions(currentQ?.options), [currentQ?.options]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const handleSubmit = useCallback(async (answer: string | null) => {
    if (submittingRef.current || result) return;
    if (!battleId || !currentQ?.id) return;
    const per = battle?.timePerQuestion ?? 30;
    const timeTaken = Math.min(per, Math.max(0, per - timeLeftRef.current));
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await submitAnswer.mutateAsync({
        id: battleId,
        data: { questionId: currentQ.id, answer: answer ?? "", timeTaken },
      });
      const data = res as any;
      setResult(data);
      setMyScore((prev) => (typeof data.currentScore === "number" ? data.currentScore : prev));
    } catch {
      toast({ title: "Failed to submit", variant: "destructive" });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [battleId, currentQ?.id, battle?.timePerQuestion, result, submitAnswer, toast, currentQ]);

  // Auto-join on load
  useEffect(() => {
    if (battle && !joined && battleId) {
      joinBattle.mutateAsync({ id: battleId }).then(() => {
        setJoined(true);
        refetch();
      }).catch(() => { setJoined(true); });
    }
  }, [battle?.id]);

  // Poll for live scores every 3 seconds
  useEffect(() => {
    if (gameOver || !battleId) return;
    const poll = setInterval(() => { refetch(); }, 3000);
    return () => clearInterval(poll);
  }, [gameOver, battleId]);

  // Timer
  useEffect(() => {
    if (!battle || gameOver || !currentQ || result) return;
    setTimeLeft(battle.timePerQuestion ?? 30);
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          handleSubmit(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [questionIdx, currentQ?.id, gameOver, result, battle, handleSubmit]);

  async function handleNext() {
    if (questionIdx < questions.length - 1) {
      setQuestionIdx(i => i + 1);
      setSelected(null);
      setResult(null);
    } else {
      setGameOver(true);
      try {
        await fetch(`/api/battles/${battleId}/finish`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-rose-500 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground">Loading battle...</p>
      </div>
    </div>
  );

  if (!battle) return (
    <div className="min-h-screen flex items-center justify-center bg-background text-center px-4">
      <div>
        <Swords className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <h2 className="text-xl font-bold text-foreground mb-2">Battle not found</h2>
        <Link href="/battle"><Button>Back to Lobby</Button></Link>
      </div>
    </div>
  );

  if (gameOver) {
    const sorted = [...participants].sort((a: any, b: any) => b.score - a.score);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold mb-1">Battle Over!</h2>
            <p className="text-muted-foreground text-sm mb-6">Your score: <span className="font-bold text-primary">{myScore}</span></p>
            <div className="space-y-2 mb-6">
              {sorted.map((p: any, i: number) => (
                <div key={p.userId} className={cn("flex items-center gap-3 p-3 rounded-lg", p.userId === userId && "bg-primary/10")}>
                  <span className="font-bold text-lg w-6 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{p.displayName}{p.userId === userId && " (you)"}</p>
                    <p className="text-xs text-muted-foreground">{p.correctAnswers} correct</p>
                  </div>
                  <p className="font-bold text-primary">{p.score} pts</p>
                </div>
              ))}
            </div>
            <Link href="/battle"><Button className="w-full">Back to Lobby</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQ) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-sm w-full text-center">
        <CardContent className="py-8">
          <Swords className="w-10 h-10 mx-auto mb-3 text-rose-500" />
          <h2 className="font-bold text-lg mb-2">Battle Lobby</h2>
          <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
            <Hash className="w-4 h-4 text-primary" />
            <span className="font-mono text-lg font-bold text-primary tracking-wider">{battle.code}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="font-mono"
              onClick={() => {
                void navigator.clipboard.writeText(String(battle.code ?? ""));
                toast({ title: "Battle code copied" });
              }}
            >
              <Copy className="w-3.5 h-3.5 mr-1" /> Copy
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Share this code with friends to join!</p>
          <div className="space-y-2 mb-6">
            {participants.map((p: any) => (
              <div key={p.userId} className="flex items-center gap-2 p-2 rounded-lg bg-muted text-sm">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {p.displayName?.charAt(0)}
                </div>
                <span className="flex-1 text-left font-medium">{p.displayName}</span>
                {p.userId === battle.hostId && <Badge variant="secondary" className="text-xs">Host</Badge>}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Waiting for questions to load...</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/battle"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div className="flex-1">
            <Progress value={((questionIdx + (result ? 1 : 0)) / questions.length) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">Question {questionIdx + 1} of {questions.length}</p>
          </div>
          <div className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-mono font-bold",
            timeLeft <= 5 ? "text-rose-500 bg-rose-500/10 animate-pulse" : "text-foreground bg-card border")}>
            <Timer className="w-3.5 h-3.5" />{timeLeft}
          </div>
        </div>

        {battle?.code && (
          <div className="flex items-center justify-between gap-2 mb-4 px-0.5 flex-wrap">
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <Hash className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground shrink-0">Invite</span>
              <span className="font-mono font-bold text-primary tracking-wider truncate">{battle.code}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 h-8 text-xs"
              onClick={() => {
                void navigator.clipboard.writeText(String(battle.code));
                toast({ title: "Battle code copied" });
              }}
            >
              <Copy className="w-3.5 h-3.5 mr-1" /> Copy
            </Button>
          </div>
        )}

        {/* Scoreboard */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {participants.map((p: any) => (
            <div key={p.userId} className={cn("flex-1 min-w-24 text-center p-2 rounded-lg border text-xs",
              p.userId === userId ? "border-primary/50 bg-primary/10" : "border-border bg-card")}>
              <div className="font-semibold text-foreground truncate">{p.userId === userId ? "You" : p.displayName}</div>
              <div className="text-lg font-bold text-primary">{p.userId === userId ? myScore : p.score}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto space-y-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-lg font-medium leading-relaxed">
              {lang === "hi" && currentQ.textHi ? currentQ.textHi : currentQ.text}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {optionList.length === 0 && (
            <p className="text-sm text-destructive">No answer choices loaded for this question. Refresh or recreate the battle.</p>
          )}
          {optionList.map((opt: string, optIdx: number) => {
            const isSelected = selected === opt;
            const isCorrect = result && opt === result.correctAnswer;
            const isWrong = result && isSelected && !result.correct;
            return (
              <button
                type="button"
                key={`${currentQ.id}-${optIdx}`}
                onClick={() => {
                  if (!result && !submitting) {
                    setSelected(opt);
                    void handleSubmit(opt);
                  }
                }}
                disabled={!!result || submitting}
                className={cn("w-full text-left p-3.5 rounded-xl border text-sm transition-all",
                  !result && "hover:border-rose-500/50 hover:bg-rose-500/5 cursor-pointer",
                  isCorrect && "border-emerald-500 bg-emerald-500/10 font-medium",
                  isWrong && "border-destructive bg-destructive/10",
                  isSelected && !result && "border-rose-500 bg-rose-500/10",
                  !isSelected && !isCorrect && result && "opacity-50 border-border",
                  !result && !isSelected && "border-border bg-card"
                )}>
                <div className="flex items-center gap-3">
                  {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                  {isWrong && <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />}
                  {opt}
                </div>
              </button>
            );
          })}
        </div>

        {result && (
          <Card className={result.correct ? "border-emerald-500/40" : "border-border"}>
            <CardContent className="py-3 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {result.correct ? `✓ Correct! +${result.pointsEarned} pts` : `✗ Incorrect. Answer: ${result.correctAnswer}`}
              </p>
              <Button size="sm" onClick={handleNext}>
                {questionIdx < questions.length - 1 ? "Next →" : "Finish"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
