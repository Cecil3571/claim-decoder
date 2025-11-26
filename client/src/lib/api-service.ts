import { type PolicyData, type CoverageAnalysis, type UnderpaymentRisk } from "./mock-service";

export async function analyzePolicy(
  file: File,
  state: string,
  type: string,
  description: string
): Promise<{ id: string; policy: PolicyData; analysis: CoverageAnalysis }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("state", state);
  formData.append("policyType", type);
  formData.append("lossDescription", description);

  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
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
