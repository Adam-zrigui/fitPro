'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, ArrowRight, RefreshCw, AlertTriangle, Home, Sparkles } from 'lucide-react'

function ClientSideLogic({ sessionId, initialData }: { sessionId?: string, initialData: any }) {
  const [retrying, setRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscriptionConfirmed, setSubscriptionConfirmed] = useState(false)

  useEffect(() => {
    if (sessionId && !subscriptionConfirmed) {
      confirmSubscription()
    }
  }, [sessionId, subscriptionConfirmed])

  const confirmSubscription = async () => {
    try {
      setRetrying(true)
      setError(null)

      const response = await fetch('/api/checkout/confirm-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      if (response.ok) {
        setSubscriptionConfirmed(true)
        // Refresh the page to show updated subscription status
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to confirm subscription')
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred')
    } finally {
      setRetrying(false)
    }
  }

  const handleRetry = () => {
    confirmSubscription()
  }

  const handleContinue = () => {
    window.location.href = '/dashboard'
  }

  if (error && !subscriptionConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-red-200 dark:border-red-800 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-black mb-2">Payment Processing Issue</h1>
                  <p className="text-red-100">We encountered an issue confirming your subscription</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Don't worry - your payment was processed. We're just having trouble activating your subscription.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed"
                >
                  {retrying ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5" />
                      Try Again
                    </>
                  )}
                </button>

                <Link
                  href="/support"
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Contact Support
                </Link>
              </div>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Your payment has been processed successfully</li>
                  <li>• We'll continue trying to activate your subscription</li>
                  <li>• You can access your programs once activation is complete</li>
                  <li>• Contact support if the issue persists</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (subscriptionConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-green-200 dark:border-green-800 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-black mb-2">Subscription Activated!</h1>
                  <p className="text-green-100">Your elite fitness journey begins now</p>
                </div>
              </div>
            </div>

            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Elite Fitness!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Your subscription has been successfully activated. You now have access to all premium programs from our 5 world-class coaches.
              </p>

              <button
                onClick={handleContinue}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
              >
                <Home className="h-5 w-5" />
                Start Your Journey
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Return null to show the server-rendered content
  return null
}

export default ClientSideLogic