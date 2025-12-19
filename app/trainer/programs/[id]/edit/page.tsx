'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Save, ChevronUp, ChevronDown, Trash, X, Edit } from 'lucide-react'

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

export default function EditProgramPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [program, setProgram] = useState<any>(null)
  const [workouts, setWorkouts] = useState<any[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [editingWorkoutId, setEditingWorkoutId] = useState<number | null>(null)
  const [sectionFiles, setSectionFiles] = useState<Record<string, File | null>>({})
  const [sectionPreviews, setSectionPreviews] = useState<Record<string, string | null>>({})
  const [sectionPreviewErrors, setSectionPreviewErrors] = useState<Record<string, string | null>>({})

  useEffect(() => {
    fetchProgram()
  }, [params.id])

  const fetchProgram = async () => {
    try {
      const res = await fetch(`/api/programs/${params.id}`)
      const data = await res.json()
      setProgram(data)
      // normalize workouts to include icon field for UI
      setWorkouts((data?.workouts || []).map((w: any) => ({ ...w, thumbnailIcon: w?.thumbnailIcon || '' })))
      // set parts
      setParts(data?.parts || [])
    } catch (error) {
      console.error('Failed to fetch program')
    } finally {
      setLoading(false)
    }
  }

  const setWorkoutIcon = (index: number, icon: string) => {
    setWorkouts(prev => {
      const copy = [...prev]
      copy[index] = { ...(copy[index] || {}), thumbnailIcon: icon }
      return copy
    })
  }

  const ICON_OPTIONS = ['🏋️', '🏃', '🚴', '🤸', '🏊', '🧘', '🦵', '🤼', '⚡', '❤️', '▶️', '⏱️', '🔥']

  const addPart = () => {
    const newPartId = Math.max(...parts.map(p => p.id), 0) + 1
    setParts(prev => [...prev, { id: newPartId, name: '', description: '', sections: [{ id: 1, title: '', url: '', mediaType: 'video' }] }])
  }

  const removePart = (partIndex: number) => {
    const removed = parts[partIndex]
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
    setParts(prev => prev.filter((_, i) => i !== partIndex))
  }

  const updatePart = (partIndex: number, field: 'name' | 'description', value: string) => {
    setParts(prev => {
      const copy = [...prev]
      copy[partIndex] = { ...copy[partIndex], [field]: value }
      return copy
    })
  }

  const addSection = (partIndex: number) => {
    setParts(prev => {
      const copy = [...prev]
      const maxSectionId = Math.max(...(copy[partIndex].sections.map(s => s.id) || [0]), 0)
      copy[partIndex].sections.push({ id: maxSectionId + 1, title: '', url: '', mediaType: 'video' })
      return copy
    })
  }

  const removeSection = (partIndex: number, sectionIndex: number) => {
    setParts(prev => {
      const copy = [...prev]
      const section = copy[partIndex].sections[sectionIndex]
      const partId = copy[partIndex].id
      const key = `${partId}-${section.id}`
      setSectionFiles(prev => {
        const copyFiles = { ...prev }
        delete copyFiles[key]
        return copyFiles
      })
      setSectionPreviews(prev => {
        const copyPreviews = { ...prev }
        if (copyPreviews[key]) {
          try { URL.revokeObjectURL(copyPreviews[key] as string) } catch (e) {}
        }
        delete copyPreviews[key]
        return copyPreviews
      })
      copy[partIndex].sections = copy[partIndex].sections.filter((_, i) => i !== sectionIndex)
      return copy
    })
  }

  const updateSection = (partIndex: number, sectionIndex: number, field: 'title' | 'url' | 'mediaType', value: string) => {
    setParts(prev => {
      const copy = [...prev]
      copy[partIndex].sections[sectionIndex] = {
        ...copy[partIndex].sections[sectionIndex],
        [field]: value
      }
      return copy
    })
  }

  const moveWorkout = (index: number, direction: 'up' | 'down') => {
    setWorkouts(prev => {
      const copy = [...prev]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= copy.length) return prev
      const tmp = copy[target]
      copy[target] = copy[index]
      copy[index] = tmp
      return copy
    })
  }

  const handlePublish = async () => {
    setSaving(true)
    try {
      await fetch(`/api/programs/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: true })
      })
      router.push('/trainer')
    } catch (error) {
      alert('Failed to publish program')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  const basicInfoComplete = Boolean(
    program &&
    String(program.title || '').trim() !== '' &&
    String(program.description || '').trim() !== '' &&
    String(program.level || '').trim() !== ''
  )
  // consider a workout "created" only if it has a string id (persisted in DB)
  const persistedWorkouts = workouts.filter(w => typeof w.id === 'string' && String(w.id).trim() !== '')
  const hasWorkouts = persistedWorkouts.length > 0
  const hasExercises = hasWorkouts && persistedWorkouts.every(w => Array.isArray(w.exercises) && w.exercises.length > 0)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-50 transition-colors">
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{program?.title}</h1>
            <p className="text-secondary mt-2">Edit program details and add workouts</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => router.push('/trainer')}
              className="btn-secondary"
            >
              Cancel
            </button>
            {!program?.published && (
              <button 
                onClick={handlePublish}
                disabled={saving || !(basicInfoComplete && hasWorkouts && hasExercises)}
                className={`btn-primary flex items-center gap-2 ${!(basicInfoComplete && hasWorkouts && hasExercises) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save className="h-5 w-5" />
                {saving ? 'Publishing...' : 'Publish Program'}
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-slate-300">Program Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input type="text" className="input" value={program?.title} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea className="input" rows={3} value={program?.description} disabled />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                    <input type="text" className="input" value={`${program?.duration} weeks`} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                    <input type="text" className="input" value={program?.level} disabled />
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Course Structure</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addPart}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-sky-600 text-white rounded-md shadow-sm hover:bg-sky-500 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Part
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setSaving(true)
                      try {
                        // Prepare parts and upload any section files that were selected
                        const payloadParts = JSON.parse(JSON.stringify(parts))
                        for (let pi = 0; pi < payloadParts.length; pi++) {
                          const part = payloadParts[pi]
                          for (let si = 0; si < part.sections.length; si++) {
                            const section = part.sections[si]
                            const key = `${part.id}-${section.id}`
                            const file = sectionFiles[key]
                            if (!file) {
                              alert('Please attach files for all sections')
                              setSaving(false)
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

                        await fetch(`/api/programs/${params.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ parts: payloadParts })
                        })
                        await fetchProgram()
                      } catch (err) {
                        alert('Failed to save parts')
                      } finally {
                        setSaving(false)
                      }
                    }}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-500 text-sm"
                  >
                    {saving ? 'Saving...' : 'Save Parts'}
                  </button>
                </div>
              </div>

              {parts.length === 0 ? (
                <p className="text-secondary text-center py-8">No parts added yet. Click "Add Part" to get started.</p>
              ) : (
                <div className="space-y-3">
                  {parts.map((part, partIndex) => (
                    <details key={part.id} className="group border border-gray-200 rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-150" open>
                      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 rounded-t-lg group-open:bg-gray-100 dark:group-open:bg-slate-700 transition-colors duration-150">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">Part {partIndex + 1}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{part.name || 'Untitled part'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {parts.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removePart(partIndex) }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove part"
                            >
                              <Trash className="h-4 w-4" />
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

                                    <div className="mt-2">
                                      {sectionPreviewErrors[key] && <p className="text-xs text-red-500">{sectionPreviewErrors[key]}</p>}
                                      {sectionPreviews[key] ? (
                                        (sectionFiles[key] && sectionFiles[key]?.type?.startsWith('video')) ? (
                                          <video src={sectionPreviews[key] || undefined} controls className="w-64 h-36 rounded-lg object-cover" />
                                        ) : (sectionFiles[key] && sectionFiles[key]?.type?.startsWith('image')) ? (
                                          <img src={sectionPreviews[key] || undefined} className="w-64 h-36 rounded-lg object-cover" />
                                        ) : (
                                          <a href={sectionPreviews[key] || undefined} target="_blank" rel="noreferrer" className="text-sm underline">Open file</a>
                                        )
                                      ) : section.url ? (
                                        section.mediaType === 'video' ? (
                                          <video src={section.url} controls className="w-64 h-36 rounded-lg object-cover" />
                                        ) : (
                                          <a href={section.url} target="_blank" rel="noreferrer" className="text-sm underline">Open {section.mediaType}</a>
                                        )
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="shrink-0">
                                    {part.sections.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeSection(partIndex, sectionIndex)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                      >
                                        <Trash className="h-4 w-4" />
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
              )}
            </div>

            <div className="card bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Workouts</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const id = Date.now()
                        setWorkouts(prev => ([...prev, { id, title: '', description: '', duration: 0, thumbnail: '', thumbnailIcon: '', exercises: [] }]))
                        setEditingWorkoutId(id)
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-sky-600 text-white rounded-md shadow-sm hover:bg-sky-500 text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Add Workout
                    </button>
                    {editingWorkoutId !== null && (
                      <button
                        type="button"
                        onClick={async () => {
                          setSaving(true)
                          try {
                            await fetch(`/api/programs/${params.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ workouts })
                            })
                            // refetch
                            await fetchProgram()
                          } catch (err) {
                            alert('Failed to save workouts')
                          } finally {
                            setSaving(false)
                          }
                        }}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-500 text-sm"
                      >
                        {saving ? 'Saving...' : 'Save Workouts'}
                      </button>
                    )}
                  </div>
              </div>

              {workouts.length === 0 ? (
                <p className="text-secondary text-center py-8">No workouts added yet. Click "Add Workout" to get started.</p>
              ) : (
                <div className="space-y-4">
                  {workouts.map((w, wi) => (
                    <div key={w.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 bg-gray-50 dark:bg-slate-800">
                      <div className="flex gap-4 items-start">
                        <div className="w-20 flex-shrink-0 flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-2xl shadow-sm">
                            {w.thumbnailIcon || '🏋️'}
                          </div>
                          <div className="text-xs text-center text-muted mt-2">Icon</div>
                        </div>

                        <div className="flex-1">
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Workout title"
                              value={w.title}
                              onChange={e => setWorkouts(prev => { const copy = [...prev]; copy[wi] = { ...copy[wi], title: e.target.value }; return copy })}
                              className="input flex-1"
                            />
                            <input
                              type="number"
                              min={0}
                              placeholder="mins"
                              value={w.duration || ''}
                              onChange={e => setWorkouts(prev => { const copy = [...prev]; copy[wi] = { ...copy[wi], duration: Number(e.target.value) }; return copy })}
                              className="input w-28"
                            />
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Brief workout description"
                            value={w.description}
                            onChange={e => setWorkouts(prev => { const copy = [...prev]; copy[wi] = { ...copy[wi], description: e.target.value }; return copy })}
                            className="input w-full mt-2"
                          />

                          <div className="mt-3">
                            <div className="text-sm font-medium mb-2">Choose icon</div>
                            <div className="flex gap-2 flex-wrap">
                              {ICON_OPTIONS.map(icon => (
                                <button key={icon} type="button" onClick={() => setWorkoutIcon(wi, icon)} className={`p-2 rounded text-lg ${w.thumbnailIcon === icon ? 'bg-slate-200 dark:bg-slate-700' : 'bg-transparent'} hover:bg-slate-100 dark:hover:bg-slate-700`}>
                                  {icon}
                                </button>
                              ))}
                            </div>
                          </div>

                          {editingWorkoutId === w.id && (
                            <div className="mt-3 border-t pt-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold">Exercises</h4>
                                <button
                                  type="button"
                                  onClick={() => setWorkouts(prev => {
                                    const copy = [...prev]
                                    const exs = copy[wi].exercises || []
                                    // guard: if last exercise is empty, don't add another
                                    const last = exs[exs.length - 1]
                                    if (last && (!last.name || last.name.trim() === '') && (!last.notes || last.notes.trim() === '')) {
                                      return copy
                                    }
                                    copy[wi].exercises = [...exs, { name: '', notes: '' }]
                                    return copy
                                  })}
                                  className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                  Add
                                </button>
                              </div>
                              <div className="space-y-2">
                                {(w.exercises || []).map((ex: any, ei: number) => (
                                  <div key={ei} className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded">
                                    <input type="text" placeholder="Exercise name" value={ex.name} onChange={e => setWorkouts(prev => { const copy = [...prev]; copy[wi].exercises[ei].name = e.target.value; return copy })} className="input flex-1" />
                                    <input type="text" placeholder="Reps/Notes" value={ex.notes || ''} onChange={e => setWorkouts(prev => { const copy = [...prev]; copy[wi].exercises[ei].notes = e.target.value; return copy })} className="input w-40" />
                                    <button type="button" onClick={() => setWorkouts(prev => { const copy = [...prev]; copy[wi].exercises = copy[wi].exercises.filter((_: any, i: number) => i !== ei); return copy })} className="inline-flex items-center gap-2 px-2 py-1 text-red-600 hover:bg-red-50 rounded">
                                      <Trash className="h-4 w-4" />
                                      <span className="sr-only">Remove exercise</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="w-28 flex flex-col items-end gap-2">
                          <button type="button" onClick={() => moveWorkout(wi, 'up')} className="p-2 rounded border bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-700">
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => moveWorkout(wi, 'down')} className="p-2 rounded border bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-700">
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => setWorkouts(prev => prev.filter(x => x.id !== w.id))} className="inline-flex items-center gap-2 px-2 py-1 text-red-600 hover:bg-red-50 rounded">
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Remove workout</span>
                          </button>
                          <button type="button" onClick={() => setEditingWorkoutId(editingWorkoutId === w.id ? null : w.id)} className="inline-flex items-center gap-2 px-2 py-1 border rounded text-sm bg-white dark:bg-slate-900 hover:bg-gray-50">
                            {editingWorkoutId === w.id ? <><X className="h-4 w-4" /><span className="sr-only">Close editor</span></> : <><Edit className="h-4 w-4" /><span className="sr-only">Edit workout</span></>}
                            <span className="hidden sm:inline">{editingWorkoutId === w.id ? 'Close' : 'Edit'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              <h3 className="font-bold mb-4">Publishing Checklist</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 ${basicInfoComplete ? 'bg-green-100' : 'bg-gray-200'} rounded-full flex items-center justify-center` }>
                    {basicInfoComplete ? <span className="text-green-600 text-xs">✓</span> : <span className="text-gray-400 text-xs">○</span>}
                  </div>
                  <span className={`text-sm ${basicInfoComplete ? '' : 'text-muted'}`}>Basic information added</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 ${hasWorkouts ? 'bg-green-100' : 'bg-gray-200'} rounded-full flex items-center justify-center` }>
                    {hasWorkouts ? <span className="text-green-600 text-xs">✓</span> : <span className="text-gray-400 text-xs">○</span>}
                  </div>
                  <span className={`text-sm ${hasWorkouts ? '' : 'text-muted'}`}>Add at least 1 workout</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 ${hasExercises ? 'bg-green-100' : 'bg-gray-200'} rounded-full flex items-center justify-center` }>
                    {hasExercises ? <span className="text-green-600 text-xs">✓</span> : <span className="text-gray-400 text-xs">○</span>}
                  </div>
                  <span className={`text-sm ${hasExercises ? '' : 'text-muted'}`}>Add exercises to workouts</span>
                </div>
              </div>
              <div className="mt-4 text-sm">
                {basicInfoComplete && hasWorkouts && hasExercises ? (
                  <div className="flex items-center justify-between">
                    <div className="text-green-600">Ready to publish</div>
                    <button onClick={handlePublish} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Publish Program</button>
                  </div>
                ) : (
                  <div className="text-gray-500">Complete the items above to enable publishing</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
