import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Clock, BarChart3, Lock, Play, Star, Award, Users, Target, Zap } from 'lucide-react'
import SubscriptionPrice from './SubscriptionPrice'
import LazyCourseOutline from './LazyCourseOutline'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function ProgramDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  const program = await prisma.program.findUnique({
    where: { id: params.id },
    include: {
      trainer: {
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
        }
      },
      _count: { select: { workouts: true } }
    }
  })

  if (!program) {
    notFound()
  }

  // Check if user is enrolled
  const isEnrolled = session ? await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id,
      programId: program.id,
      active: true
    }
  }) : null

  // Admin and Trainer users have access to all programs
  const hasAccess = isEnrolled || (session && (session.user.role === 'ADMIN' || session.user.role === 'TRAINER'))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-indigo-600/90"></div>
        {program.imageUrl && (
          <div className="absolute inset-0">
            <img
              src={program.imageUrl}
              alt={program.title}
              className="w-full h-full object-cover opacity-20"
            />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Star className="h-4 w-4 text-yellow-300 fill-current" />
              <span className="text-white/90 text-sm font-medium">
                {program.level === 'Beginner' ? 'Perfect for Beginners' :
                 program.level === 'Intermediate' ? 'Intermediate Level' : 'Advanced Training'}
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight">
              {program.title}
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              {program.description}
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">{program.duration} Weeks</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                <span className="font-semibold">{program._count.workouts} Workouts</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="font-semibold">{program.trainer.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Program Overview Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="p-8 lg:p-12">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Program Overview</h2>
                    <p className="text-gray-600 dark:text-gray-400">Everything you need to know about this course</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 text-center">
                    <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{program.duration}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Weeks</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 text-center">
                    <Target className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{program._count.workouts}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Workouts</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 text-center">
                    <Award className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{program.level}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
                  </div>
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    {program.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Trainer Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="p-8 lg:p-12">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Meet Your Trainer</h2>
                    <p className="text-gray-600 dark:text-gray-400">Learn from the best in the industry</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center flex-shrink-0">
                    <span className="text-4xl">👤</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{program.trainer.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Certified Fitness Professional & Expert Trainer</p>
                    {program.trainer.bio && (
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic">
                          "{program.trainer.bio}"
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
                        🏆 Certified Trainer
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium">
                        ⭐ {program.duration * 2}+ Years Experience
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium">
                        🎯 {program._count.workouts * 10}+ Happy Clients
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Content */}
            {hasAccess && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-8 lg:p-12">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Content</h2>
                      <p className="text-gray-600 dark:text-gray-400">Your complete workout journey</p>
                    </div>
                  </div>

                  <Suspense fallback={
                    <div className="space-y-4">
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
                        <div className="space-y-3">
                          {Array.from({length: 5}).map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 dark:bg-slate-700 rounded-2xl"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  }>
                    <LazyCourseOutline
                      programId={program.id}
                      isEnrolled={true}
                    />
                  </Suspense>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-4">
                      <Star className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Premium Access</h3>
                    <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">
                      <SubscriptionPrice />
                      <span className="text-lg font-normal text-gray-600 dark:text-gray-400">/month</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Premium access to all programs</p>
                  </div>

                  {session ? (
                    hasAccess ? (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <Award className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-800 dark:text-green-300">
                                {session.user.role === 'ADMIN' || session.user.role === 'TRAINER' ? 'Admin Access' : 'Premium Member'}
                              </p>
                              <p className="text-sm text-green-600 dark:text-green-400">Full access unlocked</p>
                            </div>
                          </div>
                        </div>
                        <a
                          href={`/programs/${program.id}/videos`}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
                        >
                          <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          Start Training
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                          <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            <div>
                              <p className="font-semibold text-amber-800 dark:text-amber-300">Course Locked</p>
                              <p className="text-sm text-amber-600 dark:text-amber-400">Subscribe to unlock</p>
                            </div>
                          </div>
                        </div>
                        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                          Subscribe Now
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-center">
                        <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                        <p className="font-semibold text-blue-800 dark:text-blue-300">Join Our Community</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Sign in to access premium content</p>
                      </div>
                      <a
                        href="/auth/signin"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center block"
                      >
                        Sign In to Continue
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
