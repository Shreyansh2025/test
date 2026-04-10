import { Router, type IRouter } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { db, usersTable, userTopicStatsTable, activityLogTable, topicsTable, notificationsTable, friendRequestsTable, battlesTable } from "@workspace/db";
import { extractToken, verifyToken } from "../lib/auth";

const router: IRouter = Router();

function getAuthUserId(req: any): number | null {
  const token = extractToken(req.headers.authorization);
  if (!token) return null;
  return verifyToken(token)?.userId ?? null;
}

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const allUsers = await db.select({ id: usersTable.id, xp: usersTable.xp })
    .from(usersTable)
    .orderBy(desc(usersTable.xp));
  const rank = allUsers.findIndex(u => u.id === userId) + 1;

  const pendingRequests = await db.select({ count: sql<number>`COUNT(*)` })
    .from(friendRequestsTable)
    .where(and(eq(friendRequestsTable.toUserId, userId), eq(friendRequestsTable.status, "pending")));

  const unreadNotifs = await db.select({ count: sql<number>`COUNT(*)` })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));

  const activeBattles = await db.select({ count: sql<number>`COUNT(*)` })
    .from(battlesTable)
    .where(eq(battlesTable.status, "waiting"));

  const overallAccuracy = user.totalQuestionsAnswered > 0
    ? user.totalCorrect / user.totalQuestionsAnswered
    : 0;

  res.json({
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    rank,
    questionsToday: 0,
    accuracyToday: 0,
    overallAccuracy: Math.round(overallAccuracy * 100) / 100,
    badgesEarned: 0,
    activeBattles: Number(activeBattles[0]?.count ?? 0),
    pendingFriendRequests: Number(pendingRequests[0]?.count ?? 0),
    unreadNotifications: Number(unreadNotifs[0]?.count ?? 0),
  });
});

router.get("/dashboard/recommendations", async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const weakTopicStats = await db.select({
    stat: userTopicStatsTable,
    topic: topicsTable,
  }).from(userTopicStatsTable)
    .leftJoin(topicsTable, eq(userTopicStatsTable.topicId, topicsTable.id))
    .where(and(eq(userTopicStatsTable.userId, userId), sql`${userTopicStatsTable.accuracy} < 0.5`))
    .limit(3);

  const recommendations = [];

  for (const ws of weakTopicStats) {
    recommendations.push({
      type: "revise_topic",
      title: `Revise ${ws.topic?.name ?? "this topic"}`,
      description: `Your accuracy in ${ws.topic?.name ?? "this topic"} is ${Math.round((ws.stat.accuracy ?? 0) * 100)}%. Practice more to improve.`,
      topicId: ws.stat.topicId,
      topicName: ws.topic?.name ?? null,
      priority: "high",
    });
  }

  recommendations.push({
    type: "challenge_friend",
    title: "Challenge a Friend",
    description: "Start a Math Battle and compete with your friends for XP rewards.",
    topicId: null,
    topicName: null,
    priority: "medium",
  });

  if (recommendations.length < 3) {
    recommendations.push({
      type: "practice_more",
      title: "Daily Practice",
      description: "Complete today's practice session to maintain your streak and earn bonus XP.",
      topicId: null,
      topicName: null,
      priority: "medium",
    });
  }

  res.json(recommendations);
});

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const activities = await db.select().from(activityLogTable)
    .where(eq(activityLogTable.userId, userId))
    .orderBy(desc(activityLogTable.createdAt))
    .limit(10);

  res.json(activities);
});

export default router;
