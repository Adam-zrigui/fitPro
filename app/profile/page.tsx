'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Toast from '@/components/Toast'
import Image from 'next/image'
import { User, Mail, Shield, Camera, Trash2 } from 'lucide-react'

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    editingEmail: false,
    emailDraft: '',
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
      })
      setImagePreview(session.user.image || null)
      setSecurity((s) => ({ ...s, emailDraft: session.user.email || '' }))
    }
    // If redirected after confirming email change, show a message
    try {
      const changed = searchParams?.get('email_changed')
      if (changed) {
        setToast({ type: 'success', text: 'Email confirmed successfully.' })
      }
    } catch (err) {
      // ignore server-side absence
    }
  }, [session])

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
      const formDataObj = new FormData()
      formDataObj.append('file', file)

      // Upload to server
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formDataObj,
      })

      if (!uploadRes.ok) throw new Error('Upload failed')

      const { url } = await uploadRes.json()

      // Update user profile with image URL
      const updateRes = await fetch(`/api/users/${session?.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url }),
      })

      if (!updateRes.ok) throw new Error('Failed to update profile')

      setImagePreview(url)
      
      // Update session
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          image: url,
        },
      })

      setMessage({ type: 'success', text: 'Profile picture updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to upload image',
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!confirm('Remove profile picture?')) return

    try {
      setIsUploadingImage(true)

      const res = await fetch(`/api/users/${session?.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: null }),
      })

      if (!res.ok) throw new Error('Failed to remove image')

      setImagePreview(null)
      
      // Update session
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          image: null,
        },
      })

      setMessage({ type: 'success', text: 'Profile picture removed' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to remove image',
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/users/${session?.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error('Failed to update profile')

      await updateSession()
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (security.newPassword && security.newPassword !== security.confirmPassword) {
        throw new Error('New passwords do not match')
      }

      const payload: any = {}
      if (security.editingEmail && security.emailDraft && security.emailDraft !== formData.email) {
        payload.email = security.emailDraft
      }
      if (security.newPassword) {
        payload.newPassword = security.newPassword
        payload.currentPassword = security.currentPassword
      }

      const res = await fetch(`/api/users/${session?.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update security settings')

      if (data?.message === 'confirmation_sent') {
        // show a toast for confirmation sent
        setToast({ type: 'success', text: 'Confirmation sent to the new email. Please check the new email and click the confirmation link.' })
      } else {
        setMessage({ type: 'success', text: 'Account settings updated' })
        // refresh session
        await updateSession()
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update' })
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    // avoid calling router.push during render (can reference browser globals)
    // redirect when session is explicitly null (not loading)
    // keep rendering while session is undefined (loading state)
    // If session is null (user not authenticated), navigate to signin in an effect
    // to avoid calling navigation during render which can cause "location is not defined" on the server.
    // We still return null here to avoid rendering the protected UI until redirected.
    if (typeof window !== 'undefined') {
      router.push('/auth/signin')
    }
    return null
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
      case 'TRAINER':
        return 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
      default:
        return 'bg-blue-100 dark:bg-slate-900 text-blue-700 dark:text-blue-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Page Title */}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Profile Settings</h1>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {message.type === 'success' ? '✓' : '✕'} {message.text}
          </div>
        )}

        {/* Profile Picture Card */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Picture</h2>
          
          <div className="flex flex-col items-center gap-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-slate-900 dark:to-slate-800 rounded-full flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <Image 
                    src={imagePreview} 
                    alt={session.user.name || 'Profile'}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-blue-600 dark:text-blue-300" />
                )}
              </div>
              
              {/* Upload Button Overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="absolute bottom-0 right-0 bg-blue-600 dark:bg-blue-700 text-white p-2 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                title="Upload profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Upload Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isUploadingImage}
              className="hidden"
            />

            {/* Upload and Remove Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="btn-primary"
              >
                {isUploadingImage ? 'Uploading...' : 'Upload Picture'}
              </button>
              {imagePreview && (
                <button
                  onClick={handleRemoveImage}
                  disabled={isUploadingImage}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>

            <p className="text-sm text-muted text-center">
              JPG, PNG or GIF. Max 5MB.
            </p>
          </div>
        </div>

        {/* Personal Information Card */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Personal Information</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Full Name
              </label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your full name"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Email Address
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="email"
                  className={`input ${security.editingEmail ? '' : 'opacity-60 cursor-not-allowed'}`}
                  value={security.editingEmail ? security.emailDraft : formData.email}
                  disabled={!security.editingEmail}
                  onChange={(e) => setSecurity((s) => ({ ...s, emailDraft: e.target.value }))}
                />
                {!security.editingEmail ? (
                  <button type="button" onClick={() => setSecurity((s) => ({ ...s, editingEmail: true }))} className="btn-ghost">Change</button>
                ) : (
                  <button type="button" onClick={() => setSecurity((s) => ({ ...s, editingEmail: false, emailDraft: formData.email }))} className="btn-secondary">Cancel</button>
                )}
              </div>
              {!security.editingEmail && <p className="text-sm text-muted mt-2">To change your email, click Change and confirm with your current password below.</p>}
            </div>

            {/* Account Role */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Shield className="h-4 w-4 inline mr-2" />
                Account Role
              </label>
              <div className={`px-4 py-3 rounded-lg font-semibold ${getRoleColor(session.user.role)}`}>
                {session.user.role}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Account Security (change password / confirm email change) */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Account Security</h2>

          <form onSubmit={handleSecuritySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
              <input
                type="password"
                className="input"
                value={security.currentPassword}
                onChange={(e) => setSecurity((s) => ({ ...s, currentPassword: e.target.value }))}
                placeholder="Enter current password to confirm changes"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
              <input
                type="password"
                className="input"
                value={security.newPassword}
                onChange={(e) => setSecurity((s) => ({ ...s, newPassword: e.target.value }))}
                placeholder="New password"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
              <input
                type="password"
                className="input"
                value={security.confirmPassword}
                onChange={(e) => setSecurity((s) => ({ ...s, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save Security Settings'}</button>
              {security.editingEmail && <button type="button" onClick={() => setSecurity((s) => ({ ...s, editingEmail: false }))} className="btn-secondary">Done</button>}
            </div>
          </form>
        </div>

        {/* Account Information */}
        <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-800 mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Account Information</h3>
          <div className="space-y-3 text-sm text-secondary">
            <p><strong>Member since:</strong> {session.user.createdAt ? new Date(session.user.createdAt).toLocaleDateString() : 'Recently'}</p>
            <p><strong>Account ID:</strong> <code className="bg-gray-200 dark:bg-slate-800 px-2 py-1 rounded text-xs">{session.user.id}</code></p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg shadow-sm border border-red-200 dark:border-red-800 p-8">
          <h3 className="text-lg font-bold text-red-900 dark:text-red-400 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button className="bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
