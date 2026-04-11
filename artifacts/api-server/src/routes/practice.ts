import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, questionsTable, usersTable, userAnswersTable, userTopicStatsTable, activityLogTable, topicsTable, subjectsTable } from "@workspace/db";
import { SubmitAnswerBody, SubmitAnswerParams, GenerateQuestionBody, ListQuestionsQueryParams } from "@workspace/api-zod";
import { extractToken, verifyToken } from "../lib/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { checkAndAwardBadges, checkSpeedBadge } from "../lib/badges";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/** Override with `AI_PRACTICE_MODEL` if your host does not serve `gpt-4o-mini`. */
function practiceOpenAiModel(): string {
  return (
    process.env.AI_PRACTICE_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini"
  );
}

function parseJsonObjectFromModelContent(raw: string): unknown {
  const t = raw.trim();
  if (!t) return null;
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonStr = (fence?.[1] ?? t).trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  }
}

type AiSessionQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  steps: string[];
  difficulty: "easy" | "medium" | "hard";
  points: number;
  timeLimit: number;
};

function normalizeRawSessionItem(q: unknown, i: number): AiSessionQuestion | null {
  if (!q || typeof q !== "object") return null;
  const o = q as Record<string, unknown>;
  const opts = Array.isArray(o.options)
    ? o.options.filter((x): x is string => typeof x === "string").slice(0, 4)
    : [];
  const safeOptions = opts.length === 4 ? opts : null;
  if (!safeOptions) return null;
  const correct =
    typeof o.correctAnswer === "string" && safeOptions.includes(o.correctAnswer)
      ? o.correctAnswer
      : safeOptions[0];
  const d = String(o.difficulty ?? "");
  const difficulty: "easy" | "medium" | "hard" =
    d === "hard" || d === "medium" || d === "easy" ? d : i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard";
  const points = difficulty === "easy" ? 10 : difficulty === "hard" ? 25 : 15;
  const timeLimit = difficulty === "easy" ? 30 : difficulty === "hard" ? 60 : 45;
  const question = typeof o.question === "string" ? o.question.trim() : "";
  if (!question) return null;
  return {
    question,
    options: safeOptions,
    correctAnswer: correct,
    explanation: typeof o.explanation === "string" ? o.explanation : "Review the concept and try again.",
    steps: Array.isArray(o.steps) ? o.steps.filter((s): s is string => typeof s === "string").slice(0, 5) : [],
    difficulty,
    points,
    timeLimit,
  };
}

function sessionRowFromFallback(
  subjectName: string | undefined,
  topicName: string,
  index: number,
): AiSessionQuestion {
  const fb = fallbackQuestionForSubject(subjectName, topicName, index);
  const difficulty: "easy" | "medium" | "hard" =
    index % 3 === 0 ? "easy" : index % 3 === 1 ? "medium" : "hard";
  const points = difficulty === "easy" ? 10 : difficulty === "hard" ? 25 : 15;
  const timeLimit = difficulty === "easy" ? 30 : difficulty === "hard" ? 60 : 45;
  return {
    question: fb.q,
    options: fb.options,
    correctAnswer: fb.answer,
    explanation: fb.explanation,
    steps: fb.steps,
    difficulty,
    points,
    timeLimit,
  };
}

