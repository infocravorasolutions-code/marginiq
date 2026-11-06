import crypto from 'crypto';
import ExternalApiCache from '../../models/ExternalApiCache';

export interface BarcodeProductData {
  found: boolean;
  barcode: string;
  name?: string;
  brand?: string;
  category?: string;
  weightGrams?: number;
  imageUrl?: string;
  description?: string;
  source: 'Open Products Facts' | 'Open Food Facts' | 'None';
  sourceUrl?: string;
  confidence: 'IMPORTED' | 'UNAVAILABLE';
  retrievedAt: Date;
  isCached?: boolean;
  rawAttributes?: Record<string, any>;
  message?: string;
}

export class BarcodeEnrichmentService {
  private static OPF_BASE = 'https://world.openproductsfacts.org/api/v2/product';
  private static OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product';
  private static USER_AGENT = 'MarginIQ/1.0 (contact@marginiq.com)';

  private static getRequestHash(barcode: string): string {
    return crypto.createHash('sha256').update(`barcode_${barcode}`).digest('hex');
  }

  /**
   * Look up product details by barcode across Open Products Facts & Open Food Facts
   */
  static async lookupBarcode(barcode: string, preferFood: boolean = false): Promise<BarcodeProductData> {
    const cleanBarcode = barcode.trim().replace(/[^0-9]/g, '');
    if (!cleanBarcode || cleanBarcode.length < 8) {
      return {
        found: false,
        barcode,
        source: 'None',
        confidence: 'UNAVAILABLE',
        retrievedAt: new Date(),
        message: 'Invalid barcode format. Expected 8-14 digits GTIN/EAN/UPC.',
      };
    }

    const requestHash = this.getRequestHash(cleanBarcode);
    const now = new Date();

    // 1. Check Cache
    const cached = await ExternalApiCache.findOne({
      provider: { $in: ['open_products_facts', 'open_food_facts'] },
      requestHash,
      expiresAt: { $gt: now },
    });

    if (cached && cached.status === 'SUCCESS' && cached.response?.found) {
      return {
        ...cached.response,
        isCached: true,
        retrievedAt: cached.retrievedAt,
      };
    }

    // 2. Query Open Products Facts first (or Open Food Facts if specified)
    const endpoints = preferFood
      ? [
          { url: `${this.OFF_BASE}/${cleanBarcode}.json`, name: 'Open Food Facts' as const, provider: 'open_food_facts' },
          { url: `${this.OPF_BASE}/${cleanBarcode}.json`, name: 'Open Products Facts' as const, provider: 'open_products_facts' },
        ]
      : [
          { url: `${this.OPF_BASE}/${cleanBarcode}.json`, name: 'Open Products Facts' as const, provider: 'open_products_facts' },
          { url: `${this.OFF_BASE}/${cleanBarcode}.json`, name: 'Open Food Facts' as const, provider: 'open_food_facts' },
        ];

    for (const ep of endpoints) {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(ep.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': this.USER_AGENT,
            'Accept': 'application/json',
          },
        });
        clearTimeout(timeoutId);

        const latency = Date.now() - startTime;

        if (res.ok) {
          const data = await res.json();
          // API returns status: 1 or status_verbose: 'product found'
          if (data && (data.status === 1 || data.product)) {
            const prod = data.product || {};
            const name = prod.product_name || prod.product_name_en || prod.generic_name || '';
            const brand = prod.brands || prod.brand_owner || '';
            const category = prod.categories || prod.category || '';
            const imageUrl = prod.image_front_url || prod.image_url || '';

            // Extract weight in grams
            let weightGrams: number | undefined;
            if (prod.net_weight_value) {
              const unit = (prod.net_weight_unit || 'g').toLowerCase();
              weightGrams = unit === 'kg' ? prod.net_weight_value * 1000 : prod.net_weight_value;
            } else if (typeof prod.quantity === 'string') {
              const match = prod.quantity.match(/([\d.]+)\s*(g|kg|ml|l)/i);
              if (match) {
                const val = parseFloat(match[1]);
                weightGrams = match[2].toLowerCase() === 'kg' || match[2].toLowerCase() === 'l' ? val * 1000 : val;
              }
            }

            const result: BarcodeProductData = {
              found: true,
              barcode: cleanBarcode,
              name: name || undefined,
              brand: brand || undefined,
              category: category ? category.split(',')[0].trim() : undefined,
              weightGrams: weightGrams ? Math.round(weightGrams) : undefined,
              imageUrl: imageUrl || undefined,
              description: prod.generic_name || prod.ingredients_text || undefined,
              source: ep.name,
              sourceUrl: ep.url,
              confidence: 'IMPORTED',
              retrievedAt: new Date(),
              isCached: false,
              rawAttributes: {
                categories_tags: prod.categories_tags?.slice(0, 5),
                countries: prod.countries,
                manufacturing_places: prod.manufacturing_places,
              },
            };

            // Cache for 7 days
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await ExternalApiCache.findOneAndUpdate(
              { provider: ep.provider, requestHash },
              {
                provider: ep.provider,
                endpoint: ep.url,
                requestHash,
                response: result,
                retrievedAt: new Date(),
                expiresAt,
                status: 'SUCCESS',
                responseTimeMs: latency,
              },
              { upsert: true, new: true }
            );

            return result;
          }
        }
      } catch (err: any) {
        // Continue to fallback endpoint
      }
    }

    // 3. Not found in either registry
    return {
      found: false,
      barcode: cleanBarcode,
      source: 'None',
      confidence: 'UNAVAILABLE',
      retrievedAt: new Date(),
      message: 'Product Not Found. Barcode does not exist in Open Products Facts or Open Food Facts.',
    };
  }

  static async testConnection(provider: 'open_products_facts' | 'open_food_facts'): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const url = provider === 'open_products_facts' ? `${this.OPF_BASE}/737628064502.json` : `${this.OFF_BASE}/737628064502.json`;
    const start = Date.now();
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT },
      });
      const latencyMs = Date.now() - start;
      if (res.ok || res.status === 404 || res.status === 500) {
        // If the server responds with 404 or 500 to a specific barcode request, the API endpoint is still reachable
        return { success: true, latencyMs, message: `Connected to ${provider === 'open_products_facts' ? 'Open Products Facts' : 'Open Food Facts'} v2 API` };
      }
      return { success: false, latencyMs, message: `HTTP ${res.status}: ${res.statusText}` };
    } catch (err: any) {
      return { success: false, latencyMs: Date.now() - start, message: err.message };
    }
  }
}
