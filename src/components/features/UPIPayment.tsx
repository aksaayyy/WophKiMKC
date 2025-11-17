'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Smartphone, Check, Loader2, CreditCard, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { loadRazorpay, createRazorpayOptions, UPI_PRICING_PLANS, formatINRPrice, UPIPlanType, UPIBillingInterval } from '@/lib/razorpay'

interface UPIPaymentProps {
  userId: string
  userEmail: string
  userName: string
  onSuccess?: (subscription: any) => void
}

export function UPIPayment({ userId, userEmail, userName, onSuccess }: UPIPaymentProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<UPIPlanType>('pro')
  const [selectedInterval, setSelectedInterval] = useState<UPIBillingInterval>('monthly')

  const handleUPIPayment = async (plan: UPIPlanType, interval: UPIBillingInterval) => {
    setLoading(`${plan}-${interval}`)

    try {
      // Load Razorpay script
      const Razorpay = await loadRazorpay()

      // Create order
      const orderResponse = await fetch('/api/v1/payments/upi/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          interval,
          userId,
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order')
      }

      // Configure Razorpay options
      const options = createRazorpayOptions(
        orderData.orderId,
        orderData.amount,
        plan,
        interval,
        userEmail,
        userName,
        async (response: any) => {
          // Payment successful, verify on server
          try {
            const verifyResponse = await fetch('/api/v1/payments/upi/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId,
              }),
            })

            const verifyData = await verifyResponse.json()

            if (verifyResponse.ok) {
              alert('🎉 Payment successful! Your subscription is now active.')
              onSuccess?.(verifyData.subscription)
            } else {
              alert('Payment verification failed. Please contact support.')
            }
          } catch (error) {
            console.error('Verification error:', error)
            alert('Payment verification failed. Please contact support.')
          }
        },
        (error: any) => {
          console.error('Payment failed:', error)
          alert('Payment was cancelled or failed. Please try again.')
        }
      )

      // Open Razorpay checkout
      const rzp = new Razorpay(options)
      rzp.open()

    } catch (error) {
      console.error('UPI payment error:', error)
      alert('Failed to initiate payment. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const plans = Object.entries(UPI_PRICING_PLANS).map(([key, plan]) => ({
    id: key as UPIPlanType,
    ...plan,
    popular: key === 'pro'
  }))

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Smartphone className="w-8 h-8 text-primary-500" />
          <h2 className="text-2xl font-bold text-white">UPI Payment</h2>
        </div>
        <p className="text-white/70">Pay easily with UPI, Cards, or Net Banking</p>
        <div className="flex items-center justify-center space-x-4 mt-4 text-sm text-white/60">
          <div className="flex items-center space-x-1">
            <Smartphone className="w-4 h-4" />
            <span>UPI</span>
          </div>
          <div className="flex items-center space-x-1">
            <CreditCard className="w-4 h-4" />
            <span>Cards</span>
          </div>
          <div className="flex items-center space-x-1">
            <Wallet className="w-4 h-4" />
            <span>Wallets</span>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center space-x-4">
        <span className={`${selectedInterval === 'monthly' ? 'text-white' : 'text-white/60'} transition-colors`}>
          Monthly
        </span>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedInterval(selectedInterval === 'monthly' ? 'annual' : 'monthly')}
          className={`w-12 h-6 rounded-full relative transition-colors ${
            selectedInterval === 'annual' ? 'bg-primary-500' : 'bg-white/20'
          }`}
        >
          <motion.div
            className="w-5 h-5 bg-white rounded-full absolute top-0.5"
            animate={{ x: selectedInterval === 'annual' ? 26 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </motion.button>
        <span className={`${selectedInterval === 'annual' ? 'text-white' : 'text-white/60'} transition-colors`}>
          Annual
        </span>
        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-sm">
          Save up to 30%
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price = selectedInterval === 'monthly' ? plan.monthlyPrice : plan.annualPrice
          const monthlyEquivalent = selectedInterval === 'annual' ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice
          
          return (
            <Card key={plan.id} className={plan.popular ? 'ring-2 ring-primary-500' : ''}>
              {plan.popular && (
                <div className="bg-primary-500 text-white text-center py-2 text-sm font-semibold rounded-t-xl -mx-6 -mt-6 mb-6">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-white mb-2">
                  {formatINRPrice(monthlyEquivalent)}
                  <span className="text-lg text-white/60">/mo</span>
                </div>
                {selectedInterval === 'annual' && (
                  <div className="text-sm text-green-400 mb-4">
                    Billed {formatINRPrice(price)} annually
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white/80">
                    {typeof plan.features.videos === 'number' ? `${plan.features.videos} videos/month` : 'Unlimited videos'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white/80">
                    {typeof plan.features.youtubeVideos === 'number' ? `${plan.features.youtubeVideos} YouTube videos/month` : 'Unlimited YouTube videos'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white/80">
                    {plan.features.quality === 'standard' ? 'Basic AI features' : 
                     plan.features.quality === 'high' ? 'Advanced AI features' : 'Premium AI features'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white/80">
                    {plan.features.support === 'email' ? 'Email support' :
                     plan.features.support === 'priority' ? 'Priority support' : 'Dedicated support'}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => handleUPIPayment(plan.id, selectedInterval)}
                disabled={loading === `${plan.id}-${selectedInterval}`}
                className="w-full"
                variant={plan.popular ? 'primary' : 'secondary'}
              >
                {loading === `${plan.id}-${selectedInterval}` ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Smartphone className="w-4 h-4 mr-2" />
                )}
                Pay {formatINRPrice(price)}
              </Button>
            </Card>
          )
        })}
      </div>

      <div className="text-center text-sm text-white/60">
        <p>🔒 Secure payments powered by Razorpay</p>
        <p>Supports UPI, Cards, Net Banking, and Wallets</p>
      </div>
    </div>
  )
}