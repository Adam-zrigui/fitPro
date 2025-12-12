'use client'

import { useEffect, useState, useRef } from 'react'
import { Clock, Users, Star, PlayCircle, TrendingUp, Filter, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import StaggerList from '@/components/StaggerList'

interface Program {
  id: string
  title: string
  description?: string
  level: string
  duration: number
  thumbnail?: string
  trainer: { name: string }
  _count: { enrollments: number }
  videoCount: number
  hasVideos: boolean
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await fetch('/api/programs')
        if (!res.ok) throw new Error('Failed to fetch programs')
        const data = await res.json()
        setPrograms(data)
        setSearchInput('')
      } catch (error) {
        console.error('Failed to load programs:', error)
        setPrograms([])
      } finally {
        setLoading(false)
      }
    }
    fetchPrograms()
  }, [])

  // Debounce search input to improve UX
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // Focus search with '/'
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

  useEffect(() => {
    let filtered = [...programs]

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.level.toLowerCase() === selectedCategory.toLowerCase())
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b._count.enrollments - a._count.enrollments)
        break
      case 'newest':
      default:
        // Assume newer items would be sorted differently, but we'll keep current order
        break
    }

    setFilteredPrograms(filtered)
  }, [programs, selectedCategory, searchQuery, sortBy])

  const categories = [
    { id: 'all', name: 'All Programs', count: programs.length },
    { id: 'beginner', name: 'Beginner', count: programs.filter(p => p.level === 'Beginner').length },
    { id: 'intermediate', name: 'Intermediate', count: programs.filter(p => p.level === 'Intermediate').length },
    { id: 'advanced', name: 'Advanced', count: programs.filter(p => p.level === 'Advanced').length },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-500 dark:from-slate-900 dark:to-slate-800 text-white">
        <div className="absolute inset-0 bg-black/5 dark:bg-black/20" />
        <div className="relative content-container section-wrapper">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Discover Your Perfect
              <span className="block bg-gradient-to-r from-white to-cyan-100 dark:from-cyan-200 dark:to-blue-200 bg-clip-text text-transparent">
                Fitness Journey
              </span>
            </h1>
            <p className="text-xl text-blue-100 dark:text-blue-200 max-w-3xl mx-auto mb-10">
              Unlimited access to all expertly crafted programs with video demonstrations, 
              personalized guidance, and proven results
            </p>
            
            {/* Search and Filter */}
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Search programs... (press /)"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 px-8 transition-all"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  Filters
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className="relative z-20 bg-white/0 backdrop-blur-0">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <PlayCircle />, label: 'Video Lessons', value: '500+' },
                { icon: <Users />, label: 'Expert Trainers', value: '50+' },
                { icon: <Star />, label: 'Programs', value: programs.length.toString() },
                { icon: <TrendingUp />, label: 'Success Rate', value: '95%' },
              ].map((stat, index) => (
                <div key={index} className="card glass bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-blue-100">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Browse Categories</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  category.id === selectedCategory
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {category.name}
                <span className="ml-2 text-sm opacity-75">({category.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Programs */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Featured Programs</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('newest')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  sortBy === 'newest'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  sortBy === 'popular'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                Most Popular
              </button>
            </div>
          </div>

          {/* Programs Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="card text-center py-16">
              <div className="max-w-md mx-auto">
                <PlayCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Programs Found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Try adjusting your search or filters</p>
              </div>
            </div>
          ) : (
            <StaggerList className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" staggerMs={70} animationClass="animate-fade-in-up">
              {filteredPrograms.map((program) => (
                <div key={program.id} className="group transform-gpu hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
                  <div className="card card-hover overflow-hidden">
                    {/* Video Thumbnail */}
                    <div className="relative h-48 mb-4 overflow-hidden rounded-xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                        <PlayCircle className="h-12 w-12 text-white/80" />
                      </div>
                      
                      {/* Video Count Badge */}
                      {program.hasVideos && (
                        <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                          <PlayCircle className="h-3 w-3 inline mr-1" />
                          {program.videoCount} videos
                        </div>
                      )}
                      
                      {/* Level Badge */}
                      <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-medium ${
                        program.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                        program.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {program.level}
                      </div>
                      
                      {/* Trainer */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold">👤</span>
                          </div>
                          <span className="text-sm text-white font-medium">
                            {program.trainer.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Program Info */}
                    <div className="p-2">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {program.title}
                      </h3>
                      <p className="text-secondary text-sm mb-4 line-clamp-2">
                        {program.description}
                      </p>
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-muted mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{program.duration} weeks</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{program._count.enrollments} enrolled</span>
                          </div>
                        </div>
                        
                        {/* Video Indicator */}
                        {program.hasVideos && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <PlayCircle className="h-4 w-4" />
                            <span>With videos</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Access & CTA (subscription-based) */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <p className="text-sm text-muted">Included with subscription</p>
                        </div>
                        <Link 
                          href={`/programs/${program.id}`}
                          className="btn-primary text-sm px-6"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </StaggerList>
          )}
        </div>

        {/* Video Section */}
        <div className="mt-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Learn with Video Demonstrations</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Each exercise comes with professional video instructions to ensure proper form and technique
            </p>
          </div>
          
          {/* Video Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: '🎬',
                title: 'High-Quality Videos',
                description: '4K video demonstrations from multiple angles'
              },
              {
                icon: '👨‍🏫',
                title: 'Expert Instruction',
                description: 'Step-by-step guidance from certified trainers'
              },
              {
                icon: '📱',
                title: 'Mobile Friendly',
                description: 'Watch on any device, anywhere, anytime'
              }
            ].map((feature, index) => (
              <div key={index} className="card text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="card bg-gradient-to-br from-blue-600 to-cyan-500 text-white mt-12">
          <div className="max-w-3xl mx-auto text-center py-12 px-6">
            <h2 className="text-3xl font-bold mb-4">Start Your Fitness Journey Today</h2>
            <p className="text-blue-100 mb-8">
              Join thousands of members transforming their lives with our video-guided programs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup" className="btn bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700">
                Sign Up Free
              </Link>
              <Link href="/auth/signin" className="btn bg-transparent border-2 border-white text-white hover:bg-white/10">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}