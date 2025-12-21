"use client"

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Loader, Clock, Target, Star } from 'lucide-react'

interface ReportData {
  totalUsers: number
  totalPrograms: number
  totalEnrollments: number
  totalRevenue: number
  activeSubscriptions: number
  monthlyGrowth: { month: string; users: number; enrollments: number }[]
  topPrograms: { title: string; enrollments: number }[]
  userSatisfaction: number
  totalReviews: number
  completionRate: number
  avgSessionTime: string
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports')
      if (!res.ok) throw new Error('Failed to fetch reports')
      const reportData = await res.json()
      setData(reportData)
    } catch (error) {
      console.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="flex justify-center items-center py-24">
          <Loader className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="text-center py-24">
          <p className="text-muted">Failed to load reports</p>
        </div>
      </div>
    )
  }

  const formatNumber = (n: number) => {
    try {
      return new Intl.NumberFormat(undefined).format(Math.round(n))
    } catch {
      return String(n)
    }
  }

  const formatCurrency = (v: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v)
    } catch {
      return `$${v.toFixed(2)}`
    }
  }

  const stats = [
    {
      title: 'Total Users',
      value: data.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      change: '+12.5%',
    },
    {
      title: 'Total Programs',
      value: data.totalPrograms,
      icon: BarChart3,
      color: 'from-green-500 to-emerald-500',
      change: '+8.2%',
    },
    {
      title: 'Enrollments',
      value: data.totalEnrollments,
      icon: TrendingUp,
      color: 'from-orange-500 to-amber-500',
      change: '+23.1%',
    },
    {
      title: 'Total Revenue',
      value: data.totalRevenue,
      currency: true,
      icon: DollarSign,
      color: 'from-purple-500 to-pink-500',
      change: '+18.7%',
    },
    {
      title: 'Active Subscriptions',
      value: data.activeSubscriptions,
      icon: Users,
      color: 'from-red-500 to-rose-500',
      change: '+5.3%',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Reports & Analytics</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive overview of your platform performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="group relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              <div className="absolute top-4 right-4 w-2 h-2 bg-current opacity-20 rounded-full animate-ping group-hover:animate-pulse"></div>
              <div className="absolute top-6 right-6 w-1 h-1 bg-current opacity-30 rounded-full animate-pulse group-hover:animate-ping"></div>
              <div className="relative z-10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.title}</p>
                  <div className={`bg-gradient-to-r ${stat.color} p-2 rounded-2xl flex items-center justify-center shadow-lg`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                  {typeof stat.value === 'number'
                    ? stat.currency
                      ? formatCurrency(stat.value)
                      : formatNumber(stat.value)
                    : stat.value}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-semibold">{stat.change} this month</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Growth */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">Monthly Growth</h2>
                  <p className="text-blue-100">User and enrollment trends</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.monthlyGrowth.map((month, i) => {
                  const maxUsers = Math.max(...data.monthlyGrowth.map(m => m.users), 1)
                  const pct = Math.round((month.users / maxUsers) * 100)
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{month.month}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{formatNumber(month.users)} users</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Top Programs */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">Top Programs</h2>
                  <p className="text-green-100">Most popular fitness programs</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.topPrograms.map((program, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {i + 1}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">{program.title}</p>
                    </div>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">{formatNumber(program.enrollments)} enrollments</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-3xl transition-all duration-300">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6" />
                <div>
                  <h3 className="text-lg font-bold">Avg Session Time</h3>
                  <p className="text-orange-100">User engagement metric</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.avgSessionTime}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Based on {formatNumber(data.totalUsers)} active users</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-3xl transition-all duration-300">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6" />
                <div>
                  <h3 className="text-lg font-bold">Completion Rate</h3>
                  <p className="text-purple-100">Program finish percentage</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.completionRate}%</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Of {formatNumber(data.totalEnrollments)} total enrollments</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-3xl transition-all duration-300">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6" />
                <div>
                  <h3 className="text-lg font-bold">User Satisfaction</h3>
                  <p className="text-cyan-100">Average rating score</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.userSatisfaction}/5</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Based on {formatNumber(data.totalReviews)} reviews</p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-600 to-slate-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Report Information</h2>
                <p className="text-gray-100">Data freshness and update schedule</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">Data Updated</p>
                <p className="text-gray-600 dark:text-gray-400">{new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">Report Period</p>
                <p className="text-gray-600 dark:text-gray-400">Current Month</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">Next Update</p>
                <p className="text-gray-600 dark:text-gray-400">Tomorrow at 12:00 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
