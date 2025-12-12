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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        subscriptionStatus: true,
        subscriptionId: true,
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    // If database is unreachable, return an empty list so the admin UI can render
    // and show a friendly empty state instead of crashing.
    // Prisma connection errors often have a `code` like 'P1001'.
    // Be conservative: if we detect a Prisma connection error, return []
    // otherwise return a generic 500 error.
    // @ts-ignore
    const code = error && (error.code || (error instanceof Error && (error as any).cause?.code))
    if (code === 'P1001') {
      // For local dev, return sample users so the admin UI can be inspected
      if (process.env.NODE_ENV !== 'production') {
        const sample = [
          { id: 'u_local_1', email: 'alice@example.com', name: 'Alice', role: 'ADMIN', createdAt: new Date().toISOString(), _count: { enrollments: 2 } },
          { id: 'u_local_2', email: 'bob@example.com', name: 'Bob', role: 'MEMBER', createdAt: new Date().toISOString(), _count: { enrollments: 0 } },
          { id: 'u_local_3', email: 'cara@example.com', name: 'Cara', role: 'TRAINER', createdAt: new Date().toISOString(), _count: { enrollments: 5 } },
        ]
        return NextResponse.json(sample, { status: 200 })
      }
      return NextResponse.json([], { status: 200 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, role } = await req.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing userId or role' },
        { status: 400 }
      )
    }

    // Prevent changing own role
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['MEMBER', 'TRAINER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    // If DB is down, inform the client with 503 Service Unavailable
    // @ts-ignore
    const code = error && (error.code || (error instanceof Error && (error as any).cause?.code))
    if (code === 'P1001') {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { enrollmentId } = await req.json()

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'Missing enrollmentId' },
        { status: 400 }
      )
    }

    await prisma.enrollment.delete({ where: { id: enrollmentId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing enrollment:', error)
    // @ts-ignore
    const code = error && (error.code || (error instanceof Error && (error as any).cause?.code))
    if (code === 'P1001') {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    return NextResponse.json(
      { error: 'Failed to remove enrollment' },
      { status: 500 }
    )
  }
}
