import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, battlesTable, battleParticipantsTable, usersTable, subjectsTable, questionsTable } from "@workspace/db";
import { CreateBattleBody, SubmitBattleAnswerBody } from "@workspace/api-zod";
import { extractToken, verifyToken } from "../lib/auth";

const router: IRouter = Router();

function randomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getAuthUserId(req: any): number | null {
  const token = extractToken(req.headers.authorization);
  if (!token) return null;
  return verifyToken(token)?.userId ?? null;
}

router.get("/battles", async (_req, res): Promise<void> => {
  const battles = await db.select({
    battle: battlesTable,
    host: usersTable,
    subject: subjectsTable,
  }).from(battlesTable)
    .leftJoin(usersTable, eq(battlesTable.hostId, usersTable.id))
    .leftJoin(subjectsTable, eq(battlesTable.subjectId, subjectsTable.id))
    .where(eq(battlesTable.status, "waiting"))
    .limit(20);

  const withCounts = await Promise.all(battles.map(async b => {
    const participants = await db.select({ count: battlesTable.id }).from(battleParticipantsTable)
      .where(eq(battleParticipantsTable.battleId, b.battle.id));
    return {
      id: b.battle.id,
      code: b.battle.code,
      subjectId: b.battle.subjectId,
      subjectName: b.subject?.name ?? "Math",
      hostId: b.battle.hostId,
      hostName: b.host?.displayName ?? "Unknown",
      status: b.battle.status,
      maxParticipants: b.battle.maxParticipants,
      currentParticipants: participants.length,
      questionCount: b.battle.questionCount,
      timePerQuestion: b.battle.timePerQuestion,
      createdAt: b.battle.createdAt,
    };
  }));

  res.json(withCounts);
});

router.post("/battles", async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateBattleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const qCount = parsed.data.questionCount ?? 10;
  const questions = await db.select({ id: questionsTable.id }).from(questionsTable).limit(qCount);
  const questionIds = questions.map(q => q.id);

  const code = randomCode();
  const [battle] = await db.insert(battlesTable).values({
    code,
    subjectId: parsed.data.subjectId,
    hostId: userId,
    questionCount: qCount,
    timePerQuestion: parsed.data.timePerQuestion ?? 30,
    questionIds,
  }).returning();

  await db.insert(battleParticipantsTable).values({
    battleId: battle.id,
    userId,
    score: 0,
    correctAnswers: 0,
    isReady: true,
  });

  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, battle.subjectId)).limit(1);
  const [host] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  res.status(201).json({
    id: battle.id,
    code: battle.code,
    subjectId: battle.subjectId,
    subjectName: subject?.name ?? "Math",
    hostId: battle.hostId,
    hostName: host?.displayName ?? "Unknown",
    status: battle.status,
    maxParticipants: battle.maxParticipants,
    currentParticipants: 1,
    questionCount: battle.questionCount,
    timePerQuestion: battle.timePerQuestion,
    createdAt: battle.createdAt,
  });
});

router.get("/battles/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [battle] = await db.select({
    battle: battlesTable,
    host: usersTable,
    subject: subjectsTable,
  }).from(battlesTable)
    .leftJoin(usersTable, eq(battlesTable.hostId, usersTable.id))
    .leftJoin(subjectsTable, eq(battlesTable.subjectId, subjectsTable.id))
    .where(eq(battlesTable.id, id))
    .limit(1);

  if (!battle) { res.status(404).json({ error: "Battle not found" }); return; }

  const participants = await db.select({
    bp: battleParticipantsTable,
    user: usersTable,
  }).from(battleParticipantsTable)
    .leftJoin(usersTable, eq(battleParticipantsTable.userId, usersTable.id))
    .where(eq(battleParticipantsTable.battleId, id));

  const questions = battle.battle.questionIds.length > 0
    ? await db.select().from(questionsTable)
        .where(inArray(questionsTable.id, battle.battle.questionIds))
    : [];

  res.json({
    id: battle.battle.id,
    code: battle.battle.code,
    subjectId: battle.battle.subjectId,
    subjectName: battle.subject?.name ?? "Math",
    hostId: battle.battle.hostId,
    hostName: battle.host?.displayName ?? "Unknown",
    status: battle.battle.status,
    maxParticipants: battle.battle.maxParticipants,
    questionCount: battle.battle.questionCount,
    timePerQuestion: battle.battle.timePerQuestion,
    participants: participants.map(p => ({
      userId: p.bp.userId,
      displayName: p.user?.displayName ?? "Unknown",
      avatarUrl: p.user?.avatarUrl ?? null,
      score: p.bp.score,
      correctAnswers: p.bp.correctAnswers,
      isReady: p.bp.isReady,
    })),
    questions: questions.map(q => ({
      id: q.id,
      topicId: q.topicId,
      text: q.text,
      textHi: q.textHi,
      options: q.options,
      difficulty: q.difficulty,
      points: q.points,
      timeLimit: battle.battle.timePerQuestion,
    })),
    createdAt: battle.battle.createdAt,
  });
});

