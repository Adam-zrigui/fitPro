// app/admin/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, BookOpen, DollarSign, TrendingUp, User, Calendar, CreditCard, Shield, Zap, BarChart3 } from 'lucide-react'
import StaggerList from '@/components/StaggerList'
import type { User as PrismaUser, Payment as PrismaPayment } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  
  // SIMPLE CHECK - If not admin, redirect
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // SIMPLE DATA FETCH - With error handling
  let userCount = 0
  let programCount = 0
  let enrollmentCount = 0
  let totalRevenue = 0
  // Typed recent lists to avoid implicit any[]
  type RecentUser = Pick<PrismaUser, 'id' | 'name' | 'email' | 'role' | 'createdAt'>
  type RecentPayment = PrismaPayment & { user?: { name?: string | null; email?: string | null } }
  type AuditLogEntry = {
    action: string
    adminId: string
    adminEmail: string
    targetUserId: string
    subscriptionId?: string
    timestamp: string
  }

  let recentUsers: RecentUser[] = []
  let recentPayments: RecentPayment[] = []
  let auditLogs: AuditLogEntry[] = []

  try {
    // Get basic counts
    userCount = await prisma.user.count()
    programCount = await prisma.program.count()
    enrollmentCount = await prisma.enrollment.count()
    
    // Get revenue
    const revenueResult = await prisma.payment.aggregate({
      _sum: { amount: true }
    })
    totalRevenue = revenueResult._sum.amount || 0
    
    // Get recent users
    recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })
    
    // Get recent payments
    recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    // Get audit logs (only if file exists)
    try {
      const logsPath = join(process.cwd(), 'logs', 'admin-actions.log')
      if (existsSync(logsPath)) {
        const logsContent = readFileSync(logsPath, 'utf-8')
        const logLines = logsContent.trim() ? logsContent.trim().split('\n').filter(line => line.trim()) : []
        // Get last 20 entries, reversed to show newest first
        auditLogs = logLines
          .slice(-20)
          .reverse()
          .map(line => {
            try {
              return JSON.parse(line) as AuditLogEntry
            } catch {
              return null
            }
          })
          .filter((log): log is AuditLogEntry => log !== null)
      } else {
        // No log file yet; leave auditLogs empty
      }
    } catch (error) {
      console.log('Audit logs not available:', error)
    }
  } catch (error) {
    console.log('Admin data fetch error:', error)
    // Continue with zero values
  }

  const stats = [
    {
      title: 'Total Users',
      value: userCount,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
    },
    {
      title: 'Total Programs',
      value: programCount,
      icon: BookOpen,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    },
    {
      title: 'Enrollments',
      value: enrollmentCount,
      icon: TrendingUp,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      
      <div className="content-container py-8">
        {/* Header */}
        <div className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 px-4 py-2 rounded-full mb-6">
            <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Admin Dashboard</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50">Admin Dashboard</h1>
            <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-indigo-500 dark:from-purple-600 dark:to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">A</div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Welcome back, <span className="font-semibold">{session.user.name}</span></p>
        </div>

        {/* Stats Cards */}
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={stat.title} className={`group relative bg-gradient-to-br ${stat.bgColor} rounded-3xl p-6 border border-gray-100 dark:border-slate-800 hover:shadow-2xl dark:hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              <div className="absolute top-4 right-4 w-2 h-2 bg-current opacity-20 rounded-full animate-ping group-hover:animate-pulse"></div>
              <div className="absolute top-6 right-6 w-1 h-1 bg-current opacity-30 rounded-full animate-pulse group-hover:animate-ping"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-right flex-1">
                    <div className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.title}</div>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-green-600 dark:text-green-400 font-semibold">Total count</div>
                  <TrendingUp className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            </div>
          ))}
        </StaggerList>

        {/* Recent Data */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Users */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">Recent Users</h2>
                  <p className="text-blue-100">Latest user registrations</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {recentUsers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No recent users</p>
                </div>
              ) : (
                <StaggerList className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user.role}
                      </div>
                    </div>
                  ))}
                </StaggerList>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">Recent Payments</h2>
                  <p className="text-green-100">Latest transactions</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {recentPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No recent payments</p>
                </div>
              ) : (
                <StaggerList className="space-y-4">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                        $
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">${payment.amount.toFixed(2)}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {payment.user ? payment.user.name : 'Unknown User'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </StaggerList>
              )}
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Admin Audit Log</h2>
                <p className="text-orange-100">Administrative actions history</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No audit logs available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Action</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Admin</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Target</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Details</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{log.action}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{log.adminEmail}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{log.targetUserId}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {log.subscriptionId ? (
                            <code className="bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded text-xs font-mono">{log.subscriptionId}</code>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Quick Actions</h2>
                <p className="text-indigo-100">Common administrative tasks</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/admin/users" className="group relative bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-3 text-white transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Manage Users</span>
              </Link>
              <Link href="/admin/programs" className="group relative bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-3 text-white transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 text-center">
                <BookOpen className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Manage Programs</span>
              </Link>
              <Link href="/admin/reports" className="group relative bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-3 text-white transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 text-center">
                <BarChart3 className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">View Reports</span>
              </Link>
              <Link href="/admin/add-video" className="group relative bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-3 text-white transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 text-center">
                <Calendar className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Add Video</span>
              </Link>
              <Link href="/admin/products" className="group relative bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-3 text-white transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Manage Products</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
