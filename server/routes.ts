import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { extractTextViaPdfKitchen } from "./pdf-parser";
import { structurePolicy, analyzeCoverage, analyzeUnderpayment } from "./llm";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // POST /api/analyze - Main endpoint to upload policy and get analysis
  app.post("/api/analyze", upload.single("file"), async (req, res, next) => {
    try {
      const { state, policyType, lossDescription } = req.body;
      const file = req.file;

      // Validate inputs
      if (!file || !state || !policyType || !lossDescription) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Step 1: Extract text via PDF Kitchen
      const rawPdfText = await extractTextViaPdfKitchen(file.buffer, file.originalname);

      // Step 2: Structure policy via LLM
      const policyData = await structurePolicy(rawPdfText);

      // Step 3: Analyze coverage via LLM
      const coverageAnalysis = await analyzeCoverage(policyData, lossDescription, state);

      // Step 4: Save to database
      const analysis = await storage.createPolicyAnalysis({
        filename,
        state,
        policyType,
        lossDescription,
        policyData,
        coverageAnalysis,
        rawPdfText,
      });

      return res.json({
        id: analysis.id,
        policyData: analysis.policyData,
        coverageAnalysis: analysis.coverageAnalysis,
      });
    } catch (error) {
      console.error("Error in /api/analyze:", error);
      return res.status(500).json({ error: error instanceof Error ? error.message : "Analysis failed" });
    }
  });

  // POST /api/underpayment - Check underpayment risk for an analysis
  app.post("/api/underpayment", async (req, res, next) => {
    try {
      const { id, estimateText } = req.body;

      if (!id || !estimateText) {
        return res.status(400).json({ error: "Missing id or estimateText" });
      }

      // Get the existing analysis
      const analysis = await storage.getPolicyAnalysisById(id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      // Analyze underpayment
      const underpaymentRisk = await analyzeUnderpayment(
        analysis.policyData,
        analysis.lossDescription,
        estimateText
      );

      // Update the analysis with underpayment risk
      const updated = await storage.updatePolicyAnalysisUnderpayment(id, underpaymentRisk);

      return res.json({ underpaymentRisk: updated.underpaymentRisk });
    } catch (error) {
      console.error("Error in /api/underpayment:", error);
      return res.status(500).json({ error: error instanceof Error ? error.message : "Underpayment analysis failed" });
    }
  });

  // GET /api/analyses - Get all analyses (for history)
  app.get("/api/analyses", async (req, res, next) => {
    try {
      const analyses = await storage.getAllPolicyAnalyses();
      return res.json(analyses);
    } catch (error) {
      console.error("Error in /api/analyses:", error);
      return res.status(500).json({ error: "Failed to fetch analyses" });
    }
  });

  // GET /api/analyses/:id - Get a specific analysis
  app.get("/api/analyses/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getPolicyAnalysisById(id);
      
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      return res.json(analysis);
    } catch (error) {
      console.error("Error in /api/analyses/:id:", error);
      return res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
