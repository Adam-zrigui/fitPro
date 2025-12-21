'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Toast from '@/components/Toast'
import Image from 'next/image'
import { User, Mail, Shield, Camera, Trash2, ArrowRight, Sparkles, Crown, Settings, Key, AlertTriangle } from 'lucide-react'

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
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
        bio: (session.user as any).bio || '',
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
    // redirect when session is explicitly null (not loading state)
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
        return 'from-purple-500 to-indigo-500'
      case 'TRAINER':
        return 'from-orange-500 to-amber-500'
      default:
        return 'from-blue-500 to-cyan-500'
    }
  }

  const getRoleBgColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800'
      case 'TRAINER':
        return 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800'
      default:
        return 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Profile Settings</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4">
            Manage Your
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"> Profile</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            Keep your account information up to date and secure. Customize your profile to make it uniquely yours.
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-8 p-6 rounded-3xl shadow-2xl border ${
            message.type === 'success'
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
              : 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-2xl flex items-center justify-center ${
                message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {message.type === 'success' ? '✓' : '✕'}
              </div>
              <span className="font-semibold">{message.text}</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Picture Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Profile Picture</h2>
                    <p className="text-blue-100">Show your best self</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col items-center gap-6">
                  {/* Profile Picture */}
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl">
                      {imagePreview ? (
                        <Image
                          src={imagePreview}
                          alt={session.user.name || 'Profile'}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-16 h-16 text-blue-600 dark:text-blue-300" />
                      )}
                    </div>

                    {/* Upload Button Overlay */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 disabled:opacity-50"
                      title="Upload profile picture"
                    >
                      <Camera className="w-5 h-5" />
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
                  <div className="flex flex-col gap-3 w-full">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
                    >
                      <Camera className="h-5 w-5" />
                      {isUploadingImage ? 'Uploading...' : 'Upload Picture'}
                    </button>
                    {imagePreview && (
                      <button
                        onClick={handleRemoveImage}
                        disabled={isUploadingImage}
                        className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-600 text-gray-700 dark:text-gray-300 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
                      >
                        <Trash2 className="h-5 w-5" />
                        Remove Picture
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Personal Information</h2>
                    <p className="text-green-100">Keep your details current</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      <User className="h-4 w-4 inline mr-2 text-blue-600 dark:text-blue-400" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0 transition-colors text-gray-900 dark:text-white font-medium"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      <Mail className="h-4 w-4 inline mr-2 text-blue-600 dark:text-blue-400" />
                      Email Address
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="email"
                        className={`flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-700 border-2 rounded-2xl focus:ring-0 transition-colors text-gray-900 dark:text-white font-medium ${
                          security.editingEmail
                            ? 'border-blue-500 dark:border-blue-400'
                            : 'border-gray-200 dark:border-slate-600 opacity-60 cursor-not-allowed'
                        }`}
                        value={security.editingEmail ? security.emailDraft : formData.email}
                        disabled={!security.editingEmail}
                        onChange={(e) => setSecurity((s) => ({ ...s, emailDraft: e.target.value }))}
                      />
                      {!security.editingEmail ? (
                        <button
                          type="button"
                          onClick={() => setSecurity((s) => ({ ...s, editingEmail: true }))}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          Change
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSecurity((s) => ({ ...s, editingEmail: false, emailDraft: formData.email }))}
                          className="px-6 py-3 bg-gray-100 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    {!security.editingEmail && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        To change your email, click Change and confirm with your current password below.
                      </p>
                    )}
                  </div>

                  {/* Bio - Only for Trainers and Admins */}
                  {(session.user.role === 'TRAINER' || session.user.role === 'ADMIN') && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        📝 Bio
                      </label>
                      <textarea
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0 transition-colors text-gray-900 dark:text-white font-medium resize-vertical"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell others about your experience, certifications, and what makes you a great trainer..."
                        rows={4}
                        maxLength={500}
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {formData.bio.length}/500 characters
                      </p>
                    </div>
                  )}

                  {/* Account Role */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      <Crown className="h-4 w-4 inline mr-2 text-blue-600 dark:text-blue-400" />
                      Account Role
                    </label>
                    <div className={`px-6 py-4 bg-gradient-to-r ${getRoleBgColor(session.user.role)} rounded-2xl border-2 font-bold text-gray-900 dark:text-white flex items-center gap-3`}>
                      <div className={`w-8 h-8 bg-gradient-to-r ${getRoleColor(session.user.role)} rounded-xl flex items-center justify-center`}>
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      {session.user.role}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  >
                    <Settings className="h-6 w-6" />
                    {loading ? 'Saving...' : 'Save Changes'}
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Account Security Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Account Security</h2>
                    <p className="text-orange-100">Keep your account secure</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={handleSecuritySubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:border-orange-500 dark:focus:border-orange-400 focus:ring-0 transition-colors text-gray-900 dark:text-white font-medium"
                      value={security.currentPassword}
                      onChange={(e) => setSecurity((s) => ({ ...s, currentPassword: e.target.value }))}
                      placeholder="Enter current password to confirm changes"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:border-orange-500 dark:focus:border-orange-400 focus:ring-0 transition-colors text-gray-900 dark:text-white font-medium"
                      value={security.newPassword}
                      onChange={(e) => setSecurity((s) => ({ ...s, newPassword: e.target.value }))}
                      placeholder="New password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:border-orange-500 dark:focus:border-orange-400 focus:ring-0 transition-colors text-gray-900 dark:text-white font-medium"
                      value={security.confirmPassword}
                      onChange={(e) => setSecurity((s) => ({ ...s, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
                    >
                      <Key className="h-5 w-5" />
                      {loading ? 'Saving...' : 'Update Security'}
                    </button>
                    {security.editingEmail && (
                      <button
                        type="button"
                        onClick={() => setSecurity((s) => ({ ...s, editingEmail: false }))}
                        className="px-6 py-4 bg-gray-100 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-colors"
                      >
                        Done
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl p-6 border-2 border-gray-200 dark:border-slate-600">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                Account Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-slate-600">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Member since:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {session.user.createdAt ? new Date(session.user.createdAt).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Account ID:</span>
                  <code className="bg-gray-200 dark:bg-slate-600 px-3 py-1 rounded-xl text-xs font-mono text-gray-900 dark:text-white">
                    {session.user.id}
                  </code>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-3xl shadow-2xl border-2 border-red-200 dark:border-red-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900 dark:text-red-400">Danger Zone</h3>
                  <p className="text-red-700 dark:text-red-300">Irreversible account actions</p>
                </div>
              </div>

              <p className="text-red-700 dark:text-red-300 mb-6 leading-relaxed">
                Once you delete your account, there is no going back. All your data, progress, and enrollments will be permanently removed. Please be certain.
              </p>
              <button className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Trash2 className="h-5 w-5" />
                Delete Account
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}