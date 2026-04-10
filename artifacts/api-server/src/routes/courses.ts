import { Router } from "express";
import { db } from "@workspace/db";
import { coursesTable, subjectsTable } from "@workspace/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/courses", requireAuth, async (req, res) => {
  try {
    const { subjectId, grade, search } = req.query;
    let query = db.select().from(coursesTable);
    const conditions = [];
    if (subjectId) conditions.push(eq(coursesTable.subjectId, parseInt(subjectId as string, 10)));
    if (grade) conditions.push(eq(coursesTable.grade, grade as string));
    if (search) conditions.push(or(
      ilike(coursesTable.title, `%${search}%`),
      ilike(coursesTable.provider, `%${search}%`),
    )!);
    const courses = await (conditions.length > 0
      ? db.select().from(coursesTable).where(conditions.length === 1 ? conditions[0] : conditions.reduce((a, b) => a as any))
      : db.select().from(coursesTable));
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.get("/courses/:id", requireAuth, async (req, res) => {
  try {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, parseInt(req.params.id, 10)));
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

export default router;
