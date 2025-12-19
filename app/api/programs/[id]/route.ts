import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const program = await prisma.program.findUnique({
      where: { id: params.id },
      include: {
        trainer: true,
        workouts: {
          orderBy: [{ week: 'asc' }, { day: 'asc' }],
          include: {
            exercises: {
              orderBy: { order: 'asc' },
              include: {
                video: true,
              }
            }
          }
        },
        parts: {
          orderBy: { order: 'asc' },
          include: {
            sections: {
              orderBy: { order: 'asc' }
            }
          }
        },
        _count: {
          select: { enrollments: true }
        }
      }
    })

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    // Transform parts data to match frontend expectations
    const transformedParts = (program.parts || []).map((part: any, partIndex: number) => ({
      id: partIndex + 1, // Use 1-based index for frontend
      name: part.name,
      description: part.description || '',
      sections: (part.sections || []).map((section: any, sectionIndex: number) => ({
        id: sectionIndex + 1, // Use 1-based index for frontend
        title: section.title,
        url: section.url,
        mediaType: section.mediaType || 'video'
      }))
    }))

    return NextResponse.json({
      ...program,
      parts: transformedParts
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()

    // Build allowed scalar updates for program
    const allowed: any = {}
    if (data.title !== undefined) allowed.title = data.title
    if (data.description !== undefined) allowed.description = data.description
    if (data.duration !== undefined) allowed.duration = parseInt(data.duration)
    if (data.level !== undefined) allowed.level = data.level
    if (data.imageUrl !== undefined) allowed.imageUrl = data.imageUrl
    if (data.published !== undefined) allowed.published = Boolean(data.published)
    if (data.learningOutcomes !== undefined) allowed.learningOutcomes = data.learningOutcomes

    // Update program scalars first
    const updatedProgram = await prisma.program.update({
      where: { id: params.id },
      data: allowed
    })

    // If workouts provided, replace existing workouts for this program
    if (data.workouts && Array.isArray(data.workouts)) {
      // fetch existing workout ids
      const existing = await prisma.workout.findMany({ where: { programId: params.id }, select: { id: true } })
      const ids = existing.map(e => e.id)

      // delete exercises for existing workouts, then delete workouts
      if (ids.length) {
        await prisma.exercise.deleteMany({ where: { workoutId: { in: ids } } })
        await prisma.workout.deleteMany({ where: { id: { in: ids } } })
      }

      // create new workouts and exercises
      for (const [wi, w] of data.workouts.entries()) {
        const title = `${w.thumbnailIcon ? w.thumbnailIcon + ' ' : ''}${w.title || 'Untitled'}`
        const createdW = await prisma.workout.create({
          data: {
            title,
            description: w.description || '',
            week: w.week ?? 0,
            day: w.day ?? 0,
            programId: params.id
          }
        })

        if (w.exercises && Array.isArray(w.exercises)) {
          for (const [ei, ex] of w.exercises.entries()) {
            await prisma.exercise.create({
              data: {
                name: ex.name || '',
                instructions: ex.notes || null,
                reps: ex.reps || '',
                sets: typeof ex.sets === 'number' ? ex.sets : 1,
                order: ei,
                workoutId: createdW.id
              }
            })
          }
        }
      }
    }

    // If parts provided, replace existing parts and sections for this program
    if (data.parts && Array.isArray(data.parts)) {
      // Delete existing parts and sections
      const existingParts = await prisma.coursePart.findMany({ where: { programId: params.id }, select: { id: true } })
      const partIds = existingParts.map(p => p.id)
      
      if (partIds.length) {
        await prisma.courseSection.deleteMany({ where: { partId: { in: partIds } } })
        await prisma.coursePart.deleteMany({ where: { id: { in: partIds } } })
      }

      // Create new parts and sections
      for (const [pi, part] of data.parts.entries()) {
        if (!part.name) continue // Skip empty parts

        const createdPart = await prisma.coursePart.create({
          data: {
            programId: params.id,
            name: part.name,
            description: part.description || null,
            order: pi,
          }
        })

        // Save sections for this part
        if (part.sections && Array.isArray(part.sections)) {
          for (const [si, section] of part.sections.entries()) {
            if (!section.title || !section.url) continue // Skip incomplete sections

            await prisma.courseSection.create({
              data: {
                partId: createdPart.id,
                title: section.title,
                url: section.url,
                mediaType: section.mediaType || 'video',
                order: si,
              }
            })
          }
        }
      }
    }

    // return fresh program with workouts and parts
    const program = await prisma.program.findUnique({
      where: { id: params.id },
      include: {
        trainer: true,
        parts: {
          orderBy: { order: 'asc' },
          include: {
            sections: {
              orderBy: { order: 'asc' }
            }
          }
        },
        workouts: {
          orderBy: [{ week: 'asc' }, { day: 'asc' }],
          include: { exercises: { orderBy: { order: 'asc' } } }
        },
        _count: { select: { enrollments: true } }
      }
    })

    return NextResponse.json(program)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update program' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const program = await prisma.program.findUnique({ where: { id: params.id } })
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Only the trainer who owns the program or an admin can delete
    if (session.user.role !== 'ADMIN' && session.user.id !== program.trainerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.program.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete program' },
      { status: 500 }
    )
  }
}
