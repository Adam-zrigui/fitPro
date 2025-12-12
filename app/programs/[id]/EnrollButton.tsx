'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { useSession } from 'next-auth/react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function EnrollButton({ programId }: { programId: string }) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const router = useRouter()

  // Check subscription status from DB directly
  useEffect(() => {
    if (session?.user?.id) {
      // Check session first
      const sessionHasSub = !!(session.user?.subscriptionStatus === 'active' || session.user?.subscriptionId)
      setHasSubscription(sessionHasSub)
    }
  }, [session])

  const handleSubscribe = async () => {
    // Redirect to the subscription page where the user can review and continue
    // We intentionally navigate instead of starting checkout inline so users
    // can see plan details before being taken off-site.
    router.push(`/programs/${programId}/subscribe`)
  }

  if (hasSubscription) {
    return (
      <button onClick={() => router.push(`/programs/${programId}/videos`)} className="btn-primary w-full">
        Start Course
      </button>
    )
  }

  return (
    <button onClick={handleSubscribe} disabled={loading} className="btn-primary w-full">
      {loading ? 'Loading…' : 'Subscribe Now'}
    </button>
  )
}
