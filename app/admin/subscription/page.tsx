'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function SubscriptionSetupPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [subscriptionInfo, setSubscriptionInfo] = useState<{ priceId: string; productId: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authorization
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/')
      return
    }

    // Fetch subscription info
    if (status === 'authenticated') {
      const fetchSubscription = async () => {
        try {
          const res = await fetch('/api/admin/subscription')
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          setSubscriptionInfo({
            priceId: data.priceId,
            productId: 'See Stripe Dashboard',
          })
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to initialize subscription')
        } finally {
          setLoading(false)
        }
      }
      fetchSubscription()
    }
  }, [status, session, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8">
          <div className="text-center mb-8">
            {error ? (
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            ) : (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            )}
            <h1 className="text-3xl font-bold mb-2 dark:text-gray-50">
              {error ? 'Subscription Setup Error' : 'Subscription Ready!'}
            </h1>
            <p className="text-secondary">
              {error
                ? 'There was an issue setting up your subscription'
                : 'Your FitPro Academy membership is configured and ready to sell'}
            </p>
          </div>

          {error ? (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          ) : subscriptionInfo ? (
            <div className="space-y-6">
              {/* Subscription Info */}
              <div className="bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h2 className="font-bold mb-4 dark:text-gray-50">Subscription Details</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-secondary">Product Name</p>
                    <p className="font-mono text-lg font-bold">FitPro Academy Membership</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary">Price</p>
                    <p className="font-mono text-lg font-bold">$29.99 / month</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary">Price ID (Stripe)</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded font-mono text-sm flex-1 break-all">
                        {subscriptionInfo.priceId}
                      </code>
                      <button
                        onClick={() => {
                          if (subscriptionInfo) {
                            navigator.clipboard.writeText(subscriptionInfo.priceId)
                            alert('Copied to clipboard!')
                          }
                        }}
                        className="btn-secondary text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-secondary">Access</p>
                    <p className="text-lg">✅ All courses included</p>
                    <p className="text-lg">✅ All videos and content</p>
                    <p className="text-lg">✅ Progress tracking</p>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h2 className="font-bold mb-4">How It Works</h2>
                <ol className="space-y-3 list-decimal list-inside text-secondary">
                  <li>Users visit your /programs page</li>
                  <li>They click "Subscribe Now" or "Enroll"</li>
                  <li>They pay $29.99/month via Stripe</li>
                  <li>✅ They instantly get access to ALL courses</li>
                  <li>Subscription renews monthly automatically</li>
                </ol>
              </div>

              {/* Features */}
              <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                <h2 className="font-bold mb-4">Features</h2>
                <ul className="space-y-2 text-secondary list-disc list-inside">
                  <li>Single payment for premium access</li>
                  <li>Automatic monthly renewal</li>
                  <li>Cancel anytime (through Stripe portal)</li>
                  <li>One subscription opens all courses</li>
                  <li>No per-course pricing needed</li>
                </ul>
              </div>

              {/* Test Checkout */}
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                <h2 className="font-bold mb-4">Test Your Subscription</h2>
                <p className="text-secondary mb-4">
                  Ready to test? Visit <code className="bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">/programs</code> and click Subscribe.
                </p>
                <p className="text-sm text-secondary mb-4">Use Stripe test card:</p>
                <code className="block bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded font-mono mb-4">
                  4242 4242 4242 4242 | 12/25 | 123
                </code>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  ℹ️ Any future expiry date and any 3-digit CVC will work
                </p>
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <a href="/programs" className="btn-primary flex-1 text-center">
              View Programs
            </a>
            <a href="/admin" className="btn-secondary flex-1 text-center">
              Back to Admin
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
