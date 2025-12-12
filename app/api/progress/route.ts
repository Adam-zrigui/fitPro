import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { exerciseId, weight, notes } = await req.json()

    const progress = await prisma.progress.create({
      data: {
        userId: session.user.id,
        exerciseId,
        weight: weight ? parseFloat(weight) : null,
        notes,
      }
    })

    return NextResponse.json(progress, { status: 201 })
  } catch (error) {
    console.error('Progress tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track progress' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const exerciseId = searchParams.get('exerciseId')

    const where: any = { userId: session.user.id }
    if (exerciseId) {
      where.exerciseId = exerciseId
    }

    const progress = await prisma.progress.findMany({
      where,
      include: {
        exercise: {
          include: {
            workout: true
          }
        }
      },
      orderBy: { completedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(progress)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}
