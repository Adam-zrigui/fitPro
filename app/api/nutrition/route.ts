import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entries = await prisma.nutritionEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      take: 30 // Last 30 days
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Failed to fetch nutrition entries:', error)
    return NextResponse.json({ error: 'Failed to fetch nutrition entries' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { date, calories, protein, completed = true } = await req.json()

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    // Parse date and normalize to UTC at noon to avoid timezone issues
    const entryDate = new Date(date)
    const normalizedDate = new Date(Date.UTC(
      entryDate.getUTCFullYear(),
      entryDate.getUTCMonth(),
      entryDate.getUTCDate(),
      12, 0, 0, 0 // Noon UTC
    ))

    // Check if entry already exists for this date
    const existingEntry = await prisma.nutritionEntry.findFirst({
      where: {
        userId: session.user.id,
        date: normalizedDate
      }
    })

    let entry
    if (existingEntry) {
      // Update existing entry
      entry = await prisma.nutritionEntry.update({
        where: { id: existingEntry.id },
        data: {
          calories: calories || existingEntry.calories,
          protein: protein || existingEntry.protein,
          completed
        }
      })
    } else {
      // Create new entry
      entry = await prisma.nutritionEntry.create({
        data: {
          userId: session.user.id,
          date: normalizedDate,
          calories,
          protein,
          completed
        }
      })
    }

    // Update user's nutrition streak
    await updateNutritionStreak(session.user.id)

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Failed to create/update nutrition entry:', error)
    return NextResponse.json({ error: 'Failed to save nutrition entry' }, { status: 500 })
  }
}

async function updateNutritionStreak(userId: string) {
  try {
    // Get all nutrition entries for the user, ordered by date desc
    const entries = await prisma.nutritionEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { date: true }
    })

    // Compute consecutive-day streak (UTC-based)
    const seenDates = new Set(entries.map(n => {
      const d = new Date(n.date)
      return d.toISOString().slice(0, 10) // YYYY-MM-DD
    }))

    const today = new Date()
    let cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
    let streak = 0

    // Count consecutive days with entries
    while (true) {
      const dayStr = cursor.toISOString().slice(0, 10)
      if (seenDates.has(dayStr)) {
        streak += 1
        cursor.setUTCDate(cursor.getUTCDate() - 1)
      } else {
        break
      }
    }

    // Update user's nutrition streak
    await prisma.user.update({
      where: { id: userId },
      data: { nutritionStreak: streak }
    })

    return streak
  } catch (error) {
    console.error('Failed to update nutrition streak:', error)
    return 0
  }
}