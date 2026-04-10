import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, questionsTable, usersTable, userAnswersTable, userTopicStatsTable, activityLogTable, topicsTable, subjectsTable } from "@workspace/db";
import { SubmitAnswerBody, SubmitAnswerParams, GenerateQuestionBody, ListQuestionsQueryParams } from "@workspace/api-zod";
import { extractToken, verifyToken } from "../lib/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { checkAndAwardBadges, checkSpeedBadge } from "../lib/badges";

const router: IRouter = Router();

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

  const [topic] = await db.select({
    topic: topicsTable,
    subject: subjectsTable,
  }).from(topicsTable)
    .leftJoin(subjectsTable, eq(topicsTable.subjectId, subjectsTable.id))
    .where(eq(topicsTable.id, parsed.data.topicId))
    .limit(1);

  if (!topic) { res.status(404).json({ error: "Topic not found" }); return; }

  const lang = parsed.data.language ?? "en";
  const langInstruction = lang === "hi"
    ? "Respond in Hindi (Hinglish acceptable). Keep explanations simple."
    : "Respond in English. Keep explanations clear and simple.";

  const prompt = `You are a math/science tutor. Generate a ${parsed.data.difficulty} difficulty multiple choice question for the topic "${topic.topic.name}" (subject: ${topic.subject?.name ?? "Math"}).

${langInstruction}

Return ONLY valid JSON in this exact format:
{
  "question": "The question text",
  "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
  "correctAnswer": "A) option1",
  "explanation": "Clear explanation of why this is correct",
  "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const generated = JSON.parse(content);

  res.json({
    question: generated.question ?? "Generated question",
    options: generated.options ?? [],
    correctAnswer: generated.correctAnswer ?? "",
    explanation: generated.explanation ?? "",
    steps: generated.steps ?? [],
  });
});

export default router;
