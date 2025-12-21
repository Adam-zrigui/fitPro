import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { programId, action } = await req.json()

    if (!programId || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    // For now, we'll use a simple approach with user metadata
    // In a real app, you'd want a proper favorites table
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { favorites: true }
    })

    let favorites = user?.favorites ? JSON.parse(user.favorites) : []

    if (action === 'add') {
      if (!favorites.includes(programId)) {
        favorites.push(programId)
      }
    } else {
      favorites = favorites.filter((id: string) => id !== programId)
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { favorites: JSON.stringify(favorites) }
    })

    return NextResponse.json({ success: true, favorites })
  } catch (error) {
    console.error('Failed to update favorites:', error)
    return NextResponse.json({ error: 'Failed to update favorites' }, { status: 500 })
  }
}