'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Video, X, CheckCircle, Link as LinkIcon } from 'lucide-react'
import { extractYouTubeId, getYouTubeEmbedUrl } from '@/lib/youtube'

export default function UploadVideoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadMode, setUploadMode] = useState<'file' | 'youtube'>('file')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [youtubeError, setYoutubeError] = useState('')
  const [videos, setVideos] = useState<Array<{
    id: string
    name: string
    url: string
    size: string
    duration: string
  }>>([])
  const [workoutId, setWorkoutId] = useState('')
  const [exerciseId, setExerciseId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Check file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file')
      return
    }

    // Check file size (limit to 500MB)
    if (file.size > 500 * 1024 * 1024) {
      alert('File size must be less than 500MB')
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      // Create form data - send file under `file` (server expects this)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('programId', params.id)
      formData.append('workoutId', workoutId)
      formData.append('exerciseId', exerciseId)
      formData.append('title', title)
      formData.append('description', description)

      // Upload to the unified upload route with type=video
      const res = await fetch('/api/upload?type=video', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()

      // normalize response: server may return { success: true, data: <result> } or the raw result
      const result = data && data.success && data.data ? data.data : data

      // Add to videos list (use returned metadata if available)
      setVideos(prev => [...prev, {
        id: (result && (result.public_id || result.public_id === 0)) ? result.public_id : `${Date.now()}`,
        name: result?.title || title || file.name,
        url: result?.secure_url || result?.url || result?.secureUrl || '',
        size: formatBytes(file.size),
        duration: result?.duration || '0:00',
        title: result?.title || title,
        description: result?.description || description,
      }])

      // Reset
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      // Navigate back to program page so outline shows the newly uploaded video
      router.push(`/programs/${params.id}`)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload video')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleYouTubeSubmit = async () => {
    setYoutubeError('')
    
    if (!youtubeUrl.trim()) {
      setYoutubeError('Please enter a YouTube URL or embed code')
      return
    }

    if (!workoutId || !exerciseId) {
      setYoutubeError('Please select workout and exercise')
      return
    }

    const videoId = extractYouTubeId(youtubeUrl)
    if (!videoId) {
      setYoutubeError('Invalid YouTube URL. Paste a full URL (youtube.com/watch?v=...) or embed code')
      return
    }

    setUploading(true)

    try {
      const embedUrl = getYouTubeEmbedUrl(videoId)
      
      // Create video record with YouTube URL
      const res = await fetch('/api/programs/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: params.id,
          workoutId,
          exerciseId,
          title: title || 'YouTube Video',
          description,
          youtubeUrl: embedUrl,
        }),
      })

      if (!res.ok) throw new Error('Failed to save video')

      const result = await res.json()

      setVideos(prev => [...prev, {
        id: result.id,
        name: title || 'YouTube Video',
        url: embedUrl,
        size: 'Streaming',
        duration: 'N/A',
      }])

      // Reset
      setYoutubeUrl('')
      setTitle('')
      setDescription('')
      setWorkoutId('')
      setExerciseId('')

      // Navigate back
      router.push(`/programs/${params.id}`)
    } catch (error) {
      console.error('YouTube submit error:', error)
      setYoutubeError('Failed to save video. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-b dark:from-slate-950 dark:to-slate-900">
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Videos</h1>
          <p className="text-secondary mt-2">Add video demonstrations for exercises</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="card mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <Upload className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Upload Video</h2>
                  <p className="text-sm text-secondary">Upload exercise demonstration videos or YouTube links</p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setUploadMode('file')
                    setYoutubeError('')
                  }}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    uploadMode === 'file'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-secondary hover:text-gray-900 dark:hover:text-gray-50'
                  }`}
                >
                  <Upload className="h-4 w-4 inline mr-2" />
                  Upload File
                </button>
                <button
                  onClick={() => {
                    setUploadMode('youtube')
                    setYoutubeError('')
                  }}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    uploadMode === 'youtube'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-secondary hover:text-gray-900 dark:hover:text-gray-50'
                  }`}
                >
                  <LinkIcon className="h-4 w-4 inline mr-2" />
                  YouTube Link
                </button>
              </div>

              {/* Workout & Exercise Selection */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Workout
                  </label>
                  <select
                    value={workoutId}
                    onChange={(e) => setWorkoutId(e.target.value)}
                    className="input"
                  >
                    <option value="">Choose a workout</option>
                    <option value="workout1">Upper Body Power</option>
                    <option value="workout2">Lower Body Strength</option>
                    {/* These would be loaded from API */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Exercise
                  </label>
                  <select
                    value={exerciseId}
                    onChange={(e) => setExerciseId(e.target.value)}
                    className="input"
                    disabled={!workoutId}
                  >
                    <option value="">Choose an exercise</option>
                    <option value="exercise1">Bench Press</option>
                    <option value="exercise2">Bent Over Rows</option>
                    {/* These would be loaded from API based on workout */}
                  </select>
                </div>
              </div>

              {/* Title & Description Inputs */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Bench Press - Proper Form"
                  className="input w-full"
                />
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description shown in course outline"
                  className="input w-full h-24"
                />
              </div>

              {/* File Upload Mode */}
              {uploadMode === 'file' && (
                <>
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="video/*"
                      className="hidden"
                      disabled={uploading || !workoutId || !exerciseId}
                    />
                    
                    <div className="max-w-md mx-auto">
                      <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Video className="h-8 w-8 text-primary-600" />
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2">Drag & drop video files</h3>
                      <p className="text-secondary mb-4">or click to browse</p>
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || !workoutId || !exerciseId}
                        className={`btn-primary ${(!workoutId || !exerciseId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {!workoutId || !exerciseId 
                          ? 'Select workout and exercise first' 
                          : uploading ? 'Uploading...' : 'Browse Files'
                        }
                      </button>
                      
                      <p className="text-sm text-muted mt-4">
                        MP4, MOV, AVI up to 500MB
                      </p>
                    </div>

                    {/* Progress Bar */}
                    {uploading && (
                      <div className="mt-6 max-w-md mx-auto">
                        <div className="flex justify-between text-sm text-secondary mb-1">
                          <span>Uploading...</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* YouTube Mode */}
              {uploadMode === 'youtube' && (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        YouTube URL or Embed Code
                      </label>
                      <textarea
                        value={youtubeUrl}
                        onChange={(e) => {
                          setYoutubeUrl(e.target.value)
                          setYoutubeError('')
                        }}
                        placeholder={'Paste YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)\n\nOr paste embed code (e.g., <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"...'}
                        className="input w-full h-24"
                      />
                      {youtubeError && (
                        <p className="text-red-600 dark:text-red-400 text-sm mt-2">{youtubeError}</p>
                      )}
                    </div>

                    <button
                      onClick={handleYouTubeSubmit}
                      disabled={uploading || !workoutId || !exerciseId || !youtubeUrl.trim()}
                      className={`w-full btn-primary ${(!workoutId || !exerciseId || !youtubeUrl.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {uploading ? 'Adding...' : 'Add YouTube Video'}
                    </button>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How to use YouTube:</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                      <li>Copy the URL from YouTube address bar</li>
                      <li>Or use the share embed code from YouTube</li>
                      <li>We'll handle the rest - just paste and submit!</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Uploaded Videos */}
            {videos.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Uploaded Videos</h3>
                <div className="space-y-3">
                  {videos.map((video) => (
                    <div key={video.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Video className="h-5 w-5 text-muted" />
                        <div>
                          <p className="font-medium">{video.name}</p>
                          <div className="flex gap-4 text-sm text-secondary">
                            <span>{video.size}</span>
                            <span>{video.duration}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-primary-600 hover:text-primary-700">
                          Preview
                        </button>
                        <button className="text-red-600 hover:text-red-700">
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Instructions Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              <h3 className="font-bold mb-4">Video Requirements</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Clear Demonstration</p>
                    <p className="text-sm text-secondary">Show proper form from multiple angles</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Good Lighting</p>
                    <p className="text-sm text-secondary">Ensure the exercise is clearly visible</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Short & Focused</p>
                    <p className="text-sm text-secondary">Keep videos under 2 minutes</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Audio Instructions</p>
                    <p className="text-sm text-secondary">Explain key points during demonstration</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <h4 className="font-semibold mb-3">Supported Formats</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 dark:bg-slate-800 p-2 rounded text-center">MP4</div>
                  <div className="bg-gray-50 dark:bg-slate-800 p-2 rounded text-center">MOV</div>
                  <div className="bg-gray-50 dark:bg-slate-800 p-2 rounded text-center">AVI</div>
                  <div className="bg-gray-50 dark:bg-slate-800 p-2 rounded text-center">WMV</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}