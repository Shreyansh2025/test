import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BrainCircuit,
  Flame,
  Gamepad2,
  Grid3x3,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

function useDailySeed() {
  return useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);
}

function MathSprint() {
  const [a, setA] = useState(() => Math.floor(Math.random() * 20) + 1);
  const [b, setB] = useState(() => Math.floor(Math.random() * 20) + 1);
  const [ans, setAns] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function next() {
    setA(Math.floor(Math.random() * 20) + 1);
    setB(Math.floor(Math.random() * 20) + 1);
    setAns("");
  }

  function submit() {
    const sum = a + b;
    if (Number(ans) === sum) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      setMsg({ text: "Nice! +1 streak", ok: true });
    } else {
      setStreak(0);
      setMsg({ text: `Off by a bit — answer was ${sum}`, ok: false });
    }
    next();
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border-2 border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-card to-card shadow-lg"
      data-no-auto-translate="true"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/20 blur-2xl" />
      <CardHeader className="relative pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg tracking-tight">Math Sprint</CardTitle>
            <CardDescription>Answer fast — build your streak</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
            <Trophy className="h-3 w-3" /> Score {score}
          </Badge>
          <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300">
            <Flame className="h-3 w-3" /> Streak {streak}
          </Badge>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-8 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">What is</p>
          <p className="mt-2 font-mono text-4xl font-bold tabular-nums tracking-tight text-foreground">
            {a} <span className="text-primary">+</span> {b}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">= ?</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={ans}
            onChange={(e) => setAns(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Your answer"
            className="h-11 font-mono text-lg"
          />
          <Button className="h-11 shrink-0 btn-glow sm:px-8" onClick={submit}>
            Check
          </Button>
        </div>
        {msg && (
          <p
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-medium",
              msg.ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-destructive/40 bg-destructive/10 text-destructive",
            )}
          >
            {msg.text}
          </p>
        )}
      </CardContent>
    </div>
  );
}

function NumberMemory() {
  const [seq, setSeq] = useState(() =>
    Array.from({ length: 5 }, () => Math.floor(Math.random() * 9) + 1).join(""),
  );
  const [show, setShow] = useState(true);
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState("");

  function newRound() {
    setSeq(Array.from({ length: 5 }, () => Math.floor(Math.random() * 9) + 1).join(""));
    setShow(true);
    setGuess("");
    setResult("");
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border-2 border-sky-500/25 bg-gradient-to-br from-sky-500/10 via-card to-card shadow-lg"
      data-no-auto-translate="true"
    >
      <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-sky-500/15 blur-2xl" />
      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Grid3x3 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg tracking-tight">Number Memory</CardTitle>
              <CardDescription>Glance, hide, recall</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 text-xs" onClick={newRound}>
            New sequence
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="rounded-xl border border-sky-500/20 bg-muted/30 px-4 py-6 text-center font-mono text-3xl font-bold tracking-[0.35em] text-foreground">
          {show ? seq : "• • • • •"}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => setShow(false)}>
            Hide sequence
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setShow(true)}>
            Show again
          </Button>
        </div>
        <Input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Type the digits in order"
          className="h-11 font-mono text-lg tracking-widest"
        />
        <Button className="w-full btn-glow" onClick={() => setResult(guess === seq ? "Perfect recall!" : `The sequence was ${seq}`)}>
          Submit
        </Button>
        {result && (
          <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-center text-sm font-medium text-foreground">{result}</p>
        )}
      </CardContent>
    </div>
  );
}

function PatternPick() {
  const [n] = useState(() => Math.floor(Math.random() * 6) + 2);
  const [answer, setAnswer] = useState("");
  const [msg, setMsg] = useState("");
  const seq = [n, n * 2, n * 3, n * 4];
  const next = n * 5;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border-2 border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-card to-card shadow-lg"
      data-no-auto-translate="true"
    >
      <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-violet-500/20 blur-2xl" />
      <CardHeader className="relative pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg tracking-tight">Pattern Pick</CardTitle>
            <CardDescription>Spot the rule — find the next term</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="rounded-xl border border-violet-500/20 bg-muted/30 px-4 py-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Sequence</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {seq.join(", ")}, <span className="text-violet-600 dark:text-violet-400">?</span>
          </p>
        </div>
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Next number"
          className="h-11 font-mono text-lg"
        />
        <Button
          className="w-full btn-glow"
          onClick={() => setMsg(Number(answer) === next ? "Correct — pattern unlocked!" : `The next term is ${next}`)}
        >
          Check answer
        </Button>
        {msg && <p className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-center text-sm font-medium">{msg}</p>}
      </CardContent>
    </div>
  );
}

