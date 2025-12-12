import { NextResponse } from 'next/server'
import { initializeDefaultSubscription, getDefaultSubscriptionPriceId } from '@/lib/subscription'

// API endpoint to initialize/get the default subscription (delegates to lib)
export async function GET() {
  try {
    const subscription = await initializeDefaultSubscription()
    return NextResponse.json({
      success: true,
      priceId: subscription.priceId,
      productId: subscription.productId,
      message: 'FitPro subscription initialized',
    })
  } catch (error: any) {
    console.error('Error initializing subscription:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to initialize subscription' },
      { status: 500 }
    )
  }
}
