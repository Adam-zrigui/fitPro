import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        level: true,
        imageUrl: true,
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(programs)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()

    // create program without price; accept thumbnail and optional preview video URL
    const program = await prisma.program.create({
      data: {
        title: data.title,
        description: data.description,
        duration: parseInt(data.duration),
        level: data.level,
        imageUrl: data.thumbnail || null,
        trainerId: session.user.id,
        published: false,
      }
    })

    // If a preview video URL was provided, create a Video linked to this program
    if (data.videoUrl) {
      try {
        await prisma.video.create({
          data: {
            title: `${program.title} - Preview`,
            description: `${program.title} preview video`,
            directUrl: data.videoUrl,
            thumbnail: data.thumbnail || null,
            uploadedById: session.user.id,
            programId: program.id,
          }
        })
      } catch (err) {
        // If video creation fails (e.g., unique url constraint), log but don't block program creation
        console.error('Failed to create preview video:', err)
      }
    }

    // Save course parts and sections if provided
    if (data.parts && Array.isArray(data.parts)) {
      for (const part of data.parts) {
        if (!part.name) continue // Skip empty parts

        const createdPart = await prisma.coursePart.create({
          data: {
            programId: program.id,
            name: part.name,
            description: part.description || null,
            order: data.parts.indexOf(part),
          }
        })

        // Save sections for this part
        if (part.sections && Array.isArray(part.sections)) {
          for (const section of part.sections) {
            if (!section.title || !section.url) continue // Skip incomplete sections

            await prisma.courseSection.create({
              data: {
                partId: createdPart.id,
                title: section.title,
                url: section.url,
                mediaType: section.mediaType || 'video',
                order: part.sections.indexOf(section),
              }
            })
          }
        }
      }
    }

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    console.error('Create program error:', error)
    return NextResponse.json(
      { error: 'Failed to create program' },
      { status: 500 }
    )
  }
}