function Target10() {
  const [nums] = useState(() => [
    Math.floor(Math.random() * 9) + 1,
    Math.floor(Math.random() * 9) + 1,
    Math.floor(Math.random() * 9) + 1,
  ]);
  const [expr, setExpr] = useState("");
  const [msg, setMsg] = useState("");

  function check() {
    try {
      const val = Function(`"use strict"; return (${expr});`)();
      setMsg(Number(val) === 10 ? "You hit 10 — brilliant!" : `You got ${val}. Aim for exactly 10.`);
    } catch {
      setMsg("Use +, -, *, / and parentheses only.");
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-card shadow-lg"
      data-no-auto-translate="true"
    >
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-emerald-500/15 blur-2xl" />
      <CardHeader className="relative pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg tracking-tight">Target 10</CardTitle>
            <CardDescription>Combine every digit once to reach 10</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="flex flex-wrap justify-center gap-2">
          {nums.map((num, i) => (
            <span
              key={i}
              className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 font-mono text-xl font-bold text-emerald-800 dark:text-emerald-200"
            >
              {num}
            </span>
          ))}
        </div>
        <Input
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="e.g. (3 + 2) * 2"
          className="h-11 font-mono"
        />
        <Button className="w-full btn-glow" onClick={check}>
          Evaluate
        </Button>
        {msg && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-sm font-medium">{msg}</p>}
      </CardContent>
    </div>
  );
}

function DailyChallenge() {
  const seed = useDailySeed();
  const [done, setDone] = useState(() => localStorage.getItem(`daily-game-${seed}`) === "1");
  function markDone() {
    localStorage.setItem(`daily-game-${seed}`, "1");
    setDone(true);
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card shadow-lg"
      data-no-auto-translate="true"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-48 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
      <CardHeader className="relative pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-md">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg tracking-tight">Daily challenge</CardTitle>
            <CardDescription>One quick win — keep your learning habit hot</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Finish any mini-game above, then tap below to log today’s session. Small daily reps compound into streaks and XP.
        </p>
        <Button className="w-full btn-glow" size="lg" onClick={markDone} disabled={done}>
          {done ? "Logged for today — see you tomorrow!" : "Mark today’s play done"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">Date: {seed}</p>
      </CardContent>
    </div>
  );
}

const TAB_META = [
  { value: "sprint", label: "Sprint", icon: Zap },
  { value: "memory", label: "Memory", icon: Grid3x3 },
  { value: "pattern", label: "Pattern", icon: Sparkles },
  { value: "target", label: "Target 10", icon: Target },
  { value: "daily", label: "Daily", icon: Flame },
] as const;

export default function GamesPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.12), transparent 50%), radial-gradient(ellipse 60% 40% at 100% 50%, hsl(var(--accent) / 0.08), transparent 45%)",
        }}
      />

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <header className="relative text-center sm:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <Gamepad2 className="h-3.5 w-3.5" />
            MathMind Arcade
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="gradient-text">Brain games</span>
            <span className="text-foreground"> · quick & sharp</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Mini challenges styled like the rest of MathMind — warm accents, clear feedback, and fast rounds you can squeeze between study sessions.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 shadow-sm backdrop-blur-sm">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="text-xs font-medium text-muted-foreground">Focus mode</p>
                <p className="text-sm font-semibold text-foreground">60-second rounds</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 shadow-sm backdrop-blur-sm">
              <Trophy className="h-5 w-5 text-amber-500" />
              <div className="text-left">
                <p className="text-xs font-medium text-muted-foreground">Streak-friendly</p>
                <p className="text-sm font-semibold text-foreground">Daily check-in</p>
              </div>
            </div>
          </div>
        </header>

        <Tabs defaultValue="sprint" className="w-full">
          <TabsList className="mb-2 grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-border bg-muted/50 p-1.5 sm:grid-cols-5">
            {TAB_META.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-xl py-2.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:text-primary sm:text-sm"
              >
                <Icon className="mr-1.5 h-3.5 w-3.5 opacity-70 sm:inline" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="sprint" className="mt-4 outline-none">
            <MathSprint />
          </TabsContent>
          <TabsContent value="memory" className="mt-4 outline-none">
            <NumberMemory />
          </TabsContent>
          <TabsContent value="pattern" className="mt-4 outline-none">
            <PatternPick />
          </TabsContent>
          <TabsContent value="target" className="mt-4 outline-none">
            <Target10 />
          </TabsContent>
          <TabsContent value="daily" className="mt-4 outline-none">
            <DailyChallenge />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
