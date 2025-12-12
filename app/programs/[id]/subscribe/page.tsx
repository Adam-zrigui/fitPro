import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'
import SubscribeCta from './SubscribeCta'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' })

export default async function SubscribePage({ params }: { params: { id: string } }) {
  // allow the page to render even if not signed in; CTA will prompt for signin
  let priceLabel: string | null = null
  try {
    const products = await stripe.products.list({ limit: 100, active: true })
    const product = products.data.find(p => p.metadata?.type === 'fitpro_main_subscription')
    if (product) {
      const prices = await stripe.prices.list({ product: product.id, type: 'recurring', active: true })
      const price = prices.data?.[0]
      if (price && typeof price.unit_amount === 'number') {
        priceLabel = new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency || 'usd' }).format(price.unit_amount / 100) + '/month'
      }
    }
  } catch (err) {
    // ignore errors; we still show CTA
    // eslint-disable-next-line no-console
    console.warn('Could not fetch subscription price:', err)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-950 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="card p-8 text-center">
          <h1 className="text-3xl font-extrabold mb-4">Subscribe for Unlimited Access</h1>
          <p className="text-muted mb-6">Get access to this program and all others with one subscription.</p>
          <SubscribeCta programId={params.id} priceLabel={priceLabel} />
        </div>
      </div>
    </div>
  )
}
