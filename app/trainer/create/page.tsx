'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Plus, Trash2, AlertCircle, CheckCircle, Camera, X, Upload } from 'lucide-react'
// Section and Part types for type safety
type Section = {
  id: number;
  title: string;
  url: string;
  mediaType: 'video';
};

type Part = {
  id: number;
  name: string;
  description: string;
  sections: Section[];
};

export default function CreateProgramPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<{ title: string; description: string; category: string; level: string; duration: string; learningOutcomes: string[]; parts: Part[] }>({
    title: '',
    description: '',
    category: 'Health & Fitness',
    level: 'Beginner',
    duration: '',
    learningOutcomes: [''],
    parts: [{ id: 1, name: '', description: '', sections: [{ id: 1, title: '', url: '', mediaType: 'video' }] }],
  })
  const [sectionFiles, setSectionFiles] = useState<Record<string, File | null>>({})
  const [sectionPreviews, setSectionPreviews] = useState<Record<string, string | null>>({})
  const [sectionPreviewErrors, setSectionPreviewErrors] = useState<Record<string, string | null>>({})
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    // Validation
    if (!formData.title.trim()) {
      setError('Course title is required')
      setLoading(false)
      return
    }
    if (!formData.description.trim()) {
      setError('Course description is required')
      setLoading(false)
      return
    }
      if (!formData.duration || parseInt(formData.duration) < 1) {
        setError('Course duration must be at least 1 week')
        setLoading(false)
        return
      }

      try {
        // Upload thumbnail first if selected
        let thumbnailUrl = null
        if (thumbnailFile) {
          thumbnailUrl = await uploadThumbnail()
        }

        // Filter out empty learning outcomes
        const outcomes = formData.learningOutcomes.filter(o => o.trim())
        
        if (outcomes.length === 0) {
          setError('Add at least one learning outcome')
          setLoading(false)
          return
        }      // Prepare parts and upload any section files that were selected
      const payloadParts = JSON.parse(JSON.stringify(formData.parts))
      for (let pi = 0; pi < payloadParts.length; pi++) {
        const part = payloadParts[pi]
        for (let si = 0; si < part.sections.length; si++) {
          const section = part.sections[si]
          const key = `${part.id}-${section.id}`
          const file = sectionFiles[key]
          if (!file) {
            setError('Please attach files for all sections')
            setLoading(false)
            return
          }

          const fd = new FormData()
          fd.append('file', file)
          const sRes = await fetch('/api/upload', { method: 'POST', body: fd })
          if (!sRes.ok) {
            const t = await sRes.text()
            throw new Error(t || 'Failed to upload section file')
          }
          const sJson = await sRes.json()
          section.url = sJson.url
        }
      }

      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          thumbnail: thumbnailUrl,
          parts: payloadParts,
          learningOutcomes: outcomes.join('|')
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create program')
      }

      const program = await res.json()
      setSuccess('Course created successfully! Redirecting...')
      setTimeout(() => {
        router.push(`/trainer/programs/${program.id}/edit`)
      }, 1500)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create program')
    } finally {
      setLoading(false)
    }
  }

  const addOutcome = () => {
    setFormData({
      ...formData,
      learningOutcomes: [...formData.learningOutcomes, '']
    })
  }

  const removeOutcome = (index: number) => {
    setFormData({
      ...formData,
      learningOutcomes: formData.learningOutcomes.filter((_, i) => i !== index)
    })
  }

  const updateOutcome = (index: number, value: string) => {
    const updated = [...formData.learningOutcomes]
    updated[index] = value
    setFormData({ ...formData, learningOutcomes: updated })
  }

  const addPart = () => {
    const newPartId = Math.max(...formData.parts.map(p => p.id), 0) + 1
    setFormData({
      ...formData,
      parts: [...formData.parts, { id: newPartId, name: '', description: '', sections: [{ id: 1, title: '', url: '', mediaType: 'video' }] }]
    })
  }

  const removePart = (partIndex: number) => {
    const removed = formData.parts[partIndex]
    // clean up any section previews/files for removed part
    if (removed) {
      const keysToRemove: string[] = []
      removed.sections.forEach((s: any) => keysToRemove.push(`${removed.id}-${s.id}`))
      if (keysToRemove.length) {
        setSectionFiles(prev => {
          const copy = { ...prev }
          keysToRemove.forEach(k => delete copy[k])
          return copy
        })
        setSectionPreviews(prev => {
          const copy = { ...prev }
          keysToRemove.forEach(k => {
            if (copy[k]) {
              try { URL.revokeObjectURL(copy[k] as string) } catch (e) {}
            }
            delete copy[k]
          })
          return copy
        })
      }
    }

    setFormData({
      ...formData,
      parts: formData.parts.filter((_, i) => i !== partIndex)
    })
  }

  const updatePart = (partIndex: number, field: 'name' | 'description', value: string) => {
    const updated = [...formData.parts]
    updated[partIndex] = { ...updated[partIndex], [field]: value }
    setFormData({ ...formData, parts: updated })
  }

  const addSection = (partIndex: number) => {
    const updated = [...formData.parts]
    const maxSectionId = Math.max(...(updated[partIndex].sections.map(s => s.id) || [0]), 0)
    updated[partIndex].sections.push({ id: maxSectionId + 1, title: '', url: '', mediaType: 'video' })
    setFormData({ ...formData, parts: updated })
  }

  const removeSection = (partIndex: number, sectionIndex: number) => {
    const updated = [...formData.parts]
    const section = updated[partIndex].sections[sectionIndex]
    const partId = updated[partIndex].id
    const key = `${partId}-${section.id}`

    // remove preview/file state for this section
    setSectionFiles(prev => {
      const copy = { ...prev }
      delete copy[key]
      return copy
    })
    setSectionPreviews(prev => {
      const copy = { ...prev }
      if (copy[key]) {
        try { URL.revokeObjectURL(copy[key] as string) } catch (e) {}
      }
      delete copy[key]
      return copy
    })

    updated[partIndex].sections = updated[partIndex].sections.filter((_, i) => i !== sectionIndex)
    setFormData({ ...formData, parts: updated })
  }

  const updateSection = (partIndex: number, sectionIndex: number, field: 'title' | 'url' | 'mediaType', value: string) => {
    const updated = [...formData.parts]
    updated[partIndex].sections[sectionIndex] = {
      ...updated[partIndex].sections[sectionIndex],
      [field]: value
    }
    setFormData({ ...formData, parts: updated })
  }

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Thumbnail size must be less than 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    setThumbnailFile(file)
    setError(null) // Clear any previous errors

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setThumbnailPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview(null)
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ''
    }
  }

  const uploadThumbnail = async (): Promise<string | null> => {
    if (!thumbnailFile) return null

    setUploadingThumbnail(true)
    try {
      const formData = new FormData()
      formData.append('file', thumbnailFile)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Failed to upload thumbnail')
      }

      const data = await res.json()
      return data.url
    } catch (error) {
      console.error('Thumbnail upload error:', error)
      throw new Error('Failed to upload course thumbnail')
    } finally {
      setUploadingThumbnail(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-50 transition-colors">
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header + Preview */}
        <div className="mb-8 md:flex md:items-start md:justify-between md:gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-slate-300" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-300">Create New Course</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Share your expertise with learners worldwide</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 hidden md:block">Fill in the basic details, then add parts, sections and media to structure your course.</p>
          </div>


        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">Error</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">Success!</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="card bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 dark:shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
              Basic Information
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  className="input w-full px-4 py-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent dark:focus:ring-slate-700"
                  placeholder="e.g., Complete Fitness Transformation: 12-Week Program"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.title.length}/100 characters</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Course Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  className="input w-full px-4 py-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent dark:focus:ring-slate-700 resize-none"
                  placeholder="Describe what students will learn, who this is for, and what they'll achieve..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.description.length}/1000 characters</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 dark:focus:ring-slate-700 focus:border-transparent"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option>Health & Fitness</option>
                    <option>Strength Training</option>
                    <option>Cardio</option>
                    <option>Yoga & Flexibility</option>
                    <option>Nutrition</option>
                    <option>Weight Loss</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Difficulty Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-slate-700 focus:border-transparent dark:bg-slate-800 dark:text-gray-50"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration (weeks) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="52"
                  className="input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 dark:focus:ring-slate-700 focus:border-transparent dark:bg-slate-800 dark:text-gray-50"
                  placeholder="e.g., 12"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>

              {/* Course Thumbnail */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Course Thumbnail (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {thumbnailPreview ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                        <img
                          src={thumbnailPreview}
                          alt="Course thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveThumbnail}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailSelect}
                      className="hidden"
                      id="course-thumbnail"
                    />
                    <label
                      htmlFor="course-thumbnail"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {thumbnailPreview ? 'Change Thumbnail' : 'Upload Thumbnail'}
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Max 5MB. Recommended: 1200x675px for best display.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Structure */}
          <div className="card bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 dark:shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Structure</h2>
                <p className="text-sm text-secondary">Organize your course into parts/modules with sections and resources</p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={addPart}
                  className="btn flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Part
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {formData.parts.map((part, partIndex) => (
                <details key={part.id} className="group border border-gray-200 rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-150" open>
                  <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 rounded-t-lg group-open:bg-gray-100 dark:group-open:bg-slate-700 transition-colors duration-150">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">Part {partIndex + 1}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{part.name || 'Untitled part'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.parts.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removePart(partIndex) }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove part"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400">Click to expand</div>
                    </div>
                  </summary>

                  <div className="px-4 pb-4 pt-2 space-y-4">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Part/Module Name</label>
                      <input
                        type="text"
                        maxLength={100}
                        className="input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 dark:focus:ring-slate-700 focus:border-transparent dark:bg-slate-800 dark:text-gray-50"
                        placeholder="e.g., Week 1 - Foundation"
                        value={part.name}
                        onChange={(e) => updatePart(partIndex, 'name', e.target.value)}
                      />
                      <label className="block text-sm font-semibold text-gray-700">Part Description</label>
                      <textarea
                        rows={2}
                        maxLength={300}
                        className="input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 dark:focus:ring-slate-700 focus:border-transparent resize-none dark:bg-slate-800 dark:text-gray-50"
                        placeholder="Brief description of what this part covers..."
                        value={part.description}
                        onChange={(e) => updatePart(partIndex, 'description', e.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-600">Sections</div>
                        <button type="button" onClick={() => addSection(partIndex)} className="btn btn-sm flex items-center gap-2">
                          <Plus className="h-4 w-4" /> Add Section
                        </button>
                      </div>

                      <div className="space-y-2">
                        {part.sections.map((section, sectionIndex) => {
                          const key = `${part.id}-${section.id}`
                          return (
                            <div key={section.id} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-slate-700">
                              <div className="flex-1 space-y-2">
                                <input
                                  type="text"
                                  maxLength={80}
                                  className="input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 dark:focus:ring-slate-700 focus:border-transparent text-sm dark:bg-slate-800 dark:text-gray-50"
                                  placeholder="Section title"
                                  value={section.title}
                                  onChange={(e) => updateSection(partIndex, sectionIndex, 'title', e.target.value)}
                                />

                                <div className="flex gap-2 items-center text-sm">
                                  <label className={`px-2 py-1 rounded-lg cursor-pointer border ${section.mediaType === 'video' ? 'border-blue-600 text-blue-600 dark:text-blue-300' : 'border-gray-300 text-gray-700 dark:text-gray-300'}`}>
                                    <input
                                      type="radio"
                                      name={`mediaType-${partIndex}-${sectionIndex}`}
                                      value="video"
                                      checked={section.mediaType === 'video'}
                                      onChange={() => updateSection(partIndex, sectionIndex, 'mediaType', 'video')}
                                      className="sr-only"
                                    />
                                    Video
                                  </label>
                                </div>

                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => {
                                    const f = e.target.files && e.target.files[0]
                                    if (f) {
                                      setSectionFiles(prev => ({ ...prev, [key]: f }))
                                      try {
                                        setSectionPreviews(prev => {
                                          if (prev[key]) {
                                            try { URL.revokeObjectURL(prev[key] as string) } catch (er) {}
                                          }
                                          const url = URL.createObjectURL(f)
                                          return { ...prev, [key]: url }
                                        })
                                        setSectionPreviewErrors(prev => ({ ...prev, [key]: null }))
                                      } catch (err) {
                                        setSectionPreviews(prev => ({ ...prev, [key]: null }))
                                        setSectionPreviewErrors(prev => ({ ...prev, [key]: 'Failed to create preview for selected file' }))
                                      }
                                    } else {
                                      setSectionFiles(prev => ({ ...prev, [key]: null }))
                                      setSectionPreviews(prev => ({ ...prev, [key]: null }))
                                      setSectionPreviewErrors(prev => ({ ...prev, [key]: null }))
                                    }
                                  }}
                                  className="w-full"
                                />
                                <p className="text-xs text-muted mt-1">Upload a {section.mediaType} for this section</p>

                                {/* Preview area for file */}
                                <div className="mt-2">
                                  {sectionPreviewErrors[key] && <p className="text-xs text-red-500">{sectionPreviewErrors[key]}</p>}
                                  {sectionPreviews[key] && (
                                    (sectionFiles[key] && sectionFiles[key]?.type?.startsWith('video')) ? (
                                      <video src={sectionPreviews[key] || undefined} controls className="w-64 h-36 rounded-lg object-cover" />
                                    ) : (sectionFiles[key] && sectionFiles[key]?.type?.startsWith('image')) ? (
                                      <img src={sectionPreviews[key] || undefined} className="w-64 h-36 rounded-lg object-cover" />
                                    ) : (
                                      <a href={sectionPreviews[key] || undefined} target="_blank" rel="noreferrer" className="text-sm underline">Open file</a>
                                    )
                                  )}
                                </div>
                              </div>

                              <div className="shrink-0">
                                {part.sections.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeSection(partIndex, sectionIndex)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Learning Outcomes */}
          <div className="card bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 dark:shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
              Learning Outcomes
            </h2>
            <p className="text-sm text-secondary mb-4">What will students learn in this course?</p>
            
            <div className="space-y-3">
              {formData.learningOutcomes.map((outcome, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    maxLength={150}
                    className="input flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-slate-700 focus:border-transparent dark:bg-slate-800 dark:text-gray-50"
                    placeholder="e.g., Master proper exercise form and technique"
                    value={outcome}
                    onChange={(e) => updateOutcome(index, e.target.value)}
                  />
                  {formData.learningOutcomes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOutcome(index)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove outcome"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addOutcome}
                className="btn mt-3 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Learning Outcome
              </button>
            </div>
          </div>

          {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Course...' : 'Create Course'}
              </button>
            </div>
        </form>

        {/* Info Section */}
        <div className="card mt-8">
          <p className="text-sm text-muted">
            <strong>Tip:</strong> Fill in all basic information first. You can add detailed lesson content, videos, and assignments after creating the course.
          </p>
        </div>
      </div>
    </div>
  )
}
