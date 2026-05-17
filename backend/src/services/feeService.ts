import { FeeBreakdown } from '../types';

// Beatix platform fee: 5% of ticket price, minimum SLL 5,000
const PLATFORM_FEE_PERCENT = 0.05;
const MINIMUM_FEE = 5000;

/**
 * Calculate the full fee breakdown for a ticket purchase.
 * @param basePrice  The face-value price of the ticket in the given currency
 * @param currency   Currency code (default 'SLL')
 */
export function calculateFees(basePrice: number, currency = 'SLL'): FeeBreakdown {
  const rawFee = basePrice * PLATFORM_FEE_PERCENT;
  const platformFee = Math.max(rawFee, MINIMUM_FEE);
  const total = basePrice + platformFee;

  return {
    basePrice,
    platformFee: Math.round(platformFee),
    total: Math.round(total),
    currency,
  };
}

/**
 * Return only the total amount the buyer will be charged.
 */
export function getTotalCharge(basePrice: number, currency = 'SLL'): number {
  return calculateFees(basePrice, currency).total;
}

/**
 * Calculate organizer payout (after platform fee deduction).
 */
export function getOrganizerPayout(basePrice: number, currency = 'SLL'): number {
  const { platformFee } = calculateFees(basePrice, currency);
  return Math.round(basePrice - platformFee);
}
