import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Ensure this route runs in the Node.js runtime so Prisma works correctly
export const runtime = 'nodejs'

if (!prisma) {
  // defensive check - will surface a clearer error during startup
  // eslint-disable-next-line no-console
  console.error('Prisma client is not initialized')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('programId')
    const exerciseId = searchParams.get('exerciseId')
    const videoId = searchParams.get('videoId')

    if (!programId) {
      return NextResponse.json({ error: 'Program ID is required' }, { status: 400 })
    }

    const comments = await prisma.comment.findMany({
      where: {
        programId,
        exerciseId: exerciseId || null,
        videoId: videoId || null,
        parentId: null, // Only get top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text, programId, exerciseId, videoId, parentId } = await request.json()

    if (!text?.trim() || !programId) {
      return NextResponse.json({ error: 'Text and program ID are required' }, { status: 400 })
    }

    // Verify the user is enrolled in the program or is the trainer
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: {
        trainerId: true,
        enrollments: {
          where: {
            userId: session.user.id,
            active: true,
          },
        },
      },
    })

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    const isTrainer = program.trainerId === session.user.id
    const isEnrolled = program.enrollments.length > 0

    if (!isTrainer && !isEnrolled) {
      return NextResponse.json({ error: 'You must be enrolled in this program to comment' }, { status: 403 })
    }

    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        userId: session.user.id,
        programId,
        exerciseId: exerciseId || null,
        videoId: videoId || null,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, text } = await request.json()
    if (!id || !text?.trim()) return NextResponse.json({ error: 'Missing id or text' }, { status: 400 })

    const existing = await prisma.comment.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })

    // Only author or program trainer can edit
    const program = await prisma.program.findUnique({ where: { id: existing.programId }, select: { trainerId: true } })
    const isTrainer = program?.trainerId === session.user.id
    if (existing.userId !== session.user.id && !isTrainer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { text: text.trim() },
      include: { user: { select: { id: true, name: true, image: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const existing = await prisma.comment.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })

    const program = await prisma.program.findUnique({ where: { id: existing.programId }, select: { trainerId: true } })
    const isTrainer = program?.trainerId === session.user.id
    if (existing.userId !== session.user.id && !isTrainer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.comment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}