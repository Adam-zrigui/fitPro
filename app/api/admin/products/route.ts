import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// GET all subscription products
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admins can manage products
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get products from Stripe
    const products = await stripe.products.list({
      limit: 100,
      active: true,
    })

    // Get prices for each product
    const productsWithPrices = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list({
          product: product.id,
          type: 'recurring',
          limit: 10,
        })

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          prices: prices.data.map((price) => ({
            id: price.id,
            amount: (price.unit_amount || 0) / 100,
            currency: price.currency,
            interval: price.recurring?.interval,
            intervalCount: price.recurring?.interval_count || 1,
            active: price.active,
          })),
        }
      })
    )

    return NextResponse.json({ products: productsWithPrices })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST create new product with pricing
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admins can create products
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, description, amount, currency = 'usd', interval = 'month' } = await req.json()

    // Validate input
    if (!name || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Name and amount (in cents) are required' },
        { status: 400 }
      )
    }

    // Create product in Stripe
    const product = await stripe.products.create({
      name,
      description: description || '',
      type: 'service',
    })

    // Create price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency,
      recurring: {
        interval: interval as 'day' | 'week' | 'month' | 'year',
      },
    })

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
      },
      price: {
        id: price.id,
        amount: (price.unit_amount || 0) / 100,
        currency: price.currency,
        interval: price.recurring?.interval,
      },
    })
  } catch (error: any) {
    console.error('Error creating product:', error)
    const message = error?.message || 'Failed to create product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
