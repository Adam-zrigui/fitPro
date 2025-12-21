'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Award, Star, Trophy, Medal, Crown, ArrowLeft, Target, CheckCircle, Lock } from 'lucide-react'
import Link from 'next/link'

function AchievementsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-2xl w-96 mb-8 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 animate-pulse">
              <div className="h-16 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-2xl mb-4 animate-pulse"></div>
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-xl w-3/4 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-lg w-1/2 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AchievementsPage() {
  return (
    <Suspense fallback={<AchievementsSkeleton />}>
      <AchievementsContent />
    </Suspense>
  )
}

function AchievementsContent() {
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

    fetchAchievementsData()
  }, [session, status, router])

  const fetchAchievementsData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard', {
        headers: { 'Cache-Control': 'no-cache' }
      })

      if (!response.ok) {
        throw new Error('Failed to load achievements data')
      }

      const achievementsData = await response.json()
      setData(achievementsData)
    } catch (error: any) {
      console.error('Failed to fetch achievements data:', error)
      setData({
        totalWorkouts: 0,
        totalActivePrograms: 0,
        error: error.message || 'Unable to load achievements data'
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return <AchievementsSkeleton />
  }

  if (!session || !data) {
    return null
  }

  const { totalWorkouts, totalActivePrograms, error } = data

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
                  onClick={fetchAchievementsData}
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

  const achievements = [
    {
      id: 1,
      title: 'First Steps',
      description: 'Complete your first workout',
      icon: Star,
      color: 'from-blue-500 to-cyan-500',
      requirement: 1,
      current: totalWorkouts,
      unlocked: totalWorkouts >= 1,
      rarity: 'Common'
    },
    {
      id: 2,
      title: 'Getting Started',
      description: 'Complete 5 workouts',
      icon: Target,
      color: 'from-green-500 to-emerald-500',
      requirement: 5,
      current: totalWorkouts,
      unlocked: totalWorkouts >= 5,
      rarity: 'Common'
    },
    {
      id: 3,
      title: 'Dedicated',
      description: 'Complete 10 workouts',
      icon: Award,
      color: 'from-purple-500 to-pink-500',
      requirement: 10,
      current: totalWorkouts,
      unlocked: totalWorkouts >= 10,
      rarity: 'Uncommon'
    },
    {
      id: 4,
      title: 'Fitness Enthusiast',
      description: 'Complete 15 workouts',
      icon: Trophy,
      color: 'from-yellow-500 to-orange-500',
      requirement: 15,
      current: totalWorkouts,
      unlocked: totalWorkouts >= 15,
      rarity: 'Rare'
    },
    {
      id: 5,
      title: 'Program Pioneer',
      description: 'Enroll in your first program',
      icon: Medal,
      color: 'from-indigo-500 to-purple-500',
      requirement: 1,
      current: totalActivePrograms,
      unlocked: totalActivePrograms >= 1,
      rarity: 'Common'
    },
    {
      id: 6,
      title: 'Coach Explorer',
      description: 'Enroll in 3 different coach programs',
      icon: Crown,
      color: 'from-pink-500 to-rose-500',
      requirement: 3,
      current: totalActivePrograms,
      unlocked: totalActivePrograms >= 3,
      rarity: 'Uncommon'
    },
    {
      id: 7,
      title: 'Fitness Champion',
      description: 'Complete 30 workouts',
      icon: Trophy,
      color: 'from-red-500 to-pink-500',
      requirement: 30,
      current: totalWorkouts,
      unlocked: totalWorkouts >= 30,
      rarity: 'Epic'
    },
    {
      id: 8,
      title: 'Elite Athlete',
      description: 'Complete 50 workouts',
      icon: Crown,
      color: 'from-yellow-400 to-yellow-600',
      requirement: 50,
      current: totalWorkouts,
      unlocked: totalWorkouts >= 50,
      rarity: 'Legendary'
    },
    {
      id: 9,
      title: 'Program Master',
      description: 'Complete 5 programs',
      icon: Star,
      color: 'from-purple-600 to-indigo-600',
      requirement: 5,
      current: totalActivePrograms,
      unlocked: totalActivePrograms >= 5,
      rarity: 'Epic'
    }
  ]

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalAchievements = achievements.length

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
      case 'Uncommon': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      case 'Rare': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
      case 'Epic': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30'
      case 'Legendary': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
    }
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
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl flex items-center justify-center">
              <Award className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white">
                Achievements
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
                {unlockedCount} of {totalAchievements} unlocked
              </p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Achievement Progress</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {Math.round((unlockedCount / totalAchievements) * 100)}% complete
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{unlockedCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unlocked</p>
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-4 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${(unlockedCount / totalAchievements) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => {
            const Icon = achievement.icon
            const progress = Math.min((achievement.current / achievement.requirement) * 100, 100)

            return (
              <div
                key={achievement.id}
                className={`relative bg-white dark:bg-slate-800 rounded-3xl p-6 border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  achievement.unlocked
                    ? 'border-green-200 dark:border-green-800 shadow-xl'
                    : 'border-gray-100 dark:border-slate-700'
                }`}
              >
                {achievement.unlocked && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-r ${achievement.color} rounded-2xl flex items-center justify-center ${
                    achievement.unlocked ? 'animate-pulse' : 'opacity-50'
                  }`}>
                    {achievement.unlocked ? (
                      <Icon className="h-7 w-7 text-white" />
                    ) : (
                      <Lock className="h-7 w-7 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-bold mb-2 ${getRarityColor(achievement.rarity)}`}>
                      {achievement.rarity}
                    </div>
                    <h3 className={`text-lg font-bold ${achievement.unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {achievement.title}
                    </h3>
                  </div>
                </div>

                <p className={`text-sm mb-4 ${achievement.unlocked ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {achievement.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className={achievement.unlocked ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                      {achievement.unlocked ? 'Completed!' : `${achievement.current}/${achievement.requirement}`}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                        achievement.unlocked
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {achievement.unlocked && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-semibold">Achievement Unlocked!</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Achievement Tips */}
        <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How to Earn Achievements</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Complete Workouts</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                The more workouts you complete, the more achievements you'll unlock. Start with our beginner programs.
              </p>
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
              >
                Browse Programs
                <Target className="h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Maintain Streaks</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                Consistent daily workouts lead to streak achievements. Check your streak progress regularly.
              </p>
              <Link
                href="/dashboard/streak"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
              >
                View Streak
                <Award className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}