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

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        program: {
          include: {
            trainer: true,
            workouts: true,
          }
        }
      },
      orderBy: { startDate: 'desc' }
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { programId } = await req.json()

    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_programId: {
          userId: session.user.id,
          programId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Already enrolled in this program' },
        { status: 400 }
      )
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        programId,
        active: true,
      },
      include: {
        program: true
      }
    })

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    console.error('Enrollment error:', error)
    return NextResponse.json(
      { error: 'Failed to create enrollment' },
      { status: 500 }
    )
  }
}
