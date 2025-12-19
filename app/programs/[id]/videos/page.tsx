'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
// Removed unnecessary import
// import VideoPlayerPage from '@/components/VideoPlayerPage'
import { ChevronDown, ChevronUp, Play, ArrowLeft, CheckCircle, Clock, BookOpen, BarChart3, MessageSquare, Send } from 'lucide-react'
import { isYouTubeUrl, getYouTubeEmbedUrl, extractYouTubeId } from '@/lib/youtube'
import ImageWithFallback from '@/components/ImageWithFallback'

interface Exercise {
  id: string
  name: string
  order: number
  videoUrl?: string
  instructions?: string
  duration?: number
  video?: {
    id: string
    title?: string
    // Prisma video model uses provider-specific fields
    directUrl?: string
    cloudinaryUrl?: string
    youtubeUrl?: string
    vimeoUrl?: string
    thumbnail?: string
  }
}

interface Workout {
  id: string
  week: number
  day: number
  title: string
  exercises: Exercise[]
}

interface Program {
  id: string
  title: string
  description?: string
  duration: number
  workouts: Workout[]
  parts?: {
    id: string
    name: string
    sections: {
      id: string
      title: string
      url: string
      mediaType: string
    }[]
  }[]
  level?: string
  category?: string
  trainer?: {
    name: string
    image?: string
  }
}

export default function CoursePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'course' | 'video'>('course')
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({})
  const [videoError, setVideoError] = useState<string | null>(null)
  const [videoFailedUrl, setVideoFailedUrl] = useState<string | null>(null)
