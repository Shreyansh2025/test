import { pgTable, text, serial, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { subjectsTable } from "./subjects";
import { z } from "zod/v4";

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").references(() => subjectsTable.id),
  title: text("title").notNull(),
  provider: text("provider").notNull(),
  providerLogo: text("provider_logo"),
  url: text("url").notNull().default("#"),
  price: real("price").notNull().default(0),
  currency: text("currency").notNull().default("INR"),
  isFree: boolean("is_free").notNull().default(false),
  durationHours: integer("duration_hours").notNull().default(10),
  rating: real("rating").notNull().default(4.0),
  reviewCount: integer("review_count").notNull().default(0),
  syllabusTopics: text("syllabus_topics").array().notNull().default([]),
  level: text("level").notNull().default("Beginner"),
  language: text("language").notNull().default("English"),
  isAiRecommended: boolean("is_ai_recommended").notNull().default(false),
  grade: text("grade"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true, createdAt: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;