router.post("/battles/:id/join", async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [battle] = await db.select().from(battlesTable).where(eq(battlesTable.id, id)).limit(1);
  if (!battle) { res.status(404).json({ error: "Battle not found" }); return; }

  const existing = await db.select().from(battleParticipantsTable)
    .where(and(eq(battleParticipantsTable.battleId, id), eq(battleParticipantsTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(battleParticipantsTable).values({
      battleId: id,
      userId,
      score: 0,
      correctAnswers: 0,
      isReady: true,
    });

    await db.update(battlesTable).set({ status: "in_progress" }).where(eq(battlesTable.id, id));
  }

  // Return full battle with participants
  req.params.id = String(id);
  const fullBattleRes = await db.select({
    battle: battlesTable,
    host: usersTable,
    subject: subjectsTable,
  }).from(battlesTable)
    .leftJoin(usersTable, eq(battlesTable.hostId, usersTable.id))
    .leftJoin(subjectsTable, eq(battlesTable.subjectId, subjectsTable.id))
    .where(eq(battlesTable.id, id))
    .limit(1);

  const fullBattle = fullBattleRes[0];
  const participants = await db.select({ bp: battleParticipantsTable, user: usersTable })
    .from(battleParticipantsTable)
    .leftJoin(usersTable, eq(battleParticipantsTable.userId, usersTable.id))
    .where(eq(battleParticipantsTable.battleId, id));

  const questions = battle.questionIds.length > 0
    ? await db.select().from(questionsTable).where(inArray(questionsTable.id, battle.questionIds))
    : [];

  res.json({
    id: fullBattle.battle.id,
    code: fullBattle.battle.code,
    subjectId: fullBattle.battle.subjectId,
    subjectName: fullBattle.subject?.name ?? "Math",
    hostId: fullBattle.battle.hostId,
    hostName: fullBattle.host?.displayName ?? "Unknown",
    status: fullBattle.battle.status,
    maxParticipants: fullBattle.battle.maxParticipants,
    questionCount: fullBattle.battle.questionCount,
    timePerQuestion: fullBattle.battle.timePerQuestion,
    participants: participants.map(p => ({
      userId: p.bp.userId,
      displayName: p.user?.displayName ?? "Unknown",
      avatarUrl: p.user?.avatarUrl ?? null,
      score: p.bp.score,
      correctAnswers: p.bp.correctAnswers,
      isReady: p.bp.isReady,
    })),
    questions: questions.map(q => ({
      id: q.id,
      topicId: q.topicId,
      text: q.text,
      textHi: q.textHi,
      options: q.options,
      difficulty: q.difficulty,
      points: q.points,
      timeLimit: battle.timePerQuestion,
    })),
    createdAt: fullBattle.battle.createdAt,
  });
});

router.post("/battles/:id/submit", async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = SubmitBattleAnswerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [question] = await db.select().from(questionsTable)
    .where(eq(questionsTable.id, parsed.data.questionId)).limit(1);
  if (!question) { res.status(404).json({ error: "Question not found" }); return; }

  const isCorrect = parsed.data.answer === question.correctAnswer;
  const pointsEarned = isCorrect ? question.points : 0;

  const [participant] = await db.select().from(battleParticipantsTable)
    .where(and(eq(battleParticipantsTable.battleId, id), eq(battleParticipantsTable.userId, userId)))
    .limit(1);

  if (participant) {
    const newScore = participant.score + pointsEarned;
    const newCorrect = participant.correctAnswers + (isCorrect ? 1 : 0);
    await db.update(battleParticipantsTable)
      .set({ score: newScore, correctAnswers: newCorrect })
      .where(eq(battleParticipantsTable.id, participant.id));

    res.json({
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      pointsEarned,
      currentScore: newScore,
    });
  } else {
    res.json({
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      pointsEarned,
      currentScore: pointsEarned,
    });
  }
});

export default router;
