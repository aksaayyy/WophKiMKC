/**
 * Verify UPI Payment and Activate Subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { razorpay } from '../../../../../../lib/razorpay'
import { supabase } from '../../../../../../../lib/supabase'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId 
    } = await request.json()

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return NextResponse.json(
        { error: 'Missing payment verification data' },
        { status: 400 }
      )
    }

    // Verify payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Get order details from database
    const { data: orderData, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .eq('user_id', userId)
      .single()

    if (orderError || !orderData) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id)

    if (payment.status !== 'captured') {
      return NextResponse.json(
        { error: 'Payment not captured' },
        { status: 400 }
      )
    }

    // Calculate subscription period
    const currentDate = new Date()
    const periodEnd = new Date(currentDate)
    
    if (orderData.billing_interval === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    // Create or update subscription
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        plan_type: orderData.plan_type,
        billing_interval: orderData.billing_interval,
        status: 'active',
        current_period_start: currentDate.toISOString(),
        current_period_end: periodEnd.toISOString(),
        amount_paid: orderData.amount,
        currency: 'INR',
        payment_method: 'upi',
        updated_at: new Date().toISOString()
      })

    if (subscriptionError) {
      console.error('Failed to create subscription:', subscriptionError)
      return NextResponse.json(
        { error: 'Failed to activate subscription' },
        { status: 500 }
      )
    }

    // Update order status
    await supabase
      .from('payment_orders')
      .update({
        status: 'completed',
        razorpay_payment_id: razorpay_payment_id,
        completed_at: new Date().toISOString()
      })
      .eq('order_id', razorpay_order_id)

    // Update user profile subscription tier
    await supabase
      .from('user_profiles')
      .update({
        subscription_tier: orderData.plan_type,
        subscription_status: 'active'
      })
      .eq('user_id', userId)

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated',
      subscription: {
        plan: orderData.plan_type,
        interval: orderData.billing_interval,
        validUntil: periodEnd.toISOString()
      }
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    )
  }
}