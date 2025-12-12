import Link from 'next/link'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SessionRefresh from './SessionRefresh'

type Props = {
  searchParams?: { session_id?: string }
}

function formatCurrency(amount?: number | null, currency?: string | null) {
  if (typeof amount !== 'number' || !currency) return ''
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
}

function formatDate(ts?: number | null) {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString()
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions)
  const sessionId = searchParams?.session_id
  let stripeSession: Stripe.Checkout.Session | null = null
  let subscription: Stripe.Subscription | null = null
  let dbUser = null

  // Confirm subscription immediately (handles webhook delay/failure)
  if (sessionId && session?.user?.id) {
    try {
      // Call our API to confirm and persist subscription from Stripe checkout session
      // This bypasses webhook delays or webhook delivery issues in dev/local environments
      const confirmRes = await fetch(`${process.env.NEXTAUTH_URL}/api/checkout/confirm-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      if (confirmRes.ok) {
        const confirmData = await confirmRes.json()
        console.log('✅ Subscription confirmed on success page:', confirmData)
      } else {
        console.warn('Subscription confirmation returned status:', confirmRes.status)
      }
    } catch (err) {
      console.error('Failed to confirm subscription:', err)
    }
  }

  // Fetch fresh user data from database (should now be updated from above)
  if (session?.user?.id) {
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          subscriptionId: true,
          subscriptionStatus: true,
          subscriptionStartDate: true,
        }
      })
    } catch (err) {
      console.error('Failed to fetch user from DB:', err)
    }
  }

  if (sessionId) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })
      stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items.data.price', 'subscription', 'customer'],
      })

      if (stripeSession.subscription) {
        // `stripeSession.subscription` can be either a subscription ID (string) or an expanded Subscription object
        if (typeof stripeSession.subscription === 'string') {
          subscription = (await stripe.subscriptions.retrieve(stripeSession.subscription, { expand: ['items.data.price'] })) as Stripe.Subscription
        } else {
          subscription = stripeSession.subscription as Stripe.Subscription
        }
      }
    } catch (err) {
      console.error('Failed to retrieve Stripe session:', err)
      stripeSession = null
    }
  }

  const lineItem = stripeSession?.line_items?.data?.[0]
  const price = lineItem?.price as Stripe.Price | undefined
  const amount = price?.unit_amount ?? stripeSession?.amount_total ?? null
  const currency = (price?.currency ?? stripeSession?.currency) || 'usd'
  // Check both session and DB for subscription status (DB is more reliable after webhook)
  const isSubscribed = dbUser?.subscriptionStatus === 'active' || session?.user?.subscriptionStatus === 'active' || !!dbUser?.subscriptionId || !!session?.user?.subscriptionId

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-slate-950 dark:to-slate-900 text-gray-900 dark:text-gray-50 transition-colors">
      <SessionRefresh />
      <div className="content-container py-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-full bg-green-600/10 text-green-700 w-12 h-12 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold">You're all set — subscription active</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">A confirmation has been sent to your email.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-medium mb-2">Subscription</h3>
              <div className="text-sm text-secondary mb-2">Plan</div>
              <div className="font-semibold mb-3">{price?.nickname ?? price?.id ?? 'Membership'}</div>

              <div className="text-sm text-secondary mb-2">Amount</div>
              <div className="mb-3">{formatCurrency(amount as number | null, currency)}</div>

              <div className="text-sm text-secondary mb-2">Billing cadence</div>
              <div className="mb-3">{price?.recurring?.interval ?? 'month'}</div>

              {subscription ? (
                <>
                  <div className="text-sm text-secondary mb-2">Subscription status</div>
                  <div className="mb-3">{subscription.status}</div>

                  <div className="text-sm text-secondary mb-2">Current period ends</div>
                  <div className="mb-3">{formatDate(subscription.current_period_end)}</div>
                </>
              ) : null}
            </div>

            <div className="card p-6">
              <h3 className="font-medium mb-2">Details</h3>
              <div className="text-sm text-secondary mb-2">Session ID</div>
              <div className="font-mono text-sm break-all mb-3">{stripeSession?.id ?? '—'}</div>

              <div className="text-sm text-secondary mb-2">Customer</div>
              <div className="mb-3">{stripeSession?.customer_details?.email ?? stripeSession?.customer_email ?? '—'}</div>

              <div className="text-sm text-secondary mb-2">Receipt</div>
              <div className="mb-3">Check your email for a receipt from Stripe.</div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                {isSubscribed ? (
                  <Link href="/programs" className="btn-primary w-full text-center">Start Course</Link>
                ) : (
                  <Link href="/dashboard" className="btn-primary w-full text-center">Go to Dashboard</Link>
                )}
                <Link href="/programs" className="btn-secondary w-full text-center">Browse Programs</Link>
              </div>
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-600 dark:text-gray-400">
            <p>If you need help, reply to the receipt email or contact support at <a href="mailto:support@example.com" className="underline">support@example.com</a>.</p>
            <p className="mt-2">If something looks wrong, you can view the subscription in your Stripe Dashboard (test mode) or contact us for assistance.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