/** Shared fallbacks — rotate by index so parallel /generate failures are not all identical. */
function fallbackQuestionForSubject(
  subjectName: string | undefined,
  topicName: string,
  variantIndex: number,
): { q: string; options: string[]; answer: string; explanation: string; steps: string[] } {
  const v = variantIndex % 4;
  const baseBySubject: Record<string, Array<{ q: string; options: string[]; answer: string; explanation: string; steps: string[] }>> = {
    Mathematics: [
      {
        q: "If 3x + 5 = 20, what is x?",
        options: ["A) 3", "B) 5", "C) 7", "D) 10"],
        answer: "B) 5",
        explanation: "3x = 15 so x = 5.",
        steps: ["Subtract 5 from both sides.", "You get 3x = 15.", "Divide both sides by 3."],
      },
      {
        q: "What is 12% of 250?",
        options: ["A) 25", "B) 30", "C) 35", "D) 40"],
        answer: "B) 30",
        explanation: "12% of 250 = 0.12 × 250 = 30.",
        steps: ["Convert percent to decimal.", "Multiply."],
      },
      {
        q: "Simplify: 2³ × 2²",
        options: ["A) 2⁵", "B) 2⁶", "C) 4⁵", "D) 2"],
        answer: "A) 2⁵",
        explanation: "Same base: add exponents → 2⁵.",
        steps: ["Use aᵐ × aⁿ = aᵐ⁺ⁿ.", "3 + 2 = 5."],
      },
      {
        q: "What is the slope of y = 4x − 1?",
        options: ["A) −1", "B) 1", "C) 4", "D) 4x"],
        answer: "C) 4",
        explanation: "In y = mx + b, m is the slope.",
        steps: ["Identify m in y = mx + b.", "Here m = 4."],
      },
    ],
    Physics: [
      {
        q: "What is the SI unit of force?",
        options: ["A) Joule", "B) Watt", "C) Newton", "D) Pascal"],
        answer: "C) Newton",
        explanation: "Force is measured in newtons (N).",
        steps: ["Recall SI mechanics units.", "Force → N."],
      },
      {
        q: "What is the SI unit of energy?",
        options: ["A) Newton", "B) Joule", "C) Watt", "D) Pascal"],
        answer: "B) Joule",
        explanation: "Energy is measured in joules (J).",
        steps: ["Work/energy → J."],
      },
      {
        q: "Speed is defined as:",
        options: ["A) mass × distance", "B) distance ÷ time", "C) force × time", "D) velocity²"],
        answer: "B) distance ÷ time",
        explanation: "Speed = distance / time.",
        steps: ["Define rate of motion.", "Use distance over time."],
      },
      {
        q: "Which quantity is a vector?",
        options: ["A) Speed", "B) Distance", "C) Velocity", "D) Mass"],
        answer: "C) Velocity",
        explanation: "Velocity has magnitude and direction.",
        steps: ["Vectors have direction.", "Velocity is vector; speed is scalar."],
      },
    ],
    Chemistry: [
      {
        q: "What is the chemical formula of water?",
        options: ["A) CO2", "B) H2O", "C) O2", "D) NaCl"],
        answer: "B) H2O",
        explanation: "Two H atoms and one O atom.",
        steps: ["Known formula for water.", "H2O."],
      },
      {
        q: "What is the atomic number of carbon?",
        options: ["A) 4", "B) 6", "C) 8", "D) 12"],
        answer: "B) 6",
        explanation: "Carbon has 6 protons.",
        steps: ["Periodic table → C.", "Atomic number = 6."],
      },
      {
        q: "Which gas is most abundant in Earth’s atmosphere?",
        options: ["A) O2", "B) CO2", "C) N2", "D) Ar"],
        answer: "C) N2",
        explanation: "Roughly 78% nitrogen.",
        steps: ["Recall air composition.", "Nitrogen dominates."],
      },
      {
        q: "A pH of 7 is considered:",
        options: ["A) acidic", "B) basic", "C) neutral", "D) undefined"],
        answer: "C) neutral",
        explanation: "pH 7 is neutral at 25°C.",
        steps: ["pH scale midpoint.", "7 = neutral."],
      },
    ],
    Programming: [
      {
        q: "Which keyword declares a constant in JavaScript?",
        options: ["A) let", "B) var", "C) const", "D) static"],
        answer: "C) const",
        explanation: "`const` blocks reassignment.",
        steps: ["const vs let.", "Immutable binding."],
      },
      {
        q: "What does `===` compare in JavaScript?",
        options: ["A) value only", "B) type only", "C) value and type", "D) memory address"],
        answer: "C) value and type",
        explanation: "Strict equality checks both.",
        steps: ["=== is strict.", "No coercion."],
      },
      {
        q: "Which structure repeats while a condition is true?",
        options: ["A) if", "B) while", "C) switch", "D) break"],
        answer: "B) while",
        explanation: "`while` loops on condition.",
        steps: ["Loop forms.", "while checks each iteration."],
      },
      {
        q: "What is an array index in most languages?",
        options: ["A) 1-based", "B) 0-based", "C) random", "D) floating"],
        answer: "B) 0-based",
        explanation: "First element is index 0 in JS, etc.",
        steps: ["Count from zero.", "First item at index 0."],
      },
    ],
  };
  const list = baseBySubject[subjectName ?? ""] ?? [];
  if (list.length > 0) return list[v]!;
  return {
    q: `(${v + 1}) Which statement best fits the topic "${topicName}"?`,
    options: [
      `A) Concept ${v + 1} is irrelevant`,
      `B) Topic "${topicName}" is not studied`,
      `C) "${topicName}" is an important idea in ${subjectName ?? "this subject"}`,
      "D) None of the above",
    ],
    answer: `C) "${topicName}" is an important idea in ${subjectName ?? "this subject"}`,
    explanation: `Focus on the core ideas of ${topicName} within your course.`,
    steps: ["Recall the definition.", "Eliminate clearly wrong options."],
  };
}

