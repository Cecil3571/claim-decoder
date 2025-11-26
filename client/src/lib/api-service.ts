import { type PolicyData, type CoverageAnalysis, type UnderpaymentRisk } from "./mock-service";

export async function analyzePolicy(
  file: File,
  state: string,
  type: string,
  description: string
): Promise<{ id: string; policy: PolicyData; analysis: CoverageAnalysis }> {
  try {
    // Read file as base64 using browser FileReader API
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64String = result.split(",")[1];
        if (!base64String) {
          reject(new Error("Failed to read file"));
          return;
        }
        resolve(base64String);
      };
      reader.onerror = () => reject(new Error("File read error"));
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
      const contentType = response.headers.get("content-type");
      let errorMessage = "Analysis failed";
      
      if (contentType?.includes("application/json")) {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } else {
        errorMessage = `Server error: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      id: data.id,
      policy: data.policyData,
      analysis: data.coverageAnalysis,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(message);
  }
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
