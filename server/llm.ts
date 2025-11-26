import { z } from "zod";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface LLMRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  response_format?: { type: "json_object" };
}

export async function callLLM(request: LLMRequest): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      ...request,
      model: request.model || "gpt-4o-mini",
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as any;
  return data.choices[0].message.content;
}

// Policy Structuring Prompt
export async function structurePolicy(rawText: string): Promise<any> {
  const prompt = `You are an expert insurance policy analyst. Extract and structure the following insurance policy text into a JSON object with this exact format:

{
  "policy_type": "string (e.g., HO-3)",
  "forms_detected": ["list of form numbers"],
  "limits": {
    "dwelling": "string",
    "other_structures": "string",
    "personal_property": "string",
    "loss_of_use_ALE": "string",
    "liability": "string",
    "medical_payments": "string"
  },
  "deductibles": {
    "all_peril": "string",
    "hurricane_wind": "string",
    "hail": "string",
    "special": "string"
  },
  "key_endorsements": ["list of endorsements"],
  "key_exclusions": ["list of exclusions"],
  "notes": "any helpful comments"
}

Policy text:
${rawText}

Return ONLY valid JSON, no markdown or extra text.`;

  const response = await callLLM({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response);
}

// Coverage Analysis Prompt
export async function analyzeCoverage(
  policyData: any,
  lossDescription: string,
  jurisdiction: string
): Promise<any> {
  const prompt = `You are an expert insurance claims analyst. Based on the following structured policy and loss description, provide coverage analysis.

POLICY DATA:
${JSON.stringify(policyData, null, 2)}

LOSS DESCRIPTION:
${lossDescription}

JURISDICTION: ${jurisdiction}

Provide a detailed coverage analysis in this JSON format:
{
  "coverage_summary": "High-level narrative analysis",
  "covered_aspects": ["list of likely covered items"],
  "excluded_aspects": ["list of excluded or limited items"],
  "ambiguous_points": ["items needing verification"],
  "questions_for_human": ["key questions for the adjuster"]
}

Return ONLY valid JSON, no markdown or extra text.`;

  const response = await callLLM({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response);
}

// Underpayment Risk Analysis Prompt
export async function analyzeUnderpayment(
  policyData: any,
  lossDescription: string,
  carrierEstimate: string
): Promise<any> {
  const prompt = `You are an expert insurance adjuster reviewing a claim. Analyze the carrier's estimate against the policy for underpayment risks.

POLICY DATA:
${JSON.stringify(policyData, null, 2)}

LOSS DESCRIPTION:
${lossDescription}

CARRIER ESTIMATE:
${carrierEstimate}

Identify potential underpayment risks in this JSON format:
{
  "missing_categories": ["line items or coverages that appear to be missing"],
  "suspicious_deductions": ["questionable depreciation or deductions"],
  "scope_concerns": ["scope of work issues or quality concerns"],
  "summary": "brief overall assessment"
}

Return ONLY valid JSON, no markdown or extra text.`;

  const response = await callLLM({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response);
}
