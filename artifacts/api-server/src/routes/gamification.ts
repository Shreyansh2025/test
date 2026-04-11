import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, usersTable, badgesTable, userBadgesTable } from "@workspace/db";
import { extractToken, verifyToken } from "../lib/auth";
import { GetLeaderboardQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_BADGES = [
  { id: 1, name: "First Steps", description: "Answer your first question", icon: "🎯", rarity: "common", condition: "answer_1", xpRequired: 0 },
  { id: 2, name: "Quick Learner", description: "Answer 10 questions", icon: "⚡", rarity: "common", condition: "answer_10", xpRequired: 100 },
  { id: 3, name: "Math Enthusiast", description: "Answer 50 questions", icon: "📚", rarity: "rare", condition: "answer_50", xpRequired: 500 },
  { id: 4, name: "Streak Starter", description: "Maintain a 3-day streak", icon: "🔥", rarity: "common", condition: "streak_3", xpRequired: 150 },
  { id: 5, name: "On Fire", description: "Maintain a 7-day streak", icon: "🌟", rarity: "rare", condition: "streak_7", xpRequired: 350 },
  { id: 6, name: "Unstoppable", description: "Maintain a 30-day streak", icon: "💎", rarity: "legendary", condition: "streak_30", xpRequired: 1500 },
  { id: 7, name: "Sharpshooter", description: "Get 10 correct in a row", icon: "🎯", rarity: "rare", condition: "correct_10", xpRequired: 400 },
  { id: 8, name: "Battle Winner", description: "Win your first battle", icon: "⚔️", rarity: "rare", condition: "battle_win_1", xpRequired: 250 },
  { id: 9, name: "Battle Champion", description: "Win 10 battles", icon: "🏆", rarity: "epic", condition: "battle_win_10", xpRequired: 900 },
  { id: 10, name: "Speed Demon", description: "Answer correctly in under 5s", icon: "💨", rarity: "rare", condition: "speed_5", xpRequired: 450 },
  { id: 11, name: "XP Collector", description: "Earn 1000 XP", icon: "⭐", rarity: "rare", condition: "xp_1000", xpRequired: 1000 },
  { id: 12, name: "Math Legend", description: "Reach Level 10", icon: "👑", rarity: "legendary", condition: "level_10", xpRequired: 2000 },
];

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
  try {
    const badges = await db.select().from(badgesTable);
    res.json(badges.length > 0 ? badges : DEFAULT_BADGES);
  } catch {
    res.json(DEFAULT_BADGES);
  }
});

router.get("/gamification/my-badges", async (req, res): Promise<void> => {
  const token = extractToken(req.headers.authorization);
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  const payload = verifyToken(token);
  if (!payload) { res.status(401).json({ error: "Invalid token" }); return; }

  try {
    const userBadges = await db.select({
      ub: userBadgesTable,
      badge: badgesTable,
    }).from(userBadgesTable)
      .leftJoin(badgesTable, eq(userBadgesTable.badgeId, badgesTable.id))
      .where(eq(userBadgesTable.userId, payload.userId));

    res.json(
      userBadges
        .filter((ub) => ub.badge != null)
        .map((ub) => ({
          badgeId: ub.ub.badgeId,
          badge: ub.badge,
          earnedAt: ub.ub.earnedAt,
        })),
    );
  } catch {
    res.json([]);
  }
});

export default router;
