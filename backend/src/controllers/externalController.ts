import { Request, Response } from 'express';
import { FrankfurterService } from '../services/external/FrankfurterService';
import { BarcodeEnrichmentService } from '../services/external/BarcodeEnrichmentService';
import { ApiHealthService } from '../services/external/ApiHealthService';
import { seedDemoData } from '../services/demo/DemoSeedService';

export class ExternalController {
  /**
   * Currency Conversion endpoint
   * POST /api/currency/convert
   * Body: { amount: number, from: string, to: string }
   */
  static async convertCurrency(req: Request, res: Response) {
    try {
      const { amount, from = 'USD', to = 'INR' } = req.body;
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < 0) {
        return res.status(400).json({ success: false, message: 'Valid positive amount is required' });
      }

      const result = await FrankfurterService.convert(numAmount, from, to);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Barcode Lookup endpoint
   * GET /api/products/lookup-barcode/:barcode
   */
  static async lookupBarcode(req: Request, res: Response) {
    try {
      const barcodeParam = req.params.barcode;
      const barcode = Array.isArray(barcodeParam) ? barcodeParam[0] : barcodeParam;
      const preferFood = req.query.food === 'true';

      const result = await BarcodeEnrichmentService.lookupBarcode(barcode, preferFood);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Provider Health endpoint
   * GET /api/integrations/health
   */
  static async getIntegrationsHealth(req: Request, res: Response) {
    try {
      const health = await ApiHealthService.getAllProviderHealth();
      return res.json({ success: true, data: health });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Provider Test endpoint
   * POST /api/integrations/test/:providerId
   */
  static async testProvider(req: Request, res: Response) {
    try {
      const providerIdParam = req.params.providerId;
      const providerId = Array.isArray(providerIdParam) ? providerIdParam[0] : providerIdParam;
      const result = await ApiHealthService.testProvider(providerId);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Demo Seed endpoint
   * POST /api/demo/seed
   */
  static async seedDemo(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const orgId = (req as any).user?.organizationId;
      const result = await seedDemoData(orgId, userId);
      return res.json({ success: true, message: 'Demo organization data successfully seeded', data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
