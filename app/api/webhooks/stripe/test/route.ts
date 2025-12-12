import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { debug, info, warn, error as logError } from '@/lib/logger'

/**
 * TEST ENDPOINT: Simulate a Stripe webhook for testing
 * POST with userId and subscriptionId to test without real Stripe CLI
 */
export async function POST(req: Request) {
  try {
    const { userId, subscriptionId } = await req.json()

    if (!userId || !subscriptionId) {
      return NextResponse.json(
        { error: 'userId and subscriptionId required' },
        { status: 400 }
      )
    }

    debug('🧪 TEST: Simulating webhook for user', userId)

    // Update user with subscription info
    const result = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionId,
        subscriptionPriceId: 'price_test_123',
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    })

    debug('✅ TEST: User updated with subscription:', result)

    return NextResponse.json({
      success: true,
      message: 'Test webhook processed',
      user: result,
    })
  } catch (err: unknown) {
    const em = err instanceof Error ? err.message : String(err)
    logError('❌ TEST: Error:', em)
    return NextResponse.json({ error: em }, { status: 500 })
  }
}
