'use client'

import { useEffect, useState } from 'react'
import { Plus, Users, DollarSign } from 'lucide-react'
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
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 text-gray-900 dark:text-gray-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 text-gray-900 dark:text-gray-50 transition-colors">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Trainer Dashboard</h1>
            <p className="text-secondary mt-2">Manage your programs and track performance</p>
          </div>
          <Link href="/trainer/create" className="btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Program
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Total Programs</p>
                <p className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 mt-1">{programs.length}</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Total Students</p>
                <p className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 mt-1">
                  {programs.reduce((acc, p) => acc + p._count.enrollments, 0)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Total Revenue</p>
                <p className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 mt-1">
                  ${totalRevenue._sum.amount?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card stat-card">
          <h2 className="text-xl font-bold mb-4">My Programs</h2>
          
          {programs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary mb-4">You haven't created any programs yet</p>
              <Link href="/trainer/create" className="btn-primary inline-flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Your First Program
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {programs.map((program) => (
                <div key={program.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{program.title}</h3>
                        <span className={`badge ${program.published ? 'badge-success' : 'badge-warning'}`}>
                          {program.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-secondary text-sm mb-3">{program.description}</p>
                      <div className="flex gap-6 text-sm text-secondary">
                        <span>{program._count.enrollments} students</span>
                        <span>{program._count.workouts} workouts</span>
                        {program.imageUrl ? (
                          <img src={program.imageUrl} alt="thumbnail" className="w-20 h-12 object-cover rounded" />
                        ) : (
                          <span>Included with subscription</span>
                        )}
                        <span>{program.duration} weeks</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link 
                        href={`/trainer/programs/${program.id}/edit`}
                        className="btn-secondary text-sm"
                      >
                        Edit
                      </Link>
                      <Link 
                        href={`/programs/${program.id}`}
                        className="btn-primary text-sm"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
