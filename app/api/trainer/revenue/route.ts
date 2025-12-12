import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const totalRevenue = await prisma.payment.aggregate({
      where: {
        userId: session.user.id,
        status: 'succeeded'
      },
      _sum: {
        amount: true
      }
    })

    return NextResponse.json(totalRevenue)
  } catch (error) {
    console.error('Failed to fetch trainer revenue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revenue' },
      { status: 500 }
    )
  }
}
