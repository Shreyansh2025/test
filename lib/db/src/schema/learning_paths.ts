import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { topicsTable } from "./subjects";
import { z } from "zod/v4";

export const subTopicsTable = pgTable("sub_topics", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull().references(() => topicsTable.id),
  name: text("name").notNull(),
  nameHi: text("name_hi"),
  order: integer("order").notNull().default(0),
  difficulty: text("difficulty").notNull().default("medium"),
  conceptExplanation: text("concept_explanation").notNull().default(""),
  conceptExplanationHi: text("concept_explanation_hi"),
  realWorldExample: text("real_world_example").notNull().default(""),
  realWorldExampleHi: text("real_world_example_hi"),
  keyFormulas: text("key_formulas").array().notNull().default([]),
  prerequisites: integer("prerequisites").array().notNull().default([]),
  estimatedMinutes: integer("estimated_minutes").notNull().default(15),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const confidenceScoresTable = pgTable("confidence_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  topicId: integer("topic_id").notNull().references(() => topicsTable.id),
  score: integer("score").notNull(),
  sessionCorrect: integer("session_correct").notNull().default(0),
  sessionTotal: integer("session_total").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubTopicSchema = createInsertSchema(subTopicsTable).omit({ id: true, createdAt: true });
export const insertConfidenceScoreSchema = createInsertSchema(confidenceScoresTable).omit({ id: true, createdAt: true });
export type InsertSubTopic = z.infer<typeof insertSubTopicSchema>;
export type InsertConfidenceScore = z.infer<typeof insertConfidenceScoreSchema>;
export type SubTopic = typeof subTopicsTable.$inferSelect;
export type ConfidenceScore = typeof confidenceScoresTable.$inferSelect;
