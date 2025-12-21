import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const programId = params.id

    // Optimized: Only fetch workouts when specifically requested
    const workouts = await prisma.workout.findMany({
      where: { programId },
      orderBy: [{ week: 'asc' }, { day: 'asc' }],
      include: {
        exercises: {
          orderBy: { order: 'asc' },
          include: {
            video: true,
          }
        }
      }
    })

    // Map to the expected format
    const safeWorkouts = workouts.map((w: any) => ({
      week: w.week,
      day: w.day,
      title: w.title,
      exercises: (w.exercises || []).map((e: any) => {
        const linkedVideo = e.video ?? null
        const inferredVideoUrl = linkedVideo ? (linkedVideo.directUrl || linkedVideo.cloudinaryUrl || linkedVideo.youtubeUrl || linkedVideo.vimeoUrl || null) : null
        return {
          id: e.id,
          name: e.name,
          order: e.order,
          videoUrl: e.videoUrl ?? inferredVideoUrl ?? undefined,
          instructions: e.instructions ?? undefined,
          video: linkedVideo
            ? {
                id: linkedVideo.id,
                title: linkedVideo.title ?? undefined,
                url: inferredVideoUrl ?? undefined,
              }
            : undefined,
        }
      }),
    }))

    return NextResponse.json(safeWorkouts)
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json(
      { error: 'Failed to load workouts' },
      { status: 500 }
    )
  }
}