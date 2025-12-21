import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' })

    // Find product with our metadata tag
    const products = await stripe.products.list({ limit: 100, active: true })
    const existingProduct = products.data.find(p => p.metadata?.type === 'fitpro_main_subscription')

    if (existingProduct) {
      const prices = await stripe.prices.list({ product: existingProduct.id, type: 'recurring', active: true })
      const price = prices.data?.[0]
      if (price && typeof price.unit_amount === 'number') {
        const amount = price.unit_amount
        const currency = price.currency || 'usd'
        const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
        return NextResponse.json({ price: formattedPrice })
      }
    }

    return NextResponse.json({ price: null })
  } catch (error) {
    console.warn('Could not fetch subscription price:', error)
    return NextResponse.json({ price: null })
  }
}