'use client'

import { useState } from 'react'
import { ChevronDown, FileText, Video, Dumbbell, Lock, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import ImageWithFallback from '@/components/ImageWithFallback'

interface Workout {
  week: number
  day: number
  title: string
  duration?: number
  exercises: Array<{
    id: string
    name: string
    order: number
    videoUrl?: string | null
    instructions?: string | null
    video?: {
      id: string
      title?: string | null
      url?: string | null
      thumbnail?: string | null
    } | null
  }>
}

interface CourseOutlineProps {
  programId: string
  title: string
  workouts: Workout[]
  isEnrolled: boolean
  canEdit?: boolean
}

export default function CourseOutline({
  programId,
  title,
  workouts,
  isEnrolled,
  canEdit = false,
}: CourseOutlineProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]))

  const toggleWeek = (week: number) => {
    const newExpanded = new Set(expandedWeeks)
    if (newExpanded.has(week)) {
      newExpanded.delete(week)
    } else {
      newExpanded.add(week)
    }
    setExpandedWeeks(newExpanded)
  }

  const weekGroups = workouts.reduce(
    (acc, workout) => {
      if (!acc[workout.week]) {
        acc[workout.week] = []
      }
      acc[workout.week].push(workout)
      return acc
    },
    {} as Record<number, Workout[]>
  )

  const weeks = Object.keys(weekGroups)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b border-gray-200 dark:from-slate-800 dark:to-slate-800 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Course Outline</h2>
        </div>
        <p className="text-sm text-secondary">{weeks.length} weeks • {workouts.length} workouts</p>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-200 dark:divide-slate-700">
        {weeks.map((week) => {
          const weekWorkouts = weekGroups[week]
          const isExpanded = expandedWeeks.has(week)
          const totalExercises = weekWorkouts.reduce((acc, w) => acc + w.exercises.length, 0)

          return (
            <div key={week} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
              {/* Week Header */}
              <button
                onClick={() => toggleWeek(week)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm dark:from-blue-700 dark:to-blue-600">
                    W{week}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Week {week}</h3>
                    <p className="text-sm text-secondary">
                      {weekWorkouts.length} day{weekWorkouts.length !== 1 ? 's' : ''} •{' '}
                      {totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Week Content */}
              {isExpanded && (
                <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 space-y-4 border-t border-gray-200 dark:border-slate-700">
                  {weekWorkouts.map((workout) => (
                    <div
                      key={`${week}-${workout.day}`}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-700"
                    >
                      {/* Workout Header */}
                      <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Dumbbell className="h-4 w-4 text-orange-500" />
                              <span className="text-sm font-medium text-secondary">
                                Day {workout.day}
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{workout.title}</h4>
                          </div>
                          {workout.duration && (
                            <div className="flex items-center gap-1 text-sm text-muted">
                              <Clock className="h-4 w-4" />
                              {workout.duration} min
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Exercises */}
                      <div className="divide-y divide-gray-200 dark:divide-slate-700">
                        {workout.exercises.map((exercise) => (
                          <div key={exercise.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {exercise.video?.thumbnail ? (
                                  <>
                                    {/* Client-side image with fallback to avoid passing handlers in server components */}
                                    <ImageWithFallback
                                      src={exercise.video.thumbnail}
                                      alt={exercise.video.title || exercise.name}
                                      className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-slate-600"
                                      fallback="icon"
                                    />
                                  </>
                                ) : (
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <div className="text-white text-lg">🎬</div>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {exercise.order}. {exercise.video?.title ?? exercise.name}
                                </p>
                                {exercise.instructions && (
                                  <p className="text-xs text-secondary mt-1 line-clamp-1">
                                    {exercise.instructions}
                                  </p>
                                )}
                                {exercise.video?.title && exercise.video?.title !== exercise.name && (
                                  <p className="text-xs text-muted mt-1">{exercise.name}</p>
                                )}
                              </div>
                              {exercise.videoUrl && (
                                isEnrolled ? (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      const el = document.getElementById(`video-${exercise.id}`)
                                      if (el) {
                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                      }
                                    }}
                                    className="flex-shrink-0 px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors cursor-pointer"
                                  >
                                    Watch
                                  </button>
                                ) : (
                                  <div className="flex-shrink-0 px-3 py-1 text-xs font-medium bg-gray-100 text-muted rounded flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    <a href={`/programs/${programId}#pricing`} className="underline">Enroll to unlock</a>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {canEdit && (
        <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 border-t border-gray-200 dark:border-slate-700">
          <Link
            href={`/trainer/programs/${programId}/edit`}
            className="inline-block px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            + Add Content
          </Link>
        </div>
      )}
    </div>
  )
}
