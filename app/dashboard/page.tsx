import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Calendar, TrendingUp, Award, Dumbbell, Play, BookOpen, Plus, BarChart3, Clock, Users, Camera, Settings } from 'lucide-react'
import Link from 'next/link'
import DashboardProfileCard from '@/components/DashboardProfileCard'
export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Get user enrollments, progress and trainer programs with error handling
  let enrollments: any[] = []
  let userProgress: any[] = []
  const progressByProgram: Record<string, { completed: number; total: number; percentage: number }> = {}
  let trainerPrograms: any[] = []
  let totalWorkouts = 0
  let totalActivePrograms = 0
  let hasActiveSubscription = false

  try {
    // Check if user has active subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionStatus: true,
        subscriptionId: true,
      }
    })

    hasActiveSubscription = user?.subscriptionStatus === 'active' || !!user?.subscriptionId

    // If user has active subscription, get ALL programs (subscription grants access to all)
    // Otherwise, get only explicit enrollments
    if (hasActiveSubscription) {
      const programs = await prisma.program.findMany({
        where: { published: true },
        include: {
          trainer: true,
          workouts: {
            include: {
              exercises: true
            }
          },
          _count: { select: { enrollments: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      enrollments = programs.map(program => ({
        program,
        active: true,
        userId: session.user.id
      }))
    } else {
      // Get only explicit enrollments for non-subscribed users
      enrollments = await prisma.enrollment.findMany({
        where: { userId: session.user.id, active: true },
        include: {
          program: {
            include: {
              trainer: true,
              workouts: {
                include: {
                  exercises: true
                }
              },
              _count: { select: { enrollments: true } }
            }
          }
        }
      })
    }

    // Get user progress
    userProgress = await prisma.progress.findMany({
      where: { userId: session.user.id },
      include: { exercise: { include: { workout: true } } }
    })

    // Calculate progress per program
    enrollments.forEach(enrollment => {
      const programId = enrollment.program.id
      const totalExercises = enrollment.program.workouts.reduce((sum: number, w: any) => sum + w.exercises.length, 0) || 1
      const completedExercises = userProgress.filter(p => 
        p.exercise.workout.programId === programId
      ).length
      
      progressByProgram[programId] = {
        completed: completedExercises,
        total: totalExercises,
        percentage: Math.round((completedExercises / totalExercises) * 100)
      }
    })

    // Get trainer's created programs
    trainerPrograms = session.user.role === 'TRAINER' || session.user.role === 'ADMIN' 
      ? await prisma.program.findMany({
          where: { trainerId: session.user.id },
          include: {
            _count: { select: { enrollments: true, workouts: true } }
          },
          orderBy: { createdAt: 'desc' }
        })
      : []

    totalWorkouts = userProgress.length
    totalActivePrograms = enrollments.length
  } catch (error) {
    // If DB is unreachable, log and fall back to empty arrays so UI can render with sample/fallback state
    // eslint-disable-next-line no-console
    console.error('Dashboard data fetch failed:', error)
    enrollments = []
    userProgress = []
    trainerPrograms = []
    totalWorkouts = 0
    totalActivePrograms = 0
  }
  const isTrainerOrAdmin = session.user.role === 'TRAINER' || session.user.role === 'ADMIN'
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
      
      <div className="content-container py-8">
        {/* Profile Card with Picture */}
        <DashboardProfileCard 
          user={{
            ...session.user,
            name: session.user.name ?? null
          }}
          totalWorkouts={totalWorkouts}
          totalActivePrograms={totalActivePrograms}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Programs Card */}
          <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl p-6 hover:shadow-md dark:hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Active Programs</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-50 mt-2">{totalActivePrograms}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Programs in progress</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-500 dark:to-blue-700 p-4 rounded-full shadow-lg">
                <Dumbbell className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          {/* Exercises Done Card */}
          <div className="stat-card bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-900/20 dark:to-green-900/10 border border-green-200 dark:border-green-800/50 rounded-xl p-6 hover:shadow-md dark:hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Exercises Done</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-50 mt-2">{totalWorkouts}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">Total completed</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-500 dark:to-green-700 p-4 rounded-full shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          {/* Current Streak Card */}
          <div className="stat-card bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-900/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-6 hover:shadow-md dark:hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Current Streak</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-50 mt-2">{totalWorkouts > 0 ? '7' : '0'}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Days in a row</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-500 dark:to-amber-700 p-4 rounded-full shadow-lg">
                <Calendar className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          {/* Achievements Card */}
          <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800/50 rounded-xl p-6 hover:shadow-md dark:hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Achievements</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-50 mt-2">{Math.min(totalWorkouts, 12)}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">Unlocked</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-500 dark:to-purple-700 p-4 rounded-full shadow-lg">
                <Award className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Enrolled Courses Section */}
        <div className="card bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-md rounded-xl mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/10 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">My Enrolled Programs</h2>
                <p className="text-sm text-secondary mt-0.5">{totalActivePrograms} active {totalActivePrograms === 1 ? 'program' : 'programs'}</p>
              </div>
            </div>
            <Link href="/programs" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 font-medium text-sm rounded-lg transition-colors">
              Browse More
              <span>→</span>
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="py-16 px-6 flex flex-col items-center justify-center">
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-slate-900 dark:to-slate-800 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                <Play className="h-10 w-10 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Programs Yet</h3>
              <p className="text-secondary mb-6 max-w-sm text-center">
                Start your fitness journey by enrolling in a program. Browse our collection of expert-led courses.
              </p>
              <Link href="/programs" className="btn-primary">
                Explore Programs
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => {
                const progress = progressByProgram[enrollment.program.id]
                return (
                  <div
                    key={enrollment.id}
                    className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-slate-900 flex flex-col"
                  >
                    {/* Program Header */}
                    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 dark:from-blue-700 dark:via-blue-800 dark:to-cyan-800 p-6 text-white relative overflow-hidden">
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                      <h3 className="font-bold text-lg mb-1 relative z-10">{enrollment.program.title}</h3>
                      <p className="text-sm text-blue-100 dark:text-blue-200 relative z-10">by {enrollment.program.trainer.name}</p>
                    </div>

                    {/* Program Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="text-secondary font-semibold">Progress</span>
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-bold text-sm">
                            {progress.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-sm">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 h-3 rounded-full transition-all duration-500 shadow-lg"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted mt-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-50">{progress.completed}</span> of <span className="font-semibold text-gray-900 dark:text-gray-50">{progress.total}</span> exercises completed
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-slate-800">
                        <div className="text-sm bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                          <p className="text-muted text-xs font-semibold uppercase tracking-wide">Duration</p>
                          <p className="font-bold text-gray-900 dark:text-white mt-1 text-lg">{enrollment.program.duration}w</p>
                        </div>
                        <div className="text-sm bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                          <p className="text-muted text-xs font-semibold uppercase tracking-wide">Workouts</p>
                          <p className="font-bold text-gray-900 dark:text-white mt-1 text-lg">{enrollment.program.workouts.length}</p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link
                        href={`/programs/${enrollment.program.id}/videos`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 dark:from-blue-600 dark:to-cyan-700 dark:hover:from-blue-700 dark:hover:to-cyan-800 text-white rounded-lg font-semibold transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg mt-auto"
                      >
                        <Play className="h-5 w-5" />
                        Continue Program
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Trainer Section */}
        {isTrainerOrAdmin && (
          <div className="card bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-md rounded-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/10 p-3 rounded-lg">
                  <BookOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h2>
                  <p className="text-sm text-secondary mt-0.5">{trainerPrograms.length} {trainerPrograms.length === 1 ? 'course' : 'courses'}</p>
                </div>
              </div>
              <Link href="/trainer/create" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 dark:from-orange-600 dark:to-amber-700 dark:hover:from-orange-700 dark:hover:to-amber-800 text-white font-semibold rounded-lg transition-all active:scale-95 shadow-md">
                <Plus className="h-5 w-5" />
                New Course
              </Link>
            </div>

            {trainerPrograms.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900 dark:to-amber-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-10 w-10 text-orange-600 dark:text-orange-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Courses Yet</h3>
                <p className="text-secondary mb-6 max-w-sm mx-auto">
                  Start creating fitness courses to share your expertise with learners worldwide.
                </p>
                <Link href="/trainer/create" className="btn-primary">
                  Create Your First Course
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainerPrograms.map((program) => (
                  <div
                    key={program.id}
                    className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-slate-900 flex flex-col"
                  >
                    {/* Course Header */}
                    <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 dark:from-orange-700 dark:via-orange-800 dark:to-amber-800 p-6 text-white relative overflow-hidden">
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                      <div className="flex items-start justify-between relative z-10 mb-1">
                        <h3 className="font-bold text-lg flex-1">{program.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2 ${program.published ? 'bg-green-500/30 text-green-100 dark:bg-green-950/50 dark:text-green-200 border border-green-400/30' : 'bg-gray-500/30 text-gray-100 dark:bg-gray-950/50 dark:text-gray-300 border border-gray-400/30'}`}>
                          {program.published ? '✓ Published' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    {/* Course Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Stats */}
                      <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 dark:border-slate-800">
                        <div className="flex items-center justify-between text-sm bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                          <span className="text-secondary flex items-center gap-2 font-medium">
                            <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            Students
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white text-lg">{program._count.enrollments}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                          <span className="text-secondary flex items-center gap-2 font-medium">
                            <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            Workouts
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white text-lg">{program._count.workouts}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                          <span className="text-secondary flex items-center gap-2 font-medium">
                            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            Duration
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white text-lg">{program.duration}w</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-auto">
                        <Link
                          href={`/trainer/programs/${program.id}/edit`}
                          className="flex-1 text-center px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors text-sm active:scale-95"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/programs/${program.id}`}
                          className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 dark:from-orange-600 dark:to-amber-700 dark:hover:from-orange-700 dark:hover:to-amber-800 text-white rounded-lg font-semibold transition-all text-sm active:scale-95 shadow-md"
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
        )}
      </div>
    </div>
  )
}
