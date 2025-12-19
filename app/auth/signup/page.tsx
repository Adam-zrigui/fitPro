'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dumbbell, ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat relative animate-background-zoom" style={{ backgroundImage: "url('/uploads/gym-background.jpg')" }}>
      {/* Dark overlay for dark mode */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Back button row (matches sign-in) */}
        <div className="flex">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white hover:text-blue-200 transition-colors font-medium group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </Link>
        </div>

        <div className="relative w-full py-2">
          {/* Left: Back link */}
         

          {/* Center: Title */}
          <div className="text-center">
            <div className="flex justify-center">
              <Dumbbell className="h-12 w-12 text-primary-600" />
            </div>
            <h2 className="mt-0 text-3xl font-extrabold text-white">
              Create your account
            </h2>
          </div>

          {/* Right: Theme toggle */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <ThemeToggle />
          </div>
        </div>
        <form className="mt-8 space-y-6 bg-white/80 dark:bg-slate-900/70 p-8 rounded-2xl shadow-2xl border border-white/20 dark:border-slate-800 transition-shadow duration-300" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <input
              type="text"
              required
              className="input"
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              type="email"
              required
              className="input"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              type="password"
              required
              className="input"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <input
              type="password"
              required
              className="input"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>

          <div className="text-center">
            <Link href="/auth/signin" className="text-primary-600 hover:text-primary-500 dark:text-blue-300">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
