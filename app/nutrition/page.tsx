import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Apple, Flame, Target, TrendingUp, Calendar, ChefHat, Sparkles, ArrowRight, BarChart3, Trophy, CheckCircle, Clock } from 'lucide-react'
import NutritionLogForm from '@/components/NutritionLogForm'

export default async function NutritionPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Get user's nutrition streak and recent entries
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nutritionStreak: true }
  })

  const recentEntries = await prisma.nutritionEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    take: 7
  })

  const plans = await prisma.nutritionPlan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  })

  // Calculate some stats
  const totalPlans = plans.length
  const totalCalories = plans.reduce((acc, plan) => acc + plan.calories, 0)
  const avgCalories = totalPlans > 0 ? Math.round(totalCalories / totalPlans) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">Nutrition Hub</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4">
            Fuel Your
            <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent"> Body</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            Track your meals, monitor macros, and achieve your nutritional goals with personalized nutrition plans.
          </p>
        </div>

        {/* Nutrition Streak Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-3xl shadow-2xl p-8 text-white mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Flame className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black mb-1">Nutrition Streak</h2>
                  <p className="text-orange-100">Keep your healthy eating momentum going!</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black mb-1">{user?.nutritionStreak || 0}</div>
                <div className="text-orange-100 text-sm">days in a row</div>
              </div>
            </div>
          </div>

          {/* Quick Log Form */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Log Today's Nutrition
            </h3>
            <NutritionLogForm />
          </div>

          {/* Recent Entries */}
          {recentEntries.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <Clock className="h-6 w-6 text-blue-500" />
                Recent Entries
              </h3>
              <div className="space-y-4">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <Apple className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {new Date(entry.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {entry.calories} cal • {entry.protein}g protein • {entry.carbs}g carbs • {entry.fats}g fats
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        Logged ✓
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{totalPlans}</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Active Plans</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{avgCalories}</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Avg Calories/Day</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <Apple className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">
              {plans.reduce((acc, plan) => acc + plan.protein, 0)}g
            </div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Protein</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">
              {plans.reduce((acc, plan) => acc + plan.carbs + plan.fats, 0)}g
            </div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Macros</div>
          </div>
        </div>

        {/* Create Plan CTA */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl shadow-2xl p-8 lg:p-12 mb-12 text-white">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ChefHat className="h-6 w-6" />
                </div>
                <span className="text-green-100 font-semibold">Create Your Plan</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black mb-4">
                Ready to Transform Your Nutrition?
              </h2>
              <p className="text-xl text-green-100 leading-relaxed max-w-2xl">
                Get personalized meal plans tailored to your goals, preferences, and lifestyle. Track your progress and achieve optimal results.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                href="/nutrition/create"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-green-600 hover:bg-gray-100 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-6 w-6" />
                Create Plan
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Nutrition Plans */}
        {plans.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Apple className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4">No nutrition plans yet</h3>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              Create your first nutrition plan to start tracking your meals and achieving your health goals.
            </p>
            <Link
              href="/nutrition/create"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <Plus className="h-6 w-6" />
              Create Your First Plan
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Flame className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{plan.title}</h3>
                        <p className="text-green-100 text-sm">Nutrition Plan</p>
                      </div>
                    </div>
                    <Calendar className="h-6 w-6 text-green-200" />
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3">
                    {plan.description || 'A comprehensive nutrition plan designed to fuel your fitness journey.'}
                  </p>

                  {/* Macro Breakdown */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Calories</p>
                      <p className="text-2xl font-black text-blue-800 dark:text-blue-200">{plan.calories}</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Protein</p>
                      <p className="text-2xl font-black text-green-800 dark:text-green-200">{plan.protein}g</p>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-800">
                      <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-1">Carbs</p>
                      <p className="text-2xl font-black text-orange-800 dark:text-orange-200">{plan.carbs}g</p>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-50 to-red-50 dark:from-yellow-900/20 dark:to-red-900/20 p-4 rounded-2xl border border-yellow-100 dark:border-yellow-800">
                      <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1">Fats</p>
                      <p className="text-2xl font-black text-yellow-800 dark:text-yellow-200">{plan.fats}g</p>
                    </div>
                  </div>

                  <Link
                    href={`/nutrition/${plan.id}`}
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group-hover:shadow-2xl"
                  >
                    View Details
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips Section */}
        {plans.length > 0 && (
          <div className="mt-16 bg-gradient-to-r from-slate-100 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-3xl p-8 lg:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                Nutrition Success Tips
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Maximize your results with these expert nutrition strategies
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Track Consistently</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Log your meals daily to stay accountable and make data-driven adjustments.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                  <Apple className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Focus on Protein</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Prioritize high-quality protein sources to support muscle growth and recovery.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Monitor Progress</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Regularly assess your results and adjust your plan as needed for optimal progress.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}