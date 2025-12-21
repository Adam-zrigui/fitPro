'use client'

import { useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function NutritionLogForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    const formData = new FormData(e.currentTarget)
    const data = {
      calories: parseInt(formData.get('calories') as string),
      protein: parseInt(formData.get('protein') as string),
      carbs: parseInt(formData.get('carbs') as string),
      fats: parseInt(formData.get('fats') as string),
    }

    try {
      const response = await fetch('/api/nutrition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setMessage('Nutrition entry logged successfully! 🎉')
        // Reset form
        e.currentTarget.reset()
        // Refresh the page to show updated streak and entries
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        const error = await response.text()
        setMessage(`Error: ${error}`)
      }
    } catch (error) {
      setMessage('Failed to log nutrition entry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Calories
            </label>
            <input
              type="number"
              name="calories"
              placeholder="2000"
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              required
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Protein (g)
            </label>
            <input
              type="number"
              name="protein"
              placeholder="150"
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              required
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Carbs (g)
            </label>
            <input
              type="number"
              name="carbs"
              placeholder="250"
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              required
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Fats (g)
            </label>
            <input
              type="number"
              name="fats"
              placeholder="67"
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              required
              min="0"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Logging...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              Log Nutrition Entry
            </>
          )}
        </button>
      </form>
      {message && (
        <div className={`mt-4 p-4 rounded-2xl ${
          message.includes('Error') || message.includes('Failed')
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}