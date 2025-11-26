import { type PolicyData, type CoverageAnalysis, type UnderpaymentRisk } from "./mock-service";

export async function analyzePolicy(
  file: File,
  state: string,
  type: string,
  description: string
): Promise<{ id: string; policy: PolicyData; analysis: CoverageAnalysis }> {
  // Read file as base64
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pdfBase64: base64,
      filename: file.name,
      state,
      policyType: type,
      lossDescription: description,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Analysis failed");
  }

  const data = await response.json();
  return {
    id: data.id,
    policy: data.policyData,
    analysis: data.coverageAnalysis,
  };
}

export async function analyzeUnderpayment(
  analysisId: string,
  estimateText: string
): Promise<UnderpaymentRisk> {
  const response = await fetch("/api/underpayment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: analysisId,
      estimateText,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Underpayment analysis failed");
  }

  const data = await response.json();
  return data.underpaymentRisk;
}
