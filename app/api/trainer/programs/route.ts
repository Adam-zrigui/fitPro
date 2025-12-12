import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const programs = await prisma.program.findMany({
      where: { trainerId: session.user.id },
      include: {
        _count: {
          select: { enrollments: true, workouts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(programs)
  } catch (error) {
    console.error('Failed to fetch trainer programs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    )
  }
}
