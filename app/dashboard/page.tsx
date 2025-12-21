'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calendar, TrendingUp, Award, Dumbbell, Play, BookOpen, Plus, BarChart3, Clock, Users, Camera, Settings, Loader2, ArrowRight, Target, Heart, Zap, CheckCircle, Crown, Sparkles, Star, Activity, Apple, Flame, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import DashboardProfileCard from '@/components/DashboardProfileCard'

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-rose-50 dark:from-slate-950 dark:via-purple-950 dark:to-rose-950">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Header Skeleton */}
        <div className="mb-12">
          <div className="h-12 bg-gradient-to-r from-amber-200 to-yellow-300 dark:from-amber-800 dark:to-yellow-700 rounded-2xl w-96 mb-4 animate-pulse"></div>
          <div className="h-6 bg-gradient-to-r from-purple-200 to-rose-200 dark:from-purple-800 dark:to-rose-800 rounded-xl w-80 animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-xl w-20 animate-pulse"></div>
                <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-2xl animate-pulse"></div>
              </div>
              <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-xl w-16 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-lg w-24 animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Programs Section Skeleton */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-8 mb-8 animate-pulse">
          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-2xl w-64 mb-6 animate-pulse"></div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-500 rounded-2xl animate-pulse"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-500 rounded-xl w-48 animate-pulse"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-500 rounded-lg w-64 animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-500 rounded w-32 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [notifications, setNotifications] = useState<string[]>([])

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Initial data fetch
    fetchDashboardData()

    // Set up periodic refresh (every 30 seconds)
    const interval = setInterval(() => {
      if (!refreshing) {
        fetchDashboardData(true) // Silent refresh
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [session, status, router])

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      if (silent) setRefreshing(true)

      const response = await fetch('/api/dashboard', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired, redirect to sign in
          router.push('/auth/signin')
          return
        }
        if (response.status === 500) {
          throw new Error('Database temporarily unavailable. Please try again in a moment.')
        }
        throw new Error(`Failed to load dashboard data (${response.status})`)
      }

      const dashboardData = await response.json()
      setData(dashboardData)
      setLastUpdated(new Date())

      // Check for new achievements or milestones
      checkForNotifications(dashboardData)

    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      setData({
        enrollments: [],
        userProgress: [],
        progressByProgram: {},
        trainerPrograms: [],
        totalWorkouts: 0,
        totalActivePrograms: 0,
        hasActiveSubscription: false,
        userRole: 'MEMBER',
        error: error.message || 'Unable to connect to database. Please check your connection and try again.'
      })

      // Add error notification
      addNotification('Failed to refresh dashboard data. Please check your connection.', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const checkForNotifications = (newData: any) => {
    const currentData = data
    if (!currentData) return

    // Check for completed programs
    const newCompletedPrograms = newData.enrollments.filter((e: any) =>
      newData.progressByProgram[e.program.id]?.percentage === 100 &&
      currentData.progressByProgram[e.program.id]?.percentage !== 100
    )

    newCompletedPrograms.forEach((enrollment: any) => {
      addNotification(`🎉 Congratulations! You completed "${enrollment.program.title}"!`, 'success')
    })

    // Check for new enrollments
    if (newData.enrollments.length > currentData.enrollments.length) {
      addNotification('New program enrolled! Check your active programs.', 'info')
    }

    // Check nutrition streak achievements: notify when crossing 7-day milestone
    const prevStreak = currentData.nutritionStreak || 0
    const newStreak = newData.nutritionStreak || 0
    if (newStreak >= 7 && prevStreak < 7) {
      addNotification(`🔥 Nutrition streak ${newStreak} days — 7-day milestone achieved!`, 'success')
    }
  }

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, `${type}:${id}:${message}`])

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => !n.includes(id)))
    }, 5000)
  }

  const dismissNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index))
  }

  const handleRefresh = () => {
    fetchDashboardData()
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      await update() // Update session
      router.push('/auth/signin')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (status === 'loading' || loading) {
    return <DashboardSkeleton />
  }

  if (!session || !data) {
    return null
  }

  // Extract data from API response
  const {
    enrollments,
    userProgress,
    progressByProgram,
    trainerPrograms,
    totalWorkouts,
    totalActivePrograms,
    hasActiveSubscription,
    nutritionStreak = 0,
    userRole,
    error
  } = data

  // Show error message if database connection failed
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
                  onClick={() => fetchDashboardData()}
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

  const isTrainerOrAdmin = userRole === 'TRAINER' || userRole === 'ADMIN'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-rose-50 dark:from-slate-950 dark:via-purple-950 dark:to-rose-950">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Header Section */}
        <div className="mb-12">
          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="mb-6 space-y-3">
              {notifications.map((notification, index) => {
                const [type, id, message] = notification.split(':')
                const bgColor = type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                           type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                           'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                const textColor = type === 'success' ? 'text-green-800 dark:text-green-200' :
                             type === 'error' ? 'text-red-800 dark:text-red-200' :
                             'text-blue-800 dark:text-blue-200'
                const icon = type === 'success' ? CheckCircle : type === 'error' ? '⚠️' : 'ℹ️'

                return (
                  <div key={index} className={`flex items-center gap-3 ${bgColor} border rounded-2xl p-4 shadow-lg animate-fade-in-up`}>
                    <div className="flex-shrink-0">
                      {type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> :
                       type === 'error' ? <div className="text-red-600 text-lg">⚠️</div> :
                       <div className="text-blue-600 text-lg">ℹ️</div>}
                    </div>
                    <p className={`flex-1 text-sm font-medium ${textColor}`}>{message}</p>
                    <button
                      onClick={() => dismissNotification(index)}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-800">
              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Elite Access</span>
            </div>

            <div className="flex items-center gap-3">
              {lastUpdated && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300 font-medium rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          <h1 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4">
            Hello, <span className="bg-gradient-to-r from-purple-600 via-rose-600 to-amber-600 bg-clip-text text-transparent">{session.user?.name || 'Fitness Elite'}</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            Welcome to your exclusive fitness journey with our 5 world-class coaches. Access premium programs designed for elite athletes like you.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              title: totalActivePrograms.toString(),
              subtitle: 'Active Programs',
              icon: Dumbbell,
              color: 'from-purple-600 to-rose-600',
              bgColor: 'from-purple-50 to-rose-50 dark:from-purple-900/20 dark:to-rose-900/20',
              change: 'Programs in progress',
              description: 'Keep pushing forward!',
              href: '/dashboard/programs'
            },
            {
              title: totalWorkouts.toString(),
              subtitle: 'Exercises Done',
              icon: TrendingUp,
              color: 'from-emerald-600 to-teal-600',
              bgColor: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
              change: 'Total completed',
              description: 'Great progress!',
              href: '/dashboard/workouts'
            },
            {
              title: nutritionStreak.toString(),
              subtitle: 'Nutrition Streak',
              icon: Target,
              color: 'from-amber-600 to-yellow-600',
              bgColor: 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
              change: 'Days in a row',
              description: 'Stay consistent!',
              href: '/dashboard/streak'
            },
            {
              title: Math.min(totalWorkouts, 12).toString(),
              subtitle: 'Achievements',
              icon: Award,
              color: 'from-rose-600 to-pink-600',
              bgColor: 'from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20',
              change: 'Unlocked',
              description: 'Keep earning badges!',
              href: '/dashboard/achievements'
            }
          ].map((stat, i) => (
            <Link
              key={i}
              href={stat.href}
              className={`group relative bg-gradient-to-br ${stat.bgColor} rounded-3xl p-6 border border-gray-100 dark:border-slate-800 hover:shadow-2xl dark:hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer`}
            >
              {/* Animated background overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

              {/* Floating particles */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-current opacity-20 rounded-full animate-ping group-hover:animate-pulse"></div>
              <div className="absolute top-6 right-6 w-1 h-1 bg-current opacity-30 rounded-full animate-pulse group-hover:animate-ping"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-right flex-1">
                    <div className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                      {stat.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.subtitle}</div>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-green-600 dark:text-green-400 font-semibold">{stat.change}</div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
                </div>

                {/* Progress bar for achievements */}
                {stat.subtitle === 'Achievements' && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${stat.color} h-1.5 rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${(parseInt(stat.title) / 12) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.description}</p>
                  </div>
                )}

                {/* Achievement badge for nutrition streak */}
                {stat.subtitle === 'Nutrition Streak' && parseInt(stat.title) >= 7 && (
                  <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full animate-bounce">
                    <Award className="h-3 w-3" />
                    Week Warrior!
                  </div>
                )}

                {stat.subtitle !== 'Achievements' && stat.subtitle !== 'Nutrition Streak' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {stat.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
              <p className="text-gray-600 dark:text-gray-400">Access your premium fitness experience</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Start Workout',
                description: 'Begin your next session',
                icon: Play,
                href: '/programs',
                color: 'from-emerald-600 to-teal-600',
                bgColor: 'hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20'
              },
              {
                title: 'View Programs',
                description: 'Browse exclusive courses',
                icon: BookOpen,
                href: '/programs',
                color: 'from-purple-600 to-rose-600',
                bgColor: 'hover:from-purple-50 hover:to-rose-50 dark:hover:from-purple-900/20 dark:hover:to-rose-900/20'
              },
              {
                title: 'Track Progress',
                description: 'Monitor your elite journey',
                icon: BarChart3,
                href: '/profile',
                color: 'from-amber-600 to-yellow-600',
                bgColor: 'hover:from-amber-50 hover:to-yellow-50 dark:hover:from-amber-900/20 dark:hover:to-yellow-900/20'
              },
              {
                title: 'Nutrition Guide',
                description: 'Premium fueling strategies',
                icon: Apple,
                href: '/nutrition',
                color: 'from-rose-600 to-pink-600',
                bgColor: 'hover:from-rose-50 hover:to-pink-50 dark:hover:from-rose-900/20 dark:hover:to-pink-900/20'
              }
            ].map((action, index) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className={`group relative bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-gray-200 dark:border-slate-600 ${action.bgColor} transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1`}
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                    {action.description}
                  </p>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
              <p className="text-gray-600 dark:text-gray-400">Your exclusive fitness journey milestones</p>
            </div>
          </div>

          <div className="space-y-4">
            {totalWorkouts > 0 ? (
              <>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-100 dark:border-green-800">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">Workout Completed!</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Great job on finishing your latest session</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
                  </div>
                </div>

                {totalActivePrograms > 0 && (
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">Program Progress</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">You're making excellent progress on your programs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">This week</p>
                    </div>
                  </div>
                )}

                {totalWorkouts >= 7 && (
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl border border-yellow-100 dark:border-yellow-800">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <Flame className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">Streak Milestone!</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">You've maintained a 7-day workout streak</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ongoing</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Activity className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Activity Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Begin your exclusive fitness journey with our world-class coaches.
                </p>
                <Link
                  href="/programs"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 via-rose-600 to-amber-600 hover:from-purple-700 hover:via-rose-700 hover:to-amber-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Crown className="h-5 w-5" />
                  Begin Elite Journey
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Enrolled Programs */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 via-rose-600 to-amber-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Your Premium Programs</h2>
                    <p className="text-blue-100">Exclusive training with our 5 world-class coaches</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {enrollments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Dumbbell className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Programs Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                      Begin your exclusive fitness journey by enrolling in programs from our 5 world-class coaches.
                    </p>
                    <Link
                      href="/programs"
                      className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <Play className="h-5 w-5" />
                      Browse Programs
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrollments.map((enrollment: any) => {
                      const progress = progressByProgram[enrollment.program.id]
                      return (
                        <div key={enrollment.id} className="group relative bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                          {/* Animated background overlay */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                          {/* Completion badge */}
                          {progress?.percentage === 100 && (
                            <div className="absolute top-4 right-4 z-10">
                              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-bounce">
                                <Award className="h-3 w-3" />
                                Completed!
                              </div>
                            </div>
                          )}

                          <div className="relative z-10 flex items-start gap-4">
                            <div className={`w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 ${progress?.percentage === 100 ? 'from-green-500 to-emerald-500' : ''}`}>
                              {progress?.percentage === 100 ? (
                                <CheckCircle className="h-8 w-8 text-white" />
                              ) : (
                                <Dumbbell className="h-8 w-8 text-white" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {enrollment.program.title}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                                {enrollment.program.description}
                              </p>

                              <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">{enrollment.program.workouts?.length || 0} workouts</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">{progress?.completed || 0} completed</span>
                                </div>
                                {progress?.percentage === 100 && (
                                  <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                    <span className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold">Mastered!</span>
                                  </div>
                                )}
                              </div>

                              <div className="mb-4">
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
                                {/* Progress milestones */}
                                <div className="flex justify-between mt-2">
                                  {[25, 50, 75, 100].map((milestone) => (
                                    <div
                                      key={milestone}
                                      className={`w-2 h-2 rounded-full ${
                                        (progress?.percentage || 0) >= milestone
                                          ? 'bg-blue-500'
                                          : 'bg-gray-300 dark:bg-slate-500'
                                      }`}
                                    ></div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <Link
                                  href={`/programs/${enrollment.program.id}/videos`}
                                  className={`inline-flex items-center gap-2 font-semibold rounded-xl px-4 py-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
                                    progress?.percentage === 100
                                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white'
                                      : 'bg-gradient-to-r from-purple-600 via-rose-600 to-amber-600 hover:from-purple-700 hover:via-rose-700 hover:to-amber-700 text-white'
                                  }`}
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

                                {progress?.percentage === 100 && (
                                  <Link
                                    href={`/programs/${enrollment.program.id}`}
                                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                    Restart
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Trainer Section */}
            {isTrainerOrAdmin && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Crown className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Trainer Programs</h2>
                      <p className="text-purple-100">Exclusive content for fitness professionals</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {trainerPrograms.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Crown className="h-10 w-10 text-purple-400 dark:text-purple-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Courses Yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                        Start creating fitness courses to share your expertise with learners worldwide.
                      </p>
                      <Link
                        href="/trainer/create"
                        className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <Plus className="h-5 w-5" />
                        Create Course
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {trainerPrograms.map((program: any) => (
                        <div key={program.id} className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                              <Award className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{program.title}</h3>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">{program._count?.enrollments || 0} students • {program._count?.workouts || 0} workouts</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${program.published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'}`}>
                              {program.published ? 'Published' : 'Draft'}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">Premium Content</span>
                            </div>
                            <div className="flex gap-3">
                              <Link
                                href={`/trainer/programs/${program.id}/edit`}
                                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-colors"
                              >
                                Edit
                              </Link>
                              <Link
                                href={`/programs/${program.id}`}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Card - Sidebar */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="sticky top-8">
              <DashboardProfileCard
                user={{
                  ...session.user,
                  name: session.user?.name ?? null
                }}
                totalWorkouts={totalWorkouts}
                totalActivePrograms={totalActivePrograms}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}