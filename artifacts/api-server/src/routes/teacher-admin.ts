import { Router, type IRouter } from "express";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db, doubtsTable, usersTable } from "@workspace/db";
import { extractToken, verifyToken } from "../lib/auth";

const router: IRouter = Router();

function getAuth(req: any): { userId: number; role: string } | null {
  const token = extractToken(req.headers.authorization);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return { userId: payload.userId, role: "student" };
}

async function getCurrentUser(req: any) {
  const auth = getAuth(req);
  if (!auth) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, auth.userId)).limit(1);
  return user ?? null;
}

router.post("/doubts", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const subject = String(req.body?.subject ?? "").trim();
  const message = String(req.body?.message ?? "").trim();
  if (!subject || !message) {
    res.status(400).json({ error: "subject and message are required" });
    return;
  }

  const [firstTeacher] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.role, "teacher"))
    .limit(1);

  const [doubt] = await db.insert(doubtsTable).values({
    studentId: user.id,
    teacherId: firstTeacher?.id ?? null,
    subject,
    message,
    status: firstTeacher?.id ? "assigned" : "open",
  }).returning();

  res.status(201).json(doubt);
});

router.get("/doubts/mine", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rows = await db.select().from(doubtsTable).where(eq(doubtsTable.studentId, user.id)).orderBy(desc(doubtsTable.createdAt));
  res.json(rows);
});

router.get("/teacher/dashboard", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (user.role !== "teacher" && user.role !== "admin") { res.status(403).json({ error: "Teacher access required" }); return; }

  const [openCount] = await db.select({ c: count() }).from(doubtsTable).where(
    and(eq(doubtsTable.status, "open"), eq(doubtsTable.teacherId, user.id)),
  );
  const [assignedCount] = await db.select({ c: count() }).from(doubtsTable).where(
    and(eq(doubtsTable.status, "assigned"), eq(doubtsTable.teacherId, user.id)),
  );
  const [resolvedCount] = await db.select({ c: count() }).from(doubtsTable).where(
    and(eq(doubtsTable.status, "resolved"), eq(doubtsTable.teacherId, user.id)),
  );

  const students = await db.execute(sql`
    select distinct u.id, u.display_name, u.username, u.email
    from doubts d
    join users u on u.id = d.student_id
    where d.teacher_id = ${user.id}
    order by u.display_name asc
    limit 50
  `);

  res.json({
    stats: {
      open: Number(openCount?.c ?? 0),
      assigned: Number(assignedCount?.c ?? 0),
      resolved: Number(resolvedCount?.c ?? 0),
    },
    students: students.rows ?? [],
  });
});

router.get("/teacher/doubts", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (user.role !== "teacher" && user.role !== "admin") { res.status(403).json({ error: "Teacher access required" }); return; }

  const rows = await db.execute(sql`
    select d.*, u.display_name as student_name, u.username as student_username
    from doubts d
    join users u on u.id = d.student_id
    where d.teacher_id = ${user.id}
    order by d.created_at desc
    limit 200
  `);
  res.json(rows.rows ?? []);
});

router.post("/teacher/doubts/:id/reply", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (user.role !== "teacher" && user.role !== "admin") { res.status(403).json({ error: "Teacher access required" }); return; }

  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid doubt id" }); return; }
  const reply = String(req.body?.reply ?? "").trim();
  if (!reply) { res.status(400).json({ error: "reply is required" }); return; }

  const [updated] = await db.update(doubtsTable).set({
    reply,
    status: "resolved",
    teacherId: user.id,
  }).where(eq(doubtsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Doubt not found" }); return; }

  res.json(updated);
});

router.get("/admin/dashboard", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (user.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }

  const [students] = await db.select({ c: count() }).from(usersTable).where(eq(usersTable.role, "student"));
  const [teachers] = await db.select({ c: count() }).from(usersTable).where(eq(usersTable.role, "teacher"));
  const [admins] = await db.select({ c: count() }).from(usersTable).where(eq(usersTable.role, "admin"));
  const [doubts] = await db.select({ c: count() }).from(doubtsTable);
  const [resolved] = await db.select({ c: count() }).from(doubtsTable).where(eq(doubtsTable.status, "resolved"));

  const users = await db.execute(sql`
    select id, username, email, display_name, role, created_at
    from users
    order by created_at desc
    limit 200
  `);

  const allDoubts = await db.execute(sql`
    select d.*, s.display_name as student_name, t.display_name as teacher_name
    from doubts d
    join users s on s.id = d.student_id
    left join users t on t.id = d.teacher_id
    order by d.created_at desc
    limit 200
  `);

  res.json({
    stats: {
      students: Number(students?.c ?? 0),
      teachers: Number(teachers?.c ?? 0),
      admins: Number(admins?.c ?? 0),
      totalDoubts: Number(doubts?.c ?? 0),
      resolvedDoubts: Number(resolved?.c ?? 0),
    },
    users: users.rows ?? [],
    doubts: allDoubts.rows ?? [],
  });
});

router.patch("/admin/users/:id/role", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (user.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }

  const id = Number(req.params.id);
  const role = String(req.body?.role ?? "").trim();
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid user id" }); return; }
  if (!["student", "teacher", "admin"].includes(role)) {
    res.status(400).json({ error: "role must be student, teacher, or admin" });
    return;
  }

  const [updated] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  const { passwordHash, ...safe } = updated;
  res.json(safe);
});

router.post("/admin/bootstrap", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [adminCount] = await db
    .select({ c: count() })
    .from(usersTable)
    .where(eq(usersTable.role, "admin"));

  if (Number(adminCount?.c ?? 0) > 0) {
    res.status(403).json({ error: "Admin already exists. Ask an existing admin." });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ role: "admin" })
    .where(eq(usersTable.id, user.id))
    .returning();

  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  const { passwordHash, ...safe } = updated;
  res.json(safe);
});

export default router;
