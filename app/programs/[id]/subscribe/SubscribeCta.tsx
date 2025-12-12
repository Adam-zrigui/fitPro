"use client"

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function SubscribeCta({ programId, priceLabel }: { programId: string; priceLabel?: string | null }) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const startCheckout = async () => {
    if (!session) return router.push('/auth/signin')
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
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
    <div className="space-y-4 text-center">
      <div className="text-lg font-semibold">Unlock all programs</div>
      <div className="text-2xl font-bold">{priceLabel ?? 'Subscribe'}</div>
      <div>
        <button onClick={startCheckout} disabled={loading} className="btn-primary px-6 py-3">
          {loading ? 'Processing…' : 'Continue to Checkout'}
        </button>
      </div>
    </div>
  )
}
