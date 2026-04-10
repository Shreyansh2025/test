import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Send, BrainCircuit, User, Loader2, Globe, Copy, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGetOpenaiConversation } from "@workspace/api-client-react";
import { useAuthContext } from "@/components/AuthProvider";
import { LANGUAGES, type Language, getStoredLanguage, setStoredLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

const LANG_PLACEHOLDERS: Record<Language, string> = {
  en: "Ask a question about math, physics, chemistry or coding...",
  hi: "गणित, भौतिकी, रसायन विज्ञान के बारे में प्रश्न पूछें...",
  bn: "গণিত, পদার্থ, রসায়ন বিষয়ে প্রশ্ন করুন...",
  ta: "கணிதம், இயற்பியல் பற்றி கேளுங்கள்...",
  te: "గణితం, భౌతికశాస్త్రం గురించి అడగండి...",
  mr: "गणित, भौतिकशास्त्र बद्दल प्रश्न विचारा...",
  pa: "ਗਣਿਤ, ਭੌਤਿਕ ਵਿਗਿਆਨ ਬਾਰੇ ਪੁੱਛੋ...",
  gu: "ગણિત, ભૌતિકશાસ્ત્ર વિશે પ્રશ્ન પૂછો...",
};

const EXAMPLE_QUESTIONS: Record<Language, string[]> = {
  en: ["Solve x² + 5x + 6 = 0", "Explain derivatives intuitively", "What is Newton's second law?", "Help me with integration by parts"],
  hi: ["x² + 5x + 6 = 0 हल करें", "अवकलन सरल भाषा में समझाएं", "न्यूटन का दूसरा नियम क्या है?", "समाकलन में मदद करें"],
  bn: ["x² + 5x + 6 = 0 সমাধান করুন", "ডেরিভেটিভ সহজে বোঝান", "নিউটনের দ্বিতীয় সূত্র কী?", "ইন্টিগ্রেশন সাহায্য করুন"],
  ta: ["x² + 5x + 6 = 0 தீர்க்க", "வகையீடு விளக்குங்கள்", "நியூட்டனின் இரண்டாம் விதி என்ன?", "ஒருங்கிணைப்பு உதவுங்கள்"],
  te: ["x² + 5x + 6 = 0 పరిష్కరించండి", "డెరివేటివ్‌లు వివరించండి", "న్యూటన్ రెండవ నియమం ఏమిటి?", "ఇంటిగ్రేషన్ సహాయం"],
  mr: ["x² + 5x + 6 = 0 सोडवा", "अवकल सरल भाषेत समजवा", "न्यूटनचा दुसरा नियम काय?", "समाकलनात मदत करा"],
  pa: ["x² + 5x + 6 = 0 ਹੱਲ ਕਰੋ", "ਡੈਰੀਵੇਟਿਵ ਸਮਝਾਓ", "ਨਿਊਟਨ ਦਾ ਦੂਜਾ ਨਿਯਮ ਕੀ ਹੈ?", "ਇੰਟੀਗ੍ਰੇਸ਼ਨ ਵਿੱਚ ਮਦਦ"],
  gu: ["x² + 5x + 6 = 0 ઉકેલો", "ડેરિવેટિવ સમજાવો", "ન્યૂટનનો બીજો નિયમ શું છે?", "ઇન્ટિગ્રેશન મદદ"],
};

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";

  async function handleCopy() {
    await navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("flex gap-3 group", isUser && "flex-row-reverse")}>
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        isUser ? "bg-primary text-primary-foreground" : "bg-card border border-border")}>
        {isUser ? <User className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4 text-primary" />}
      </div>
      <div className={cn("max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed relative",
        isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border text-foreground rounded-tl-sm")}>
        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
        {!isUser && (
          <button onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-muted transition-all">
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
          </button>
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-card border border-border">
        <BrainCircuit className="w-4 h-4 text-primary animate-pulse" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center">
          {[0, 0.2, 0.4].map(d => (
            <div key={d} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LanguageDropdown({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === lang)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-accent/10 text-sm font-medium text-foreground transition-colors"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{current.flag} {current.nativeName}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden min-w-180px">
            <div className="p-1.5 max-h-72 overflow-y-auto">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setLang(l.code); setStoredLanguage(l.code); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left",
                    lang === l.code ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
                  )}
                >
                  <span className="text-base">{l.flag}</span>
                  <div>
                    <div className="font-medium leading-tight">{l.nativeName}</div>
                    {l.code !== "en" && <div className="text-[10px] opacity-70">{l.name}</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function TutorChatPage() {
  const [, params] = useRoute("/tutor/:conversationId");
  const convId = params?.conversationId ? parseInt(params.conversationId, 10) : 0;
  const { token } = useAuthContext();
  const { toast } = useToast();
  const [lang, setLang] = useState<Language>(getStoredLanguage);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: conv, isLoading } = useGetOpenaiConversation(convId, {
    enabled: !!convId,
    onSuccess: (data: any) => {
      if (data?.messages) setMessages(data.messages);
    },
  } as any);

  useEffect(() => {
    if ((conv as any)?.messages) setMessages((conv as any).messages);
  }, [(conv as any)?.messages?.length]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q && messages.length === 0 && !streaming) {
      sendMessage(q); 
    }
  }, [convId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  function handleLangChange(newLang: Language) {
    setLang(newLang);
    setStoredLanguage(newLang);
  }

  async function sendMessage(overrideText?: string) {
    const textToSend = overrideText || input.trim();
    if (!textToSend || streaming) return;
    
    const userMsg: Message = { role: "user", content: textToSend };
    setMessages(m => [...m, userMsg]);
    setInput(""); // Clear input
    setStreaming(true);
    if (!input.trim() || streaming) return;
    const q = input.trim();
    setStreamingContent("");

    try {
      const res = await fetch(`/api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ content: q, language: lang }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.done) {
                setMessages(m => [...m, { role: "assistant", content: full }]);
                setStreamingContent("");
              } else if (d.content) {
                full += d.content;
                setStreamingContent(full);
              }
            } catch {}
          }
        }
      }
    } catch {
      toast({ title: "Failed to get AI response", variant: "destructive" });
      setStreamingContent("");
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const convTitle = (conv as any)?.title ?? "AI Tutor";
  const examples = EXAMPLE_QUESTIONS[lang] ?? EXAMPLE_QUESTIONS.en;
  const placeholder = LANG_PLACEHOLDERS[lang] ?? LANG_PLACEHOLDERS.en;
  const currentLang = LANGUAGES.find(l => l.code === lang)!;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <Link href="/tutor"><Button variant="ghost" size="sm" className="gap-1.5 -ml-2"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <img src="/assets/logo.png" alt="MathMind" className="w-6 h-6 rounded object-cover hidden sm:block" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <BrainCircuit className="w-5 h-5 text-primary" />
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground text-sm truncate">{convTitle}</h1>
          <p className="text-xs text-muted-foreground">AI Tutor • {currentLang.flag} {currentLang.nativeName}</p>
        </div>
        <LanguageDropdown lang={lang} setLang={handleLangChange} />
      </div>

      {/* Language tip banner */}
      {lang !== "en" && (
        <div className="px-4 py-2 bg-primary/5 border-b border-primary/10 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-xs text-primary">
            Responding in <strong>{currentLang.nativeName} ({currentLang.name})</strong> — English technical terms will be bridged for clarity.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 && !streaming ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto mb-4">
              <img src="/assets/machine.webp" alt="AI Tutor" className="w-full h-full object-contain rounded-xl" onError={e => {
                (e.target as HTMLImageElement).style.display = 'none';
              }} />
            </div>
            <BrainCircuit className="w-10 h-10 mx-auto text-primary/30 mb-3" />
            <h3 className="font-semibold text-foreground mb-1">How can I help you today?</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Ask me anything in <strong>{currentLang.nativeName}</strong>!
            </p>
            <p className="text-xs text-muted-foreground mb-5">Math, Physics, Chemistry, Programming — step-by-step explanations</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
              {examples.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 text-sm text-muted-foreground transition-all">
                  💬 {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {streaming && streamingContent && (
              <MessageBubble msg={{ role: "assistant", content: streamingContent }} />
            )}
            {streaming && !streamingContent && <ThinkingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card shrink-0">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 resize-none min-h-44px max-h-32"
            style={{ height: "auto" }}
          />
          <Button onClick={sendMessage} disabled={!input.trim() || streaming} size="icon" className="shrink-0 h-11 w-11">
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          Enter to send · Shift+Enter for new line · {currentLang.flag} {currentLang.nativeName}
        </p>
      </div>
    </div>
  );
}
