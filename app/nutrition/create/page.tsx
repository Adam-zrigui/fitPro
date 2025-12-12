'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'

interface Meal {
  name: string
  time: string
  foods: string[]
}

export default function CreateNutritionPlan() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  })
  
  const [meals, setMeals] = useState<Meal[]>([
    { name: 'Breakfast', time: '08:00', foods: [''] }
  ])

  const addMeal = () => {
    setMeals([...meals, { name: '', time: '', foods: [''] }])
  }

  const removeMeal = (index: number) => {
    setMeals(meals.filter((_, i) => i !== index))
  }

  const addFood = (mealIndex: number) => {
    const newMeals = [...meals]
    newMeals[mealIndex].foods.push('')
    setMeals(newMeals)
  }

  const updateMeal = (index: number, field: keyof Meal, value: any) => {
    const newMeals = [...meals]
    newMeals[index] = { ...newMeals[index], [field]: value }
    setMeals(newMeals)
  }

  const updateFood = (mealIndex: number, foodIndex: number, value: string) => {
    const newMeals = [...meals]
    newMeals[mealIndex].foods[foodIndex] = value
    setMeals(newMeals)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          meals: meals.filter(m => m.name && m.foods.some(f => f))
        })
      })

      if (!res.ok) throw new Error('Failed to create plan')

      router.push('/nutrition')
    } catch (error) {
      alert('Failed to create nutrition plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-b dark:from-slate-950 dark:to-slate-900">
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">
          <h1 className="text-2xl font-bold mb-6">Create Nutrition Plan</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Name
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g., Muscle Building Diet"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={2}
                  className="input"
                  placeholder="Brief description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Calories
                </label>
                <input
                  type="number"
                  required
                  className="input"
                  placeholder="2500"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Protein (g)
                </label>
                <input
                  type="number"
                  required
                  className="input"
                  placeholder="180"
                  value={formData.protein}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  required
                  className="input"
                  placeholder="250"
                  value={formData.carbs}
                  onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fats (g)
                </label>
                <input
                  type="number"
                  required
                  className="input"
                  placeholder="70"
                  value={formData.fats}
                  onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Meal Plan</h2>
                <button
                  type="button"
                  onClick={addMeal}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Meal
                </button>
              </div>

              <div className="space-y-4">
                {meals.map((meal, mealIndex) => (
                  <div key={mealIndex} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="grid md:grid-cols-2 gap-3 flex-1">
                        <input
                          type="text"
                          placeholder="Meal name (e.g., Breakfast)"
                          className="input"
                          value={meal.name}
                          onChange={(e) => updateMeal(mealIndex, 'name', e.target.value)}
                        />
                        <input
                          type="time"
                          className="input"
                          value={meal.time}
                          onChange={(e) => updateMeal(mealIndex, 'time', e.target.value)}
                        />
                      </div>
                      {meals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMeal(mealIndex)}
                          className="text-red-600 hover:text-red-700 ml-2"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {meal.foods.map((food, foodIndex) => (
                        <input
                          key={foodIndex}
                          type="text"
                          placeholder="Food item (e.g., 3 eggs, 2 slices toast)"
                          className="input"
                          value={food}
                          onChange={(e) => updateFood(mealIndex, foodIndex, e.target.value)}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => addFood(mealIndex)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        + Add food item
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Creating...' : 'Create Nutrition Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
