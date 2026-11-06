import crypto from 'crypto';
import ExternalApiCache from '../../models/ExternalApiCache';

export interface CurrencyConversionResult {
  originalAmount: number;
  originalCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  convertedAmount: number;
  rateDate: string;
  rateProvider: string;
  source: string;
  retrievedAt: Date;
  confidence: 'VERIFIED' | 'HIGH' | 'ESTIMATED' | 'IMPORTED';
  isCached: boolean;
}

// Fallback rates as of recent benchmarks if network is completely unreachable
const FALLBACK_INR_RATES: Record<string, number> = {
  USD: 86.85,
  EUR: 92.40,
  GBP: 110.15,
  CNY: 11.95,
  AED: 23.65,
  INR: 1.0,
};

export class FrankfurterService {
  private static BASE_URL = 'https://api.frankfurter.dev/v1';

  private static getRequestHash(base: string, target: string): string {
    return crypto.createHash('sha256').update(`${base}_${target}`).digest('hex');
  }

  /**
   * Convert currency to INR (or target currency) with caching and snapshot-safe traceability
   */
  static async convert(
    amount: number,
    fromCurrency: string = 'USD',
    toCurrency: string = 'INR'
  ): Promise<CurrencyConversionResult> {
    const from = fromCurrency.toUpperCase().trim();
    const to = toCurrency.toUpperCase().trim();

    if (from === to) {
      return {
        originalAmount: amount,
        originalCurrency: from,
        targetCurrency: to,
        exchangeRate: 1.0,
        convertedAmount: amount,
        rateDate: new Date().toISOString().split('T')[0],
        rateProvider: 'Frankfurter API',
        source: 'https://api.frankfurter.dev',
        retrievedAt: new Date(),
        confidence: 'VERIFIED',
        isCached: false,
      };
    }

    const requestHash = this.getRequestHash(from, to);
    const now = new Date();

    // 1. Check Cache first
    const cached = await ExternalApiCache.findOne({
      provider: 'frankfurter',
      requestHash,
      expiresAt: { $gt: now },
    });

    if (cached && cached.response && cached.response.rate) {
      const rate = cached.response.rate;
      return {
        originalAmount: amount,
        originalCurrency: from,
        targetCurrency: to,
        exchangeRate: rate,
        convertedAmount: Math.round(amount * rate * 100) / 100,
        rateDate: cached.response.date || now.toISOString().split('T')[0],
        rateProvider: 'Frankfurter API (Cached)',
        source: 'https://api.frankfurter.dev',
        retrievedAt: cached.retrievedAt,
        confidence: 'HIGH',
        isCached: true,
      };
    }

    // 2. Fetch live rate with timeout
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = `${this.BASE_URL}/latest?base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'MarginIQ/1.0 (support@marginiq.com)' },
      });
      clearTimeout(timeoutId);

      const elapsed = Date.now() - startTime;

      if (!res.ok) {
        throw new Error(`Frankfurter API returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const rate = data.rates?.[to];

      if (!rate || typeof rate !== 'number') {
        throw new Error(`Target currency ${to} rate not found in response`);
      }

      // Store in Cache (valid for 24 hours)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await ExternalApiCache.findOneAndUpdate(
        { provider: 'frankfurter', requestHash },
        {
          provider: 'frankfurter',
          endpoint: url,
          requestHash,
          response: { rate, date: data.date, base: from, symbol: to },
          retrievedAt: new Date(),
          expiresAt,
          status: 'SUCCESS',
          responseTimeMs: elapsed,
        },
        { upsert: true, new: true }
      );

      return {
        originalAmount: amount,
        originalCurrency: from,
        targetCurrency: to,
        exchangeRate: rate,
        convertedAmount: Math.round(amount * rate * 100) / 100,
        rateDate: data.date,
        rateProvider: 'Frankfurter API',
        source: 'https://api.frankfurter.dev',
        retrievedAt: new Date(),
        confidence: 'VERIFIED',
        isCached: false,
      };
    } catch (err: any) {
      // 3. Fallback to fallback table or expired cache
      const expiredCache = await ExternalApiCache.findOne({
        provider: 'frankfurter',
        requestHash,
      });

      if (expiredCache?.response?.rate) {
        const rate = expiredCache.response.rate;
        return {
          originalAmount: amount,
          originalCurrency: from,
          targetCurrency: to,
          exchangeRate: rate,
          convertedAmount: Math.round(amount * rate * 100) / 100,
          rateDate: expiredCache.response.date || 'Historic',
          rateProvider: 'Frankfurter API (Offline Fallback)',
          source: 'https://api.frankfurter.dev',
          retrievedAt: expiredCache.retrievedAt,
          confidence: 'ESTIMATED',
          isCached: true,
        };
      }

      const fallbackRate = FALLBACK_INR_RATES[from] || 86.85;
      return {
        originalAmount: amount,
        originalCurrency: from,
        targetCurrency: to,
        exchangeRate: fallbackRate,
        convertedAmount: Math.round(amount * fallbackRate * 100) / 100,
        rateDate: new Date().toISOString().split('T')[0],
        rateProvider: 'Static Baseline (API Offline)',
        source: 'MarginIQ Currency Baseline',
        retrievedAt: new Date(),
        confidence: 'ESTIMATED',
        isCached: false,
      };
    }
  }

  static async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.BASE_URL}/latest?base=USD&symbols=INR`, {
        headers: { 'User-Agent': 'MarginIQ/1.0 (support@marginiq.com)' },
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return { success: true, latencyMs, message: 'Connected to Frankfurter API v1' };
      }
      return { success: false, latencyMs, message: `HTTP ${res.status}: ${res.statusText}` };
    } catch (err: any) {
      return { success: false, latencyMs: Date.now() - start, message: err.message };
    }
  }
}
