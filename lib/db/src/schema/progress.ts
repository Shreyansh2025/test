import { pgTable, text, serial, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";
import { topicsTable } from "./subjects";
import { questionsTable } from "./questions";
import { z } from "zod/v4";

export const userAnswersTable = pgTable("user_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  questionId: integer("question_id").notNull().references(() => questionsTable.id),
  topicId: integer("topic_id").notNull().references(() => topicsTable.id),
  answer: text("answer").notNull(),
  isCorrect: integer("is_correct").notNull().default(0),
  timeTaken: integer("time_taken").notNull().default(0),
  xpEarned: integer("xp_earned").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userTopicStatsTable = pgTable("user_topic_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  topicId: integer("topic_id").notNull().references(() => topicsTable.id),
  answered: integer("answered").notNull().default(0),
  correct: integer("correct").notNull().default(0),
  accuracy: real("accuracy").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const activityLogTable = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  type: text("type").notNull(),
  description: text("description").notNull(),
  xpEarned: integer("xp_earned").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserAnswerSchema = createInsertSchema(userAnswersTable).omit({ id: true, createdAt: true });
export const insertTopicStatSchema = createInsertSchema(userTopicStatsTable).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activityLogTable).omit({ id: true, createdAt: true });

export type InsertUserAnswer = z.infer<typeof insertUserAnswerSchema>;
export type UserAnswer = typeof userAnswersTable.$inferSelect;
export type UserTopicStat = typeof userTopicStatsTable.$inferSelect;
export type ActivityLog = typeof activityLogTable.$inferSelect;
