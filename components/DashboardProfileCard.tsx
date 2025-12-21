'use client'

import { useState, useRef } from 'react'
import { Camera, Settings, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface DashboardProfileCardProps {
  user: {
    id: string
    name: string | null
    email: string
    image?: string | null
    role: string
  }
  totalWorkouts: number
  totalActivePrograms: number
}

export default function DashboardProfileCard({
  user,
  totalWorkouts,
  totalActivePrograms,
}: DashboardProfileCardProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(user.image || null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file' })
      return
    }

    try {
      setIsUploadingImage(true)

      // Create form data
      const formData = new FormData()
      formData.append('file', file)

      // Upload to your server (you'd need to create this endpoint)
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) throw new Error('Upload failed')

      const { url } = await uploadRes.json()

      // Update user profile with image URL
      const updateRes = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url }),
      })

      if (!updateRes.ok) throw new Error('Failed to update profile')

      setImagePreview(url)
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to upload image',
      })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!confirm('Remove profile picture?')) return

    try {
      setIsUploadingImage(true)

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: null }),
      })

      if (!res.ok) throw new Error('Failed to remove image')

      setImagePreview(null)
      setMessage({ type: 'success', text: 'Profile picture removed' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to remove image',
      })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
      case 'TRAINER':
        return 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800'
      default:
        return 'bg-blue-100 dark:bg-slate-900 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 w-full h-full">
      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <div className="flex flex-col items-center gap-6 text-center h-full">
        {/* Profile Picture - Centered at top */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center overflow-hidden shadow-lg border-4 border-white dark:border-slate-900">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt={user.name || 'Profile'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-6xl">👤</span>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage}
            className="absolute bottom-0 right-0 p-3 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Change profile picture"
          >
            <Camera className="h-5 w-5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            disabled={isUploadingImage}
          />
        </div>

        {/* User Info - Centered */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{user.name || 'User'}</h1>
          <p className="text-secondary text-lg mb-3">{user.email}</p>
          <div className="flex justify-center">
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${getRoleBadgeColor(
                user.role
              )}`}
            >
              {user.role === 'ADMIN' ? '⚙️ Admin' : user.role === 'TRAINER' ? '🏋️ Trainer' : '💪 Member'}
            </span>
          </div>
          {(user.role === 'TRAINER' || user.role === 'ADMIN') && (
            <p className="text-xs text-muted font-medium mt-2">Trainer Verified ✓</p>
          )}
        </div>

        {/* Quick Stats - Horizontal row */}
        <div className="flex gap-4 w-full max-w-xs">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center border border-blue-100 dark:border-slate-800 flex-1">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalActivePrograms}</p>
            <p className="text-sm text-secondary mt-1">Programs</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center border border-cyan-100 dark:border-slate-800 flex-1">
            <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{totalWorkouts}</p>
            <p className="text-sm text-secondary mt-1">Workouts</p>
          </div>
        </div>

        {/* Action Buttons - Bottom */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/profile"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
            title="Go to profile settings"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
          {imagePreview && (
            <button
              onClick={handleRemoveImage}
              disabled={isUploadingImage}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove profile picture"
            >
              <Trash2 className="h-5 w-5" />
              Remove Picture
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
