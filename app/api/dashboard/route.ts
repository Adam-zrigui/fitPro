import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user enrollments, progress and trainer programs with error handling
    let enrollments: any[] = []
    let userProgress: any[] = []
    const progressByProgram: Record<string, { completed: number; total: number; percentage: number }> = {}
    let trainerPrograms: any[] = []
    let totalWorkouts = 0
    let totalActivePrograms = 0
    let hasActiveSubscription = false

    // Add retry logic for database connection issues
    const executeWithRetry = async (operation: () => Promise<any>, maxRetries = 3) => {
      let lastError: any = null
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation()
        } catch (error: any) {
          lastError = error
          if (error.code === 'P1001' && attempt < maxRetries) {
            // Database connection error, wait and retry
            console.log(`Database connection failed, retrying (${attempt}/${maxRetries})...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
            continue
          }
          throw error
        }
      }
      throw lastError
    }

    // Check if user has active subscription with retry
    const user = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          subscriptionStatus: true,
          subscriptionId: true,
        }
      })
    )

    hasActiveSubscription = user?.subscriptionStatus === 'active' || !!user?.subscriptionId

    // If user has active subscription, get ALL programs (subscription grants access to all)
    // Otherwise, get only explicit enrollments
    if (hasActiveSubscription) {
      const programs = await executeWithRetry(() =>
        prisma.program.findMany({
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
      )

      enrollments = programs.map((program: any) => ({
        program,
        active: true,
        userId: session.user.id
      }))
    } else {
      // Get only explicit enrollments for non-subscribed users
      enrollments = await executeWithRetry(() =>
        prisma.enrollment.findMany({
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
      )
    }

    // Get user progress with retry
    userProgress = await executeWithRetry(() =>
      prisma.progress.findMany({
        where: { userId: session.user.id },
        include: { exercise: { include: { workout: true } } }
      })
    )

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

    // Get trainer's created programs with retry
    trainerPrograms = session.user.role === 'TRAINER' || session.user.role === 'ADMIN'
      ? await executeWithRetry(() =>
          prisma.program.findMany({
            where: { trainerId: session.user.id },
            include: {
              _count: { select: { enrollments: true, workouts: true } }
            },
            orderBy: { createdAt: 'desc' }
          })
        )
      : []

    totalWorkouts = userProgress.length
    totalActivePrograms = enrollments.length

    return NextResponse.json({
      enrollments,
      userProgress,
      progressByProgram,
      trainerPrograms,
      totalWorkouts,
      totalActivePrograms,
      hasActiveSubscription,
      userRole: session.user.role
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}