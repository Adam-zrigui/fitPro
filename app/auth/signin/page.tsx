'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Dumbbell, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function SignInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [prefetching, setPrefetching] = useState(false)

  // Redirect logged-in users
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render anything if user is authenticated (will redirect)
  if (status === 'authenticated') {
    return null
  }

  const isRegistered = searchParams.get('registered') === 'true'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        // Prefetch dashboard data before navigation for faster loading
        setPrefetching(true)
        fetch('/api/dashboard', { method: 'GET' }).catch(() => {
          // Ignore prefetch errors - dashboard will handle loading
        }).finally(() => {
          setPrefetching(false)
        })

        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-cover bg-center bg-no-repeat animate-background-zoom" style={{ backgroundImage: "url('/uploads/gym-background.jpg')" }}>
      {/* Dark overlay for dark mode */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* hide decorative blobs in dark mode to keep contrast */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob dark:opacity-0"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 dark:opacity-0"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 dark:opacity-0"></div>
      </div>

      {/* Content */}
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Back Button + Theme Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white hover:text-blue-200 transition-colors font-medium group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </Link>
          </div>
          <div className="theme-toggle-wrapper">
            <ThemeToggle />
          </div>
        </div>

        {/* Logo and Header */}
        <div className="text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-75 animate-pulse"></div>
              <Dumbbell className="h-16 w-16 text-white relative bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">
            FitAcademy
          </h1>
          <p className="text-blue-100 text-lg mb-2">Transform Your Fitness Journey</p>
        </div>

        {/* Form Card */}
        <form 
          className="mt-8 space-y-6 bg-white/80 dark:bg-slate-900/70 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 dark:border-slate-800 hover:shadow-3xl transition-shadow duration-300"
          onSubmit={handleSubmit}
        >
          {/* Error Message */}
          {error && (
            <div className="bg-red-50/80 border border-red-200 text-red-700 px-4 py-4 rounded-xl text-sm font-medium animate-shake">
              {error}
            </div>
          )}

          {/* Success Message */}
          {isRegistered && (
            <div className="bg-green-50/80 border border-green-200 text-green-700 px-4 py-4 rounded-xl text-sm font-medium">
              Account created successfully! You can now sign in.
            </div>
          )}

          {/* Email Input */}
          <div className="group">
            <label htmlFor="email" className="sr-only">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                id="email"
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-slate-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-slate-700 outline-none transition-all duration-200 bg-gray-50/50 dark:bg-slate-800 dark:text-gray-50 hover:bg-gray-100"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="group">
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                id="password"
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-slate-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-slate-700 outline-none transition-all duration-200 bg_gray-50/50 dark:bg-slate-800 dark:text-gray-50 hover:bg-gray-100"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading || prefetching}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing in...
              </>
            ) : prefetching ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading dashboard...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* External OAuth providers removed. Use credentials sign-in. */}

          {/* Sign Up Link */}
          <Link
            href="/auth/signup"
            className="block w-full py-3 px-4 border-2 border-gray-200 hover:border-blue-600 text-gray-700 dark:text-gray-200 hover:text-blue-600 font-semibold rounded-xl transition-all duration-200 text-center hover:bg-blue-50 dark:hover:bg-slate-800"
          >
            Create a new account
          </Link>
        </form>

        {/* Footer Info */}
        <div className="text-center text-sm text-muted">
          <p>Get premium access to all fitness programs from our expert coaches</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        /* Theme toggle styling for sign-in header */
        .theme-toggle-wrapper {
          display: flex;
          align-items: center;
        }

        /* Target the toggle button by aria-label to adjust visibility on the gradient background */
        button[aria-label="Toggle dark mode"] {
          /* slightly translucent background to sit well on the hero */
          background: rgba(255, 255, 255, 0.85);
          color: #111827;
          border-radius: 0.5rem;
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(16,24,40,0.08);
          transition: transform 160ms ease, background 160ms ease;
        }

        button[aria-label="Toggle dark mode"]:hover {
          transform: translateY(-1px);
        }

        /* Dark-mode overrides for the toggle button */
        .dark button[aria-label="Toggle dark mode"] {
          background: rgba(17, 24, 39, 0.7);
          color: #f8fafc;
          box-shadow: 0 6px 18px rgba(2,6,23,0.6);
        }
      `}</style>
    </div>
  )
}
