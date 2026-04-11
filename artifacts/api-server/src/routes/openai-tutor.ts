import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import { CreateOpenaiConversationBody, SendOpenaiMessageBody, GetOpenaiConversationParams, DeleteOpenaiConversationParams, ListOpenaiMessagesParams } from "@workspace/api-zod";
import { extractToken, verifyToken } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getAuthUserId(req: any): number | null {
  const token = extractToken(req.headers.authorization);
  if (!token) return null;
  return verifyToken(token)?.userId ?? null;
}

function buildSystemPrompt(lang: string): string {
  const prompts: Record<string, string> = {
    en: `You are MathMind, an expert AI tutor. Help students learn Math, Physics, Chemistry, and Programming step-by-step.
Always show your reasoning clearly. Break down complex problems into simple steps.
When a student is wrong, gently identify the specific misconception and guide them to the correct understanding.
Include a "Why?" section for every solution to build conceptual mastery, not just rote answers.
Be encouraging, patient, and adaptive. Tailor explanation depth to the student's apparent level.`,

    hi: `Aap MathMind hain, ek expert AI tutor. Aap students ko Math, Physics, Chemistry aur Programming step-by-step sikhate hain.
Apna reasoning clearly dikhao. Complex problems ko simple steps mein todke samjhao.
Jab student galat ho, unki specific misconception identify karo aur correct samajh ki taraf guide karo.
Har solution mein "Kyun?" section zaroor include karo — sirf jawab nahi, samajh banao.
Hindi ya Hinglish mein samjhao. Technical terms English mein likhte hue unka Hindi arth bhi batao.
Encourage karo, patience rakho aur student ke level ke anusar samjhao.`,

    bn: `Aap MathMind, ekjon bishesgya AI shikhak. Chattader Math, Physics, Chemistry ebong Programming dhopon dhopon sikhte sahajya karo.
Protibar tomar reasoning sposto koro. Jotil somosyake sohoj dhopon-e bhango.
Jakhon chhatra vul kore, tar nirdishtho vul dharna chihno koro ebong shothik bujhte shohajyato koro.
Protiti somadhan-e "Keno?" obhidho section antorbhukkto koro.
Bangla-te explain koro; technical terms-er Bangla ortho dao.`,

    ta: `Neenga MathMind, oru expert AI aasiryar. Manavargalukku Kathanitham, Iyal Anaiyal, Rasayanam, Programming podriyall padikka udavungal.
Oluorum thetham thelivaga kadaikka vendiyathu. Kattinatham sitta steps-il piriungal.
Manithar thappaga irukum podhu, kurippita thappana theerpaiyai kandu, sari purinthukolla vali kidaikkavum.
Oluorum teerviluha "Yen?" pirivu serthukonga.
Tamil-il vilakka; technical terms-ikku Tamil artham koodavum sollunga.`,

    te: `Mee MathMind, oka expert AI dhyapakulu. Vidhyarthulaku Ganitham, Physics, Chemistry, Programming dab-by-step nerpinchandi.
Mee reasoning clearly chupandi. Kastamaina samsyalanu simple steps-lo vivarinchandi.
Vidhyarthi tappu chessinappudu, specific thappanu identfy chesi, correct understanding vaipu nirdesinchandi.
Prathi solution-lo "Enduku?" vibhagam cherchaandi.
Telugu-lo cheppandi; technical terms ki Telugu artha kuda ivvandi.`,

    mr: `Tumi MathMind, ek expert AI shikshak. Vidyartthyanna Ganit, Physics, Chemistry ani Programming step-by-step shikhavta.
Apla reasoning spashtapane dakha. Kat in samasyanna sopy steps madhe soda.
Vidhyarthi chukla asalyas, tyachi specific gairsamaj ola kha aani sahicha samajh dyava.
Pratyek uttarat "Kaan?" vibhag samavish kara.
Marathi madhe samjavun dyaa; technical terms che Marathi artha pan sanga.`,

    pa: `Tusi MathMind ho, ik expert AI teacher. Vidhyarthian nu Ganit, Physics, Chemistry te Programming kadam-by-kadam sikhao.
Apni reasoning clearly dikkhao. Mushkil samasyawan nu saral kadam'ch tado.
Jad vidhyarthi galat hove, unhi di khaas galatafahmi pahchanno te sahih samajh vali raah dikhao.
Har hal wich "Kyun?" bhag zaroor shamil karo.
Punjabi wich samjhao; technical terms de Punjabi arth vi dao.`,

    gu: `Tame MathMind, ek visheshagya AI shikshak. Vidhyarthio ne Ganit, Physics, Chemistry ane Programming pagiythiye shikhvo.
Tamari reasoning spashta dikhavo. Kathin samasyaone saral paglo ma vihecho.
Jyare vidhyarthi galat hoy, teno chokkas bhramniyakar shodhi, sahee samajh taraf darshan apo.
Daret ukelma "Kyun?" vibhag jaroor samavesh karo.
Gujarati ma samjhavo; technical terms na Gujarati artha pan aapo.`,
  };

  const base = prompts[lang] ?? prompts.en;

  const bridgeNote = lang !== "en"
    ? `\n\nIMPORTANT: When using technical terms (like "derivative", "integration", "Newton's law", "algorithm"), always write the English term first, then explain it in ${getLangName(lang)}. This helps students build both native-language understanding AND English terminology mastery.`
    : "";

  return base + bridgeNote;
}

