import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get basic counts
    const totalUsers = await prisma.user.count()
    const totalPrograms = await prisma.program.count()
    const totalEnrollments = await prisma.enrollment.count()
    
    // Get revenue
    const revenueResult = await prisma.payment.aggregate({
      _sum: { amount: true }
    })
    const totalRevenue = revenueResult._sum.amount || 0

    // Get active subscriptions (guarded because client/schema may be out-of-sync)
    let activeSubscriptions = 0
    try {
      activeSubscriptions = await prisma.user.count({ where: { subscriptionStatus: 'active' } })
    } catch (err) {
      console.warn('Could not query subscriptionStatus (maybe prisma client is out-of-date):', err)
      activeSubscriptions = 0
    }

    // Get top programs by enrollments
    const topPrograms = await prisma.program.findMany({
      select: {
        title: true,
        _count: { select: { enrollments: true } }
      },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 5
    })

    // Get real monthly growth data
    const currentDate = new Date()
    const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1)

    // Get user growth by month
    const userGrowth = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as users
      FROM "User"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month
    ` as Array<{ month: Date; users: bigint }>

    // Get enrollment growth by month
    const enrollmentGrowth = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "startDate") as month,
        COUNT(*) as enrollments
      FROM "Enrollment"
      WHERE "startDate" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "startDate")
      ORDER BY month
    ` as Array<{ month: Date; enrollments: bigint }>

    // Combine user and enrollment data
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })

      const userData = userGrowth.find(u => {
        const uMonth = new Date(u.month)
        return uMonth.getMonth() === date.getMonth() && uMonth.getFullYear() === date.getFullYear()
      })

      const enrollmentData = enrollmentGrowth.find(e => {
        const eMonth = new Date(e.month)
        return eMonth.getMonth() === date.getMonth() && eMonth.getFullYear() === date.getFullYear()
      })

      months.push({
        month: monthName,
        users: Number(userData?.users || 0),
        enrollments: Number(enrollmentData?.enrollments || 0)
      })
    }

    // Get user satisfaction (average rating)
    const ratingStats = await prisma.rating.aggregate({
      _count: { id: true },
      _avg: { score: true }
    })
    const userSatisfaction = ratingStats._avg.score ? Number(ratingStats._avg.score.toFixed(1)) : 0
    const totalReviews = ratingStats._count.id

    // Calculate completion rate
    // A program is considered completed if the user has completed all workouts in the program
    const totalEnrollmentsCount = await prisma.enrollment.count()
    let completedPrograms = 0

    if (totalEnrollmentsCount > 0) {
      // Get all enrollments with program details
      const enrollments = await prisma.enrollment.findMany({
        include: {
          program: {
            include: {
              workouts: true
            }
          },
          user: {
            select: {
              id: true,
              progress: {
                select: {
                  exerciseId: true,
                  completedAt: true
                }
              }
            }
          }
        }
      })

      for (const enrollment of enrollments) {
        const totalWorkouts = enrollment.program.workouts.length
        if (totalWorkouts === 0) continue

        // Get all exercises in the program
        const programExercises = await prisma.exercise.findMany({
          where: {
            workoutId: {
              in: enrollment.program.workouts.map(w => w.id)
            }
          },
          select: { id: true }
        })

        const totalExercises = programExercises.length
        const completedExerciseIds = new Set(
          enrollment.user.progress
            .filter(p => p.completedAt !== null)
            .map(p => p.exerciseId)
        )
        const completedExercises = programExercises.filter(ex => completedExerciseIds.has(ex.id)).length

        // Consider program completed if user has completed at least 80% of exercises
        if (totalExercises > 0 && (completedExercises / totalExercises) >= 0.8) {
          completedPrograms++
        }
      }
    }

    const completionRate = totalEnrollmentsCount > 0
      ? Number(((completedPrograms / totalEnrollmentsCount) * 100).toFixed(1))
      : 0

    // Calculate average session time
    // Estimate based on progress entries per user per day (assuming 1-2 sessions per day)
    const progressStats = await prisma.progress.findMany({
      select: {
        userId: true,
        completedAt: true
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 1000 // Sample recent progress entries
    })

    // Filter out null completedAt values in code
    const validProgressStats = progressStats.filter(p => p.completedAt !== null)

    let avgSessionTimeMinutes = 30 // default fallback

    if (validProgressStats.length > 0 && totalUsers > 0) {
      // Group progress by user and date to estimate sessions
      const userSessions: { [key: string]: { [date: string]: number } } = {}

      validProgressStats.forEach(progress => {
        const userId = progress.userId
        const date = progress.completedAt!.toISOString().split('T')[0] // YYYY-MM-DD

        if (!userSessions[userId]) {
          userSessions[userId] = {}
        }
        userSessions[userId][date] = (userSessions[userId][date] || 0) + 1
      })

      // Calculate average exercises per session per user
      let totalExercisesInSessions = 0
      let totalSessions = 0

      Object.values(userSessions).forEach(userDays => {
        Object.values(userDays).forEach(exercisesInDay => {
          // Assume each day represents 1-2 sessions
          const sessionsInDay = Math.max(1, Math.ceil(exercisesInDay / 8)) // Assume ~8 exercises per session
          totalSessions += sessionsInDay
          totalExercisesInSessions += exercisesInDay
        })
      })

      if (totalSessions > 0) {
        const avgExercisesPerSession = totalExercisesInSessions / totalSessions
        // Estimate 3-5 minutes per exercise + 5 minute warm-up/cooldown
        avgSessionTimeMinutes = Math.round((avgExercisesPerSession * 4) + 5)
      }
    }

    const avgSessionTime = avgSessionTimeMinutes >= 60
      ? `${Math.floor(avgSessionTimeMinutes / 60)}h ${avgSessionTimeMinutes % 60}m`
      : `${avgSessionTimeMinutes}m`

    return NextResponse.json({
      totalUsers,
      totalPrograms,
      totalEnrollments,
      totalRevenue,
      activeSubscriptions,
      monthlyGrowth: months,
      topPrograms: topPrograms.map(p => ({
        title: p.title,
        enrollments: p._count.enrollments
      })),
      userSatisfaction,
      totalReviews,
      completionRate,
      avgSessionTime
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
