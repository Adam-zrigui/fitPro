"use client"

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function SubscribeCta({ programId, priceLabel }: { programId: string; priceLabel?: string | null }) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const router = useRouter()

  const startCheckout = async () => {
    if (!session) return router.push('/auth/signin')
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to create checkout')

      const { sessionId, sessionUrl } = body
      const stripe = await stripePromise
      if (stripe && sessionId) {
        const result = await stripe.redirectToCheckout({ sessionId })
        if (result?.error) {
          if (sessionUrl) window.location.href = sessionUrl
          else alert(result.error.message)
        }
        return
      }

      if (sessionUrl) window.location.href = sessionUrl
    } catch (err: any) {
      console.error('Checkout start failed', err)
      alert(err?.message || 'Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose Your Plan</h3>
        <p className="text-muted">Get premium access to all fitness programs from our expert coaches</p>
      </div>

      {/* Plan Selection */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Monthly Plan */}
        <div
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedPlan === 'monthly'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setSelectedPlan('monthly')}
        >
          <div className="text-center">
            <h4 className="font-semibold text-lg">Monthly</h4>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">$29<span className="text-sm font-normal">/month</span></div>
            <p className="text-sm text-muted mt-1">Cancel anytime</p>
          </div>
        </div>

        {/* Yearly Plan */}
        <div
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all relative ${
            selectedPlan === 'yearly'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setSelectedPlan('yearly')}
        >
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
            SAVE 25%
          </div>
          <div className="text-center">
            <h4 className="font-semibold text-lg">Yearly</h4>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">$249<span className="text-sm font-normal">/year</span></div>
            <p className="text-sm text-muted mt-1">$20.75/month</p>
          </div>
        </div>
      </div>

      {/* Selected Plan Summary */}
      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm text-muted">
          Selected: <span className="font-semibold">
            {selectedPlan === 'monthly' ? '$29/month' : '$249/year (25% savings)'}
          </span>
        </p>
      </div>

      {/* Checkout Button */}
      <div className="text-center">
        <button onClick={startCheckout} disabled={loading} className="btn-primary px-8 py-3 text-lg">
          {loading ? 'Processing…' : `Subscribe ${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'}`}
        </button>
        <p className="text-xs text-muted mt-2">
          You can cancel your subscription at any time
        </p>
      </div>
    </div>
  )
}
