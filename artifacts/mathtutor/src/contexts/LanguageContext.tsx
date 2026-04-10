import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { type Language, type TranslationKey, getStoredLanguage, setStoredLanguage, t as translate } from "@/lib/i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getStoredLanguage);

  const setLang = useCallback((newLang: Language) => {
    setStoredLanguage(newLang);
    setLangState(newLang);
  }, []);

  const t = useCallback((key: TranslationKey) => translate(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
