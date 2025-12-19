import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('programId')

    if (!programId) return NextResponse.json({ error: 'programId required' }, { status: 400 })

    // compute average and count
    const agg = await prisma.rating.aggregate({
      where: { programId },
      _avg: { score: true },
      _count: { _all: true },
    })

    // optional: return recent ratings
    const recent = await prisma.rating.findMany({
      where: { programId },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ average: agg._avg.score ?? null, count: agg._count._all ?? 0, recent })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Ratings GET error', err)
    return NextResponse.json({ error: 'Failed to load ratings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { programId, score, review } = await request.json()
    if (!programId || !score) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const s = Number(score)
    if (isNaN(s) || s < 1 || s > 5) return NextResponse.json({ error: 'Score must be 1-5' }, { status: 400 })

    // verify enrollment or trainer
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { trainerId: true, enrollments: { where: { userId: session.user.id, active: true } } },
    })
    if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    const isTrainer = program.trainerId === session.user.id
    const isEnrolled = (program.enrollments || []).length > 0
    if (!isTrainer && !isEnrolled) return NextResponse.json({ error: 'Must be enrolled to rate' }, { status: 403 })

    // upsert rating
    const existing = await prisma.rating.findUnique({ where: { userId_programId: { userId: session.user.id, programId } } }).catch(() => null)
    let result
    if (existing) {
      result = await prisma.rating.update({
        where: { id: existing.id },
        data: { score: s, review: review || null },
        include: { user: { select: { id: true, name: true, image: true } } },
      })
    } else {
      result = await prisma.rating.create({
        data: { userId: session.user.id, programId, score: s, review: review || null },
        include: { user: { select: { id: true, name: true, image: true } } },
      })
    }

    return NextResponse.json(result, { status: existing ? 200 : 201 })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Ratings POST error', err)
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 })
  }
}
