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

    // Get basic counts
    const totalUsers = await prisma.user.count()
    const totalPrograms = await prisma.program.count()
    const totalEnrollments = await prisma.enrollment.count()
    
    // Get revenue
    const revenueResult = await prisma.payment.aggregate({
      _sum: { amount: true }
    })
    const totalRevenue = revenueResult._sum.amount || 0

    // Get active subscriptions (guarded because client/schema may be out-of-sync)
    let activeSubscriptions = 0
    try {
      activeSubscriptions = await prisma.user.count({ where: { subscriptionStatus: 'active' } })
    } catch (err) {
      console.warn('Could not query subscriptionStatus (maybe prisma client is out-of-date):', err)
      activeSubscriptions = 0
    }

    // Get top programs by enrollments
    const topPrograms = await prisma.program.findMany({
      select: {
        title: true,
        _count: { select: { enrollments: true } }
      },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 5
    })

    // Generate monthly growth data (mock data for demo)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const monthlyGrowth = months.map(month => ({
      month,
      users: Math.floor(Math.random() * totalUsers * 0.3) + Math.floor(totalUsers * 0.2),
      enrollments: Math.floor(Math.random() * totalEnrollments * 0.3) + Math.floor(totalEnrollments * 0.2)
    }))

    return NextResponse.json({
      totalUsers,
      totalPrograms,
      totalEnrollments,
      totalRevenue,
      activeSubscriptions,
      monthlyGrowth,
      topPrograms: topPrograms.map(p => ({
        title: p.title,
        enrollments: p._count.enrollments
      }))
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
