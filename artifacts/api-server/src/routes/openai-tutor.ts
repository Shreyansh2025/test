import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { CreateOpenaiConversationBody, SendOpenaiMessageBody, GetOpenaiConversationParams, DeleteOpenaiConversationParams, ListOpenaiMessagesParams } from "@workspace/api-zod";
import { extractToken, verifyToken } from "../lib/auth";

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

  const stream = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: chatMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullResponse += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
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

router.post("/ai/misconception", async (req, res): Promise<void> => {
  const { question, correctAnswer, userAnswer, explanation, language } = req.body;
  if (!question || !correctAnswer) {
    res.status(400).json({ error: "question and correctAnswer are required" });
    return;
  }
  const lang = language ?? "en";
  const langName = getLangName(lang);
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are MathMind, an AI math tutor. When a student gets a question wrong, identify the specific misconception or reasoning error in 2-4 clear sentences. Be educational, specific, and encouraging. ${lang !== "en" ? `Respond primarily in ${langName}, but keep technical terms in English.` : ""}`,
        },
        {
          role: "user",
          content: `Question: ${question}\nCorrect Answer: ${correctAnswer}\nStudent's Answer: ${userAnswer ?? "no answer (timeout)"}\nExplanation given: ${explanation ?? "none"}\n\nWhat is the likely misconception? Give a targeted, encouraging explanation.`,
        },
      ],
      max_tokens: 250,
    });
    const misconception = completion.choices[0]?.message?.content ?? "Could not determine the misconception. Please review the correct answer and explanation.";
    res.json({ misconception });
  } catch (err: any) {
    res.status(500).json({ message: "AI service unavailable", error: err?.message });
  }
});

export default router;
