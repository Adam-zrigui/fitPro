import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import { Plus, Apple, Flame, Target, TrendingUp, Heart, Sparkles, ArrowRight, ChefHat, Utensils, Salad, Beef } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-950 dark:via-green-950 dark:to-emerald-950">
      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
        {/* Header Section */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">Nutrition Hub</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-black text-gray-900 dark:text-white mb-6">
            Fuel Your
            <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent"> Body Right</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
            Personalized nutrition plans designed to optimize your performance and help you achieve your fitness goals. Track macros, calories, and nutrients with precision.
          </p>
        </div>

        {/* Create Plan CTA */}
        <div className="mb-12">
          <Link
            href="/nutrition/create"
            className="inline-flex items-center gap-4 px-8 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-xl rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            Create New Nutrition Plan
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-32 h-32 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Apple className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-6">No nutrition plans yet</h3>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Create your first nutrition plan to start tracking your diet and optimize your performance
            </p>
            <Link
              href="/nutrition/create"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-xl rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <ChefHat className="h-6 w-6" />
              Create Your First Plan
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Plans</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{plans.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                    <Flame className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Avg Calories</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                      {Math.round(plans.reduce((acc, plan) => acc + plan.calories, 0) / plans.length)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
                    <Utensils className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Avg Protein</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                      {Math.round(plans.reduce((acc, plan) => acc + plan.protein, 0) / plans.length)}g
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Carbs</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                      {plans.reduce((acc, plan) => acc + plan.carbs, 0)}g
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 dark:border-slate-700 hover:border-green-200 dark:hover:border-green-800">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-black mb-2 line-clamp-2">{plan.title}</h3>
                        <p className="text-green-100 text-sm leading-relaxed line-clamp-2">{plan.description}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center ml-4">
                        <Flame className="h-6 w-6" />
                      </div>
                    </div>
                  </div>

                  {/* Macros Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Calories</p>
                        </div>
                        <p className="text-3xl font-black text-blue-900 dark:text-blue-100">{plan.calories}</p>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Beef className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <p className="text-sm font-bold text-green-700 dark:text-green-300">Protein</p>
                        </div>
                        <p className="text-3xl font-black text-green-900 dark:text-green-100">{plan.protein}g</p>
                      </div>
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Salad className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          <p className="text-sm font-bold text-orange-700 dark:text-orange-300">Carbs</p>
                        </div>
                        <p className="text-3xl font-black text-orange-900 dark:text-orange-100">{plan.carbs}g</p>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-4 rounded-2xl border border-yellow-100 dark:border-yellow-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <p className="text-sm font-bold text-yellow-700 dark:text-yellow-300">Fats</p>
                        </div>
                        <p className="text-3xl font-black text-yellow-900 dark:text-yellow-100">{plan.fats}g</p>
                      </div>
                    </div>

                    <Link
                      href={`/nutrition/${plan.id}`}
                      className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <Target className="h-5 w-5" />
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}