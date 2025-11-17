/**
 * Create Stripe Checkout Session
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe, getPriceId, PlanType, BillingInterval } from '../../../../../lib/stripe'
import { supabase } from '../../../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { plan, interval, userId } = await request.json()

    // Validate input
    if (!plan || !interval || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: plan, interval, userId' },
        { status: 400 }
      )
    }

    // Validate plan and interval
    const validPlans: PlanType[] = ['starter', 'pro', 'enterprise']
    const validIntervals: BillingInterval[] = ['monthly', 'annual']

    if (!validPlans.includes(plan) || !validIntervals.includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid plan or interval' },
        { status: 400 }
      )
    }

    // Get user details from Supabase
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get price ID
    const priceId = getPriceId(plan, interval)

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId,
        plan,
        interval,
      },
      subscription_data: {
        metadata: {
          userId,
          plan,
          interval,
        },
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })

  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}