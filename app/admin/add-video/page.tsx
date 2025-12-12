import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AddVideoForm from './AddVideoForm'

export default async function AdminAddVideoPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Fetch programs to choose from (include unpublished so admin can add to any)
  let programs: Array<{ id: string; title: string }> = []
  try {
    programs = await prisma.program.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true },
    })
  } catch (err) {
    console.error('Failed to load programs for admin add video page', err)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-4">Add Video</h1>
        <p className="text-sm text-secondary mb-6">Upload a new video and attach it to a program.</p>
        <AddVideoForm programs={programs} />
      </div>
    </div>
  )
}
