import { useState } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGES, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === lang)!;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size={compact ? "sm" : "default"}
        onClick={() => setOpen(o => !o)}
        className={cn("flex items-center gap-1.5 px-2 text-xs font-medium", compact && "h-7")}
      >
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-foreground">{current.nativeName}</span>
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-full mb-1 z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden min-w-[160px]">
            <div className="p-1.5 max-h-64 overflow-y-auto">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code as Language); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all",
                    lang === l.code
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-foreground"
                  )}
                >
                  <span className="text-base">{l.flag}</span>
                  <span className="font-medium">{l.nativeName}</span>
                  {lang !== l.code && <span className="text-xs text-muted-foreground ml-auto">{l.name}</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
