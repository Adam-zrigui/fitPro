import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { debug, info, warn, error as logError } from '@/lib/logger'
import { getDefaultSubscriptionPriceId } from '@/lib/subscription'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user?.email) {
      return NextResponse.json({ error: 'User email required for checkout' }, { status: 400 })
    }

    // Get the default subscription price ID
    let subscriptionPriceId: string
    try {
      subscriptionPriceId = await getDefaultSubscriptionPriceId()
    } catch (err: unknown) {
      const em = err instanceof Error ? err.message : String(err)
      logError('Failed to get subscription price ID:', em)
      return NextResponse.json(
        { error: 'Subscription pricing not available. Please contact support.' },
        { status: 500 }
      )
    }

    if (!subscriptionPriceId) {
      logError('No subscription price ID returned')
      return NextResponse.json(
        { error: 'Subscription pricing not available. Please contact support.' },
        { status: 500 }
      )
    }

    // Create checkout session for recurring subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: subscriptionPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      // attach the user id to the subscription so webhooks can map back to our user
      subscription_data: {
        metadata: {
          userId: session.user.id,
        },
      },
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/programs`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
      },
    })

    // Prefer returning the hosted `url` when available so clients can fallback
    // directly to the Checkout page if Stripe.js fails to load for any reason.
    return NextResponse.json({
      sessionId: checkoutSession.id,
      sessionUrl: (checkoutSession.url as string) || null,
    })
  } catch (err: unknown) {
    const em = err instanceof Error ? err.message : String(err)
    logError('Checkout error:', em)
    // If this was a Stripe error with extra props, try to surface them (non-breaking)
    const maybeAny = err as any
    if (maybeAny?.statusCode) logError('Stripe status code:', maybeAny.statusCode)
    if (maybeAny?.type) logError('Stripe error type:', maybeAny.type)

    const message = maybeAny?.message ?? em ?? 'Failed to create checkout session'
    const status = maybeAny?.statusCode ?? 500

    return NextResponse.json({ error: message }, { status })
  }
}