function getLangName(code: string): string {
  const names: Record<string, string> = {
    hi: "Hindi", bn: "Bengali", ta: "Tamil", te: "Telugu",
    mr: "Marathi", pa: "Punjabi", gu: "Gujarati", en: "English",
  };
  return names[code] ?? "the student's language";
}

/** Ollama base URLs to try (env first, then common local defaults). Empty env is ignored. */
function ollamaBaseCandidates(): string[] {
  const fromEnv = process.env.OLLAMA_BASE_URL?.trim();
  const defaults = ["http://127.0.0.1:11434", "http://localhost:11434"];
  const raw = [fromEnv && fromEnv.length > 0 ? fromEnv : null, ...defaults].filter(Boolean) as string[];
  return [...new Set(raw.map((b) => b.replace(/\/+$/, "")))];
}

function ollamaMathModel(): string {
  const raw = process.env.OLLAMA_MATH_MODEL;
  return String((raw && raw.trim()) || "math-tutor:latest");
}

function ollamaTimeoutMs(): number {
  const n = Number(process.env.OLLAMA_TIMEOUT_MS);
  if (Number.isFinite(n) && n > 0) return Math.min(n, 600_000);
  return 180_000;
}

/** When false, do not prepend the app’s MathMind system prompt so your Ollama Modelfile SYSTEM/rules apply. */
function ollamaUseAppSystemPrompt(): boolean {
  const v = process.env.OLLAMA_MATH_USE_APP_SYSTEM_PROMPT?.trim();
  if (v === undefined || v === "") return true;
  return !/^(0|false|no|off)$/i.test(v);
}

function formatConvoForOllamaPrompt(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): string {
  return messages
    .map((m) => (m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`))
    .join("\n\n");
}

async function tryOllamaGenerate(
  base: string,
  model: string,
  prompt: string,
  signal: AbortSignal,
): Promise<string | null> {
  const response = await fetch(`${base}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.2 },
    }),
    signal,
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Ollama /api/generate ${response.status}: ${errText.slice(0, 200)}`);
  }
  const data = (await response.json()) as { response?: string };
  const text = data.response?.trim();
  return text && text.length > 0 ? text : null;
}

async function tryOllamaChat(
  base: string,
  model: string,
  prompt: string,
  signal: AbortSignal,
): Promise<string | null> {
  return tryOllamaChatMessages(base, model, [{ role: "user", content: prompt }], signal);
}

async function tryOllamaChatMessages(
  base: string,
  model: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  signal: AbortSignal,
): Promise<string | null> {
  const response = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: 0.2 },
    }),
    signal,
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Ollama /api/chat ${response.status}: ${errText.slice(0, 200)}`);
  }
  const data = (await response.json()) as { message?: { content?: string } };
  const text = data.message?.content?.trim();
  return text && text.length > 0 ? text : null;
}

async function runMathBot(prompt: string): Promise<string> {
  const model = ollamaMathModel();
  const bases = ollamaBaseCandidates();
  const timeoutMs = ollamaTimeoutMs();
  let lastErr: Error | null = null;

  for (const base of bases) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const signal = controller.signal;
    try {
      try {
        const fromGen = await tryOllamaGenerate(base, model, prompt, signal);
        if (fromGen) return fromGen;
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
      }
      try {
        const fromChat = await tryOllamaChat(base, model, prompt, signal);
        if (fromChat) return fromChat;
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
      }
    } finally {
      clearTimeout(t);
    }
  }

  throw lastErr ?? new Error("Ollama did not return any text for the math bot.");
}

