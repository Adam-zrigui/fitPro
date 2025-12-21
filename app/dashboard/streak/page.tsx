'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Target, Flame, Calendar, Award, ArrowLeft, TrendingUp, CheckCircle, Star } from 'lucide-react'
import Link from 'next/link'

function StreakSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-2xl w-96 mb-8 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 animate-pulse">
              <div className="h-20 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-2xl mb-4 animate-pulse"></div>
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-xl w-3/4 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function StreakPage() {
  return (
    <Suspense fallback={<StreakSkeleton />}>
      <StreakContent />
    </Suspense>
  )
}

function StreakContent() {
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

    fetchStreakData()
  }, [session, status, router])

  const fetchStreakData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard', {
        headers: { 'Cache-Control': 'no-cache' }
      })

      if (!response.ok) {
        throw new Error('Failed to load streak data')
      }

      const streakData = await response.json()
      setData(streakData)
    } catch (error: any) {
      console.error('Failed to fetch streak data:', error)
      setData({
        totalWorkouts: 0,
        currentStreak: 0,
        nutritionStreak: 0,
        error: error.message || 'Unable to load streak data'
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return <StreakSkeleton />
  }

  if (!session || !data) {
    return null
  }

  const { totalWorkouts, currentStreak, nutritionStreak, error } = data

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
                  onClick={fetchStreakData}
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

  const workoutMilestones = [
    { days: 3, title: 'Getting Started', color: 'from-blue-500 to-cyan-500', unlocked: currentStreak >= 3 },
    { days: 7, title: 'Week Warrior', color: 'from-yellow-500 to-orange-500', unlocked: currentStreak >= 7 },
    { days: 14, title: 'Two Week Champion', color: 'from-orange-500 to-red-500', unlocked: currentStreak >= 14 },
    { days: 30, title: 'Monthly Master', color: 'from-purple-500 to-pink-500', unlocked: currentStreak >= 30 },
    { days: 50, title: 'Golden Streak', color: 'from-yellow-400 to-yellow-600', unlocked: currentStreak >= 50 },
    { days: 100, title: 'Century Club', color: 'from-indigo-500 to-purple-500', unlocked: currentStreak >= 100 }
  ]

  const nutritionMilestones = [
    { days: 3, title: 'Nutrition Novice', color: 'from-green-500 to-emerald-500', unlocked: nutritionStreak >= 3 },
    { days: 7, title: 'Healthy Habits', color: 'from-emerald-500 to-teal-500', unlocked: nutritionStreak >= 7 },
    { days: 14, title: 'Nutrition Champion', color: 'from-teal-500 to-cyan-500', unlocked: nutritionStreak >= 14 },
    { days: 30, title: 'Diet Master', color: 'from-cyan-500 to-blue-500', unlocked: nutritionStreak >= 30 },
    { days: 50, title: 'Nutrition Legend', color: 'from-blue-500 to-indigo-500', unlocked: nutritionStreak >= 50 },
    { days: 100, title: 'Century Eater', color: 'from-indigo-500 to-purple-500', unlocked: nutritionStreak >= 100 }
  ]

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
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl flex items-center justify-center">
              <Flame className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white">
                Your Streaks
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
                Track your workout and nutrition consistency
              </p>
            </div>
          </div>
        </div>

        {/* Current Streaks Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Workout Streak */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className={`w-20 h-20 bg-gradient-to-r ${currentStreak >= 7 ? 'from-yellow-500 to-orange-500' : 'from-orange-500 to-red-500'} rounded-full flex items-center justify-center shadow-2xl`}>
                  <Flame className="h-10 w-10 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{currentStreak}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">days</p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Workout Streak
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {currentStreak === 0
                  ? 'Complete your first workout to begin!'
                  : 'Keep the momentum going!'
                }
              </p>

              {currentStreak >= 7 && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-bounce">
                  <Award className="h-4 w-4" />
                  Week Warrior!
                </div>
              )}
            </div>
          </div>

          {/* Nutrition Streak */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className={`w-20 h-20 bg-gradient-to-r ${nutritionStreak >= 7 ? 'from-green-500 to-emerald-500' : 'from-green-400 to-blue-500'} rounded-full flex items-center justify-center shadow-2xl`}>
                  <Target className="h-10 w-10 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{nutritionStreak}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">days</p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Nutrition Streak
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {nutritionStreak === 0
                  ? 'Log your first nutrition entry to begin!'
                  : 'Healthy eating habits pay off!'
                }
              </p>

              {nutritionStreak >= 7 && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-bounce">
                  <Award className="h-4 w-4" />
                  Nutrition Champion!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Streak Milestones */}
        <div className="mb-12">
          {/* Workout Milestones */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Flame className="h-8 w-8 text-orange-500" />
              Workout Milestones
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workoutMilestones.map((milestone, index) => (
                <div
                  key={`workout-${milestone.days}`}
                  className={`relative bg-white dark:bg-slate-800 rounded-3xl p-6 border transition-all duration-300 ${
                    milestone.unlocked
                      ? 'border-green-200 dark:border-green-800 shadow-2xl hover:shadow-3xl hover:-translate-y-1'
                      : 'border-gray-100 dark:border-slate-700 opacity-60'
                  }`}
                >
                  {milestone.unlocked && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${milestone.color} rounded-2xl flex items-center justify-center ${milestone.unlocked ? 'animate-pulse' : ''}`}>
                      {milestone.unlocked ? (
                        <Award className="h-6 w-6 text-white" />
                      ) : (
                        <Target className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{milestone.days}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">days</p>
                    </div>
                  </div>

                  <h3 className={`text-lg font-semibold mb-2 ${milestone.unlocked ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    {milestone.title}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {milestone.unlocked ? 'Achievement Unlocked! 🎉' : `Complete ${milestone.days} workout days in a row`}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition Milestones */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Target className="h-8 w-8 text-green-500" />
              Nutrition Milestones
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nutritionMilestones.map((milestone, index) => (
                <div
                  key={`nutrition-${milestone.days}`}
                  className={`relative bg-white dark:bg-slate-800 rounded-3xl p-6 border transition-all duration-300 ${
                    milestone.unlocked
                      ? 'border-green-200 dark:border-green-800 shadow-2xl hover:shadow-3xl hover:-translate-y-1'
                      : 'border-gray-100 dark:border-slate-700 opacity-60'
                  }`}
                >
                  {milestone.unlocked && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${milestone.color} rounded-2xl flex items-center justify-center ${milestone.unlocked ? 'animate-pulse' : ''}`}>
                      {milestone.unlocked ? (
                        <Award className="h-6 w-6 text-white" />
                      ) : (
                        <Target className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{milestone.days}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">days</p>
                    </div>
                  </div>

                  <h3 className={`text-lg font-semibold mb-2 ${milestone.unlocked ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    {milestone.title}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {milestone.unlocked ? 'Achievement Unlocked! 🥗' : `Log nutrition for ${milestone.days} days in a row`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Streak Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl p-8 border border-blue-100 dark:border-blue-800">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Streak Success Tips
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Master both your workout and nutrition streaks with these expert strategies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workout Tips */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Workout Tips
              </h3>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Consistency is Key</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Try to work out at the same time each day. Building habits around consistent timing helps maintain your streak.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Start Small</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Don't overwhelm yourself. Even 20-30 minute workouts count towards your streak and fitness goals.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Rest Days Matter</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  If you miss a day, don't give up! Rest is important for recovery. Just get back to it the next day.
                </p>
              </div>
            </div>

            {/* Nutrition Tips */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Nutrition Tips
              </h3>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Track Consistently</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Log your meals daily to stay accountable and make data-driven adjustments to your nutrition.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Focus on Protein</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Prioritize high-quality protein sources to support muscle growth and recovery from workouts.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Monitor Progress</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Regularly assess your results and adjust your nutrition plan as needed for optimal progress.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}