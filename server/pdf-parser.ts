const PDF_KITCHEN_URL = process.env.PDF_KITCHEN_URL || "https://pdf-kitchen.replit.app";

export async function extractTextViaPdfKitchen(file: Buffer, filename: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", new Blob([file], { type: "application/pdf" }), filename);

  const response = await fetch(`${PDF_KITCHEN_URL}/extract`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`PDF Kitchen error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as any;
  
  if (!data.text) {
    throw new Error("PDF Kitchen returned no text");
  }

  return data.text;
}
