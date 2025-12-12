import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import { Plus, Apple, Flame } from 'lucide-react'
import Link from 'next/link'

export default async function NutritionPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  const plans = await prisma.nutritionPlan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nutrition Plans</h1>
            <p className="text-secondary mt-2">Track your meals and macros</p>
          </div>
          <Link href="/nutrition/create" className="btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Plan
          </Link>
        </div>

        {plans.length === 0 ? (
          <div className="card text-center py-12">
            <Apple className="h-16 w-16 text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No nutrition plans yet</h3>
            <p className="text-secondary mb-6">Create your first nutrition plan to start tracking your diet</p>
            <Link href="/nutrition/create" className="btn-primary inline-flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Your First Plan
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{plan.title}</h3>
                    <p className="text-sm text-secondary">{plan.description}</p>
                  </div>
                  <Flame className="h-6 w-6 text-orange-500" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-primary-50 p-3 rounded-lg">
                    <p className="text-sm text-secondary">Calories</p>
                    <p className="text-2xl font-bold text-primary-600">{plan.calories}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-secondary">Protein</p>
                    <p className="text-2xl font-bold text-green-600">{plan.protein}g</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-sm text-secondary">Carbs</p>
                    <p className="text-2xl font-bold text-orange-600">{plan.carbs}g</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-secondary">Fats</p>
                    <p className="text-2xl font-bold text-yellow-600">{plan.fats}g</p>
                  </div>
                </div>

                <Link 
                  href={`/nutrition/${plan.id}`}
                  className="btn-primary w-full text-center"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
