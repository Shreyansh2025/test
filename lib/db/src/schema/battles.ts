import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";
import { subjectsTable } from "./subjects";
import { z } from "zod/v4";

export const battlesTable = pgTable("battles", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  subjectId: integer("subject_id").notNull().references(() => subjectsTable.id),
  hostId: integer("host_id").notNull().references(() => usersTable.id),
  status: text("status").notNull().default("waiting"),
  maxParticipants: integer("max_participants").notNull().default(2),
  questionCount: integer("question_count").notNull().default(10),
  timePerQuestion: integer("time_per_question").notNull().default(30),
  questionIds: integer("question_ids").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const battleParticipantsTable = pgTable("battle_participants", {
  id: serial("id").primaryKey(),
  battleId: integer("battle_id").notNull().references(() => battlesTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  score: integer("score").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  isReady: boolean("is_ready").notNull().default(false),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBattleSchema = createInsertSchema(battlesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBattleParticipantSchema = createInsertSchema(battleParticipantsTable).omit({ id: true, joinedAt: true });

export type InsertBattle = z.infer<typeof insertBattleSchema>;
export type Battle = typeof battlesTable.$inferSelect;
export type BattleParticipant = typeof battleParticipantsTable.$inferSelect;
