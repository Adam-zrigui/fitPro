'use client'

import { useEffect, useState } from 'react'

interface SubscriptionPriceProps {
  className?: string
}

export default function SubscriptionPrice({ className = '' }: SubscriptionPriceProps) {
  const [price, setPrice] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPrice = async () => {
      try {
        const res = await fetch('/api/subscription/price')
        if (res.ok) {
          const data = await res.json()
          setPrice(data.price)
        }
      } catch (error) {
        console.warn('Could not load subscription price:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPrice()
  }, [])

  if (loading) {
    return <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded h-6 w-16 ${className}`}></div>
  }

  return price ? (
    <span className={className}>{price}</span>
  ) : (
    <span className={className}>Subscribe</span>
  )
}