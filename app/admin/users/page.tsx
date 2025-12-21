'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Edit2, CheckCircle, AlertCircle, Loader, Trash2, Dumbbell, Crown, UserCheck, UserX, Search } from 'lucide-react'

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
  const [searchQuery, setSearchQuery] = useState('')
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

  const filteredUsers = users
    .filter(u => filter === 'ALL' || u.role === filter)
    .filter(u =>
      searchQuery === '' ||
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'from-blue-600 to-cyan-600' },
    { label: 'Admins', value: users.filter(u => u.role === 'ADMIN').length, icon: Crown, color: 'from-purple-600 to-pink-600' },
    { label: 'Trainers', value: users.filter(u => u.role === 'TRAINER').length, icon: UserCheck, color: 'from-green-600 to-teal-600' },
    { label: 'Members', value: users.filter(u => u.role === 'MEMBER').length, icon: UserX, color: 'from-orange-600 to-red-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="content-container py-8">
        {/* Header */}
        <div className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 px-4 py-2 rounded-full mb-6">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Manage Users</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50">Users Management</h1>
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
              <Dumbbell className="h-6 w-6" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Manage user roles and permissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-3xl transition-shadow duration-300">
              <div className={`bg-gradient-to-r ${stat.color} p-6 text-white`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Users Management Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-6 w-6" />
              <div>
                <h2 className="font-bold text-xl">User Management</h2>
                <p className="text-blue-100 text-sm">
                  {filteredUsers.length} of {users.length} users
                  {(filter !== 'ALL' || searchQuery) && (
                    <span className="ml-2 text-blue-200">
                      ({filter !== 'ALL' ? `${filter.toLowerCase()}s` : ''}
                      {filter !== 'ALL' && searchQuery ? ' • ' : ''}
                      {searchQuery ? `search: "${searchQuery}"` : ''})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3">
              {['ALL', 'MEMBER', 'TRAINER', 'ADMIN'].map(role => (
                <button
                  key={role}
                  onClick={() => setFilter(role)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    filter === role
                      ? 'bg-white text-blue-700 shadow-lg'
                      : 'bg-blue-500/20 text-blue-100 hover:bg-blue-500/30'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {users.length === 0 ? 'No users found' : 'No users match your search'}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                  {users.length === 0
                    ? 'Users will appear here once they register'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map(user => (
                  <div key={user.id} className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-50">{user.name || 'No name'}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">{user.email}</p>
                          <p className="text-gray-500 dark:text-gray-500 text-xs">
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                          user.role === 'TRAINER' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}>
                          {user.role}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {user._count.enrollments} enrollments
                        </span>
                      </div>
                    </div>

                    {/* Management Controls */}
                    <div className="flex flex-wrap gap-2">
                      {user.role !== 'TRAINER' && (
                        <button
                          onClick={() => handleRoleChange(user.id, 'TRAINER')}
                          disabled={updating === user.id}
                          className="px-3 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Make Trainer
                        </button>
                      )}
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleRoleChange(user.id, 'ADMIN')}
                          disabled={updating === user.id}
                          className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Make Admin
                        </button>
                      )}
                      {user.role !== 'MEMBER' && (
                        <button
                          onClick={() => handleRoleChange(user.id, 'MEMBER')}
                          disabled={updating === user.id}
                          className="px-3 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove Role
                        </button>
                      )}

                      {/* Subscription control */}
                      {('subscriptionStatus' in user) && (
                        user.subscriptionStatus === 'active' ? (
                          <button
                            onClick={() => handleRevokeSub(user.id)}
                            className="px-3 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            Revoke Sub
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGrantSub(user.id)}
                            className="px-3 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            Grant Sub
                          </button>
                        )
                      )}

                      {user._count.enrollments > 0 && (
                        <button
                          onClick={() => fetchEnrollments(user.id)}
                          disabled={loadingEnrollments === user.id}
                          className="px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingEnrollments === user.id ? 'Loading...' : `Enrollments (${user._count.enrollments})`}
                        </button>
                      )}
                    </div>

                    {/* Expanded Enrollments */}
                    {expandedUser === user.id && enrollments[user.id] && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-50">Programs Enrolled:</h4>
                        {enrollments[user.id].length === 0 ? (
                          <p className="text-gray-600 dark:text-gray-400">No enrollments</p>
                        ) : (
                          <div className="space-y-2">
                            {enrollments[user.id].map(enrollment => (
                              <div key={enrollment.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg border border-gray-200 dark:border-slate-600">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{enrollment.program.title}</span>
                                <button
                                  onClick={() => handleRemoveEnrollment(user.id, enrollment.id)}
                                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Remove enrollment"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-3xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-blue-800 dark:text-blue-200 font-medium">Important Note</p>
              <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">Only admins can manage user roles. You cannot change your own role.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
