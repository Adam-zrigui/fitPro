const Stripe = require('stripe')
const fs = require('fs')
const path = require('path')

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.replace(/"/g, '').trim()
  }
})

const stripe = new Stripe(envVars.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

async function checkPrices() {
  try {
    const prices = await stripe.prices.list({
      product: 'prod_TdNeOmIJDo8s3W',
      type: 'recurring',
      active: true
    })

    console.log('Current Stripe Prices:')
    prices.data.forEach(price => {
      console.log(`- ${price.metadata?.plan_type}: $${price.unit_amount / 100}/${price.recurring?.interval} (ID: ${price.id})`)
    })
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkPrices()