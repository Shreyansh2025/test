import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { signToken, verifyToken, extractToken } from "../lib/auth";
import { checkAndAwardBadges } from "../lib/badges";

const router: IRouter = Router();

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayDiff(fromYmd: string, toYmd: string): number {
  const from = new Date(`${fromYmd}T00:00:00.000Z`).getTime();
  const to = new Date(`${toYmd}T00:00:00.000Z`).getTime();
  return Math.floor((to - from) / (24 * 60 * 60 * 1000));
}

async function updateDailyStreak(userId: number): Promise<void> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return;

  const today = toYmd(new Date());
  const last = user.lastActiveDate;

  if (last === today) return;

  let nextStreak = 1;
  if (last) {
    const diff = dayDiff(last, today);
    if (diff === 1) nextStreak = Math.max(1, (user.streak ?? 0) + 1);
    else nextStreak = 1;
  }

  await db
    .update(usersTable)
    .set({ streak: nextStreak, lastActiveDate: today })
    .where(eq(usersTable.id, userId));

  await checkAndAwardBadges(userId);
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, email, password, displayName, language } = parsed.data;
  const requestedRole = String(req.body?.role ?? "student").trim();
  const role: "student" | "teacher" | "admin" =
    requestedRole === "teacher" || requestedRole === "admin"
      ? requestedRole
      : "student";
  const inviteCode = String(req.body?.inviteCode ?? "").trim();

  if (role === "teacher") {
    const expected = String(process.env.TEACHER_INVITE_CODE ?? "").trim();
    if (!expected || inviteCode !== expected) {
      res.status(403).json({ error: "Invalid teacher invite code" });
      return;
    }
  }
  if (role === "admin") {
    const expected = String(process.env.ADMIN_INVITE_CODE ?? "").trim();
    if (!expected || inviteCode !== expected) {
      res.status(403).json({ error: "Invalid admin invite code" });
      return;
    }
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const existingUsername = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (existingUsername.length > 0) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    username,
    email,
    passwordHash,
    displayName,
    language: language ?? "en",
    role,
  }).returning();

  const token = signToken(user.id);
  res.status(201).json({ token, user: sanitizeUser(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  await updateDailyStreak(user.id);
  const [freshUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
  if (!freshUser) {
    res.status(404).json({ error: "User not found after login update" });
    return;
  }

  const token = signToken(freshUser.id);
  res.json({ token, user: sanitizeUser(freshUser) });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  await updateDailyStreak(payload.userId);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(sanitizeUser(user));
});

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export default router;
