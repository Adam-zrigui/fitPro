"use client"

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Loader } from 'lucide-react'

interface ReportData {
  totalUsers: number
  totalPrograms: number
  totalEnrollments: number
  totalRevenue: number
  activeSubscriptions: number
  monthlyGrowth: { month: string; users: number; enrollments: number }[]
  topPrograms: { title: string; enrollments: number }[]
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Reports & Analytics</h1>
          </div>
          <p className="text-secondary">Comprehensive overview of your platform</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="card card-hover">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-secondary">{stat.title}</p>
                <div className={`bg-gradient-to-br ${stat.color} p-2 rounded-lg`}> 
                  <stat.icon className="h-5 w-5 text-white dark:text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold dark:text-gray-50">
                {typeof stat.value === 'number'
                  ? stat.currency
                    ? formatCurrency(stat.value)
                    : formatNumber(stat.value)
                  : stat.value}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">{stat.change} this month</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Growth */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6 dark:text-gray-50">Monthly Growth</h2>
            <div className="space-y-4">
              {data.monthlyGrowth.map((month, i) => {
                const maxUsers = Math.max(...data.monthlyGrowth.map(m => m.users), 1)
                const pct = Math.round((month.users / maxUsers) * 100)
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-100">{month.month}</span>
                      <span className="text-sm text-secondary">{formatNumber(month.users)} users</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-800/50 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Programs */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6 dark:text-gray-50">Top Programs</h2>
            <div className="space-y-4">
              {data.topPrograms.map((program, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {i + 1}
                    </div>
                    <p className="font-medium text-gray-900 dark:text-gray-50">{program.title}</p>
                  </div>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatNumber(program.enrollments)} enrollments</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 dark:text-gray-50">Report Information</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-secondary">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Data Updated</p>
              <p className="text-muted">{new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Report Period</p>
              <p className="text-muted">Current Month</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Next Update</p>
              <p className="text-muted">Tomorrow at 12:00 AM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
