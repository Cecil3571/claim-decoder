import FormData from "form-data";
import { Readable } from "stream";

const PDF_KITCHEN_URL = process.env.PDF_KITCHEN_URL || "https://pdf-kitchen.replit.app";

export async function extractTextViaPdfKitchen(file: Buffer, filename: string): Promise<string> {
  try {
    // Create FormData with the PDF file using form-data package for Node.js
    const formData = new FormData();
    formData.append("file", Readable.from(file), { filename });

    const response = await fetch(`${PDF_KITCHEN_URL}/extract`, {
      method: "POST",
      body: formData as any,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`PDF Kitchen error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    
    if (!data.text) {
      throw new Error("PDF Kitchen returned no text");
    }

    return data.text;
  } catch (error) {
    console.error("PDF Kitchen extraction error:", error);
    throw error;
  }
}
