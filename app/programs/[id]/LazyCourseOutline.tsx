'use client'

import { useEffect, useState, Suspense } from 'react'
import CourseOutline from '@/components/CourseOutline'
import { Clock } from 'lucide-react'

interface LazyCourseOutlineProps {
  programId: string
  isEnrolled: boolean
}

function CourseOutlineSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
}

export default function LazyCourseOutline({ programId, isEnrolled }: LazyCourseOutlineProps) {
  const [workouts, setWorkouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadWorkouts = async () => {
      try {
        const res = await fetch(`/api/programs/${programId}/workouts`)
        if (!res.ok) throw new Error('Failed to load workouts')
        const data = await res.json()
        if (mounted) {
          setWorkouts(data)
        }
      } catch (err) {
        console.error('Error loading workouts:', err)
        if (mounted) {
          setError('Failed to load workout details')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Small delay to prioritize initial page render
    const timer = setTimeout(loadWorkouts, 100)
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [programId])

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">⚠️ {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (loading) {
    return <CourseOutlineSkeleton />
  }

  return <CourseOutline
    programId={programId}
    title="Course Outline"
    workouts={workouts}
    isEnrolled={isEnrolled}
  />
}