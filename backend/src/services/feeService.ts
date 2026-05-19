import { query } from '../db/client';
import { FeeBreakdown, FeeSettingRow } from '../types/index';

/** Pull current fee settings from DB, fall back to safe defaults. */
async function getSettings(): Promise<{ feePercent: number; minFee: number; currency: string }> {
  const result = await query<FeeSettingRow>('SELECT * FROM fee_settings ORDER BY id ASC LIMIT 1');
  const row = result.rows[0];
  return {
    feePercent: row ? parseFloat(row.fee_percent) : 5,
    minFee: row ? parseFloat(row.min_fee) : 5000,
    currency: row?.currency ?? 'SLL',
  };
}

/** Calculate fees for a given base price. */
export async function calculateFees(basePrice: number, currency?: string): Promise<FeeBreakdown> {
  const settings = await getSettings();
  const raw = basePrice * (settings.feePercent / 100);
  const platformFee = Math.max(raw, settings.minFee);
  return {
    basePrice,
    platformFee: Math.round(platformFee),
    total: Math.round(basePrice + platformFee),
    currency: currency ?? settings.currency,
  };
}

/** Synchronous version with explicit fee params — for when you already have settings. */
export function calculateFeesSync(
  basePrice: number,
  feePercent: number,
  minFee: number,
  currency = 'SLL'
): FeeBreakdown {
  const raw = basePrice * (feePercent / 100);
  const platformFee = Math.max(raw, minFee);
  return {
    basePrice,
    platformFee: Math.round(platformFee),
    total: Math.round(basePrice + platformFee),
    currency,
  };
}
