"use client"

import React, { useState, useEffect } from 'react'

type Program = {
  id: string
  title: string
}

type Exercise = {
  id: string
  name: string
  workout: {
    title: string
    week: number
    day: number
  }
}

export default function AddVideoForm({ programs }: { programs: Program[] }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [programId, setProgramId] = useState(programs?.[0]?.id || '')
  const [exerciseId, setExerciseId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loadingExercises, setLoadingExercises] = useState(false)

  // Load exercises when program changes
  useEffect(() => {
    if (!programId) {
      setExercises([])
      setExerciseId('')
      return
    }

    const loadExercises = async () => {
      setLoadingExercises(true)
      try {
        const res = await fetch(`/api/programs/${programId}`)
        if (!res.ok) throw new Error('Failed to load program')
        const program = await res.json()
        
        // Flatten exercises from all workouts
        const allExercises: Exercise[] = []
        program.workouts?.forEach((workout: any) => {
          workout.exercises?.forEach((exercise: any) => {
            allExercises.push({
              id: exercise.id,
              name: exercise.name,
              workout: {
                title: workout.title,
                week: workout.week,
                day: workout.day
              }
            })
          })
        })
        
        setExercises(allExercises)
      } catch (error) {
        console.error('Failed to load exercises:', error)
        setExercises([])
      } finally {
        setLoadingExercises(false)
      }
    }

    loadExercises()
  }, [programId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (!file) {
      setMessage('Please choose a video file')
      return
    }
    if (!programId) {
      setMessage('Please select a program')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('title', title)
      formData.append('description', description)
      formData.append('programId', programId)
      // optional fields
      formData.append('workoutId', '')
      formData.append('exerciseId', exerciseId)

      const res = await fetch(`/api/programs/${programId}/videos`, {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!res.ok) {
        setMessage(json?.error || 'Upload failed')
      } else {
        setMessage('Video uploaded successfully')
        setTitle('')
        setDescription('')
        setFile(null)
        setExerciseId('')
      }
    } catch (err) {
      console.error(err)
      setMessage('Unexpected error during upload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
            <select
              value={programId}
              onChange={(e) => {
                setProgramId(e.target.value)
                setExerciseId('') // Reset exercise selection when program changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Program --</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exercise (Optional)</label>
            <select
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              disabled={loadingExercises || !programId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingExercises ? 'Loading exercises...' : programId ? '-- Select Exercise --' : '-- Select a program first --'}
              </option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  Week {exercise.workout.week}, Day {exercise.workout.day} - {exercise.name}
                </option>
              ))}
            </select>
            {exerciseId && <p className="text-sm text-secondary mt-1">Video will be linked to this exercise</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter video title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter video description (optional)"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {file && <p className="text-sm text-secondary mt-2">File: {file.name}</p>}
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload Video'}
            </button>
            {message && (
              <p className={`text-sm ${
                message.includes('successfully') 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {message}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
