import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: {
        id: true,
        programId: true,
        program: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    // If DB is down, return sample enrollments in dev to allow UI inspection
    // @ts-ignore
    const code = error && (error.code || (error instanceof Error && (error as any).cause?.code))
    if (code === 'P1001' && process.env.NODE_ENV !== 'production') {
      const sample = [
        { id: 'e_local_1', programId: 'p_local_1', program: { id: 'p_local_1', title: 'Full Body Bootcamp' } },
        { id: 'e_local_2', programId: 'p_local_2', program: { id: 'p_local_2', title: 'Strength Foundations' } }
      ]
      return NextResponse.json(sample)
    }
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}
