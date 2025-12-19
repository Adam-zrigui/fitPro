import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import CourseOutline from '@/components/CourseOutline'
import ImageWithFallback from '@/components/ImageWithFallback'
import StaggerList from '@/components/StaggerList'
import { Clock, BarChart3, Award, CheckCircle, Video, Lock } from 'lucide-react'
import EnrollButton from './EnrollButton'
import DeleteProgramButton from '@/components/DeleteProgramButton'
// import ImageFallback from './ImageFallback'
// If the file exists elsewhere, update the path accordingly, e.g.:
// import ImageFallback from '@/components/ImageFallback'
// If the file exists elsewhere, update the path accordingly, e.g.:
// import Image from 'next/image' // Use next/image if needed

export default async function ProgramDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  let program: any = null
  try {
    program = await prisma.program.findUnique({
      where: { id: params.id },
      include: {
        trainer: true,
        parts: {
          orderBy: { id: 'asc' },
          include: {
            sections: {
              orderBy: { id: 'asc' }
            }
          }
        },
        workouts: {
          orderBy: [{ week: 'asc' }, { day: 'asc' }],
          include: {
            exercises: {
              orderBy: { order: 'asc' },
              include: {
                video: true,
              }
            }
          }
        },
        enrollments: session ? {
          where: { userId: session.user.id }
        } : false
      }
    })
  } catch (e) {
    // If DB is down, log and render a friendly fallback page
    // eslint-disable-next-line no-console
    console.error('Failed to load program detail:', e)
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="card text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Service temporarily unavailable</h2>
            <p className="text-muted mb-6">We're having trouble reaching the database. Please try again later.</p>
            <a href="/programs" className="btn-secondary">Back to Programs</a>
          </div>
        </div>
      </div>
    )
  }

  if (!program) {
    notFound()
  }

  // Fetch user subscription from DB for most accurate enrollment check
  let dbUserSubscription = null
  if (session?.user?.id) {
    dbUserSubscription = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionStatus: true, subscriptionId: true }
    })
  }
  // Check subscription: DB first (most reliable after webhook). We avoid
  // trusting session-only subscription flags where possible.
  const hasSubscription = Boolean(
    dbUserSubscription?.subscriptionStatus === 'active' || dbUserSubscription?.subscriptionId
  ) || Boolean(session && (session.user?.subscriptionStatus === 'active' || session.user?.subscriptionId))

  // Check enrollment: server returned filtered enrollments for the current
  // user when a session is present. Use that first; otherwise rely on
  // subscription status.
  const userIsEnrolled = Boolean(session && program.enrollments && program.enrollments.length > 0)
  const isEnrolled = userIsEnrolled || hasSubscription

  // Fetch subscription price details to display in the sidebar (read-only)
  let subscriptionPriceLabel: string | null = null
  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' })

    // Find product with our metadata tag
    const products = await stripe.products.list({ limit: 100, active: true })
    const existingProduct = products.data.find(p => p.metadata?.type === 'fitpro_main_subscription')

    if (existingProduct) {
      const prices = await stripe.prices.list({ product: existingProduct.id, type: 'recurring', active: true })
      const price = prices.data?.[0]
      if (price && typeof price.unit_amount === 'number') {
        const amount = price.unit_amount
        const currency = price.currency || 'usd'
        subscriptionPriceLabel = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
      }
    }
  } catch (err) {
    // ignore pricing failures - we'll fall back to a generic CTA
    // eslint-disable-next-line no-console
    console.warn('Could not fetch subscription price:', err)
  }

  // Map Prisma results to a clean DTO shape expected by CourseOutline
  const safeWorkouts = program.workouts.map((w: any) => ({
    week: w.week,
    day: w.day,
    title: w.title,
    // duration: w.duration ?? undefined, // Removed because 'duration' does not exist on workout
    exercises: (w.exercises || []).map((e: any) => {
      const linkedVideo = e.video ?? null
      const inferredVideoUrl = linkedVideo ? (linkedVideo.directUrl || linkedVideo.cloudinaryUrl || linkedVideo.youtubeUrl || linkedVideo.vimeoUrl || null) : null
      return {
        id: e.id,
        name: e.name,
        order: e.order,
        // preserve legacy videoUrl field for UI checks while preferring linked video
        videoUrl: e.videoUrl ?? inferredVideoUrl ?? undefined,
        instructions: e.instructions ?? undefined,
        video: linkedVideo
          ? {
              id: linkedVideo.id,
              title: linkedVideo.title ?? undefined,
              url: inferredVideoUrl ?? undefined,
            }
          : undefined,
      }
    }),
  }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      
      <div className="content-container py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <div className="relative h-80 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 dark:from-blue-800 dark:via-purple-800 dark:to-pink-700 overflow-hidden">
                {program.imageUrl && (
                  <ImageWithFallback
                    src={program.imageUrl}
                    alt={program.title}
                    className="w-full h-full object-cover"
                    fallback="gradient"
                  />
                )}
                {/* Animated background elements */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-10 right-10 w-52 h-52 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
                
                {/* Content overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                      <span className="text-white/80 text-sm font-semibold tracking-widest">PREMIUM PROGRAM</span>
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                    <h2 className="text-white font-black text-4xl md:text-5xl leading-tight drop-shadow-lg">{program.title}</h2>
                    <p className="text-white/90 text-lg max-w-2xl drop-shadow-md font-medium">{program.trainer.name} • {program.duration}-Week Program</p>
                  </div>
                </div>
                
                {/* Bottom gradient overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-slate-900 to-transparent"></div>
              </div>

              <span className={`badge ${
                program.level === 'Beginner' ? 'badge-success' :
                program.level === 'Intermediate' ? 'badge-warning' :
                'badge-info'
              } mb-4 inline-block`}>
                {program.level}
              </span>

              <h1 className="text-4xl font-extrabold mb-4 text-gray-900 dark:text-gray-50">{program.title}</h1>
              <p className="text-lg text-secondary mb-8 leading-relaxed">{program.description}</p>

              <div className="flex gap-8 mb-8 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-secondary">Duration</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-50">{program.duration} weeks</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-secondary">Workouts</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-50">{program.workouts.length} total</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Video className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-secondary">Videos</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-50">Included</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-secondary">Certificate</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-50">Upon completion</p>
                  </div>
                </div>
              </div>

              {program.learningOutcomes && (
                <div className="border-t border-gray-200 dark:border-slate-700 pt-8 mb-8">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-50">What You'll Learn</h2>
                  <StaggerList className="space-y-3 grid sm:grid-cols-2 gap-4" staggerMs={40} animationClass="animate-fade-in">
                    {program.learningOutcomes.split('|').map((outcome: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-secondary">{outcome.trim()}</span>
                      </li>
                    ))}
                  </StaggerList>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-slate-700 pt-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-50">About the Trainer</h2>
                <div className="flex items-center gap-5 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-3xl">👤</span>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-900 dark:text-gray-50">{program.trainer.name}</p>
                    <p className="text-sm text-secondary">Certified Fitness Trainer</p>
                  </div>
                </div>
              </div>
            </div>

            {isEnrolled || (session && (session.user?.id === program.trainerId || session.user?.role === 'ADMIN')) ? (
              <div className="card bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-md">
                <CourseOutline
                  programId={program.id}
                  title={program.title}
                  workouts={safeWorkouts}
                  isEnrolled={!!(isEnrolled || (session && (session.user?.id === program.trainerId || session.user?.role === 'ADMIN')))}
                />
              </div>
            ) : (
              <div className="card bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-md relative overflow-hidden">
                <div className="blur-sm pointer-events-none select-none">
                  <CourseOutline
                    programId={program.id}
                    title={program.title}
                    workouts={safeWorkouts}
                    isEnrolled={!!(isEnrolled || (session && (session.user?.id === program.trainerId || session.user?.role === 'ADMIN')))}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <div className="text-center">
                    <Lock className="h-12 w-12 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
                    <p className="text-gray-900 dark:text-gray-50 font-semibold">Subscribe to view course outline</p>
                  </div>
                </div>
              </div>
            )}

            {/* Program Parts and Sections */}
            {program.parts && program.parts.length > 0 && (
              <div className="card bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-md">
                <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-50">Course Content</h3>
                <div className="space-y-6">
                  {program.parts.map((part: any, partIndex: number) => (
                    <div key={part.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                      <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-50">
                        Part {partIndex + 1}: {part.name}
                      </h4>
                      {part.description && (
                        <p className="text-secondary mb-4">{part.description}</p>
                      )}
                      <div className="space-y-3">
                        {part.sections.map((section: any) => (
                          <div key={section.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 dark:text-gray-50">{section.title}</h5>
                              {section.url && (
                                <div className="mt-2">
                                  {section.mediaType === 'video' ? (
                                    <video
                                      src={section.url}
                                      controls
                                      className="w-full max-w-md rounded-lg"
                                      preload="metadata"
                                    />
                                  ) : (
                                    <img
                                      src={section.url}
                                      alt={section.title}
                                      className="w-full max-w-md rounded-lg object-cover"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isEnrolled && !(session && (session.user.id === program.trainerId || session.user.role === 'ADMIN')) && (
              <div className="card bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex-shrink-0">
                    <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">
                      Course Content Locked
                    </h3>
                    <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">
                      Subscribe to unlock the full course including all videos, exercises, and progress tracking.
                    </p>
                    {session ? (
                      <EnrollButton programId={program.id} />
                    ) : (
                      <a href="/auth/signin" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors">
                        Sign in to Subscribe
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isEnrolled && (
              <div className="card bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-md">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-50">Program Schedule</h2>
                  <StaggerList className="space-y-4" staggerMs={70} animationClass="animate-fade-in-up">
                    {[...Array(program.duration)].map((_, week) => {
                      const weekWorkouts = program.workouts.filter((w: any) => w.week === week + 1)
                      return (
                        <div key={week} className="border border-gray-200 dark:border-slate-700 rounded-lg p-5 hover:shadow-md transition-shadow">
                          <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-50">Week {week + 1}</h3>
                          <div className="space-y-3">
                            {weekWorkouts.map((workout: any) => (
                              <div key={workout.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800/50 dark:to-slate-800/30 rounded-lg hover:from-gray-100 hover:to-gray-200 dark:hover:from-slate-700/50 dark:hover:to-slate-700/30 transition-colors">
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-gray-50">Day {workout.day}: {workout.title}</p>
                                  <p className="text-sm text-secondary">{workout.exercises.length} exercises</p>
                                </div>
                                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </StaggerList>
                </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="card sticky top-8 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-lg">
              <div className="text-center mb-8">
                <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 mb-2">Unlimited Access</p>
                <p className="text-secondary text-lg">{subscriptionPriceLabel ? `${subscriptionPriceLabel}/month` : 'Subscribe for all programs'}</p>
              </div>

              {session ? (
                isEnrolled ? (
                  <div className="text-center space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg font-semibold">
                      ✓ You have active subscription
                    </div>
                    <a href={`/programs/${program.id}/videos`} className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-95">
                      Start Course
                    </a>
                  </div>
                ) : session.user.id === program.trainerId || session.user.role === 'ADMIN' ? (
                  <div className="text-center space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg font-semibold">
                      ✓ You own this course
                    </div>
                    <a href={`/programs/${program.id}/videos`} className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-95">
                      View Course
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-4 py-3 rounded-lg font-semibold flex items-center gap-2 justify-center">
                      <Lock className="h-5 w-5" />
                      <span>Course Locked</span>
                    </div>
                    <EnrollButton programId={program.id} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Subscribe to unlock this course and 100+ other programs
                    </p>
                  </div>
                )
              ) : (
                <a href="/auth/signin" className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-95">
                  Sign in to Subscribe
                </a>
              )}

              {/* Delete program for trainer or admin */}
              {session && (session.user.id === program.trainerId || session.user.role === 'ADMIN') && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                  <DeleteProgramButton programId={program.id} />
                </div>
              )}

              <div className="mt-8 space-y-4">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">What's Included</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-secondary">All programs with one subscription</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-secondary">Video for every exercise</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-secondary">Progress tracking</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-secondary">Nutrition plans</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-secondary">Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
