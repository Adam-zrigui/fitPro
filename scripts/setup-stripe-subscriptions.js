const Stripe = require('stripe')
require('dotenv').config({ path: '../.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

async function setupStripeSubscriptions() {
  try {
    console.log('Setting up Stripe subscription products and prices...')

    // Check for existing products
    const products = await stripe.products.list({ limit: 100, active: true })
    const existingProduct = products.data.find((p) => p.metadata?.type === 'fitpro_subscription')

    let productId, monthlyPriceId, yearlyPriceId

    if (existingProduct) {
      console.log('Found existing product:', existingProduct.id)

      // Get all active prices for this product
      const prices = await stripe.prices.list({
        product: existingProduct.id,
        type: 'recurring',
        active: true
      })

      const monthlyPrice = prices.data.find(p => p.metadata?.plan_type === 'monthly')
      const yearlyPrice = prices.data.find(p => p.metadata?.plan_type === 'yearly')

      productId = existingProduct.id
      monthlyPriceId = monthlyPrice?.id
      yearlyPriceId = yearlyPrice?.id

      if (monthlyPrice && yearlyPrice) {
        console.log('✅ Found existing subscription products and prices!')
      } else {
        console.log('Creating missing prices...')
      }
    } else {
      // Create product
      console.log('Creating new product...')
      const product = await stripe.products.create({
        name: 'FitPro Academy Membership',
        description: 'Premium access to all fitness programs, courses, and video content',
        metadata: { type: 'fitpro_subscription' },
      })
      productId = product.id
      console.log('✅ Product created:', productId)
    }

    // Create monthly price if it doesn't exist
    if (!monthlyPriceId) {
      console.log('Creating monthly price...')
      const monthlyPrice = await stripe.prices.create({
        product: productId,
        unit_amount: 2900, // $29.00
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { plan_type: 'monthly' },
      })
      monthlyPriceId = monthlyPrice.id
      console.log('✅ Monthly price created:', monthlyPriceId)
    }

    // Create yearly price if it doesn't exist
    if (!yearlyPriceId) {
      console.log('Creating yearly price...')
      const yearlyPrice = await stripe.prices.create({
        product: productId,
        unit_amount: 24900, // $249.00
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: { plan_type: 'yearly' },
      })
      yearlyPriceId = yearlyPrice.id
      console.log('✅ Yearly price created:', yearlyPriceId)
    }

    console.log('\n🎉 Setup complete!')
    console.log('Product ID:', productId)
    console.log('Monthly Price ID:', monthlyPriceId)
    console.log('Yearly Price ID:', yearlyPriceId)

    console.log('\n📋 Summary:')
    console.log('- Monthly Plan: $29.00/month')
    console.log('- Yearly Plan: $249.00/year (25% savings)')

  } catch (error) {
    console.error('❌ Error setting up subscriptions:', error.message)
    process.exit(1)
  }
}

setupStripeSubscriptions()</content>
<parameter name="filePath">c:\Users\zrigu\OneDrive\Desktop\fit\scripts\setup-stripe-subscriptions.js