import { Router } from "express";
import { db } from "@workspace/db";
import { coursesTable } from "@workspace/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function firstQueryValue(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : undefined;
  return undefined;
}

router.get("/courses", requireAuth, async (req, res) => {
  try {
    const subjectId = firstQueryValue(req.query.subjectId);
    const grade = firstQueryValue(req.query.grade);
    const search = firstQueryValue(req.query.search);

    const conditions = [];
    if (subjectId) conditions.push(eq(coursesTable.subjectId, parseInt(subjectId, 10)));
    if (grade) conditions.push(eq(coursesTable.grade, grade));
    if (search) {
      conditions.push(
        or(
          ilike(coursesTable.title, `%${search}%`),
          ilike(coursesTable.provider, `%${search}%`),
        )!,
      );
    }

    const where = conditions.length === 0 ? undefined : and(...conditions);
    const courses = await db.select().from(coursesTable).where(where);
    return res.json(courses);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.get("/courses/:id", requireAuth, async (req, res) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam, 10);
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
    if (!course) return res.status(404).json({ error: "Course not found" });
    return res.json(course);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch course" });
  }
});

export default router;