/** Ollama with Modelfile only: real user/assistant turns (no app SYSTEM), so the model’s template + SYSTEM apply. */
async function runMathBotFromConversation(
  convo: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  const model = ollamaMathModel();
  const bases = ollamaBaseCandidates();
  const timeoutMs = ollamaTimeoutMs();
  const fallbackPrompt = formatConvoForOllamaPrompt(convo);
  let lastErr: Error | null = null;

  for (const base of bases) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const signal = controller.signal;
    try {
      try {
        const fromChat = await tryOllamaChatMessages(base, model, convo, signal);
        if (fromChat) return fromChat;
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
      }
      try {
        const fromGen = await tryOllamaGenerate(base, model, fallbackPrompt, signal);
        if (fromGen) return fromGen;
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
      }
      try {
        const fromChatSingle = await tryOllamaChat(base, model, fallbackPrompt, signal);
        if (fromChatSingle) return fromChatSingle;
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
      }
    } finally {
      clearTimeout(t);
    }
  }

  throw lastErr ?? new Error("Ollama did not return any text for the math bot.");
}

async function streamGroqChat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  onChunk: (content: string) => void,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("Missing GROQ_API_KEY"), { status: 500 });
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      messages,
      temperature: 0.3,
      max_tokens: 1200,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    throw Object.assign(new Error(`Groq error ${response.status}`), { status: response.status });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const piece = parsed.choices?.[0]?.delta?.content;
        if (!piece) continue;
        full += piece;
        onChunk(piece);
      } catch {
        // Ignore malformed SSE chunks
      }
    }
  }

  return full;
}

router.get("/openai/conversations", async (_req, res): Promise<void> => {
  const convs = await db.select().from(conversations).orderBy(conversations.createdAt);
  res.json(convs);
});

router.post("/openai/conversations", async (req, res): Promise<void> => {
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [conv] = await db.insert(conversations).values({ title: parsed.data.title }).returning();
  res.status(201).json(conv);
});

router.get("/openai/conversations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  const msgs = await db.select().from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  res.json({ ...conv, messages: msgs });
});

router.delete("/openai/conversations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
  res.sendStatus(204);
});

router.get("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const msgs = await db.select().from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));
  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = SendOpenaiMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const provider = req.body?.provider === "math-bot" ? "math-bot" : "ai-tutor";

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  const [userMsg] = await db.insert(messages).values({
    conversationId: id,
    role: "user",
    content: parsed.data.content,
  }).returning();

  const history = await db.select().from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt))
    .limit(20);

  const lang = parsed.data.language ?? "en";
  const systemPrompt = buildSystemPrompt(lang);

  const chatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...history.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";
  if (provider === "math-bot") {
    try {
      const useAppSystem = ollamaUseAppSystemPrompt();
      const convoOnly = chatMessages.filter(
        (m): m is { role: "user" | "assistant"; content: string } =>
          m.role === "user" || m.role === "assistant",
      );
      if (useAppSystem) {
        const latestUser =
          chatMessages.filter((m) => m.role === "user").at(-1)?.content ?? "";
        fullResponse = await runMathBot(
          `${systemPrompt}\n\nStudent question:\n${latestUser}`,
        );
      } else {
        fullResponse = await runMathBotFromConversation(convoOnly);
      }
      res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
    } catch (err) {
      logger.warn({ err }, "Math bot (Ollama) failed");
      fullResponse =
        "Math AI Bot is unavailable. Start Ollama, pull your model, then set OLLAMA_BASE_URL (e.g. http://127.0.0.1:11434) and OLLAMA_MATH_MODEL (default: math-tutor:latest) on the API server. If the API runs in Docker, use http://host.docker.internal:11434 instead of 127.0.0.1.";
      res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
    }
  } else {
    try {
      fullResponse = await streamGroqChat(chatMessages, (content) => {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      });
    } catch (err: any) {
      const status = Number(err?.status ?? err?.statusCode ?? 500);
      if (status === 429) {
        fullResponse =
          "I am getting rate-limited right now. Please wait a few seconds and send your message again.";
      } else {
        fullResponse =
          "AI tutor is temporarily unavailable. Please try again shortly.";
      }
      res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
    }
  }

  await db.insert(messages).values({
    conversationId: id,
    role: "assistant",
    content: fullResponse,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
