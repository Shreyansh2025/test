import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Plus, Trash2, MessageSquare, BrainCircuit, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useListOpenaiConversations, useCreateOpenaiConversation, useDeleteOpenaiConversation } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGES } from "@/lib/i18n";

const QUICK_PROMPTS = [
  { en: "Explain quadratic equations step by step", hi: "द्विघात समीकरण step-by-step समझाएं" },
  { en: "Help me solve integration by parts", hi: "आंशिक समाकलन में मदद चाहिए" },
  { en: "What is Newton's second law?", hi: "न्यूटन का दूसरा नियम क्या है?" },
  { en: "Explain recursion with an example", hi: "उदाहरण सहित पुनरावृत्ति समझाएं" },
  { en: "What is photosynthesis?", hi: "प्रकाश संश्लेषण क्या है?" },
  { en: "Explain Python loops simply", hi: "Python loops सरल भाषा में" },
];

export default function TutorPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { lang } = useLanguage();
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const { data: conversations, isLoading, refetch } = useListOpenaiConversations();
  const createConv = useCreateOpenaiConversation();
  const deleteConv = useDeleteOpenaiConversation();

  const currentLang = LANGUAGES.find(l => l.code === lang);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const conv = await createConv.mutateAsync({ title: newTitle.trim() });
      setNewTitle("");
      navigate(`/tutor/${(conv as any).id}`);
    } catch {
      toast({ title: "Failed to create conversation", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function handleQuickStart(prompt?: string) {
    setCreating(true);
    try {
      const title = prompt ?? `Tutor Session — ${new Date().toLocaleDateString()}`;
      const conv = await createConv.mutateAsync({ title });
      const url = prompt ? `/tutor/${(conv as any).id}?q=${encodeURIComponent(prompt)}` : `/tutor/${(conv as any).id}`;
      navigate(url);
    } catch {
      toast({ title: "Failed to create conversation", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteConv.mutateAsync(id);
      refetch();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <img src="/assets/machine.webp" alt="AI" className="w-7 h-7 rounded-lg object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <BrainCircuit className="w-6 h-6 text-primary" />
            AI Tutor
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ask anything in <strong>{currentLang?.nativeName ?? "English"}</strong> — Math, Physics, Chemistry, Coding
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {LANGUAGES.slice(0, 5).map(l => (
              <span key={l.code} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                {l.flag} {l.nativeName}
              </span>
            ))}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">+3 more</span>
          </div>
        </div>
        <Button onClick={() => handleQuickStart()} disabled={creating} className="btn-glow flex-shrink-0">
          <Plus className="w-4 h-4 mr-2" />New Chat
        </Button>
      </div>

      {/* Language info card */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
        <Globe className="w-5 h-5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">Multilingual AI Tutor</p>
          <p className="text-xs text-muted-foreground">Switch language in the chat to learn in your preferred language. Technical terms will be bridged back to English.</p>
        </div>
        <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px]">8 Languages</Badge>
      </div>

      {/* Quick prompts */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Start</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {QUICK_PROMPTS.map(p => {
            const text = lang === "hi" ? p.hi : p.en;
            return (
              <button
                key={p.en}
                onClick={() => handleQuickStart(p.en)}
                className="text-left p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-sm text-muted-foreground"
              >
                💬 {text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Create named conversation */}
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          placeholder="Name your conversation... e.g., 'Calculus Homework'"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={!newTitle.trim() || creating} variant="outline">
          Create
        </Button>
      </form>

      {/* Conversation List */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Previous Conversations
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : conversations && (conversations as any[]).length > 0 ? (
          <div className="space-y-2">
            {(conversations as any[]).map((conv: any) => (
              <Link key={conv.id} href={`/tutor/${conv.id}`}>
                <div className="group flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                  <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground group-hover:text-primary text-sm truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(conv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start a new chat to get help from the AI tutor</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
