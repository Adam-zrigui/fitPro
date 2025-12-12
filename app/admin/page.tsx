// app/admin/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, BookOpen, DollarSign, TrendingUp, User, Calendar, CreditCard, Shield } from 'lucide-react'
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
    },
    {
      title: 'Total Programs',
      value: programCount,
      icon: BookOpen,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Enrollments',
      value: enrollmentCount,
      icon: TrendingUp,
      color: 'from-orange-500 to-amber-500',
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-purple-500 to-pink-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      
      <div className="content-container py-8">
        {/* Header */}
        <div className="mb-10 sm:mb-12">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50">Admin Dashboard</h1>
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">A</div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Welcome back, <span className="font-semibold">{session.user.name}</span></p>
        </div>

        {/* Stats Grid */}
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8" staggerMs={70} animationClass="animate-fade-in">
          {stats.map((stat, index) => (
            <div key={index} className="card hover:shadow-lg dark:hover:shadow-xl transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wide">{stat.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 mt-3">{stat.value}</p>
                </div>
                <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg flex-shrink-0`}>
                  <stat.icon className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </StaggerList>

        {/* Recent Data */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-gray-50">Recent Users</h2>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            
            {recentUsers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted mx-auto mb-4" />
                <p className="text-muted">No users found</p>
              </div>
            ) : (
              <div className="space-y-4">
                <StaggerList className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-50">{user.name || 'No name'}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <span className={`badge ${
                        user.role === 'ADMIN' ? 'badge-primary' :
                        user.role === 'TRAINER' ? 'badge-warning' :
                        'badge-success'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  ))}
                </StaggerList>
              </div>
            )}
          </div>

          {/* Recent Payments */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-gray-50">Recent Payments</h2>
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            
            {recentPayments.length === 0 ? (
              <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted mx-auto mb-4" />
                  <p className="text-muted">No payments yet</p>
                </div>
            ) : (
              <div className="space-y-4">
            <StaggerList className="space-y-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-50">{payment.user?.name || 'Unknown User'}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">${payment.amount.toFixed(2)}</p>
                    <span className={`badge ${
                      payment.status === 'succeeded' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </StaggerList>
              </div>
            )}
          </div>
        </div>

        {/* Audit Log */}
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold dark:text-gray-50">Admin Audit Log</h2>
            <Shield className="h-5 w-5 text-gray-400" />
          </div>
          
          {auditLogs.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted mx-auto mb-4" />
              <p className="text-muted">No audit logs yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-50">Action</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-50">Admin</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-50">Target User</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-50">Subscription ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-50">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`badge ${
                          log.action === 'grant_subscription' ? 'badge-success' : 'badge-warning'
                        }`}>
                          {log.action === 'grant_subscription' ? 'Granted' : 'Revoked'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-300">
                              {log.adminEmail.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="truncate">{log.adminEmail}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <code className="px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded text-xs font-mono">
                          {log.targetUserId.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {log.subscriptionId ? (
                          <code className="px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded text-xs font-mono">
                            {log.subscriptionId.slice(0, 12)}...
                          </code>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card mt-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link href="/admin/users" className="btn-secondary rounded-md px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-center">
              Manage Users
            </Link>
            <Link href="/admin/programs" className="btn-secondary rounded-md px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-center">
              Manage Programs
            </Link>
            <Link href="/admin/subscription" className="btn-secondary rounded-md px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-center">
              Subscription
            </Link>
            <Link href="/admin/reports" className="btn-secondary rounded-md px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-center">
              View Reports
            </Link>
            <Link href="/admin/users?action=add-admin" className="btn-primary rounded-md px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-center">
              Add New Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
