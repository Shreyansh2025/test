import type { Language } from "@/lib/i18n";

const translationCache = new Map<string, string>();

function cacheKey(lang: Language, text: string): string {
  return `${lang}::${text}`;
}

function chunkArray<T>(items: T[], size: number): T[][]
{
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function translateBatch(
  texts: string[],
  targetLang: Language,
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!texts.length || targetLang === "en") {
    for (const text of texts) result[text] = text;
    return result;
  }

  const missing = texts.filter((text) => !translationCache.has(cacheKey(targetLang, text)));
  const batches = chunkArray(missing, 40);

  for (const batch of batches) {
    try {
      const res = await fetch("/api/i18n/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLang: "en",
          targetLang,
          texts: batch,
        }),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { translations?: string[] };
      const translated = Array.isArray(data.translations) ? data.translations : [];
      for (let i = 0; i < batch.length; i += 1) {
        const src = batch[i];
        if (!src) continue;
        const dst = translated[i] ?? src;
        translationCache.set(cacheKey(targetLang, src), dst);
      }
    } catch {
      // Keep source text if API is temporarily unavailable.
      for (const src of batch) {
        translationCache.set(cacheKey(targetLang, src), src);
      }
    }
  }

  for (const text of texts) {
    result[text] = translationCache.get(cacheKey(targetLang, text)) ?? text;
  }
  return result;
}
