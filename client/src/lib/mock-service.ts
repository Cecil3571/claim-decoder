import { useState, useEffect } from "react";

export interface PolicyData {
  policy_type: string;
  forms_detected: string[];
  limits: {
    dwelling: string;
    other_structures: string;
    personal_property: string;
    loss_of_use_ALE: string;
    liability: string;
    medical_payments: string;
  };
  deductibles: {
    all_peril: string;
    hurricane_wind: string;
    hail: string;
    special: string;
  };
  key_endorsements: string[];
  key_exclusions: string[];
  notes: string;
}

export interface CoverageAnalysis {
  coverage_summary: string;
  covered_aspects: string[];
  excluded_aspects: string[];
  ambiguous_points: string[];
  questions_for_human: string[];
}

export interface UnderpaymentRisk {
  missing_categories: string[];
  suspicious_deductions: string[];
  scope_concerns: string[];
  summary: string;
}

// Mock Data
const MOCK_POLICY_DATA: PolicyData = {
  policy_type: "HO-3 Special Form",
  forms_detected: ["HO 00 03 05 11", "OL 04 20", "HO 04 90"],
  limits: {
    dwelling: "$450,000",
    other_structures: "$45,000",
    personal_property: "$225,000",
    loss_of_use_ALE: "$90,000",
    liability: "$300,000",
    medical_payments: "$5,000",
  },
  deductibles: {
    all_peril: "$1,000",
    hurricane_wind: "2% ($9,000)",
    hail: "1% ($4,500)",
    special: "N/A",
  },
  key_endorsements: [
    "Ordinance or Law (10%)",
    "Water Back-Up ($5,000)",
    "Roof Replacement Cost Schedule",
  ],
  key_exclusions: [
    "Wear and tear, marring, deterioration",
    "Earth movement / Sinkhole",
    "Neglect / Failure to protect",
    "Intentional Loss",
  ],
  notes: "Policy appears to have a cosmetic damage exclusion for metal roof surfaces.",
};

const MOCK_COVERAGE_ANALYSIS: CoverageAnalysis = {
  coverage_summary: "The policy provides open-peril coverage for the dwelling, meaning accidental direct physical loss is covered unless excluded. Given the loss description of wind damage to the roof, this is generally a covered peril. However, the 'Roof Replacement Cost Schedule' endorsement may limit recovery to Actual Cash Value (ACV) rather than Replacement Cost if the roof is older.",
  covered_aspects: [
    "Windstorm damage to the dwelling roof (Coverage A)",
    "Interior water damage resulting from the storm-created opening",
    "Debris removal (up to 5% of Coverage A)",
  ],
  excluded_aspects: [
    "Pre-existing wear and tear or deterioration",
    "Mold damage if not reported immediately (limited coverage)",
  ],
  ambiguous_points: [
    "Roof payment basis: The schedule endorsement needs to be cross-referenced with the roof's age.",
    "Matching: State statutes may require matching of undamaged shingles, but policy language is silent.",
  ],
  questions_for_human: [
    "What is the age of the roof? (Critical for ACV vs RCV)",
    "Was there an opening in the roof created by the wind before water entered?",
    "Confirm the exact date of loss to verify it falls within the policy period.",
  ],
};

const MOCK_UNDERPAYMENT_RISK: UnderpaymentRisk = {
  missing_categories: [
    "No Ordinance & Law coverage included for code upgrades (e.g., decking renailing)",
    "General Contractor Overhead & Profit (O&P) omitted despite 3+ trades involved",
    "Debris removal appears underestimated for the volume of roofing material",
  ],
  suspicious_deductions: [
    "Excessive depreciation applied to non-material items (labor, tax, debris removal)",
    "Deductible applied twice (once for wind, once for water - incorrect)",
  ],
  scope_concerns: [
    "Estimate allows for 'shingle repair' but slope/brittleness may require full replacement",
    "Drip edge and starter strip missing from replacement scope",
  ],
  summary: "The carrier's estimate appears to be a 'repair-only' scope that ignores the impossibility of repair due to brittle shingles. Additionally, O&P is missing, and depreciation is applied aggressively.",
};

export async function analyzePolicy(file: File, state: string, type: string, description: string): Promise<{ policy: PolicyData; analysis: CoverageAnalysis }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2500));
  
  // In a real app, we'd upload 'file' to PDF Kitchen here
  console.log("Analyzing:", { fileName: file.name, state, type, description });
  
  return {
    policy: MOCK_POLICY_DATA,
    analysis: MOCK_COVERAGE_ANALYSIS,
  };
}

export async function analyzeUnderpayment(policy: PolicyData, description: string, estimateText: string): Promise<UnderpaymentRisk> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  console.log("Checking underpayment for:", estimateText.substring(0, 20) + "...");
  
  return MOCK_UNDERPAYMENT_RISK;
}
