'use client'

import { useState } from 'react'
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  instructions: string
  videoUrl?: string | null
}

interface WorkoutCardProps {
  workout: {
    id: string
    title: string
    description: string
    exercises: Exercise[]
  }
  onComplete?: (exerciseId: string) => void
}

export default function WorkoutCard({ workout, onComplete }: WorkoutCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div 
        className="p-4 bg-white dark:bg-slate-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700"
        onClick={() => setExpanded(!expanded)}
      >
          <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{workout.title}</h3>
            <p className="text-sm text-secondary">{workout.exercises.length} exercises</p>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-gray-50 dark:bg-slate-800 space-y-3">
          {workout.exercises.map((exercise, idx) => (
            <div key={exercise.id} className="bg-white dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold">{idx + 1}. {exercise.name}</h4>
                  <p className="text-sm text-primary-600 font-medium">
                    {exercise.sets} sets × {exercise.reps} reps
                  </p>
                </div>
                {onComplete && (
                  <button
                    onClick={() => onComplete(exercise.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="h-6 w-6" />
                  </button>
                )}
              </div>
              <p className="text-sm text-secondary mb-2">{exercise.instructions}</p>
              {exercise.videoUrl && (
                <a 
                  href={exercise.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Watch video demonstration →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
