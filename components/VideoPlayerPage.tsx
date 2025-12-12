'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  ChevronLeft,
  Volume2,
  Maximize,
  Play,
  Pause,
  BookOpen,
  CheckCircle2,
  SkipBack,
  SkipForward,
  Repeat,
} from 'lucide-react'
import Link from 'next/link'

interface VideoPlayerPageProps {
  videoUrl: string
  title: string
  description?: string
  programId: string
  programTitle: string
  workoutTitle: string
  week: number
  day: number
  exerciseName: string
  nextVideoId?: string
  previousVideoId?: string
  relatedVideos?: Array<{
    id: string
    title: string
    week: number
    day: number
    duration: string
    thumbnail?: string
  }>
  isCompleted?: boolean
}

export default function VideoPlayerPage({
  videoUrl,
  title,
  description,
  programId,
  programTitle,
  workoutTitle,
  week,
  day,
  exerciseName,
  nextVideoId,
  previousVideoId,
  relatedVideos = [],
  isCompleted = false,
}: VideoPlayerPageProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoWrapperRef = useRef<HTMLDivElement | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [bufferedEnd, setBufferedEnd] = useState(0)
  const [segmentStart, setSegmentStart] = useState<number | null>(null)
  const [segmentEnd, setSegmentEnd] = useState<number | null>(null)
  const [isReplayingSegment, setIsReplayingSegment] = useState(false)
  const [loopSegment, setLoopSegment] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimerRef = useRef<number | null>(null)
  const [isSeeking, setIsSeeking] = useState(false)
  const wasPlayingRef = useRef<boolean>(false)

  // Extract video ID from URL
  const getVideoEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.split('v=')[1] || url.split('/').pop()
      return `https://www.youtube.com/embed/${videoId}`
    } else if (url.includes('vimeo')) {
      const videoId = url.split('/').pop()
      return `https://player.vimeo.com/video/${videoId}`
    }
    return url
  }

  const isDirectVideoFile = (url: string) => {
    return /\.(mp4|webm|ogg)(\?|$)/i.test(url)
  }

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    el.addEventListener('play', handlePlay)
    el.addEventListener('pause', handlePause)

    return () => {
      el.removeEventListener('play', handlePlay)
      el.removeEventListener('pause', handlePause)
    }
  }, [videoRef.current])

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current)
    }
  }, [])

  const scheduleHideControls = (delay = 3000) => {
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = window.setTimeout(() => setShowControls(false), delay)
  }

  const handleMouseMoveControls = () => {
    setShowControls(true)
    scheduleHideControls(3000)
  }

  const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))

  const startSeek = (ev: React.PointerEvent<HTMLElement>) => {
    const target = ev.currentTarget as HTMLElement
    try { target.setPointerCapture(ev.pointerId) } catch {}
    setIsSeeking(true)
    setShowControls(true)
    // remember whether it was playing
    if (videoRef.current) wasPlayingRef.current = !videoRef.current.paused
    handleSeekMove(ev)
  }

  const handleSeekMove = (ev: React.PointerEvent<HTMLElement>) => {
    if (!videoRef.current) return
    const target = ev.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const x = ev.clientX - rect.left
    const ratio = clamp(x / rect.width, 0, 1)
    const t = ratio * (duration || 0)
    videoRef.current.currentTime = t
    setCurrentTime(t)
  }

  const endSeek = (ev: React.PointerEvent<HTMLElement>) => {
    const target = ev.currentTarget as HTMLElement
    try { target.releasePointerCapture(ev.pointerId) } catch {}
    setIsSeeking(false)
    // resume play if it was playing before
    if (videoRef.current && wasPlayingRef.current) {
      videoRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
    scheduleHideControls(3000)
  }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
      videoRef.current.muted = muted
    }
  }, [volume, muted])

  const togglePlay = async () => {
    const el = videoRef.current
    if (!el) return
    try {
      if (el.paused) {
        await el.play()
        setIsPlaying(true)
      } else {
        el.pause()
        setIsPlaying(false)
      }
    } catch (e) {
      // autoplay/play promise rejected
      console.warn('Play/pause failed', e)
    }
  }

  const handleVolumeChange = (value: number) => {
    setVolume(value)
    if (value === 0) setMuted(true)
    else setMuted(false)
  }

  const toggleFullscreen = () => {
    const el = videoWrapperRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  const skipSeconds = (seconds: number) => {
    const el = videoRef.current
    if (!el) return
    const newTime = Math.min(Math.max(0, el.currentTime + seconds), duration || el.duration || 0)
    el.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleLoadedMetadata = () => {
    const el = videoRef.current
    if (!el) return
    setDuration(el.duration || 0)
    // update buffered
    try {
      if (el.buffered && el.buffered.length > 0) {
        setBufferedEnd(el.buffered.end(el.buffered.length - 1))
      }
    } catch {}
    setCurrentTime(el.currentTime || 0)
  }

  const handleTimeUpdate = () => {
    const el = videoRef.current
    if (!el) return
    const t = el.currentTime
    setCurrentTime(t)

    // update buffered progress where available
    try {
      if (el.buffered && el.buffered.length > 0) {
        setBufferedEnd(el.buffered.end(el.buffered.length - 1))
      }
    } catch {}

    // If we're replaying a defined segment, stop or loop when reaching the end
    if (isReplayingSegment && segmentEnd != null && segmentStart != null) {
      // small tolerance to ensure we catch the end
      if (t >= Math.max(0, segmentEnd - 0.05)) {
        if (loopSegment) {
          el.currentTime = segmentStart
          el.play().catch(() => {})
        } else {
          el.pause()
          setIsReplayingSegment(false)
          setIsPlaying(false)
          // reset to segment start so replay is visible
          el.currentTime = segmentStart
        }
      }
    }
  }

  const formatTime = (t: number) => {
    if (!t || isNaN(t)) return '0:00'
    const total = Math.floor(t)
    const minutes = Math.floor(total / 60)
    const seconds = total % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header Navigation */}
      <div className="bg-gray-950 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/programs/${programId}/videos`}
            className="flex items-center gap-2 hover:text-blue-400 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm font-medium">{programTitle}</span>
          </Link>
          <div className="text-sm text-muted">
            Week {week} • Day {day}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6 p-4 sm:p-6">
          {/* Main Video Section */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div
              className={`bg-gray-950 rounded-lg overflow-hidden shadow-lg mb-6 ${
                isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
              }`}
            >
              <div
                ref={videoWrapperRef}
                className="relative bg-black w-full"
                style={{ paddingBottom: '56.25%' }}
                onMouseMove={handleMouseMoveControls}
              >
                {isDirectVideoFile(videoUrl) ? (
                  <>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="absolute inset-0 w-full h-full object-cover"
                      // provide native controls as a fallback
                      controls={false}
                      playsInline
                      onLoadedMetadata={handleLoadedMetadata}
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={() => setIsPlaying(false)}
                      onClick={() => togglePlay()}
                    />

                    {/* Big center play button (YouTube-like) */}
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePlay() }}
                        className="pointer-events-auto bg-black/60 hover:bg-black/70 p-4 rounded-full flex items-center justify-center"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10" />}
                      </button>
                    </div>

                    {/* Progress bar (clickable like YouTube) */}
                    <div className={`absolute left-0 right-0 top-auto bottom-12 px-0 ${showControls ? '' : 'pointer-events-none'}`}>
                          <div
                            className="h-2 bg-gray-700 w-full cursor-pointer relative rounded"
                            onPointerDown={startSeek}
                            onPointerMove={(e) => { if (isSeeking) handleSeekMove(e) }}
                            onPointerUp={endSeek}
                            onPointerCancel={endSeek}
                          >
                            {/* buffered track */}
                            <div className="absolute left-0 top-0 h-2 bg-gray-500 rounded" style={{ width: `${duration ? (bufferedEnd / duration) * 100 : 0}%`, opacity: 0.6 }} />
                            {/* played track */}
                            <div className="absolute left-0 top-0 h-2 bg-red-600 rounded" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                            {/* thumb */}
                            <div
                              className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow transform -translate-x-1/2 -translate-y-1/2 transition-all"
                              style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                            />
                          </div>
                      <div className="flex justify-between text-xs text-gray-300 mt-1 px-2">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Bottom control bar (YouTube-like) */}
                    <div className={`absolute left-0 right-0 bottom-0 p-2 bg-black/60 backdrop-blur-sm flex flex-wrap items-center gap-2 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      <button
                        onClick={() => skipSeconds(-10)}
                        className="p-2 bg-black/30 hover:bg-black/50 rounded flex items-center justify-center"
                        title="Rewind 10s"
                        aria-label="Rewind 10 seconds"
                      >
                        <SkipBack className="h-5 w-5" />
                      </button>

                      <button
                        onClick={togglePlay}
                        className="p-2 bg-black/30 hover:bg-black/50 rounded flex items-center justify-center"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </button>

                      <button
                        onClick={() => skipSeconds(10)}
                        className="p-2 bg-black/30 hover:bg-black/50 rounded flex items-center justify-center"
                        title="Forward 10s"
                        aria-label="Forward 10 seconds"
                      >
                        <SkipForward className="h-5 w-5" />
                      </button>

                      {/* Segment A/B controls (hidden on small screens to avoid overflow) */}
                      <div className="hidden md:flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (!videoRef.current) return
                            setSegmentStart(videoRef.current.currentTime)
                          }}
                          className="px-2 py-1 bg-black/30 hover:bg-black/50 rounded text-xs"
                          title="Set A (segment start)"
                        >
                          A
                        </button>
                        <button
                          onClick={() => {
                            if (!videoRef.current) return
                            setSegmentEnd(videoRef.current.currentTime)
                          }}
                          className="px-2 py-1 bg-black/30 hover:bg-black/50 rounded text-xs"
                          title="Set B (segment end)"
                        >
                          B
                        </button>
                        <button
                          onClick={() => {
                            if (segmentStart == null || segmentEnd == null) return
                            // ensure start < end
                            if (segmentEnd <= segmentStart) return
                            if (!videoRef.current) return
                            videoRef.current.currentTime = segmentStart
                            videoRef.current.play().catch(() => {})
                            setIsReplayingSegment(true)
                            setIsPlaying(true)
                          }}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                          title="Replay A→B"
                        >
                          Replay
                        </button>
                        <button
                          onClick={() => setLoopSegment((v) => !v)}
                          className={`px-2 py-1 rounded text-xs ${loopSegment ? 'bg-green-600' : 'bg-black/30 hover:bg-black/50'}`}
                          title="Toggle loop segment"
                        >
                          {loopSegment ? 'Loop' : 'Loop'}
                        </button>
                        <button
                          onClick={() => {
                            setSegmentStart(null)
                            setSegmentEnd(null)
                            setIsReplayingSegment(false)
                            setLoopSegment(false)
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                          title="Clear segment"
                        >
                          Clear
                        </button>
                        <div className="text-xs text-gray-300 ml-2">
                          {segmentStart != null && <span>A: {formatTime(segmentStart)}</span>}
                          {segmentEnd != null && <span className="ml-2">B: {formatTime(segmentEnd)}</span>}
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-gray-200" />
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={muted ? 0 : volume}
                          onChange={(e) => handleVolumeChange(Number(e.target.value))}
                          className="w-24"
                          aria-label="Volume"
                        />
                      </div>

                      <div className="flex items-center gap-3 ml-auto">
                        <div className="hidden sm:flex text-xs text-gray-200 w-24 text-center">{formatTime(currentTime)} / {formatTime(duration)}</div>
                        <button
                          onClick={toggleFullscreen}
                          className="p-2 bg-black/30 hover:bg-black/50 rounded flex items-center justify-center"
                          title="Fullscreen"
                          aria-label="Fullscreen"
                        >
                          <Maximize className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <iframe
                      src={getVideoEmbedUrl(videoUrl)}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={title}
                    />

                    {/* Video Controls Overlay for embed (fullscreen only) */}
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        onClick={toggleFullscreen}
                        className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/75 rounded transition-colors"
                        title="Fullscreen"
                      >
                        <Maximize className="h-5 w-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Video Info */}
            <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    {isCompleted && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-muted">
                      {workoutTitle}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold mb-2">{title}</h1>
                  <p className="text-sm text-muted">
                    {exerciseName} • Week {week}, Day {day}
                  </p>
                </div>
              </div>

              {description && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h3 className="font-semibold mb-2 text-blue-400">Description</h3>
                  <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
                    {description}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {previousVideoId && (
                <Link
                  href={`#previous`}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors text-center flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous Video
                </Link>
              )}
              {nextVideoId && (
                <Link
                  href={`#next`}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-center flex items-center justify-center gap-2"
                >
                  Next Video
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </Link>
              )}
            </div>
          </div>

          {/* Sidebar - Course Outline */}
          <div className="lg:col-span-1">
            {/* Course Info Card */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6 sticky top-20">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold text-lg">Course Content</h3>
              </div>

              <div className="bg-gray-900 rounded p-3 mb-4">
                <p className="text-sm text-gray-400 mb-1">Current Program</p>
                <p className="font-medium text-white">{programTitle}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full w-[45%]" />
                </div>
              </div>

              <Link
                href={`/programs/${programId}/videos`}
                className="block w-full text-center px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg font-medium transition-colors text-sm"
              >
                View All Videos
              </Link>
            </div>

            {/* Related Videos */}
            {relatedVideos.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Play className="h-4 w-4 text-blue-400" />
                  More from this week
                </h3>
                <div className="space-y-3">
                  {relatedVideos.map((video) => (
                    <Link
                      key={video.id}
                      href={`#video-${video.id}`}
                      className="block p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors group"
                    >
                      <div className="flex gap-3">
                        <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                          <Play className="h-4 w-4 text-muted group-hover:text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white">
                            {video.title}
                          </p>
                          <p className="text-xs text-muted mt-1">
                            {video.duration}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
