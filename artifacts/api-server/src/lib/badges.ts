import { eq, and, sql, desc } from "drizzle-orm";
import { db, usersTable, badgesTable, userBadgesTable, battleParticipantsTable, battlesTable, userAnswersTable } from "@workspace/db";

export async function checkAndAwardBadges(userId: number): Promise<void> {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return;

    const allBadges = await db.select().from(badgesTable);
    const earned = await db.select({ badgeId: userBadgesTable.badgeId }).from(userBadgesTable)
      .where(eq(userBadgesTable.userId, userId));
    const earnedIds = new Set(earned.map(e => e.badgeId));

    const totalAnswered = user.totalQuestionsAnswered;
    const streak = user.streak;
    const xp = user.xp;
    const level = user.level;

    const battleWins = await db
      .select({ count: sql<number>`count(*)` })
      .from(battleParticipantsTable)
      .innerJoin(battlesTable, eq(battleParticipantsTable.battleId, battlesTable.id))
      .where(
        and(
          eq(battleParticipantsTable.userId, userId),
          eq(battlesTable.status, "finished"),
          sql`${battleParticipantsTable.score} = (
            select max(bp2.score)
            from battle_participants bp2
            where bp2.battle_id = ${battleParticipantsTable.battleId}
          )`,
        ),
      );
    const wins = Number(battleWins[0]?.count ?? 0);

    // Check consecutive correct answers (last 10 answers all correct)
    const recentAnswers = await db.select({ isCorrect: userAnswersTable.isCorrect })
      .from(userAnswersTable)
      .where(eq(userAnswersTable.userId, userId))
      .orderBy(desc(userAnswersTable.createdAt))
      .limit(10);
    const consecutiveCorrect =
      recentAnswers.length >= 10 &&
      recentAnswers.every(a => Number(a.isCorrect) === 1);

    const toAward: typeof allBadges = [];

    for (const badge of allBadges) {
      if (earnedIds.has(badge.id)) continue;
      const cond = badge.condition;
      let shouldAward = false;

      if (cond === "answer_1" && totalAnswered >= 1) shouldAward = true;
      else if (cond === "answer_10" && totalAnswered >= 10) shouldAward = true;
      else if (cond === "answer_50" && totalAnswered >= 50) shouldAward = true;
      else if (cond === "streak_3" && streak >= 3) shouldAward = true;
      else if (cond === "streak_7" && streak >= 7) shouldAward = true;
      else if (cond === "streak_30" && streak >= 30) shouldAward = true;
      else if (cond === "battle_win_1" && wins >= 1) shouldAward = true;
      else if (cond === "battle_win_10" && wins >= 10) shouldAward = true;
      else if (cond === "xp_1000" && xp >= 1000) shouldAward = true;
      else if (cond === "level_10" && level >= 10) shouldAward = true;
      else if (cond === "correct_10" && consecutiveCorrect) shouldAward = true;

      if (shouldAward) toAward.push(badge);
    }

    for (const b of toAward) {
      await db.insert(userBadgesTable).values({ userId, badgeId: b.id });
    }
  } catch {
  }
}

export async function checkSpeedBadge(userId: number, timeTaken: number): Promise<void> {
  try {
    if (timeTaken > 5) return;
    const [badge] = await db.select().from(badgesTable).where(eq(badgesTable.condition, "speed_5")).limit(1);
    if (!badge) return;
    const [already] = await db.select().from(userBadgesTable)
      .where(and(eq(userBadgesTable.userId, userId), eq(userBadgesTable.badgeId, badge.id))).limit(1);
    if (already) return;
    await db.insert(userBadgesTable).values({ userId, badgeId: badge.id });
  } catch {
  }
}
