/**
 * Create Razorpay Order for UPI Payment
 */

import { NextRequest, NextResponse } from 'next/server'
import { razorpay, getUPIPrice, UPIPlanType, UPIBillingInterval } from '../../../../../../lib/razorpay'
import { supabase } from '../../../../../../../lib/supabase'

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
    const validPlans: UPIPlanType[] = ['starter', 'pro', 'enterprise']
    const validIntervals: UPIBillingInterval[] = ['monthly', 'annual']

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

    // Get price in INR
    const amount = getUPIPrice(plan, interval)

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId,
        plan,
        interval,
        userEmail: user.user.email || null
      }
    })

    // Store order in database for verification
    const { error: dbError } = await supabase
      .from('payment_orders')
      .insert({
        order_id: order.id,
        user_id: userId,
        plan_type: plan,
        billing_interval: interval,
        amount: amount,
        currency: 'INR',
        status: 'created',
        payment_method: 'upi',
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Failed to store order:', dbError)
      // Continue anyway, we can handle this in webhook
    }

    return NextResponse.json({
      orderId: order.id,
      amount: amount,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    })

  } catch (error) {
    console.error('Razorpay order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}