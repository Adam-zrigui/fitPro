'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dumbbell, ArrowLeft, Mail, Lock, User, Eye, EyeOff, Sparkles, CheckCircle, ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function SignUpPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create account')
      }

      router.push('/auth/signin?registered=true')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = (password: string) => {
    if (password.length === 0) return { score: 0, label: '', color: '' }
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
    const colors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500']

    return { score, label: labels[score], color: colors[score] }
  }

  const strength = passwordStrength(formData.password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Join FitAcademy</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50">Start Your Journey</h1>
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
              <Dumbbell className="h-6 w-6" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Create your account and unlock premium fitness programs</p>
        </div>

        {/* Sign Up Form */}
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-3xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">Create Account</h2>
                  <p className="text-green-100">Join our fitness community</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-4 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}

                {/* Full Name */}
                <div className="group">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                    <input
                      id="name"
                      type="text"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:border-green-600 dark:focus:border-slate-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-slate-700 outline-none transition-all duration-200 bg-gray-50/50 dark:bg-slate-800 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-slate-700"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                    <input
                      id="email"
                      type="email"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:border-green-600 dark:focus:border-slate-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-slate-700 outline-none transition-all duration-200 bg-gray-50/50 dark:bg-slate-800 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-slate-700"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                    <input
                      id="password"
                      type="password"
                      required
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:border-green-600 dark:focus:border-slate-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-slate-700 outline-none transition-all duration-200 bg-gray-50/50 dark:bg-slate-800 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-slate-700"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              strength.score === 1 ? 'bg-red-500 w-1/4' :
                              strength.score === 2 ? 'bg-orange-500 w-2/4' :
                              strength.score === 3 ? 'bg-yellow-500 w-3/4' :
                              strength.score === 4 ? 'bg-green-500 w-full' : 'w-0'
                            }`}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${strength.color}`}>
                          {strength.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Use 8+ characters with uppercase, lowercase, numbers, and symbols
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="group">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:border-green-600 dark:focus:border-slate-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-slate-700 outline-none transition-all duration-200 bg-gray-50/50 dark:bg-slate-800 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-slate-700"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password Match Indicator */}
                  {formData.confirmPassword && (
                    <div className="mt-2 flex items-center gap-2">
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">×</span>
                          </div>
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium">Passwords don't match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Sign In Link */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link href="/auth/signin" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>

              {/* Back to Home */}
              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}