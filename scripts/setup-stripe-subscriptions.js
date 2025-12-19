const { initializeSubscriptionProducts } = require('../lib/subscription')

async function setupStripeSubscriptions() {
  try {
    console.log('Setting up Stripe subscription products and prices...')

    const result = await initializeSubscriptionProducts()

    console.log('✅ Subscription products created successfully!')
    console.log('Product ID:', result.productId)
    console.log('Monthly Price ID:', result.monthlyPriceId)
    console.log('Yearly Price ID:', result.yearlyPriceId)

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