import { Router, type IRouter } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db, usersTable, userTopicStatsTable, userAnswersTable, activityLogTable, topicsTable, subjectsTable } from "@workspace/db";
import { GetProgressQueryParams, GetTopicStatsQueryParams, GetAccuracyHistoryQueryParams } from "@workspace/api-zod";
import { extractToken, verifyToken } from "../lib/auth";

const router: IRouter = Router();

function getUserId(req: any): number | null {
  const parsed = GetProgressQueryParams.safeParse(req.query);
  if (parsed.success && parsed.data.userId) return parsed.data.userId;
  const token = extractToken(req.headers.authorization);
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

router.get("/progress", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const topicStats = await db.select({
    stat: userTopicStatsTable,
    topic: topicsTable,
  }).from(userTopicStatsTable)
    .leftJoin(topicsTable, eq(userTopicStatsTable.topicId, topicsTable.id))
    .where(eq(userTopicStatsTable.userId, userId));

  const weakTopics = topicStats
    .filter(s => s.stat.accuracy < 0.5 && s.stat.answered >= 3)
    .map(s => s.topic?.name ?? "Unknown");

  const strongTopics = topicStats
    .filter(s => s.stat.accuracy >= 0.8 && s.stat.answered >= 3)
    .map(s => s.topic?.name ?? "Unknown");

  const accuracy = user.totalQuestionsAnswered > 0
    ? user.totalCorrect / user.totalQuestionsAnswered
    : 0;

  res.json({
    totalXp: user.xp,
    level: user.level,
    streak: user.streak,
    totalAnswered: user.totalQuestionsAnswered,
    totalCorrect: user.totalCorrect,
    overallAccuracy: Math.round(accuracy * 100) / 100,
    studyTimeMinutes: Math.floor(user.totalQuestionsAnswered * 1.5),
    weakTopics: weakTopics.slice(0, 5),
    strongTopics: strongTopics.slice(0, 5),
  });
});

router.get("/progress/topic-stats", async (req, res): Promise<void> => {
  const parsed = GetTopicStatsQueryParams.safeParse(req.query);
  const userId = parsed.success && parsed.data.userId
    ? parsed.data.userId
    : (() => {
        const token = extractToken(req.headers.authorization);
        if (!token) return null;
        return verifyToken(token)?.userId ?? null;
      })();
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const stats = await db.select({
    stat: userTopicStatsTable,
    topic: topicsTable,
    subject: subjectsTable,
  }).from(userTopicStatsTable)
    .leftJoin(topicsTable, eq(userTopicStatsTable.topicId, topicsTable.id))
    .leftJoin(subjectsTable, eq(topicsTable.subjectId, subjectsTable.id))
    .where(eq(userTopicStatsTable.userId, userId));

  res.json(stats.map(s => ({
    topicId: s.stat.topicId,
    topicName: s.topic?.name ?? "Unknown",
    subjectName: s.subject?.name ?? "Unknown",
    accuracy: s.stat.accuracy,
    answered: s.stat.answered,
    correct: s.stat.correct,
    strength: s.stat.accuracy >= 0.8 ? "strong" : s.stat.accuracy >= 0.5 ? "average" : "weak",
  })));
});

router.get("/progress/accuracy-history", async (req, res): Promise<void> => {
  const parsed = GetAccuracyHistoryQueryParams.safeParse(req.query);
  const userId = parsed.success && parsed.data.userId
    ? parsed.data.userId
    : (() => {
        const token = extractToken(req.headers.authorization);
        if (!token) return null;
        return verifyToken(token)?.userId ?? null;
      })();
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const days = (parsed.success && parsed.data.days) ? parsed.data.days : 7;

  const answers = await db.select({
    date: sql<string>`DATE(${userAnswersTable.createdAt})`,
    total: sql<number>`COUNT(*)`,
    correct: sql<number>`SUM(${userAnswersTable.isCorrect})`,
  }).from(userAnswersTable)
    .where(and(
      eq(userAnswersTable.userId, userId),
      sql`${userAnswersTable.createdAt} >= NOW() - INTERVAL '${sql.raw(String(days))} days'`
    ))
    .groupBy(sql`DATE(${userAnswersTable.createdAt})`)
    .orderBy(sql`DATE(${userAnswersTable.createdAt})`);

  res.json(answers.map(a => ({
    date: a.date,
    accuracy: a.total > 0 ? Math.round((a.correct / a.total) * 100) / 100 : 0,
    questionsAnswered: a.total,
  })));
});

export default router;
