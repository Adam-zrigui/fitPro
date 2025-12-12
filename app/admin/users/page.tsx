'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Edit2, CheckCircle, AlertCircle, Loader, Trash2 } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  _count: {
    enrollments: number
  }
}

interface Enrollment {
  id: string
  programId: string
  program: { title: string }
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState('ALL')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [enrollments, setEnrollments] = useState<Record<string, Enrollment[]>>({})
  const [loadingEnrollments, setLoadingEnrollments] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load users' })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update user')
      }

      const updatedUser = await res.json()
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      setMessage({ type: 'success', text: `User role updated to ${newRole}` })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update user' })
    } finally {
      setUpdating(null)
    }
  }

  const fetchEnrollments = async (userId: string) => {
    setLoadingEnrollments(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/enrollments`)
      if (!res.ok) throw new Error('Failed to fetch enrollments')
      const data = await res.json()
      setEnrollments(prev => ({ ...prev, [userId]: data }))
      setExpandedUser(expandedUser === userId ? null : userId)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load enrollments' })
    } finally {
      setLoadingEnrollments(null)
    }
  }

  const handleRemoveEnrollment = async (userId: string, enrollmentId: string) => {
    if (!confirm('Remove this enrollment?')) return
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId })
      })
      if (!res.ok) throw new Error('Failed to remove enrollment')
      setEnrollments(prev => ({
        ...prev,
        [userId]: (prev[userId] || []).filter(e => e.id !== enrollmentId)
      }))
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, _count: { enrollments: u._count.enrollments - 1 } } : u))
      setMessage({ type: 'success', text: 'Enrollment removed' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to remove enrollment' })
    }
  }

  const handleGrantSub = async (userId: string) => {
    if (!confirm('Grant subscription to this user without payment?')) return
    setUpdating(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/subscription`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to grant subscription')
      const data = await res.json()
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionStatus: data.user.subscriptionStatus, subscriptionId: data.user.subscriptionId } : u))
      setMessage({ type: 'success', text: 'Subscription granted' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to grant subscription' })
    } finally {
      setUpdating(null)
    }
  }

  const handleRevokeSub = async (userId: string) => {
    if (!confirm('Revoke subscription for this user?')) return
    setUpdating(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/subscription`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to revoke subscription')
      const data = await res.json()
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionStatus: data.user.subscriptionStatus, subscriptionId: null } : u))
      setMessage({ type: 'success', text: 'Subscription revoked' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to revoke subscription' })
    } finally {
      setUpdating(null)
    }
  }

  const filteredUsers = filter === 'ALL' ? users : users.filter(u => u.role === filter)

  const stats = [
    { label: 'Total Users', value: users.length },
    { label: 'Admins', value: users.filter(u => u.role === 'ADMIN').length },
    { label: 'Trainers', value: users.filter(u => u.role === 'TRAINER').length },
    { label: 'Members', value: users.filter(u => u.role === 'MEMBER').length },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      
      <div className="content-container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                <Users className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users Management</h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Manage user roles and permissions</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="card bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:shadow-lg dark:hover:shadow-lg transition-all">
              <p className="text-sm text-secondary">{ stat.label}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          {['ALL', 'MEMBER', 'TRAINER', 'ADMIN'].map(role => (
            <button
              key={role}
              onClick={() => setFilter(role)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === role
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Users Table */}
        <div className="card bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted mx-auto mb-4" />
              <p className="text-muted">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Enrollments</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Joined</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredUsers.map(user => (
                    <React.Fragment key={user.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/20 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-300 font-bold">
                                {(user.name || user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-50">{user.name || 'No name'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`badge ${
                            user.role === 'ADMIN' ? 'badge-primary' :
                            user.role === 'TRAINER' ? 'badge-warning' :
                            'badge-success'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user._count.enrollments}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 flex-wrap items-center">
                            {user.role !== 'TRAINER' && (
                              <button
                                onClick={() => handleRoleChange(user.id, 'TRAINER')}
                                disabled={updating === user.id}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Promote to Trainer"
                              >
                                Make Trainer
                              </button>
                            )}
                            {user.role !== 'ADMIN' && (
                              <button
                                onClick={() => handleRoleChange(user.id, 'ADMIN')}
                                disabled={updating === user.id}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Promote to Admin"
                              >
                                Make Admin
                              </button>
                            )}
                            {user.role !== 'MEMBER' && (
                              <button
                                onClick={() => handleRoleChange(user.id, 'MEMBER')}
                                disabled={updating === user.id}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Demote to Member"
                              >
                                Remove Role
                              </button>
                            )}
                            {/* Subscription control */}
                            {('subscriptionStatus' in user) && (
                              user.subscriptionStatus === 'active' ? (
                                <button
                                  onClick={() => handleRevokeSub(user.id)}
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                                >
                                  Revoke Sub
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleGrantSub(user.id)}
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
                                >
                                  Grant Sub
                                </button>
                              )
                            )}
                            {user._count.enrollments > 0 && (
                              <button
                                onClick={() => fetchEnrollments(user.id)}
                                disabled={loadingEnrollments === user.id}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {loadingEnrollments === user.id ? '...' : `📚 ${user._count.enrollments}`}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedUser === user.id && enrollments[user.id] && (
                        <tr className="bg-gray-50 dark:bg-slate-800/50">
                          <td colSpan={6} className="px-6 py-4">
                            <div>
                              <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-50">Programs Enrolled:</h4>
                              {enrollments[user.id].length === 0 ? (
                                <p className="text-gray-600 dark:text-gray-400">No enrollments</p>
                              ) : (
                                <div className="space-y-2">
                                  {enrollments[user.id].map(enrollment => (
                                    <div key={enrollment.id} className="flex justify-between items-center bg-white dark:bg-slate-700/50 p-3 rounded border border-gray-200 dark:border-slate-600">
                                      <span className="text-sm text-gray-900 dark:text-gray-100">{enrollment.program.title}</span>
                                      <button
                                        onClick={() => handleRemoveEnrollment(user.id, enrollment.id)}
                                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="Remove enrollment"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg text-sm text-blue-800 dark:text-blue-200">
          <p><strong>Note:</strong> Only admins can manage user roles. You cannot change your own role.</p>
        </div>
      </div>
    </div>
  )
}
