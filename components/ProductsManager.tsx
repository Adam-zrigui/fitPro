'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, AlertCircle } from 'lucide-react'

interface Price {
  id: string
  amount: number
  currency: string
  interval: string
  active: boolean
}

interface Product {
  id: string
  name: string
  description?: string
  prices: Price[]
}

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    currency: 'usd',
    interval: 'month',
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      setProducts(data.products || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.amount) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          interval: formData.interval,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create product')
      }

      const data = await res.json()
      setMessage({ type: 'success', text: `Product "${data.product.name}" created successfully! Price ID: ${data.price.id}` })
      setFormData({ name: '', description: '', amount: '', currency: 'usd', interval: 'month' })
      setShowForm(false)
      setTimeout(() => fetchProducts(), 500)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create product' })
    }
  }

  const handleSelectPrice = (priceId: string) => {
    setSelectedPrice(priceId)
    // Copy to clipboard
    navigator.clipboard.writeText(priceId)
    setMessage({ type: 'success', text: `Price ID copied: ${priceId}` })
    setTimeout(() => setMessage(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-secondary">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Products</h2>
          <p className="text-secondary mt-1">Manage Stripe subscription products and pricing</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          New Product
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="card bg-blue-50 dark:bg-slate-900/20 border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Subscription Product</h3>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g., FitPro Monthly"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Price Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">Price Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="29.99"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Billing Interval */}
              <div>
                <label className="block text-sm font-medium mb-2">Billing Interval</label>
                <select
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="month">Monthly</option>
                  <option value="week">Weekly</option>
                  <option value="year">Yearly</option>
                  <option value="day">Daily</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="usd">USD ($)</option>
                  <option value="eur">EUR (€)</option>
                  <option value="gbp">GBP (£)</option>
                  <option value="jpy">JPY (¥)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                placeholder="e.g., Monthly access to all fitness programs and video content"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">
                Create Product
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Products List */}
      <div className="space-y-4">
        {products.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-secondary mb-4">No products created yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Create Your First Product
            </button>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="card p-6 border">
              <div className="mb-4">
                <h3 className="text-lg font-bold">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-secondary mt-1">{product.description}</p>
                )}
                <p className="text-xs text-muted mt-2">ID: {product.id}</p>
              </div>

              {/* Prices */}
              <div className="space-y-2">
                {product.prices.map((price) => (
                  <button
                    key={price.id}
                    onClick={() => handleSelectPrice(price.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPrice === price.id
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold">
                          ${price.amount.toFixed(2)} / {price.interval}
                        </span>
                        <span className="text-xs text-muted ml-2">({price.currency.toUpperCase()})</span>
                        {!price.active && (
                          <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded font-mono">
                        {price.id}
                      </code>
                    </div>
                    <p className="text-xs text-muted mt-2">Click to copy Price ID</p>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="card bg-blue-50 dark:bg-slate-900/20 border border-blue-200 dark:border-blue-800 p-4">
        <h4 className="font-semibold text-gray-900 dark:text-blue-300 mb-2">💡 How to Use</h4>
        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
          <li>Click "New Product" to create a subscription plan</li>
          <li>Click on a price to copy its ID to clipboard</li>
          <li>Paste the Price ID into <code className="bg-blue-200 dark:bg-slate-800 px-1 rounded">STRIPE_SUBSCRIPTION_PRICE_ID</code> in <code className="bg-blue-200 dark:bg-slate-800 px-1 rounded">.env.local</code></li>
          <li>Refresh your app and you're ready to accept subscriptions!</li>
        </ol>
      </div>
    </div>
  )
}
