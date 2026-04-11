import { Router, type IRouter } from "express";

const router: IRouter = Router();

type TranslateBody = {
  targetLang?: string;
  sourceLang?: string;
  texts?: unknown;
};

function normalizeLang(input: string | undefined): string {
  const v = (input ?? "en").trim().toLowerCase();
  return v || "en";
}

async function translateWithOpenAI(
  sourceLang: string,
  targetLang: string,
  texts: string[],
): Promise<string[] | null> {
  try {
    const { openai } = await import("@workspace/integrations-openai-ai-server");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a translation engine. Return ONLY valid JSON in this exact shape: {\"translations\":[...]} with the same array length and order as input. Do not add commentary.",
        },
        {
          role: "user",
          content: JSON.stringify({
            sourceLang,
            targetLang,
            texts,
            rules: [
              "Keep meaning accurate and natural.",
              "Preserve punctuation, numbers, emojis, and URLs.",
              "Do not translate code snippets or brand names like 'AI Tutor'.",
            ],
          }),
        },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
      max_tokens: 2200,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { translations?: unknown };
    if (!Array.isArray(parsed.translations)) return null;
    const out = parsed.translations.map((v) =>
      typeof v === "string" ? v : String(v ?? ""),
    );
    if (out.length !== texts.length) return null;
    return out;
  } catch {
    return null;
  }
}

router.post("/i18n/translate", async (req, res): Promise<void> => {
  const body = (req.body ?? {}) as TranslateBody;
  const targetLang = normalizeLang(body.targetLang);
  const sourceLang = normalizeLang(body.sourceLang);
  const textsRaw = Array.isArray(body.texts) ? body.texts : [];
  const texts = textsRaw
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .slice(0, 200);

  if (!texts.length) {
    res.status(400).json({ error: "texts must be a non-empty string array" });
    return;
  }

  if (targetLang === sourceLang) {
    res.json({ translations: texts });
    return;
  }

  const translated = await translateWithOpenAI(sourceLang, targetLang, texts);
  if (translated) {
    res.json({ translations: translated });
    return;
  }

  // Safe fallback if translation provider is unavailable.
  res.json({ translations: texts });
});

export default router;
