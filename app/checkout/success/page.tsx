import Link from 'next/link'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SessionRefresh from './SessionRefresh'
import ClientSideLogic from './ClientSideLogic'
import { CheckCircle, ArrowRight, Sparkles, CreditCard, Calendar, Star, Award, Users, AlertTriangle, RefreshCw, Home, BookOpen } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <SessionRefresh />

        <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">Welcome to FitAcademy</span>
          </div>

          <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>

          <h1 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4">
            You're All
            <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent"> Set!</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Your subscription is now active. Welcome to premium access to our exclusive fitness programs and expert guidance from our 5 world-class coaches.
          </p>
        </div>

        {/* Subscription Details */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Subscription Details</h2>
                  <p className="text-green-100">Your premium membership is active</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-700">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Plan</span>
                <span className="font-bold text-gray-900 dark:text-white">{price?.nickname ?? price?.id ?? 'Membership'}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-700">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Amount</span>
                <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(amount as number | null, currency)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-700">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Billing</span>
                <span className="font-bold text-gray-900 dark:text-white">{price?.recurring?.interval ?? 'month'}ly</span>
              </div>

              {subscription && (
                <>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-700">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Status</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-semibold">
                      {subscription.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Next Billing</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatDate(subscription.current_period_end)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">What's Next</h2>
                  <p className="text-blue-100">Start your fitness journey</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Explore Programs</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Browse our collection of expert-designed fitness programs</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Choose Your Path</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Select a program that matches your goals and fitness level</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Track Progress</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Monitor your results and celebrate your achievements</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          {isSubscribed ? (
            <Link
              href="/programs"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <Award className="h-6 w-6" />
              Start Your Journey
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              Go to Dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
          <Link
            href="/programs"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 hover:border-green-300 dark:hover:border-green-600 text-gray-700 dark:text-gray-300 font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Browse Programs
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-r from-slate-100 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-3xl p-8 lg:p-12 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
              Your Premium Benefits
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to achieve your fitness goals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Expert Trainers</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Learn from certified fitness professionals</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Premium Programs</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Access to all fitness programs and content</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Flexible Scheduling</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Work out on your schedule, anytime, anywhere</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Progress Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Monitor your results and stay motivated</p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="mb-4">
            A confirmation has been sent to your email. Need help? Contact our support team.
          </p>
          <p className="text-sm">
            Questions? Reply to your receipt email or visit our{' '}
            <Link href="/support" className="text-blue-600 dark:text-blue-400 hover:underline">
              support center
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}