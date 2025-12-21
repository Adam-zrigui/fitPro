'use client'

import { useEffect, useState } from 'react'
import { Plus, Users, DollarSign, BookOpen, TrendingUp, Award, Sparkles, ArrowRight, BarChart3, Calendar, Target, Star } from 'lucide-react'
import Link from 'next/link'

export default function TrainerDashboard() {
  const [programs, setPrograms] = useState<any[]>([])
  const [totalRevenue, setTotalRevenue] = useState<any>({ _sum: { amount: 0 } })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/trainer/programs')
        const data = await res.json()
        setPrograms(data)

        const revenueRes = await fetch('/api/trainer/revenue')
        const revenueData = await revenueRes.json()
        setTotalRevenue(revenueData)
      } catch (error) {
        console.error('Failed to fetch trainer data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totalStudents = programs.reduce((acc, p) => acc + p._count.enrollments, 0)
  const totalPrograms = programs.length
  const avgRating = 4.8 // Mock rating for display

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">Trainer Dashboard</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4">
            Empower Your
            <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 bg-clip-text text-transparent"> Students</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            Manage your programs, track performance, and help your students achieve their fitness goals.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{totalPrograms}</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Programs</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{totalStudents}</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Active Students</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">
              ${totalRevenue._sum.amount?.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Revenue</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{avgRating}</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Average Rating</div>
          </div>
        </div>

        {/* Create Program CTA */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 rounded-3xl shadow-2xl p-8 lg:p-12 mb-12 text-white">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Target className="h-6 w-6" />
                </div>
                <span className="text-orange-100 font-semibold">Create Program</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black mb-4">
                Ready to Inspire More Students?
              </h2>
              <p className="text-xl text-orange-100 leading-relaxed max-w-2xl">
                Design comprehensive fitness programs that transform lives. Share your expertise and build a thriving coaching business.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                href="/trainer/create"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-orange-600 hover:bg-gray-100 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-6 w-6" />
                Create Program
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Programs Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">My Programs</h2>
                <p className="text-orange-100">Manage and track your fitness programs</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {programs.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <BookOpen className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4">No programs yet</h3>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Create your first fitness program and start helping students achieve their goals.
                </p>
                <Link
                  href="/trainer/create"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
                >
                  <Plus className="h-6 w-6" />
                  Create Your First Program
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {programs.map((program) => (
                  <div
                    key={program.id}
                    className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-6 border border-gray-100 dark:border-slate-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Award className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{program.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                program.published
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {program.published ? 'Published' : 'Draft'}
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                              {program.description || 'A comprehensive fitness program designed to help you achieve your goals.'}
                            </p>
                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{program._count.enrollments} students</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                <span>{program._count.workouts} workouts</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{program.duration} weeks</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>4.8 rating</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                        <Link
                          href={`/trainer/programs/${program.id}/edit`}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          Edit Program
                        </Link>
                        <Link
                          href={`/programs/${program.id}`}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-600 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          View Live
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance Insights */}
        {programs.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-slate-100 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-3xl p-8 lg:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                Performance Insights
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Track your success and optimize your programs for better results
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Student Retention</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Keep students engaged with regular check-ins and progress updates.
                </p>
                <div className="text-2xl font-black text-green-600">94%</div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Program Completion</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Help students finish what they start with achievable milestones.
                </p>
                <div className="text-2xl font-black text-blue-600">87%</div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Student Satisfaction</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Focus on quality content and personalized support for better reviews.
                </p>
                <div className="text-2xl font-black text-purple-600">4.8★</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}