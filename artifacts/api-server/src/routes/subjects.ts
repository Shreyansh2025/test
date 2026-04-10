import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, subjectsTable, topicsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/subjects", async (_req, res): Promise<void> => {
  const subjects = await db.select().from(subjectsTable).orderBy(subjectsTable.order);
  res.json(subjects);
});

router.get("/subjects/:id/topics", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const topics = await db.select().from(topicsTable)
    .where(eq(topicsTable.subjectId, id))
    .orderBy(topicsTable.order);
  res.json(topics);
});

export default router;
