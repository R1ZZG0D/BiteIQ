import express from "express";
import multer from "multer";
import { z } from "zod";
import { analyzeScan } from "../services/scanPipeline.js";
import { calculateDailySummary } from "../services/nutrition.js";
import { extractTextFromImage } from "../services/ocr.js";
import { fetchProductByBarcode } from "../services/openFoodFacts.js";
import { getIngredientKnowledgeBase } from "../services/parser.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

const preferenceSchema = z.enum(["Vegan", "Vegetarian", "Eggetarian", "Non-Vegetarian"]);

const profileSchema = z.object({
  preference: preferenceSchema,
  sugar_goal_g: z.coerce.number().min(0).max(500),
  protein_goal_g: z.coerce.number().min(0).max(500)
});

const scanTextSchema = z.object({
  productName: z.string().trim().min(1).max(120).optional(),
  rawText: z.string().trim().min(3),
  sugarGrams: z.coerce.number().min(0).max(500).optional(),
  proteinGrams: z.coerce.number().min(0).max(500).optional()
});

const barcodeSchema = z.object({
  barcode: z.string().trim().min(6).max(32)
});

const manualNutritionSchema = z.object({
  productName: z.string().trim().min(1).max(120),
  sugarGrams: z.coerce.number().min(0).max(500),
  proteinGrams: z.coerce.number().min(0).max(500)
});

export function createApiRouter(repository) {
  const router = express.Router();

  router.get("/health", (_req, res) => {
    res.json({ ok: true, service: "food-intelligence-backend" });
  });

  router.get("/ingredients", (_req, res) => {
    res.json({ ingredients: getIngredientKnowledgeBase() });
  });

  router.get("/profile", async (_req, res, next) => {
    try {
      res.json(await repository.getProfile());
    } catch (error) {
      next(error);
    }
  });

  router.put("/profile", async (req, res, next) => {
    try {
      const body = profileSchema.parse(req.body);
      res.json(await repository.updateProfile(body));
    } catch (error) {
      next(error);
    }
  });

  router.get("/summary", async (req, res, next) => {
    try {
      const [profile, scans] = await Promise.all([
        repository.getProfile(),
        repository.listScans()
      ]);
      res.json(calculateDailySummary({ profile, scans, date: req.query.date ?? new Date() }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/history", async (_req, res, next) => {
    try {
      res.json({ scans: await repository.listScans() });
    } catch (error) {
      next(error);
    }
  });

  router.get("/history/:id", async (req, res, next) => {
    try {
      const scan = await repository.getScan(req.params.id);
      if (!scan) {
        res.status(404).json({ error: "Scan not found." });
        return;
      }
      res.json(scan);
    } catch (error) {
      next(error);
    }
  });

  router.post("/scan/text", async (req, res, next) => {
    try {
      const body = scanTextSchema.parse(req.body);
      const saved = await saveAnalyzedScan(repository, {
        rawText: body.rawText,
        productName: body.productName,
        nutritionInput: {
          sugarGrams: body.sugarGrams,
          proteinGrams: body.proteinGrams
        }
      });
      res.status(201).json(saved);
    } catch (error) {
      next(error);
    }
  });

  router.post("/scan/image", upload.single("labelImage"), async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "labelImage file is required." });
        return;
      }

      const rawText = await extractTextFromImage(req.file.buffer, req.file.mimetype);
      const saved = await saveAnalyzedScan(repository, {
        rawText,
        productName: req.body.productName,
        nutritionInput: {
          sugarGrams: req.body.sugarGrams,
          proteinGrams: req.body.proteinGrams
        }
      });
      res.status(201).json(saved);
    } catch (error) {
      next(error);
    }
  });

  router.post("/scan/barcode", async (req, res, next) => {
    try {
      const { barcode } = barcodeSchema.parse(req.body);
      const product = await fetchProductByBarcode(barcode);
      const saved = await saveAnalyzedScan(repository, product);
      res.status(201).json({ ...saved, barcode: product.barcode });
    } catch (error) {
      next(error);
    }
  });

  router.post("/track/manual", async (req, res, next) => {
    try {
      const body = manualNutritionSchema.parse(req.body);
      const saved = await saveAnalyzedScan(repository, {
        rawText: "Manual nutrition entry",
        productName: body.productName,
        nutritionInput: {
          sugarGrams: body.sugarGrams,
          proteinGrams: body.proteinGrams
        }
      });
      res.status(201).json(saved);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

async function saveAnalyzedScan(repository, scanInput) {
  const profile = await repository.getProfile();
  const analysis = analyzeScan({
    ...scanInput,
    userPreference: profile.preference
  });
  return repository.addScan({
    rawText: scanInput.rawText,
    ...analysis
  });
}
