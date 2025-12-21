'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import ImageWithFallback from '@/components/ImageWithFallback'
import StaggerList from '@/components/StaggerList'
import SMGInsane from '@/components/SMGInsane'
import { Users, Clock, PlayCircle, Grid, List, Search, Filter, Star, Award, Sparkles, Target, Trophy, Zap, ArrowRight, ChevronLeft, ChevronRight, Flame, Heart, Crown, TrendingUp, Play, CheckCircle } from 'lucide-react'

interface Program {
  id: string
  title: string
  description?: string
  level: string
  duration: number
  imageUrl?: string
  trainer: { name: string; bio?: string }
  _count: { enrollments: number }
  videoCount: number
  hasVideos: boolean
  createdAt?: string
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [levelFilter, setLevelFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all')
  const [page, setPage] = useState(1)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [userEnrollments, setUserEnrollments] = useState<Set<string>>(new Set())
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const perPage = 12

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch programs
        const programsRes = await fetch('/api/programs')
        if (!programsRes.ok) {
          throw new Error(`Failed to load programs: ${programsRes.status}`)
        }
        const programsData = await programsRes.json()

        // Fetch user data (enrollments, subscription status, favorites)
        const userRes = await fetch('/api/user/programs-status')
        if (userRes.ok) {
          const userData = await userRes.json()
          if (mounted) {
            setUserEnrollments(new Set(userData.enrolledProgramIds || []))
            setFavorites(new Set(userData.favoriteProgramIds || []))
            setHasActiveSubscription(userData.hasActiveSubscription || false)
          }
        }

        if (mounted) {
          setPrograms(programsData)
        }
      } catch (err: any) {
        console.error('Failed to load programs:', err)
        if (mounted) {
          setError(err.message || 'Failed to load programs. Please try again.')
          setPrograms([])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchData()
    return () => { mounted = false }
  }, [])

