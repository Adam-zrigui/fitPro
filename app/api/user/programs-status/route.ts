import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id, active: true },
      select: { programId: true }
    })

    // Get user favorites
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionStatus: true,
        subscriptionId: true,
        favorites: true
      }
    })

    const favorites = user?.favorites ? JSON.parse(user.favorites) : []
    const hasActiveSubscription = user?.subscriptionStatus === 'active' || !!user?.subscriptionId

    return NextResponse.json({
      enrolledProgramIds: enrollments.map(e => e.programId),
      favoriteProgramIds: favorites,
      hasActiveSubscription
    })
  } catch (error) {
    console.error('Failed to fetch user programs status:', error)
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
  }
}