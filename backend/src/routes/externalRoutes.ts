import express from 'express';
import { ExternalController } from '../controllers/externalController';
import { protect } from '../middlewares/auth';

const router = express.Router();

// Currency Conversion & Live FX (Frankfurter API)
router.post('/currency/convert', ExternalController.convertCurrency);

// Barcode Lookup & Product Registry Enrichment (Open Products Facts / Open Food Facts)
router.get('/products/lookup-barcode/:barcode', ExternalController.lookupBarcode);

// Integrations Health & Diagnostics (Admin Monitoring)
router.get('/integrations/health', ExternalController.getIntegrationsHealth);
router.post('/integrations/test/:providerId', ExternalController.testProvider);

// Demo Organization Seeding
router.post('/demo/seed', protect, ExternalController.seedDemo);

export default router;
