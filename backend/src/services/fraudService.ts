/**
 * BEATIX — Fraud Detection Service
 * Flags suspicious purchase patterns before a transaction is created.
 */

import { query } from '../config/database'

export interface FraudCheckResult {
  flagged: boolean
  reason?: string
  severity: 'none' | 'low' | 'medium' | 'high'
}

export async function checkForFraud(params: {
  buyerPhone: string
  eventId: string
  quantity: number
  unitPrice: number
}): Promise<FraudCheckResult> {
  const { buyerPhone, eventId, quantity, unitPrice } = params

  // ── Rule 1: Single transaction quantity limit ────────────────────────────
  if (quantity > 10) {
    return { flagged: true, severity: 'high', reason: 'Single transaction exceeds 10 tickets' }
  }

  // ── Rule 2: Same phone buying same event multiple times in 1 hour ────────
  const recentRes = await query<{ count: string; total_qty: string }>(`
    SELECT COUNT(*) AS count, COALESCE(SUM(quantity), 0) AS total_qty
    FROM transactions
    WHERE buyer_phone = $1
      AND event_id    = $2
      AND status IN ('pending', 'success')
      AND created_at  > NOW() - INTERVAL '1 hour'
  `, [buyerPhone, eventId])

  const recentCount  = Number(recentRes.rows[0]?.count  || 0)
  const recentQtySum = Number(recentRes.rows[0]?.total_qty || 0)

  if (recentCount >= 3) {
    return {
      flagged:  true,
      severity: 'high',
      reason:   `Phone ${buyerPhone} made ${recentCount} purchase attempts for this event in the last hour`,
    }
  }

  if (recentQtySum + quantity > 20) {
    return {
      flagged:  true,
      severity: 'medium',
      reason:   `Total tickets purchased by ${buyerPhone} for this event would exceed 20`,
    }
  }

  // ── Rule 3: High-value transaction ──────────────────────────────────────
  const transactionValue = quantity * unitPrice
  if (transactionValue > 5000) {
    return {
      flagged:  true,
      severity: 'low',
      reason:   `High-value transaction: NLe ${transactionValue} — review recommended`,
    }
  }

  // ── Rule 4: Rapid sequential purchases across all events (velocity check) ─
  const velocityRes = await query<{ count: string }>(`
    SELECT COUNT(*) AS count
    FROM transactions
    WHERE buyer_phone = $1
      AND created_at  > NOW() - INTERVAL '10 minutes'
  `, [buyerPhone])

  if (Number(velocityRes.rows[0]?.count || 0) >= 5) {
    return {
      flagged:  true,
      severity: 'medium',
      reason:   `High purchase velocity: 5+ transactions in 10 minutes from ${buyerPhone}`,
    }
  }

  return { flagged: false, severity: 'none' }
}

/** Persist a fraud flag to the database */
export async function recordFraudFlag(params: {
  transactionId: string
  reason: string
  severity: string
}): Promise<void> {
  await query(
    `INSERT INTO fraud_flags (transaction_id, reason, auto_flagged)
     VALUES ($1, $2, TRUE)`,
    [params.transactionId, `[${params.severity.toUpperCase()}] ${params.reason}`]
  )
}
