'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { BookOpen, Edit2, Trash2, Eye, Plus, Loader, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'
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
    {
      label: 'Total Programs',
      value: programs.length,
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
    },
    {
      label: 'Published',
      value: programs.filter(p => p.published).length,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    },
    {
      label: 'Draft',
      value: programs.filter(p => !p.published).length,
      icon: Edit2,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      
      <div className="content-container py-8">
        {/* Header */}
        <div className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 px-4 py-2 rounded-full mb-6">
            <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">Manage Programs</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50">Programs Management</h1>
            <div className="flex items-center gap-4">
              <Link href="/trainer/create" className="btn-primary">
                <Plus className="h-5 w-5 mr-2" />
                New Program
              </Link>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Manage and organize fitness programs</p>
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

        {/* Stats Cards */}
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={stat.label} className={`group relative bg-gradient-to-br ${stat.bgColor} rounded-3xl p-6 border border-gray-100 dark:border-slate-800 hover:shadow-2xl dark:hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              <div className="absolute top-4 right-4 w-2 h-2 bg-current opacity-20 rounded-full animate-ping group-hover:animate-pulse"></div>
              <div className="absolute top-6 right-6 w-1 h-1 bg-current opacity-30 rounded-full animate-pulse group-hover:animate-ping"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-right flex-1">
                    <div className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-green-600 dark:text-green-400 font-semibold">Total count</div>
                  <TrendingUp className="h-4 w-4 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            </div>
          ))}
        </StaggerList>

        {/* Programs Management Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="h-6 w-6" />
              <div>
                <h2 className="font-bold text-xl">Program Management</h2>
                <p className="text-green-100 text-sm">
                  {filteredPrograms.length} of {programs.length} programs
                  {(filter !== 'all' || searchTerm) && (
                    <span className="ml-2 text-green-200">
                      ({filter !== 'all' ? `${filter}` : ''}
                      {filter !== 'all' && searchTerm ? ' • ' : ''}
                      {searchTerm ? `search: "${searchTerm}"` : ''})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3 mb-6">
              {['all', 'published', 'draft'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as 'all' | 'published' | 'draft')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all capitalize ${
                    filter === f
                      ? 'bg-white text-green-700 shadow-lg'
                      : 'bg-green-500/20 text-green-100 hover:bg-green-500/30'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="mb-6">
              <input
                type="search"
                aria-label="Search programs"
                placeholder="Search programs or trainer... (press /)"
                ref={searchRef}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/50"
              />
            </div>
          </div>

          <div className="p-6">
            {/* Programs List */}
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-slate-600 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-gray-200 dark:bg-slate-600 rounded w-1/3" />
                        <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPrograms.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No programs found</p>
              </div>
            ) : (
              <StaggerList className="space-y-4">
                {filteredPrograms.map(program => (
                  <div key={program.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                      {program.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{program.title}</h3>
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
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>By {program.trainer.name || 'Unknown'}</span>
                        <span>{program._count.workouts} workouts</span>
                        <span>{program._count.enrollments} enrollments</span>
                        <span>{new Date(program.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/programs/${program.id}`} className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                        <Eye className="h-5 w-5" />
                      </Link>
                      <Link href={`/trainer/edit/${program.id}`} className="p-2 text-gray-400 hover:text-green-500 transition-colors">
                        <Edit2 className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => openDeleteModal(program.id, program.title)}
                        disabled={deletingId === program.id}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {deletingId === program.id ? <Loader className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </StaggerList>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-green-50 dark:bg-slate-800 border border-green-200 dark:border-slate-700 rounded-3xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-green-800 dark:text-green-200 font-medium">Program Management Tips</p>
              <p className="text-green-700 dark:text-green-300 text-sm mt-1">Use the search bar to quickly find programs. Press "/" to focus the search input.</p>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
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
    </div>
  )
}
