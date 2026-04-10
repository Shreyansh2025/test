import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, usersTable, badgesTable, userBadgesTable } from "@workspace/db";
import { extractToken, verifyToken } from "../lib/auth";
import { GetLeaderboardQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/gamification/leaderboard", async (req, res): Promise<void> => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 50;

  const users = await db.select({
    id: usersTable.id,
    displayName: usersTable.displayName,
    avatarUrl: usersTable.avatarUrl,
    xp: usersTable.xp,
    level: usersTable.level,
    streak: usersTable.streak,
  }).from(usersTable).orderBy(desc(usersTable.xp)).limit(limit);

  res.json(users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    xp: u.xp,
    level: u.level,
    streak: u.streak,
  })));
});

router.get("/gamification/badges", async (_req, res): Promise<void> => {
  const badges = await db.select().from(badgesTable);
  res.json(badges);
});

router.get("/gamification/my-badges", async (req, res): Promise<void> => {
  const token = extractToken(req.headers.authorization);
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  const payload = verifyToken(token);
  if (!payload) { res.status(401).json({ error: "Invalid token" }); return; }

  const userBadges = await db.select({
    ub: userBadgesTable,
    badge: badgesTable,
  }).from(userBadgesTable)
    .leftJoin(badgesTable, eq(userBadgesTable.badgeId, badgesTable.id))
    .where(eq(userBadgesTable.userId, payload.userId));

  res.json(userBadges.map(ub => ({
    badgeId: ub.ub.badgeId,
    badge: ub.badge,
    earnedAt: ub.ub.earnedAt,
  })));
});

export default router;
