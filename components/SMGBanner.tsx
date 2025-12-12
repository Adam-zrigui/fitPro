'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function SMGBanner() {
  const router = useRouter()
  const pathname = usePathname()

  const goToPrograms = () => {
    router.push('/programs')
  }

  const learnMore = () => {
    // If we're on the homepage, smooth-scroll to the features section
    if (typeof window !== 'undefined' && (pathname === '/' || pathname === '')) {
      const el = document.getElementById('features')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    // Otherwise navigate to homepage first, then scroll
    if (pathname !== '/') {
      router.push('/')
      // Wait for navigation, then scroll
      setTimeout(() => {
        const el = document.getElementById('features')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 300)
    }
  }

  return (
    <section className="relative overflow-hidden z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-500/8 dark:from-slate-900/12 dark:to-slate-800/12" />
      <div className="content-container min-h-[56vh] flex items-center">
        <div className="w-full text-center py-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            <span className="block text-gray-900 dark:text-white">SMG — Shape, Move, Grow</span>
            <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Make progress on your terms
            </span>
          </h2>

          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Short, focused programs with clear outcomes — video demos, progress tracking, and community support.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={goToPrograms}
              className="btn-primary px-8 py-3 cursor-pointer"
              aria-label="Explore Programs"
            >
              Explore Programs
            </button>

            <button
              type="button"
              onClick={learnMore}
              className="btn-secondary px-6 py-3 cursor-pointer"
              aria-label="Learn more about features"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
