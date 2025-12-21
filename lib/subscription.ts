import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

/**
 * Initialize subscription products and prices (idempotent)
 */
export async function initializeSubscriptionProducts() {
  try {
    // Check for existing products
    const products = await stripe.products.list({ limit: 100, active: true })
    const existingProduct = products.data.find((p) => p.metadata?.type === 'fitpro_subscription')

    if (existingProduct) {
      // Get all active prices for this product
      const prices = await stripe.prices.list({
        product: existingProduct.id,
        type: 'recurring',
        active: true
      })

      const monthlyPrice = prices.data.find(p => p.metadata?.plan_type === 'monthly')
      const yearlyPrice = prices.data.find(p => p.metadata?.plan_type === 'yearly')

      if (monthlyPrice && yearlyPrice) {
        return {
          productId: existingProduct.id,
          monthlyPriceId: monthlyPrice.id,
          yearlyPriceId: yearlyPrice.id
        }
      }
    }

    // Create product if it doesn't exist
    const product = await stripe.products.create({
      name: 'FitPro Academy Membership',
      description: 'Premium access to all fitness programs, courses, and video content',
      metadata: { type: 'fitpro_subscription' },
    })

    // Create monthly price ($29/month)
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 2900, // $29.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan_type: 'monthly' },
    })

    // Create yearly price ($249/year)
    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 24900, // $249.00
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { plan_type: 'yearly' },
    })

    return {
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      yearlyPriceId: yearlyPrice.id
    }
  } catch (error) {
    console.error('Error initializing subscription products:', error)
    throw error
  }
}

/**
 * Get subscription price IDs
 */
export async function getSubscriptionPriceIds() {
  const subscription = await initializeSubscriptionProducts()
  return {
    monthly: subscription.monthlyPriceId,
    yearly: subscription.yearlyPriceId
  }
}

/**
 * Get specific price ID by plan type
 */
export async function getSubscriptionPriceId(planType: 'monthly' | 'yearly'): Promise<string> {
  const priceIds = await getSubscriptionPriceIds()
  return priceIds[planType]
}

/**
 * Legacy function for backward compatibility
 */
export async function initializeDefaultSubscription() {
  const subscription = await initializeSubscriptionProducts()
  return {
    productId: subscription.productId,
    priceId: subscription.monthlyPriceId // Return monthly as default
  }
}

export async function getDefaultSubscriptionPriceId(): Promise<string> {
  return getSubscriptionPriceId('monthly')
}
