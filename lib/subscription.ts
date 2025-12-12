import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

/**
 * Initialize the default subscription product (idempotent)
 */
export async function initializeDefaultSubscription() {
  try {
    const products = await stripe.products.list({ limit: 100, active: true })
    const existingProduct = products.data.find((p) => p.metadata?.type === 'fitpro_main_subscription')

    if (existingProduct) {
      const prices = await stripe.prices.list({ product: existingProduct.id, type: 'recurring', active: true })
      if (prices.data.length > 0) {
        return { productId: existingProduct.id, priceId: prices.data[0].id }
      }
    }

    // Create product and a monthly price (if not found)
    const product = await stripe.products.create({
      name: 'FitPro Academy Membership',
      description: 'Unlimited access to all fitness programs, courses, and video content',
      metadata: { type: 'fitpro_main_subscription' },
    })

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 2999,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan_type: 'monthly' },
    })

    return { productId: product.id, priceId: price.id }
  } catch (error) {
    console.error('Error initializing default subscription:', error)
    throw error
  }
}

export async function getDefaultSubscriptionPriceId(): Promise<string> {
  const subscription = await initializeDefaultSubscription()
  return subscription.priceId
}