interface Comment {
  id: string
  text: string
  userId: string
  user: {
    id: string
    name: string
    image?: string
  }
  likes: number
  dislikes: number
  parentId?: string
  replies?: Comment[]
  createdAt: string
  updatedAt: string
}

  // Comments state (persisted in DB)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  // Ratings state
  const [userRating, setUserRating] = useState<number | null>(null)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [ratingCount, setRatingCount] = useState<number>(0)
  const [loadingRating, setLoadingRating] = useState(false)

  // Get selected workout/exercise from URL params
  const selectedWorkoutId = searchParams.get('workout')
  const selectedExerciseId = searchParams.get('exercise')

  // Play button handler: show video player
  function handlePlayExercise(workoutId: string, exerciseId: string) {
    setViewMode('video')
    // clear any previous playback errors when switching videos
    setVideoError(null)
    setVideoFailedUrl(null)
    const url = new URL(window.location.href)
    url.searchParams.set('workout', workoutId)
    url.searchParams.set('exercise', exerciseId)
    router.push(url.pathname + url.search)
  }

  // Find selected workout/exercise
  const currentWorkout = program && selectedWorkoutId
    ? program.workouts.find(w => w.id === selectedWorkoutId)
    : null
  
  const currentExercise = selectedExerciseId && currentWorkout
    ? currentWorkout.exercises.find(e => e.id === selectedExerciseId)
    : null

  // Handle adding comments (persist to DB)
  const handleAddComment = async () => {
    if (!newComment.trim() || !session?.user?.id) return
    try {
      const payload = {
        text: newComment.trim(),
        programId: params.id,
        exerciseId: currentExercise?.id || null,
        videoId: null,
      }

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error('Failed to post comment', await res.text())
        return
      }

      const created: Comment = await res.json()
      setComments(prev => [created, ...prev])
      setNewComment('')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error posting comment', err)
    }
  }

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Delete this comment?')) return
    try {
      const res = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      setComments(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Delete failed', err)
    }
  }

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditText(comment.text)
  }

  const cancelEdit = () => {
    setEditingCommentId(null)
    setEditText('')
  }

  const handleUpdateComment = async (id: string) => {
    if (!editText.trim()) return
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, text: editText.trim() }),
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated: Comment = await res.json()
      setComments(prev => prev.map(c => c.id === id ? updated : c))
      cancelEdit()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Update failed', err)
    }
  }

  // Load comments for this program / exercise
  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!params?.id) return
      setLoadingComments(true)
      try {
        const qs = new URLSearchParams({ programId: params.id })
        if (currentExercise?.id) qs.set('exerciseId', currentExercise.id)
        const res = await fetch(`/api/comments?${qs.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch comments')
        const data: Comment[] = await res.json()
        if (mounted) setComments(data)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading comments', err)
      } finally {
        if (mounted) setLoadingComments(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [params.id, currentExercise?.id])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/programs/${params.id}/videos`)
      return
    }

    if (status === 'authenticated') {
      const fetchProgram = async () => {
        try {
          const res = await fetch(`/api/programs/${params.id}`)
          if (!res.ok) throw new Error('Failed to load program')
          const data = await res.json()
          setProgram(data)
          // Auto-expand first workout if viewing course
          if (data.workouts?.length > 0) {
            setExpandedWorkout(data.workouts[0].id)
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load course')
        } finally {
          setLoading(false)
        }
      }
      fetchProgram()
    }
  }, [status, params.id, router])

  // Calculate progress
  const totalExercises = program?.workouts?.reduce((sum, w) => sum + w.exercises.length, 0) || 0
  const completedExercises = Object.values(completedMap).filter(Boolean).length
  const progressPercentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0

  // Load ratings (average + count)
  const loadRatings = async () => {
    if (!params?.id) return
    try {
      const res = await fetch(`/api/ratings?programId=${params.id}`)
      if (!res.ok) throw new Error('Failed to load ratings')
      const data = await res.json()
      setAverageRating(data.average)
      setRatingCount(data.count || 0)
      // find current user's rating if present
      const me = (data.recent || []).find((r: any) => r.user?.id === session?.user?.id)
      if (me) setUserRating(me.score)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading ratings', err)
    }
  }

  useEffect(() => {
    if (progressPercentage === 100) loadRatings()
  }, [params.id, progressPercentage, session?.user?.id])


  // Get next/previous exercises
  const getAdjacentExercises = () => {
    if (!program || !currentWorkout) return { prev: null, next: null }
    
    let foundCurrent = false
    let prev = null
    let next = null

    for (let i = 0; i < program.workouts.length; i++) {
      for (let j = 0; j < program.workouts[i].exercises.length; j++) {
        const ex = program.workouts[i].exercises[j]
        if (foundCurrent && !next) {
          next = { workoutId: program.workouts[i].id, exerciseId: ex.id, ex }
        }
        if (currentExercise?.id === ex.id && program.workouts[i].id === currentWorkout.id) {
          foundCurrent = true
        }
        if (!foundCurrent) {
          prev = { workoutId: program.workouts[i].id, exerciseId: ex.id, ex }
        }
      }
    }
    return { prev, next }
  }

  const { prev: prevEx, next: nextEx } = getAdjacentExercises()

  // Render video player view (Coursera-style)
  if (viewMode === 'video' && currentExercise && currentWorkout && program) {
    // Determine video source from video relation or fallback to videoUrl
    let videoSrc = currentExercise.video?.directUrl || 
                   currentExercise.video?.cloudinaryUrl || 
                   currentExercise.video?.youtubeUrl || 
                   currentExercise.video?.vimeoUrl || 
                   currentExercise.videoUrl || null

    // If no video on exercise, check course parts/sections
    if (!videoSrc && program.parts) {
      for (const part of program.parts) {
        for (const section of part.sections) {
          if (section.mediaType === 'video' && section.url) {
            videoSrc = section.url
            break
          }
        }
        if (videoSrc) break
      }
    }

    const videoIsYouTube = videoSrc ? isYouTubeUrl(videoSrc) : false
    const embedSrc = videoIsYouTube && videoSrc ? getYouTubeEmbedUrl(extractYouTubeId(videoSrc) || '') : null
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          {/* Top Bar */}
          <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4">
            <button
              onClick={() => setViewMode('course')}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Course
            </button>
          </div>

          {/* Video and Sidebar Layout */}
          <div className="p-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Video Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Video Player */}
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden">
                  <div className="aspect-video bg-black">
                    {videoSrc ? (
                      videoIsYouTube && embedSrc ? (
                        <iframe
                          src={embedSrc}
                          title={currentExercise.name}
                          className="w-full h-full"
                          frameBorder={0}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={videoSrc}
                          controls
                          autoPlay
                          className="w-full h-full"
                          onError={(e) => {
                            // graceful fallback: set state so UI can show debug info
                            // eslint-disable-next-line no-console
                            console.warn('Video playback failed for', videoSrc, e)
                            setVideoError('Video file not found or invalid. Please upload a valid MP4 file through the admin interface.')
                            setVideoFailedUrl(videoSrc)
                          }}
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {videoError ? (
                          <div className="text-center">
                            <p className="font-semibold mb-2">{videoError}</p>
                            {videoFailedUrl && (
                              <p className="text-xs text-muted mb-2 break-all">{videoFailedUrl}</p>
                            )}
                            <div className="flex items-center justify-center gap-2">
                              {videoFailedUrl && (
                                <a href={videoFailedUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-blue-600 text-white rounded">Open URL</a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>No video available</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Info */}
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
                  <h1 className="text-2xl font-bold dark:text-gray-50 mb-2">{currentExercise.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span>Week {currentWorkout.week} • Day {currentWorkout.day}</span>
                    {currentExercise.duration && <span>• {currentExercise.duration} min</span>}
                  </div>
                  {currentExercise.instructions && (
                    <p className="text-gray-700 dark:text-gray-300">{currentExercise.instructions}</p>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4">
                  {prevEx && (
                    <button
                      onClick={() => handlePlayExercise(prevEx.workoutId, prevEx.exerciseId)}
                      className="flex-1 px-4 py-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors dark:text-gray-50"
                    >
                      ← Previous
                    </button>
                  )}
                  <button
                    onClick={() => setCompletedMap(prev => ({ ...prev, [currentExercise.id]: !prev[currentExercise.id] }))}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      completedMap[currentExercise.id]
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <CheckCircle className="h-5 w-5" />
                    {completedMap[currentExercise.id] ? 'Completed' : 'Mark Complete'}
                  </button>
                  {nextEx && (
                    <button
                      onClick={() => handlePlayExercise(nextEx.workoutId, nextEx.exerciseId)}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Next →
                    </button>
                  )}
                </div>
              </div>

              {/* Sidebar Column */}
              <div className="space-y-6">
                {/* Enhanced Progress Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="h-6 w-6" />
                    <h3 className="font-bold text-lg">Your Progress</h3>
                  </div>

                  {/* Progress Circle */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          stroke="white"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 45}`}
                          strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`}
                          className="transition-all duration-500 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{progressPercentage}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Stats */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-100">Completed</span>
                      <span className="font-bold text-green-300">{completedExercises}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-100">Total</span>
                      <span className="font-bold">{totalExercises}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-100">Remaining</span>
                      <span className="font-bold">{totalExercises - completedExercises}</span>
                    </div>
                  </div>

                  {/* Motivational Message */}
                  <div className="mt-6 pt-4 border-t border-blue-400">
                    {progressPercentage === 100 ? (
                      <div className="space-y-3">
                        <p className="text-center text-blue-100 text-sm">🎉 Congratulations! Course completed!</p>

                        {/* Rating UI */}
                        <div className="flex items-center justify-center gap-4">
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map((n) => (
                              <button
                                key={n}
                                onClick={() => setSelectedRating(n)}
                                className={`text-2xl ${selectedRating && selectedRating >= n ? 'text-yellow-400' : 'text-yellow-200'} transition-colors`}
                                aria-label={`Rate ${n} stars`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <div>
                            <button
                              onClick={async () => {
                                if (!selectedRating || !session?.user?.id) return
                                try {
                                  setLoadingRating(true)
                                  const res = await fetch('/api/ratings', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ programId: params.id, score: selectedRating }),
                                  })
                                  if (!res.ok) throw new Error(await res.text())
                                  const data = await res.json()
                                  // refresh averages
                                  await loadRatings()
                                  setUserRating(data.score)
                                } catch (err) {
                                  // eslint-disable-next-line no-console
                                  console.error('Failed to submit rating', err)
                                } finally {
                                  setLoadingRating(false)
                                }
                              }}
                              className="px-3 py-1 bg-white text-blue-700 rounded-md font-medium"
                            >
                              {loadingRating ? 'Saving...' : 'Submit Rating'}
                            </button>
                          </div>
                        </div>

                        {averageRating !== null && (
                          <p className="text-center text-blue-100 text-xs">Average: {averageRating.toFixed(2)} ({ratingCount} ratings)</p>
                        )}
                      </div>
                    ) : progressPercentage >= 75 ? (
                      <p className="text-center text-blue-100 text-sm">Almost there! Keep going! 💪</p>
                    ) : progressPercentage >= 50 ? (
                      <p className="text-center text-blue-100 text-sm">Halfway done! You're doing great! 🔥</p>
                    ) : progressPercentage >= 25 ? (
                      <p className="text-center text-blue-100 text-sm">Great start! Keep the momentum! 🚀</p>
                    ) : (
                      <p className="text-center text-blue-100 text-sm">Every journey begins with a single step! 🌟</p>
                    )}
                  </div>
                </div>

                {/* Course Info Card */}
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
                  <h3 className="font-bold dark:text-gray-50 mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Course Info
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Course</p>
                      <p className="font-medium dark:text-gray-50">{program?.title}</p>
                    </div>
                    {program?.level && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Level</p>
                        <p className="font-medium dark:text-gray-50">{program.level}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Duration</p>
                      <p className="font-medium dark:text-gray-50">{program?.duration} weeks</p>
                    </div>
                    {program?.trainer && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Trainer</p>
                        <p className="font-medium dark:text-gray-50">{program.trainer.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section - Course Content */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold dark:text-gray-50 mb-6">Course Content</h2>

              {/* Lessons in This Workout */}
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow mb-6">
                <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold dark:text-gray-50">
                    {currentWorkout.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Week {currentWorkout.week} • Day {currentWorkout.day}
                  </p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-slate-800 max-h-96 overflow-y-auto">
                  {currentWorkout.exercises.map((exercise, idx) => (
                    <button
                      key={exercise.id}
                      onClick={() => handlePlayExercise(currentWorkout.id, exercise.id)}
                      className={`w-full px-6 py-4 text-left flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
                        currentExercise.id === exercise.id ? 'bg-blue-50 dark:bg-slate-800' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {completedMap[exercise.id] ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <div className="h-5 w-5 rounded border-2 border-gray-300 dark:border-slate-600" />
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {exercise.video?.thumbnail ? (
                          <ImageWithFallback
                            src={exercise.video.thumbnail}
                            alt={exercise.video.title || exercise.name}
                            className="w-16 h-12 object-cover rounded-lg border border-gray-200 dark:border-slate-600"
                            fallback="icon"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <div className="text-white text-sm">▶️</div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium dark:text-gray-50">
                          {idx + 1}. {exercise.name}
                        </p>
                        {exercise.duration && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {exercise.duration} min
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Related Workouts */}
              {program && program.workouts && program.workouts.length > 1 && (
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold dark:text-gray-50 mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Other Workouts in This Course
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {program.workouts.map((workout) => {
                      const completed = workout.exercises.filter(ex => completedMap[ex.id]).length
                      const total = workout.exercises.length
                      const isCurrentWorkout = workout.id === currentWorkout.id
                      return (
                        <button
                          key={workout.id}
                          onClick={() => {
                            if (!isCurrentWorkout && workout.exercises.length > 0) {
                              handlePlayExercise(workout.id, workout.exercises[0].id)
                            }
                          }}
                          disabled={isCurrentWorkout}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            isCurrentWorkout
                              ? 'border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-600'
                              : 'border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md'
                          }`}
                        >
                          <p className="font-semibold text-sm dark:text-gray-50">Week {workout.week} • Day {workout.day}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{workout.title}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{completed}/{total}</span>
                            <div className="w-16 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section - Modern YouTube Style */}
        <div className="mt-8">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden">
            {/* Comments Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold dark:text-gray-50 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  {comments.length} Comments
                </h3>
                <div className="flex items-center gap-2">
                  <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium">
                    Sort by
                  </button>
                  <select className="text-sm bg-transparent text-gray-600 dark:text-gray-400 border-none outline-none">
                    <option>Top comments</option>
                    <option>Newest first</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Add Comment Section */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                      placeholder="Add a comment..."
                      className="w-full px-0 py-2 bg-transparent border-none outline-none text-gray-900 dark:text-gray-50 placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:ring-0"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="text-sm">😊</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setNewComment('')}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {comments.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-2">No comments yet</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Be the first to share your thoughts on this video!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex gap-4">
                        <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                          {comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm text-gray-900 dark:text-gray-50">{comment.user?.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        {editingCommentId === comment.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-sm text-gray-900 dark:text-gray-50"
                              rows={3}
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateComment(comment.id)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">{comment.text}</p>
                            <div className="flex items-center gap-4">
                              <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                                <span>👍</span>
                                <span>0</span>
                              </button>
                              <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                                <span>👎</span>
                              </button>
                              <button className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                                Reply
                              </button>
                              {session?.user?.id === comment.userId && (
                                <>
                                  <button
                                    onClick={() => startEditComment(comment)}
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-sm text-red-600 hover:text-red-800 px-2 py-1 rounded"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Course List View (default)
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error || 'Course not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!program) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{program.title}</h1>
          <p className="text-blue-100 text-lg mb-6">{program.description}</p>
          
          {/* Stats */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>{program.duration} weeks</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <span>{totalExercises} lessons</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>{progressPercentage}% complete</span>
            </div>
            {program.trainer && (
              <div className="flex items-center gap-2">
                <span>By {program.trainer.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Card */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold dark:text-gray-50">Your Progress</h2>
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            {completedExercises} of {totalExercises} lessons completed
          </p>
        </div>

        {/* Workouts Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold dark:text-gray-50 mb-6">Course Content</h2>
          
          {program.workouts?.map((workout, workoutIdx) => {
            const workoutCompleted = workout.exercises.filter(ex => completedMap[ex.id]).length
            const workoutTotal = workout.exercises.length
            const workoutProgress = workoutTotal > 0 ? Math.round((workoutCompleted / workoutTotal) * 100) : 0
            
            return (
              <div key={workout.id} className="bg-white dark:bg-slate-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Workout Header - Improved */}
                <button
                  onClick={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
                  className="w-full px-6 py-6 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent dark:hover:from-slate-800 dark:hover:to-transparent transition-all"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 text-blue-700 dark:text-blue-200 rounded-full text-xs font-bold tracking-wide">
                        WEEK {workout.week} • DAY {workout.day}
                      </span>
                      {workoutProgress === 100 && (
                        <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-full text-xs font-bold">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold dark:text-gray-50 leading-tight">{workout.title}</h3>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {workoutTotal} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        {workoutCompleted}/{workoutTotal} done
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar in Header */}
                  <div className="hidden sm:flex flex-col items-end gap-2 ml-6">
                    <div className="w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                        style={{ width: `${workoutProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{workoutProgress}%</span>
                  </div>

                  <div className="ml-4">
                    {expandedWorkout === workout.id ? (
                      <ChevronUp className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-6 w-6 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Exercises List - Improved */}
                {expandedWorkout === workout.id && (
                  <div className="border-t border-gray-100 dark:border-slate-800 bg-gradient-to-b from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                    {workout.exercises.map((exercise, idx) => {
                      const isCompleted = completedMap[exercise.id]
                      return (
                        <div
                          key={exercise.id}
                          className="px-6 py-4 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors flex items-start justify-between group"
                        >
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            {/* Completion Indicator */}
                            <div className="flex-shrink-0 pt-1">
                              {isCompleted ? (
                                <div className="h-6 w-6 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-white" />
                                </div>
                              ) : (
                                <div className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-slate-600 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                                  {idx + 1}
                                </div>
                              )}
                            </div>

                            {/* Exercise Info */}
                            <div className="min-w-0 flex-1">
                              <p className={`font-semibold transition-colors ${
                                isCompleted
                                  ? 'text-gray-500 dark:text-gray-400 line-through'
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {exercise.name}
                              </p>
                              {exercise.instructions && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                                  {exercise.instructions}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {exercise.duration && (
                                  <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded">
                                    <Clock className="h-3 w-3" />
                                    {exercise.duration} min
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="ml-4 flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setCompletedMap(prev => ({ ...prev, [exercise.id]: !prev[exercise.id] }))}
                              className={`p-2 rounded-lg transition-colors ${
                                isCompleted
                                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                              }`}
                              title={isCompleted ? 'Mark as incomplete' : 'Mark complete'}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handlePlayExercise(workout.id, exercise.id)}
                              className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2 whitespace-nowrap"
                            >
                              <Play className="h-4 w-4" />
                              Play
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