router.get("/practice/questions", async (req, res): Promise<void> => {
  const parsed = ListQuestionsQueryParams.safeParse(req.query);
  const topicId = parsed.success ? parsed.data.topicId : undefined;
  const difficulty = parsed.success ? parsed.data.difficulty : undefined;
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 10;

  let query = db.select().from(questionsTable);
  const conditions = [];
  if (topicId) conditions.push(eq(questionsTable.topicId, topicId));
  if (difficulty) conditions.push(eq(questionsTable.difficulty, difficulty));

  const questions = conditions.length > 0
    ? await db.select().from(questionsTable).where(and(...conditions)).limit(limit)
    : await db.select().from(questionsTable).limit(limit);

  res.json(questions.map(q => ({
    id: q.id,
    topicId: q.topicId,
    text: q.text,
    textHi: q.textHi,
    options: q.options,
    difficulty: q.difficulty,
    points: q.points,
    timeLimit: q.timeLimit,
  })));
});

router.post("/practice/questions/:id/submit", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = SubmitAnswerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, id)).limit(1);
  if (!question) { res.status(404).json({ error: "Question not found" }); return; }

  const isCorrect = parsed.data.answer === question.correctAnswer;
  const xpEarned = isCorrect ? question.points : Math.floor(question.points * 0.1);

  const token = extractToken(req.headers.authorization);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      await db.insert(userAnswersTable).values({
        userId: payload.userId,
        questionId: question.id,
        topicId: question.topicId,
        answer: parsed.data.answer,
        isCorrect: isCorrect ? 1 : 0,
        timeTaken: parsed.data.timeTaken,
        xpEarned,
      });

      const [existing] = await db.select().from(userTopicStatsTable)
        .where(and(eq(userTopicStatsTable.userId, payload.userId), eq(userTopicStatsTable.topicId, question.topicId)))
        .limit(1);

      if (existing) {
        const newAnswered = existing.answered + 1;
        const newCorrect = existing.correct + (isCorrect ? 1 : 0);
        await db.update(userTopicStatsTable)
          .set({ answered: newAnswered, correct: newCorrect, accuracy: newCorrect / newAnswered })
          .where(eq(userTopicStatsTable.id, existing.id));
      } else {
        await db.insert(userTopicStatsTable).values({
          userId: payload.userId,
          topicId: question.topicId,
          answered: 1,
          correct: isCorrect ? 1 : 0,
          accuracy: isCorrect ? 1 : 0,
        });
      }

      await db.update(usersTable).set({
        xp: sql`${usersTable.xp} + ${xpEarned}`,
        totalQuestionsAnswered: sql`${usersTable.totalQuestionsAnswered} + 1`,
        totalCorrect: isCorrect ? sql`${usersTable.totalCorrect} + 1` : usersTable.totalCorrect,
      }).where(eq(usersTable.id, payload.userId));

      if (isCorrect) {
        await db.insert(activityLogTable).values({
          userId: payload.userId,
          type: "question_answered",
          description: `Answered a question correctly and earned ${xpEarned} XP`,
          xpEarned,
        });
      }

      const timeTaken = parsed.data.timeTaken ?? 999;
      if (isCorrect && timeTaken <= 5) {
        await checkSpeedBadge(payload.userId, timeTaken);
      }
      await checkAndAwardBadges(payload.userId);
    }
  }

  res.json({
    correct: isCorrect,
    correctAnswer: question.correctAnswer,
    xpEarned,
    explanation: question.explanation,
    explanationHi: question.explanationHi,
    steps: question.steps,
  });
});

