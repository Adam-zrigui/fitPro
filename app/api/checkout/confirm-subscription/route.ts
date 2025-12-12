import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { debug, info, warn, error as logError } from '@/lib/logger'
import Stripe from 'stripe'

/**
 * Confirm subscription after checkout.
 * Called from checkout success page to verify and persist subscription to DB.
 * This handles the case where webhooks aren't configured (local dev, etc.)
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    })

    // Retrieve the checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'line_items.data.price'],
    })

    debug('📋 Confirming subscription from checkout session:', sessionId)
    debug('📦 Subscription ID:', checkoutSession.subscription)

    // If a subscription was created, mark user as subscribed
    if (checkoutSession.subscription) {
      const subscriptionId = typeof checkoutSession.subscription === 'string' 
        ? checkoutSession.subscription 
        : checkoutSession.subscription.id

      // Retrieve full subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price'],
      })

      const priceId = subscription.items?.data?.[0]?.price?.id
      const status = subscription.status // e.g., 'active', 'trialing', 'past_due'
      const startDate = subscription.created ? new Date(subscription.created * 1000) : new Date()
      const endDate = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null

      // Update user with subscription info
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          subscriptionId,
          subscriptionPriceId: priceId,
          subscriptionStatus: status,
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate,
        },
      })

      debug('✅ Subscription confirmed for user:', session.user.id)
      debug('💾 Updated user:', updatedUser)

      return NextResponse.json({
        success: true,
        message: 'Subscription confirmed',
        subscriptionId,
        status,
      })
    }

    return NextResponse.json({
      success: false,
      message: 'No subscription found in checkout session',
    }, { status: 400 })
  } catch (err: unknown) {
    const em = err instanceof Error ? err.message : String(err)
    logError('❌ Error confirming subscription:', em)
    return NextResponse.json(
      { error: em || 'Failed to confirm subscription' },
      { status: 500 }
    )
  }
}
