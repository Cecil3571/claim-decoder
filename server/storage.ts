import { db } from "./db";
import { policyAnalyses } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { PolicyAnalysis, InsertPolicyAnalysis } from "@shared/schema";

export interface IStorage {
  // Policy Analysis CRUD
  createPolicyAnalysis(analysis: InsertPolicyAnalysis): Promise<PolicyAnalysis>;
  getPolicyAnalysisById(id: string): Promise<PolicyAnalysis | undefined>;
  getAllPolicyAnalyses(): Promise<PolicyAnalysis[]>;
  updatePolicyAnalysisUnderpayment(id: string, underpaymentRisk: any): Promise<PolicyAnalysis>;
}

export class DatabaseStorage implements IStorage {
  async createPolicyAnalysis(analysis: InsertPolicyAnalysis): Promise<PolicyAnalysis> {
    const result = await db
      .insert(policyAnalyses)
      .values(analysis)
      .returning();
    return result[0];
  }

  async getPolicyAnalysisById(id: string): Promise<PolicyAnalysis | undefined> {
    const result = await db
      .select()
      .from(policyAnalyses)
      .where(eq(policyAnalyses.id, id))
      .limit(1);
    return result[0];
  }

  async getAllPolicyAnalyses(): Promise<PolicyAnalysis[]> {
    return await db
      .select()
      .from(policyAnalyses)
      .orderBy(policyAnalyses.createdAt);
  }

  async updatePolicyAnalysisUnderpayment(id: string, underpaymentRisk: any): Promise<PolicyAnalysis> {
    const result = await db
      .update(policyAnalyses)
      .set({ underpaymentRisk, updatedAt: new Date() })
      .where(eq(policyAnalyses.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