router.post("/practice/generate", async (req, res): Promise<void> => {
  const parsed = GenerateQuestionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const rawExtra = req.body as { questionIndex?: unknown; sessionId?: unknown };
  const qIndex =
    typeof rawExtra.questionIndex === "number" &&
    rawExtra.questionIndex >= 1 &&
    rawExtra.questionIndex <= 20
      ? Math.floor(rawExtra.questionIndex)
      : 1;
  const sessionId =
    typeof rawExtra.sessionId === "string" && rawExtra.sessionId.length <= 128
      ? rawExtra.sessionId
      : undefined;

  const [topic] = await db.select({
    topic: topicsTable,
    subject: subjectsTable,
  }).from(topicsTable)
    .leftJoin(subjectsTable, eq(topicsTable.subjectId, subjectsTable.id))
    .where(eq(topicsTable.id, parsed.data.topicId))
    .limit(1);

  if (!topic) { res.status(404).json({ error: "Topic not found" }); return; }

  const lang = parsed.data.language ?? "en";
  const sessionHint = sessionId ? `Session: ${sessionId}. ` : "";
  const langInstruction = lang === "hi"
    ? "Respond in Hindi (Hinglish acceptable). Keep explanations simple."
    : "Respond in English. Keep explanations clear and simple.";

  const prompt = `You are a math/science tutor. Generate ONE ${parsed.data.difficulty} difficulty multiple choice question for the topic "${topic.topic.name}" (subject: ${topic.subject?.name ?? "Math"}).

${sessionHint}This is question #${qIndex} in a practice set (10 questions total). It MUST be unique: different numbers, scenario, and sub-skill than a generic drill — do NOT repeat a common textbook template.

${langInstruction}

Return ONLY valid JSON in this exact format:
{
  "question": "The question text",
  "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
  "correctAnswer": "A) option1",
  "explanation": "Clear explanation of why this is correct",
  "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
}`;

  const fallback = fallbackQuestionForSubject(
    topic.subject?.name ?? undefined,
    topic.topic.name,
    qIndex - 1,
  );

  try {
    const completion = await openai.chat.completions.create({
      model: practiceOpenAiModel(),
      max_completion_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    let generated: any = {};
    try {
      generated = JSON.parse(content);
    } catch {
      generated = {};
    }

    const options = Array.isArray(generated.options)
      ? generated.options.filter((o: unknown) => typeof o === "string").slice(0, 4)
      : [];
    const safeOptions = options.length === 4 ? options : fallback.options;
    const safeCorrectAnswer =
      typeof generated.correctAnswer === "string" && safeOptions.includes(generated.correctAnswer)
        ? generated.correctAnswer
        : safeOptions[0];

    res.json({
      question: typeof generated.question === "string" ? generated.question : fallback.q,
      options: safeOptions,
      correctAnswer: safeCorrectAnswer,
      explanation: typeof generated.explanation === "string" ? generated.explanation : fallback.explanation,
      steps: Array.isArray(generated.steps)
        ? generated.steps.filter((s: unknown) => typeof s === "string").slice(0, 5)
        : fallback.steps,
    });
  } catch {
    res.json({
      question: fallback.q,
      options: fallback.options,
      correctAnswer: fallback.answer,
      explanation: fallback.explanation,
      steps: fallback.steps,
    });
  }
});

/** One model call → 10 distinct MCQs for AI practice (no DB insert). Avoids duplicate fallback when 10 parallel /generate calls fail. */
router.post("/practice/generate-ai-session", async (req, res): Promise<void> => {
  const body = req.body as { topicId?: unknown; language?: unknown };
  const topicId = Number(body.topicId);
  const langRaw = body.language;
  const language = langRaw === "hi" ? "hi" : langRaw === "en" ? "en" : "en";
  if (!Number.isFinite(topicId)) {
    res.status(400).json({ error: "topicId is required" });
    return;
  }

  const [topic] = await db.select({
    topic: topicsTable,
    subject: subjectsTable,
  }).from(topicsTable)
    .leftJoin(subjectsTable, eq(topicsTable.subjectId, subjectsTable.id))
    .where(eq(topicsTable.id, topicId))
    .limit(1);

  if (!topic) { res.status(404).json({ error: "Topic not found" }); return; }
  const languageInstruction = language === "hi"
    ? "Write the full quiz in Hindi (Hinglish acceptable) with simple, student-friendly explanations."
    : "Write the full quiz in English with clear, student-friendly explanations.";

  const prompt = `You are an expert tutor. Generate exactly 10 DISTINCT multiple-choice questions for topic "${topic.topic.name}" (subject: ${topic.subject?.name ?? "General"}).

${languageInstruction}

Requirements:
- Each of the 10 questions must be different from the others (different concept, numbers, wording, and skill).
- Include a balanced mix of easy, medium, and hard questions across the set.
- Exactly 4 options per question, each starting with "A) ", "B) ", "C) ", "D) ".
- correctAnswer must exactly match one option string.

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A) ...",
      "explanation": "Why this answer is correct",
      "steps": ["Step 1...", "Step 2..."],
      "difficulty": "easy"
    }
  ]
}

Use difficulty values "easy", "medium", or "hard" for each question. The questions array MUST have length 10.`;

  const subjectName = topic.subject?.name ?? undefined;
  const topicName = topic.topic.name;
  let fromModel: AiSessionQuestion[] = [];

  try {
    const completion = await openai.chat.completions.create({
      model: practiceOpenAiModel(),
      max_completion_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "";
    const parsedRoot = parseJsonObjectFromModelContent(content) as { questions?: unknown } | null;
    const rawList = parsedRoot && Array.isArray(parsedRoot.questions) ? parsedRoot.questions : [];

    fromModel = rawList
      .map((q, i) => normalizeRawSessionItem(q, i))
      .filter((x): x is AiSessionQuestion => x != null)
      .slice(0, 10);
  } catch (err) {
    logger.warn({ err }, "generate-ai-session: model call or parse failed; padding with fallbacks");
  }

  const out: AiSessionQuestion[] = [...fromModel];
  for (let i = out.length; i < 10; i++) {
    out.push(sessionRowFromFallback(subjectName, topicName, i));
  }

  res.json({
    questions: out.slice(0, 10),
    ...(fromModel.length === 0 ? { fallback: true as const } : {}),
  });
});

router.post("/practice/generate-quiz", async (req, res): Promise<void> => {
  const topicId = Number(req.body?.topicId);
  const countRaw = Number(req.body?.count ?? 10);
  const language = req.body?.language === "hi" ? "hi" : "en";
  const difficulty = ["easy", "medium", "hard"].includes(String(req.body?.difficulty))
    ? String(req.body?.difficulty)
    : "mixed";

  if (!Number.isFinite(topicId)) {
    res.status(400).json({ error: "topicId is required" });
    return;
  }
  const count = Math.min(15, Math.max(5, Number.isFinite(countRaw) ? countRaw : 10));

  const [topic] = await db.select({
    topic: topicsTable,
    subject: subjectsTable,
  }).from(topicsTable)
    .leftJoin(subjectsTable, eq(topicsTable.subjectId, subjectsTable.id))
    .where(eq(topicsTable.id, topicId))
    .limit(1);

  if (!topic) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }

  const languageInstruction = language === "hi"
    ? "Write the full quiz in Hindi (Hinglish acceptable) with simple, student-friendly explanations."
    : "Write the full quiz in English with clear, student-friendly explanations.";
  const difficultyInstruction = difficulty === "mixed"
    ? "Use a balanced mix of easy, medium, and hard questions."
    : `Use only ${difficulty} difficulty questions.`;

  const prompt = `You are an expert tutor. Generate ${count} multiple-choice quiz questions for topic "${topic.topic.name}" (subject: ${topic.subject?.name ?? "General"}).
${languageInstruction}
${difficultyInstruction}

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A) ...",
      "explanation": "Why this answer is correct",
      "steps": ["Step 1...", "Step 2..."],
      "difficulty": "easy|medium|hard"
    }
  ]
}

Rules:
- Exactly 4 options per question.
- correctAnswer must exactly match one option string.
- Keep each question unique and not repetitive.
- Keep explanations concise.`;

  try {
    const completion = await openai.chat.completions.create({
      model: practiceOpenAiModel(),
      max_completion_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsedRoot = parseJsonObjectFromModelContent(content);
    const parsed = (parsedRoot && typeof parsedRoot === "object"
      ? parsedRoot
      : {}) as { questions?: any[] };
    const generated = Array.isArray(parsed.questions) ? parsed.questions : [];

    if (generated.length === 0) {
      res.status(502).json({ error: "Could not generate quiz questions." });
      return;
    }

    const rowsToInsert = generated.slice(0, count).map((q, i) => {
      const qDifficulty = ["easy", "medium", "hard"].includes(String(q?.difficulty))
        ? String(q.difficulty)
        : (difficulty === "mixed" ? (i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard") : difficulty);
      const points = qDifficulty === "easy" ? 10 : qDifficulty === "hard" ? 25 : 15;
      const timeLimit = qDifficulty === "easy" ? 30 : qDifficulty === "hard" ? 60 : 45;
      const options = Array.isArray(q?.options) ? q.options.filter((x: unknown) => typeof x === "string").slice(0, 4) : [];
      const safeOptions = options.length === 4 ? options : ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"];
      const correct = typeof q?.correctAnswer === "string" && safeOptions.includes(q.correctAnswer) ? q.correctAnswer : safeOptions[0];

      return {
        topicId,
        text: String(q?.question ?? "Generated question"),
        textHi: language === "hi" ? String(q?.question ?? "Generated question") : null,
        options: safeOptions,
        correctAnswer: correct,
        explanation: String(q?.explanation ?? "Review the concept and try once more."),
        explanationHi: language === "hi" ? String(q?.explanation ?? "Concept ko dubara revise karke fir try karo.") : null,
        steps: Array.isArray(q?.steps) ? q.steps.filter((x: unknown) => typeof x === "string").slice(0, 5) : [],
        difficulty: qDifficulty,
        points,
        timeLimit,
        isAiGenerated: true,
      };
    });

    const inserted = await db.insert(questionsTable).values(rowsToInsert).returning();
    res.json(inserted.map((q) => ({
      id: q.id,
      topicId: q.topicId,
      text: q.text,
      textHi: q.textHi,
      options: q.options,
      difficulty: q.difficulty,
      points: q.points,
      timeLimit: q.timeLimit,
    })));
  } catch {
    res.status(500).json({ error: "Failed to generate quiz." });
  }
});

export default router;
