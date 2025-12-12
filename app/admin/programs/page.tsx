'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { BookOpen, Edit2, Trash2, Eye, Plus, Loader, AlertCircle, CheckCircle } from 'lucide-react'
import StaggerList from '@/components/StaggerList'

interface Program {
  id: string
  title: string
  description: string
  duration: number
  level: string
  imageUrl?: string | null
  trainer: {
    name: string | null
    email: string
  }
  published: boolean
  createdAt: string
  _count: {
    enrollments: number
    workouts: number
  }
}

export default function ProgramsManagementPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; id?: string | null; title?: string } | null>(null)

  useEffect(() => {
    fetchPrograms()
  }, [])

  // Focus search when user presses '/'
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const active = document.activeElement
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/admin/programs')
      if (!res.ok) throw new Error('Failed to fetch programs')
      const data = await res.json()
      setPrograms(data)
    } catch (error) {
      console.error('Failed to load programs', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPrograms = programs
    .filter(p => {
      if (filter === 'published') return p.published
      if (filter === 'draft') return !p.published
      return true
    })
    .filter(p => {
      const q = searchTerm.trim().toLowerCase()
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        (p.trainer?.email || '').toLowerCase().includes(q) ||
        (p.trainer?.name || '').toLowerCase().includes(q)
      )
    })

  const handleDeleteProgram = async (programId: string) => {
    setDeletingId(programId)
    try {
      const res = await fetch('/api/admin/programs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: programId })
      })

      if (!res.ok) throw new Error('Failed to delete program')

      setPrograms(prev => prev.filter(p => p.id !== programId))
      setMessage({ type: 'success', text: 'Program deleted successfully' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete program' })
    } finally {
      setDeletingId(null)
      setConfirmModal(null)
    }
  }

  function openDeleteModal(id: string, title: string) {
    setConfirmModal({ open: true, id, title })
  }
  function closeDeleteModal() {
    setConfirmModal(null)
  }

  const stats = [
    { label: 'Total Programs', value: programs.length },
    { label: 'Published', value: programs.filter(p => p.published).length },
    { label: 'Draft', value: programs.filter(p => !p.published).length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Manage Programs</h1>
            </div>
            <p className="text-gray-600 dark:text-slate-400">View and manage all fitness programs</p>
          </div>
          <Link href="/trainer/create" className="btn-primary">
            <Plus className="h-5 w-5 mr-2" />
            New Program
          </Link>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="card">
              <p className="text-sm text-gray-600 dark:text-slate-400">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          <div className="flex-1">
            <input
              type="search"
              aria-label="Search programs"
              placeholder="Search programs or trainer... (press /)"
              ref={searchRef}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {['all', 'published', 'draft'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as 'all' | 'published' | 'draft')}
              className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Programs List as compact cards */}
        <div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg shadow-sm animate-pulse-slow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-20 h-12 bg-gray-200 dark:bg-slate-700 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-slate-400">No programs found</p>
            </div>
          ) : (
            <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerMs={70} animationClass="animate-fade-in-up">
              {filteredPrograms.map(program => (
                <div
                  key={program.id}
                  className="group p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow transform-gpu hover:-translate-y-0.5 flex flex-col justify-between hover-pop"
                >
                  <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">{program.title}</p>
                          <p className="text-sm text-gray-600 dark:text-slate-200 mt-1 line-clamp-3">{program.description}</p>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-slate-300 text-right">
                          <p>{new Date(program.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          program.level === 'Beginner'
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : program.level === 'Intermediate'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}>
                          {program.level}
                        </span>

                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          program.published
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200'
                        }`}>
                          {program.published ? 'Published' : 'Draft'}
                        </span>

                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-50 dark:bg-slate-700 text-gray-700 dark:text-slate-100">
                          {program._count.workouts} workouts
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-slate-300">
                        <div><span className="font-semibold text-gray-900 dark:text-gray-100">{program.duration}</span> weeks</div>
                        <div><span className="font-semibold text-gray-900 dark:text-gray-100">{program._count.enrollments}</span> enrollments</div>
                      </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 opacity-100">
                      <Link
                        href={`/programs/${program.id}`}
                        className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 dark:focus:ring-offset-slate-800"
                        title={`View ${program.title}`}
                        aria-label={`View Program: ${program.title}`}
                      >
                        <Eye className="h-4 w-4 mr-2" /> View
                      </Link>

                      <Link
                        href={`/trainer/programs/${program.id}/edit`}
                        className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-400 dark:focus:ring-offset-slate-800"
                        title={`Edit ${program.title}`}
                        aria-label={`Edit Program: ${program.title}`}
                      >
                        <Edit2 className="h-4 w-4 mr-2" /> Edit
                      </Link>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={() => openDeleteModal(program.id, program.title)}
                        disabled={deletingId === program.id}
                        className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Delete ${program.title}`}
                        aria-label={`Delete Program: ${program.title}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </StaggerList>
          )}
        </div>
      </div>
      {/* Confirm Modal */}
      {confirmModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeDeleteModal} />
          <div
            className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 w-full max-w-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-heading"
          >
            <h3 id="confirm-delete-heading" className="text-lg font-semibold text-gray-900 dark:text-slate-100">Delete program</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">Are you sure you want to delete "{confirmModal.title}"? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-100" onClick={closeDeleteModal}>Cancel</button>
              <button className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700" onClick={() => confirmModal.id && handleDeleteProgram(confirmModal.id)}>
                {deletingId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
