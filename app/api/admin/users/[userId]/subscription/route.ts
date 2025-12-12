import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { info } from '@/lib/logger'
import fs from 'fs'
import path from 'path'

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    // Allow admin to provide a custom subscriptionId if desired
    const subscriptionId = body?.subscriptionId || `admin-${Date.now()}`

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'active',
        subscriptionId,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: null
      },
      select: { id: true, email: true, subscriptionStatus: true, subscriptionId: true }
    })

    // Log admin action (structured)
    try {
      const entry = {
        action: 'grant_subscription',
        adminId: session.user.id,
        adminEmail: session.user.email,
        targetUserId: userId,
        subscriptionId: updated.subscriptionId,
        timestamp: new Date().toISOString(),
      }
      info('Admin action:', entry)
      const logsDir = path.join(process.cwd(), 'logs')
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })
      fs.appendFileSync(path.join(logsDir, 'admin-actions.log'), JSON.stringify(entry) + '\n')
    } catch (logErr) {
      // don't block main flow on logging errors
      info('Failed to write admin audit log', (logErr as any).message || logErr)
    }

    return NextResponse.json({ success: true, user: updated })
  } catch (err) {
    console.error('Admin grant subscription error:', err)
    return NextResponse.json({ error: 'Failed to grant subscription' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'inactive',
        subscriptionId: null,
        subscriptionEndDate: new Date()
      },
      select: { id: true, email: true, subscriptionStatus: true }
    })

    // Log admin revoke action
    try {
      const entry = {
        action: 'revoke_subscription',
        adminId: session.user.id,
        adminEmail: session.user.email,
        targetUserId: userId,
        timestamp: new Date().toISOString(),
      }
      info('Admin action:', entry)
      const logsDir = path.join(process.cwd(), 'logs')
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })
      fs.appendFileSync(path.join(logsDir, 'admin-actions.log'), JSON.stringify(entry) + '\n')
    } catch (logErr) {
      info('Failed to write admin audit log', (logErr as any).message || logErr)
    }

    return NextResponse.json({ success: true, user: updated })
  } catch (err) {
    console.error('Admin revoke subscription error:', err)
    return NextResponse.json({ error: 'Failed to revoke subscription' }, { status: 500 })
  }
}
