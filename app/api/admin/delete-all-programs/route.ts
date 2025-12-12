import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { debug, info, warn, error as logError } from '@/lib/logger'

/**
 * Admin endpoint to delete all demo/test programs
 * WARNING: This deletes all programs! Only use for development.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 401 })
  }

  try {
    // Delete all programs (cascade will delete related enrollments, workouts, etc.)
    const result = await prisma.program.deleteMany({})
    
    debug(`✅ Deleted ${result.count} programs`)
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} programs`,
      count: result.count
    })
  } catch (err: unknown) {
    const em = err instanceof Error ? err.message : String(err)
    logError('Error deleting programs:', em)
    return NextResponse.json(
      { error: em || 'Failed to delete programs' },
      { status: 500 }
    )
  }
}
