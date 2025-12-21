'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Dumbbell, Clock, CheckCircle, Star, ArrowRight, Target, TrendingUp, Award, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function ProgramsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-2xl w-96 mb-8 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 animate-pulse">
              <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-2xl mb-4 animate-pulse"></div>
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-xl w-3/4 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-lg w-1/2 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProgramsPage() {
  return (
    <Suspense fallback={<ProgramsSkeleton />}>
      <ProgramsContent />
    </Suspense>
  )
}

function ProgramsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchProgramsData()
  }, [session, status, router])

  const fetchProgramsData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard', {
        headers: { 'Cache-Control': 'no-cache' }
      })

      if (!response.ok) {
        throw new Error('Failed to load programs data')
      }

      const programsData = await response.json()
      setData(programsData)
    } catch (error: any) {
      console.error('Failed to fetch programs data:', error)
      setData({
        enrollments: [],
        userProgress: [],
        progressByProgram: {},
        totalWorkouts: 0,
        totalActivePrograms: 0,
        error: error.message || 'Unable to load programs data'
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return <ProgramsSkeleton />
  }

  if (!session || !data) {
    return null
  }

  const { enrollments, progressByProgram, totalActivePrograms, error } = data

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">Connection Error</h3>
                <p className="text-red-700 dark:text-red-300 mb-6">{error}</p>
                <button
                  onClick={fetchProgramsData}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center">
              <Dumbbell className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white">
                Active Programs
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
                {totalActivePrograms} program{totalActivePrograms !== 1 ? 's' : ''} with our expert coaches
              </p>
            </div>
          </div>
        </div>

        {/* Programs Grid */}
        {enrollments.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Dumbbell className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">No Active Programs</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              You haven't enrolled in any programs yet. Start your fitness journey by exploring our exclusive collection of 5 expert coaches.
            </p>
            <Link
              href="/programs"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Target className="h-5 w-5" />
              Browse Programs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {enrollments.map((enrollment: any) => {
              const progress = progressByProgram[enrollment.program.id]
              return (
                <div key={enrollment.id} className="group bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
                  {/* Program Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center ${progress?.percentage === 100 ? 'bg-green-500/30' : ''}`}>
                          {progress?.percentage === 100 ? (
                            <CheckCircle className="h-6 w-6" />
                          ) : (
                            <Dumbbell className="h-6 w-6" />
                          )}
                        </div>
                        {progress?.percentage === 100 && (
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            Completed!
                          </div>
                        )}
                      </div>

                      <h3 className="text-xl font-bold mb-2 line-clamp-2">{enrollment.program.title}</h3>
                      <p className="text-blue-100 text-sm line-clamp-2">{enrollment.program.description}</p>
                    </div>
                  </div>

                  {/* Program Details */}
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{enrollment.program.workouts?.length || 0} workouts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{progress?.completed || 0} completed</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className={`font-semibold ${progress?.percentage === 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                          {progress?.percentage || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                            progress?.percentage === 100
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                              : 'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                          style={{ width: `${progress?.percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/programs/${enrollment.program.id}/videos`}
                      className={`w-full inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-6 py-3 transition-all duration-300 ${
                        progress?.percentage === 100
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                      } shadow-lg hover:shadow-xl hover:scale-105`}
                    >
                      {progress?.percentage === 100 ? (
                        <>
                          <Star className="h-4 w-4" />
                          Review Program
                        </>
                      ) : (
                        <>
                          Continue Learning
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}