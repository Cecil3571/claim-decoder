import { type PolicyData, type CoverageAnalysis, type UnderpaymentRisk } from "./mock-service";

export async function analyzePolicy(
  file: File,
  state: string,
  type: string,
  description: string
): Promise<{ id: string; policy: PolicyData; analysis: CoverageAnalysis }> {
  // Read file as base64 using browser FileReader API
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64String = result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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
