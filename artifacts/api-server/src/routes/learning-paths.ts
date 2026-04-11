import { Router } from "express";
import { db } from "@workspace/db";
import { subTopicsTable, confidenceScoresTable, topicsTable, subjectsTable, userTopicStatsTable } from "@workspace/db/schema";
import { eq, and, desc, avg } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/learning-paths/sub-topics", requireAuth, async (req, res) => {
  try {
    const q = req.query.topicId;
    const first = Array.isArray(q) ? q[0] : q;
    const topicIdRaw = typeof first === "string" ? first : undefined;
    const topicId = topicIdRaw ? parseInt(topicIdRaw, 10) : undefined;
    const where = topicId ? eq(subTopicsTable.topicId, topicId) : undefined;
    const subTopics = await db.select().from(subTopicsTable)
      .where(where)
      .orderBy(subTopicsTable.topicId, subTopicsTable.order);
    return res.json(subTopics);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch sub-topics" });
  }
});

router.get("/learning-paths/overview", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const subjects = await db.select().from(subjectsTable).orderBy(subjectsTable.order);
    const topics = await db.select().from(topicsTable).orderBy(topicsTable.subjectId, topicsTable.order);
    const stats = await db.select().from(userTopicStatsTable).where(eq(userTopicStatsTable.userId, userId));
    const statsMap = Object.fromEntries(stats.map(s => [s.topicId, s]));
    const subTopicCounts = await db.select({ topicId: subTopicsTable.topicId })
      .from(subTopicsTable);
    const subTopicCountMap: Record<number, number> = {};
    for (const s of subTopicCounts) {
      subTopicCountMap[s.topicId] = (subTopicCountMap[s.topicId] ?? 0) + 1;
    }
    const result = subjects.map(subject => ({
      ...subject,
      topics: topics
        .filter(t => t.subjectId === subject.id)
        .map(topic => {
          const topicStats = statsMap[topic.id];
          const answered = topicStats?.answered ?? 0;
          const correct = topicStats?.correct ?? 0;
          const acc = answered > 0 ? correct / Math.max(answered, 1) : 0;
          return {
            ...topic,
            subTopicCount: subTopicCountMap[topic.id] ?? 0,
            mastered: acc >= 0.8 && answered >= 3,
            inProgress: answered > 0 && acc < 0.8,
            accuracy: acc,
            questionsAnswered: answered,
          };
        }),
    }));
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch learning path overview" });
  }
});

router.post("/confidence", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { topicId, score, sessionCorrect, sessionTotal } = req.body;
    if (!topicId || score === undefined) {
      return res.status(400).json({ error: "topicId and score are required" });
    }
    if (score < 1 || score > 5) {
      return res.status(400).json({ error: "Score must be between 1 and 5" });
    }
    const [inserted] = await db.insert(confidenceScoresTable).values({
      userId, topicId: parseInt(topicId, 10),
      score: parseInt(score, 10),
      sessionCorrect: sessionCorrect ?? 0,
      sessionTotal: sessionTotal ?? 0,
    }).returning();
    return res.json({ success: true, confidenceScore: inserted });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save confidence score" });
  }
});

router.get("/confidence/:topicId", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const topicIdParam = Array.isArray(req.params.topicId) ? req.params.topicId[0] : req.params.topicId;
    const topicId = parseInt(topicIdParam, 10);
    const scores = await db.select().from(confidenceScoresTable)
      .where(and(eq(confidenceScoresTable.userId, userId), eq(confidenceScoresTable.topicId, topicId)))
      .orderBy(desc(confidenceScoresTable.createdAt))
      .limit(5);
    const avgScore = scores.length > 0 ? scores.reduce((acc, s) => acc + s.score, 0) / scores.length : null;
    return res.json({ scores, avgScore });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch confidence scores" });
  }
});

export default router;
