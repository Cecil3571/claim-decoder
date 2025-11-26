import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Policy Analysis table - stores the structured policy data extracted via LLM
export const policyAnalyses = pgTable("policy_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  state: text("state").notNull(),
  policyType: text("policy_type").notNull(),
  lossDescription: text("loss_description").notNull(),
  
  // Structured policy data (from LLM)
  policyData: json("policy_data").notNull(),
  
  // Coverage analysis (from LLM)
  coverageAnalysis: json("coverage_analysis").notNull(),
  
  // Optional underpayment analysis (if user provides estimate)
  underpaymentRisk: json("underpayment_risk"),
  
  // Original PDF text from PDF Kitchen
  rawPdfText: text("raw_pdf_text").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertPolicyAnalysisSchema = createInsertSchema(policyAnalyses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPolicyAnalysis = z.infer<typeof insertPolicyAnalysisSchema>;
export type PolicyAnalysis = typeof policyAnalyses.$inferSelect;

// Legacy user schema (if needed for auth later)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
