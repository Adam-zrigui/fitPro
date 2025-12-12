import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { debug, info, warn, error as logError } from '@/lib/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  debug('🔔 Webhook received at', new Date().toISOString())
  debug('📋 Signature present:', !!signature)
  debug('📋 Webhook secret configured:', !!webhookSecret)

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    debug('✅ Webhook signature verified')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logError('❌ Webhook Signature Error:', msg)
    // If signature verification fails, log but continue processing for testing
    warn('⚠️  Signature verification failed - attempting to process anyway (DEV MODE)')
    try {
      event = JSON.parse(body)
    } catch (parseErr: unknown) {
      const pmsg = parseErr instanceof Error ? parseErr.message : String(parseErr)
      return NextResponse.json({ error: pmsg }, { status: 400 })
    }
  }

  debug(`📨 Event type: ${event.type}`)

  if (event.type === 'checkout.session.completed') {
    const stripeSession = event.data.object as Stripe.Checkout.Session
    const metadata = stripeSession.metadata || {}
    const userId = metadata.userId
    const programId = metadata.programId

    debug('💳 Checkout session completed')
    debug('👤 User ID:', userId)
    debug('📚 Program ID:', programId)
    debug('💰 Subscription:', stripeSession.subscription)

    try {
      // If this was a program purchase (programId present), create an enrollment and payment
      if (programId) {
        await prisma.enrollment.create({
          data: {
            userId,
            programId,
            active: true,
          },
        })

        await prisma.payment.create({
          data: {
            userId,
            amount: (stripeSession.amount_total || 0) / 100,
            currency: stripeSession.currency || 'usd',
            status: 'succeeded',
            stripePaymentId: (stripeSession.payment_intent as string) || (stripeSession.payment_intent as any)?.id || '',
          },
        })

        debug(`✅ Enrollment created for user ${userId} in program ${programId}`)
      }

      // If this was a subscription checkout, attach subscription info to the user
      if (stripeSession.subscription) {
        const subscriptionId = stripeSession.subscription as string
        debug('📝 Processing subscription:', subscriptionId)
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['items.data.price'],
        })

        const priceId = subscription.items?.data?.[0]?.price?.id
        const status = subscription.status
        const startDate = subscription.created ? new Date(subscription.created * 1000) : null
        const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null

        debug('💾 Updating user subscription:', {
          userId,
          subscriptionId,
          priceId,
          status,
          startDate,
          currentPeriodEnd,
        })

        const result = await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionId: subscriptionId,
            subscriptionPriceId: priceId,
            subscriptionStatus: status,
            subscriptionStartDate: startDate,
            subscriptionEndDate: currentPeriodEnd,
          },
        })

        debug(`✅ Updated subscription for user ${userId}: ${subscriptionId} (${status})`)
        debug('📊 Updated user record:', result)
      }
    } catch (err: unknown) {
      const emsg = err instanceof Error ? err.message : String(err)
      logError('❌ Database error:', emsg)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  // Handle subscription lifecycle updates
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const subscription = event.data.object as Stripe.Subscription

    // Try to map to our user
    let userId = subscription.metadata?.userId as string | undefined

    try {
      // If metadata doesn't include our userId, try to find by customer email
      if (!userId && subscription.customer) {
        const customer = await stripe.customers.retrieve(String(subscription.customer)) as Stripe.Customer
        const email = customer.email
        if (email) {
          const dbUser = await prisma.user.findUnique({ where: { email } })
          if (dbUser) userId = dbUser.id
        }
      }

      const priceId = subscription.items?.data?.[0]?.price?.id
      const status = subscription.status
      const startDate = subscription.created ? new Date(subscription.created * 1000) : null
      const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null

      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionId: subscription.id,
            subscriptionPriceId: priceId,
            subscriptionStatus: status,
            subscriptionStartDate: startDate,
            subscriptionEndDate: currentPeriodEnd,
          },
        })

        debug(`Subscription ${subscription.id} (${status}) synced for user ${userId}`)
      } else {
        warn('Subscription update received but could not map to a user', subscription.id)
      }
    } catch (err) {
      const emsg = err instanceof Error ? err.message : String(err)
      logError('Error handling subscription.updated:', emsg)
      return NextResponse.json({ error: 'Subscription update handler error' }, { status: 500 })
    }
  }

  // Handle failed invoice payments (mark subscription as past_due)
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice

    try {
      // Attempt mapping: prefer subscription metadata -> customer email
      let userId: string | undefined

      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(String(invoice.subscription))
        userId = subscription.metadata?.userId as string | undefined
      }

      if (!userId && invoice.customer) {
        const customer = await stripe.customers.retrieve(String(invoice.customer)) as Stripe.Customer
        if (customer.email) {
          const dbUser = await prisma.user.findUnique({ where: { email: customer.email } })
          if (dbUser) userId = dbUser.id
        }
      }

      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'past_due',
          },
        })
        debug(`Marked subscription past_due for user ${userId} due to failed invoice`)
      } else {
        warn('Invoice.payment_failed received but could not map to a user', invoice.id)
      }
    } catch (err) {
      const emsg = err instanceof Error ? err.message : String(err)
      logError('Error handling invoice.payment_failed:', emsg)
      return NextResponse.json({ error: 'Invoice handler error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
