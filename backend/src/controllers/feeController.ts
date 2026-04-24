import { Response, NextFunction } from 'express'
import { query } from '../db/client'
import { AuthRequest } from '../middleware/auth'

// GET /api/admin/fees  — get current fee settings
export async function getFeeSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await query('SELECT * FROM fee_settings ORDER BY updated_at DESC LIMIT 1', [])
    res.json({ success: true, data: result.rows[0] })
  } catch (err) { next(err) }
}

// PATCH /api/admin/fees  — update global fee settings
export async function updateFeeSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { total_fee_percentage, organizer_share_percentage, buyer_share_percentage } = req.body

    // Validate shares add up to 100
    if (Number(organizer_share_percentage) + Number(buyer_share_percentage) !== 100) {
      res.status(400).json({ success: false, message: 'Organizer and buyer share percentages must add up to 100' })
      return
    }

    await query(
      `INSERT INTO fee_settings (total_fee_percentage, organizer_share_percentage, buyer_share_percentage, updated_by)
       VALUES ($1, $2, $3, $4)`,
      [total_fee_percentage, organizer_share_percentage, buyer_share_percentage, req.user!.userId]
    )

    res.json({
      success: true,
      message: `Fee updated: ${total_fee_percentage}% total — Organizer pays ${organizer_share_percentage}%, Buyer pays ${buyer_share_percentage}%`
    })
  } catch (err) { next(err) }
}

// PATCH /api/admin/organizers/:id/fee  — set custom partner fee for a specific organizer
export async function setOrganizerFee(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { fee_type, custom_fee_percentage } = req.body

    if (fee_type === 'partner' && !custom_fee_percentage) {
      res.status(400).json({ success: false, message: 'Custom fee percentage required for partner organizers' })
      return
    }

    await query(
      `UPDATE organizers SET fee_type=$1, custom_fee_percentage=$2 WHERE id=$3`,
      [fee_type, fee_type === 'partner' ? custom_fee_percentage : null, req.params.id]
    )

    res.json({
      success: true,
      message: fee_type === 'partner'
        ? `Partner rate of ${custom_fee_percentage}% set for this organizer`
        : 'Organizer reset to standard global fee rate'
    })
  } catch (err) { next(err) }
}

// Helper: calculate fee breakdown for a transaction
export async function calculateFee(subtotal: number, organizerId: string): Promise<{
  feeRate: number
  serviceFee: number
  organizerFeeShare: number
  buyerFeeShare: number
  organizerReceives: number
  buyerPays: number
}> {
  // Get organizer fee type
  const orgRes = await query('SELECT fee_type, custom_fee_percentage FROM organizers WHERE id=$1', [organizerId])
  const org = orgRes.rows[0]

  let feeRate: number

  if (org?.fee_type === 'partner' && org?.custom_fee_percentage) {
    feeRate = Number(org.custom_fee_percentage) / 100
  } else {
    // Use global admin-set rate
    const feeRes = await query('SELECT * FROM fee_settings ORDER BY updated_at DESC LIMIT 1', [])
    const settings = feeRes.rows[0]
    feeRate = Number(settings.total_fee_percentage) / 100
  }

  // Get split percentages from global settings
  const feeRes = await query('SELECT * FROM fee_settings ORDER BY updated_at DESC LIMIT 1', [])
  const settings = feeRes.rows[0]
  const orgSharePct = Number(settings.organizer_share_percentage) / 100
  const buyerSharePct = Number(settings.buyer_share_percentage) / 100

  const totalFee = subtotal * feeRate
  const organizerFeeShare = totalFee * orgSharePct  // organizer contributes this (deducted from payout)
  const buyerFeeShare = totalFee * buyerSharePct     // buyer pays this on top

  return {
    feeRate,
    serviceFee: totalFee,
    organizerFeeShare,
    buyerFeeShare,
    organizerReceives: subtotal - organizerFeeShare,
    buyerPays: subtotal + buyerFeeShare,
  }
}
