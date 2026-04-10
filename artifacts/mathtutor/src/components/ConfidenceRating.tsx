import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const EMOJI_LABELS = [
  { value: 1, emoji: "😟", label: "Very Low" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🤩", label: "Excellent!" },
];

interface ConfidenceRatingProps {
  topicName: string;
  sessionCorrect: number;
  sessionTotal: number;
  topicId: number;
  token: string | null;
  onDone: () => void;
}

export function ConfidenceRating({ topicName, sessionCorrect, sessionTotal, topicId, token, onDone }: ConfidenceRatingProps) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (selected === null) return;
    setSaving(true);
    try {
      await fetch("/api/confidence", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topicId, score: selected, sessionCorrect, sessionTotal }),
      });
      setSaved(true);
      setTimeout(onDone, 800);
    } catch {
      onDone();
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-2">✅</div>
        <p className="text-sm font-semibold text-foreground">Progress saved!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="text-center">
        <div className="text-2xl mb-2">🧠</div>
        <h3 className="font-bold text-foreground text-base">{t("howConfident")}</h3>
        <p className="text-xs text-muted-foreground mt-1">Topic: <span className="font-semibold text-foreground">{topicName}</span></p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {EMOJI_LABELS.map(({ value, emoji, label }) => (
          <button
            key={value}
            onClick={() => setSelected(value)}
            className={cn(
              "flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all duration-200",
              selected === value
                ? "border-primary bg-primary/10 scale-110 shadow-md"
                : "border-border hover:border-primary/50 hover:bg-accent/50"
            )}
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-[9px] font-medium text-muted-foreground">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onDone}>
          Skip
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={selected === null || saving}
          onClick={handleSave}
        >
          {saving ? "Saving..." : t("saveProgress")}
        </Button>
      </div>
    </div>
  );
}