  const toggleFavorite = async (programId: string) => {
    try {
      const isFavorited = favorites.has(programId)
      const response = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId, action: isFavorited ? 'remove' : 'add' })
      })

      if (response.ok) {
        setFavorites(prev => {
          const newFavorites = new Set(prev)
          if (isFavorited) {
            newFavorites.delete(programId)
          } else {
            newFavorites.add(programId)
          }
          return newFavorites
        })
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const enrollInProgram = async (programId: string) => {
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId })
      })

      if (response.ok) {
        setUserEnrollments(prev => new Set(Array.from(prev).concat(programId)))
        // Show success message or redirect to program
        window.location.href = `/programs/${programId}`
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to enroll in program')
      }
    } catch (error) {
      console.error('Failed to enroll:', error)
      alert('Failed to enroll in program. Please try again.')
    }
  }

  const filtered = useMemo(() => {
    let list = [...programs]

    // Filter by level
    if (levelFilter !== 'all') {
      list = list.filter(p => p.level.toLowerCase() === levelFilter)
    }

    // Filter by search query
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(p =>
        (p.title + ' ' + (p.description || '') + ' ' + p.trainer.name).toLowerCase().includes(q)
      )
    }

    // Sort by creation date (newest first)
    list.sort((a, b) => (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()))

    return list
  }, [programs, levelFilter, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pagePrograms = filtered.slice((page - 1) * perPage, page * perPage)

  const clearFilters = () => {
    setQuery('')
    setLevelFilter('all')
    setPage(1)
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'from-green-500 to-emerald-500'
      case 'intermediate': return 'from-yellow-500 to-orange-500'
      case 'advanced': return 'from-red-500 to-pink-500'
      default: return 'from-gray-500 to-slate-500'
    }
  }

  const getLevelBgColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
      case 'intermediate': return 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800'
      case 'advanced': return 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800'
      default: return 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-rose-50 dark:from-slate-950 dark:via-purple-950 dark:to-rose-950">
      <SMGInsane />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-rose-600 to-amber-700 dark:from-purple-800 dark:via-rose-800 dark:to-amber-900"></div>
        <div className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-amber-200/20">
              <Crown className="h-4 w-4 text-amber-200" />
              <span className="text-sm font-semibold text-amber-100">Elite Fitness Experience</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Transform Your
              <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent"> Fitness Journey</span>
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
              Discover our exclusive collection of 5 world-class fitness coaches. Each program is meticulously crafted by certified experts for maximum results.
            </p>

            {/* Enhanced Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm rounded-3xl"></div>
                <div className="relative flex items-center gap-4 p-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-6 w-6" />
                    <input
                      aria-label="Search programs"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search programs, trainers, or topics..."
                      className="w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder-white/70 text-lg focus:outline-none focus:ring-2 focus:ring-white/50 rounded-2xl"
                    />
                  </div>
                  <div className="flex gap-2 bg-white/10 rounded-2xl p-1">
                    <button
                      onClick={() => setView('grid')}
                      className={`p-3 rounded-xl transition-all duration-300 ${
                        view === 'grid'
                          ? 'bg-white text-blue-600 shadow-lg'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Grid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setView('list')}
                      className={`p-3 rounded-xl transition-all duration-300 ${
                        view === 'list'
                          ? 'bg-white text-blue-600 shadow-lg'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-2xl font-bold text-white mb-1">{programs.length}+</div>
                <div className="text-blue-100 text-sm">Programs Available</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-2xl font-bold text-white mb-1">
                  {programs.reduce((acc, p) => acc + p._count.enrollments, 0)}
                </div>
                <div className="text-blue-100 text-sm">Active Members</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-2xl font-bold text-white mb-1">
                  {new Set(programs.map(p => p.trainer.name)).size}
                </div>
                <div className="text-blue-100 text-sm">Expert Trainers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-2xl font-bold text-white mb-1">4.8★</div>
                <div className="text-blue-100 text-sm">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 sticky top-0 z-20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Filter className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">Filter by level:</span>
              </div>
              {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-105 ${
                    levelFilter === level
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
            <div className="text-lg text-gray-600 dark:text-gray-400 font-semibold">
              {filtered.length} program{filtered.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        {error ? (
          <div className="text-center py-32">
            <div className="w-24 h-24 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Unable to Load Programs</h3>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-32">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 dark:border-blue-800"></div>
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent absolute inset-0"></div>
            </div>
          </div>
        ) : pagePrograms.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">No programs found</h3>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Try adjusting your search or filter criteria.</p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <Filter className="h-5 w-5" />
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className={`grid gap-8 ${
              view === 'grid'
                ? 'lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2'
                : 'grid-cols-1 max-w-5xl mx-auto'
            }`}>
              <StaggerList className="contents" staggerMs={100} animationClass="animate-fade-in-up">
                {pagePrograms.map((program) => {
                  const isEnrolled = userEnrollments.has(program.id)
                  const isFavorited = favorites.has(program.id)

                  return (
                    <div key={program.id} className="group block">
                      <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800">
                        <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 overflow-hidden">
                          {program.imageUrl ? (
                            <ImageWithFallback
                              src={program.imageUrl}
                              alt={program.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              fallback="gradient"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <PlayCircle className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                                <div className="text-sm text-gray-500">No preview</div>
                              </div>
                            </div>
                          )}

                          {/* Favorite Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleFavorite(program.id)
                            }}
                            className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                          >
                            <Heart className={`h-5 w-5 ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'} transition-colors`} />
                          </button>

                          {/* Level Badge */}
                          <div className="absolute top-4 left-4">
                            <div className={`px-4 py-2 bg-gradient-to-r ${getLevelColor(program.level)} text-white font-bold text-sm rounded-2xl shadow-lg`}>
                              {program.level}
                            </div>
                          </div>

                          {/* Video Count Badge */}
                          {program.hasVideos && (
                            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-2xl text-sm font-semibold flex items-center gap-2">
                              <PlayCircle className="h-4 w-4" />
                              {program.videoCount} videos
                            </div>
                          )}

                          {/* Enrollment Status */}
                          {isEnrolled && (
                            <div className="absolute bottom-4 right-4 bg-green-500 text-white px-3 py-2 rounded-2xl text-sm font-semibold flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Enrolled
                            </div>
                          )}

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                            <div className="text-white">
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="h-4 w-4" />
                                <span className="text-sm font-semibold">{program.duration} weeks</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span className="text-sm font-semibold">{program._count.enrollments} enrolled</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                            {program.title}
                          </h3>

                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                            {program.description || 'No description available.'}
                          </p>

                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
                                <Award className="h-4 w-4 text-white" />
                              </div>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {program.trainer.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="text-sm font-bold">4.8</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{program.duration}w</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{program._count.enrollments}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {isEnrolled ? (
                                <Link
                                  href={`/dashboard`}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                >
                                  <Target className="h-4 w-4" />
                                  Continue
                                </Link>
                              ) : hasActiveSubscription ? (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    enrollInProgram(program.id)
                                  }}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                >
                                  <Play className="h-4 w-4" />
                                  Start Now
                                </button>
                              ) : (
                                <Link
                                  href={`/programs/${program.id}`}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                >
                                  View Details
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </StaggerList>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-16 gap-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-4 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Previous
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-6 py-4 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                          page === pageNum
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-4 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Statistics Section */}
      <div className="bg-gradient-to-r from-gray-900 to-slate-800 dark:from-slate-900 dark:to-slate-950 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 rounded-full mb-6">
              <TrendingUp className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">Community Impact</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Join Our Exclusive
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent"> Fitness Community</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Discover why our community chooses us for their fitness journey. Real results from real people.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-black text-white mb-2">
                {programs.length}+
              </div>
              <div className="text-gray-300 font-semibold">Programs Available</div>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-black text-white mb-2">
                {programs.reduce((acc, p) => acc + p._count.enrollments, 0)}
              </div>
              <div className="text-gray-300 font-semibold">Active Members</div>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-black text-white mb-2">
                {new Set(programs.map(p => p.trainer.name)).size}
              </div>
              <div className="text-gray-300 font-semibold">Expert Trainers</div>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Star className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-black text-white mb-2">
                4.8★
              </div>
              <div className="text-gray-300 font-semibold">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Trainers Section */}
      <div className="bg-white dark:bg-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 rounded-full mb-6">
              <Flame className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">Expert Team</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
              Meet Our
              <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent"> Expert Trainers</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Learn from certified professionals with years of experience in fitness and wellness. Each trainer brings unique expertise to help you achieve your goals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {Array.from(new Set(programs.map(p => p.trainer.name))).slice(0, 3).map((trainerName, index) => {
              const trainerPrograms = programs.filter(p => p.trainer.name === trainerName)
              const totalEnrollments = trainerPrograms.reduce((acc, p) => acc + p._count.enrollments, 0)
              const avgRating = 4.6 + Math.random() * 0.4

              return (
                <div key={trainerName} className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-orange-900/20 dark:via-red-900/20 dark:to-pink-900/20 rounded-3xl p-8 text-center transform hover:scale-105 transition-all duration-500 shadow-2xl hover:shadow-3xl border border-orange-100 dark:border-orange-800">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
                    <Award className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">{trainerName}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    Certified fitness professional with {trainerPrograms.length} program{trainerPrograms.length !== 1 ? 's' : ''} and {totalEnrollments} successful transformations.
                  </p>
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <span className="font-bold text-gray-900 dark:text-white">{totalEnrollments}</span>
                      <span className="text-gray-600 dark:text-gray-400">students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-gray-900 dark:text-white">{avgRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 px-4 py-2 rounded-full mb-6">
              <Heart className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">Success Stories</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
              What Our
              <span className="bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent"> Members Say</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Real transformations from real people who achieved their fitness goals. Join the community of success stories.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Lost 30lbs in 6 months",
                content: "The programs here completely changed my life. The trainers are amazing and the community support is incredible!",
                rating: 5,
                avatar: "SJ"
              },
              {
                name: "Mike Chen",
                role: "Gained 15lbs of muscle",
                content: "Professional guidance with clear progress tracking. I've never felt more motivated to work out.",
                rating: 5,
                avatar: "MC"
              },
              {
                name: "Emma Davis",
                role: "Completed first marathon",
                content: "From couch to marathon in one year. The structured programs made it possible. Highly recommend!",
                rating: 5,
                avatar: "ED"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 dark:border-slate-700">
                <div className="flex items-center mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-8 italic leading-relaxed text-lg">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-lg">{testimonial.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 dark:from-blue-800 dark:via-purple-800 dark:to-indigo-900 py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
            <Zap className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-semibold text-blue-100">Start Today</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
            Ready to Start Your
            <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent"> Transformation?</span>
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join our exclusive community of members who have achieved their fitness goals with our 5 expert coaches. Choose from our curated collection of premium programs and get started today.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 hover:bg-gray-100 font-black text-xl rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="h-6 w-6" />
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center gap-3 px-10 py-5 border-2 border-white text-white hover:bg-white hover:text-blue-600 font-black text-xl rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <Target className="h-6 w-6" />
              Browse Programs
            </Link>
          </div>
          <div className="mt-12 text-blue-100">
            <p className="text-lg font-semibold">✓ No credit card required • ✓ Cancel anytime • ✓ 30-day money-back guarantee</p>
          </div>
        </div>
      </div>
    </div>
  )
}