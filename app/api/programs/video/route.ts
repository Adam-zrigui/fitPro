import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { programId, workoutId, exerciseId, title, description, youtubeUrl } = body

    if (!programId || !exerciseId || !youtubeUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: programId, exerciseId, youtubeUrl' },
        { status: 400 }
      )
    }

    // Verify user is trainer or admin
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { trainerId: true }
    })

    if (!program || (program.trainerId !== session.user.id && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find or create video record
    let video = await prisma.video.findFirst({
      where: {
        exercise: {
          id: exerciseId
        }
      }
    })

    if (video) {
      // Update existing video
      video = await prisma.video.update({
        where: { id: video.id },
        data: {
          title: title || video.title,
          description: description || video.description,
          youtubeUrl,
        }
      })
    } else {
      // Create new video
      video = await prisma.video.create({
        data: {
          title: title || 'YouTube Video',
          description: description || null,
          youtubeUrl,
          uploadedById: session.user.id,
          exerciseId: exerciseId,
        }
      })
    }

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    console.error('Video save error:', error)
    return NextResponse.json(
      { error: 'Failed to save video' },
      { status: 500 }
    )
  }
}
