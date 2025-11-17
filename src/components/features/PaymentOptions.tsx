'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Smartphone, Globe, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SubscriptionManager } from './SubscriptionManager'
import { UPIPayment } from './UPIPayment'

interface PaymentOptionsProps {
  userId: string
  userEmail: string
  userName: string
  onSuccess?: (subscription: any) => void
}

export function PaymentOptions({ userId, userEmail, userName, onSuccess }: PaymentOptionsProps) {
  const [selectedMethod, setSelectedMethod] = useState<'international' | 'upi' | null>(null)

  if (selectedMethod === 'international') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Button
            onClick={() => setSelectedMethod(null)}
            variant="outline"
            className="mb-4"
          >
            ← Back to Payment Options
          </Button>
        </div>
        <SubscriptionManager userId={userId} />
      </div>
    )
  }

  if (selectedMethod === 'upi') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Button
            onClick={() => setSelectedMethod(null)}
            variant="outline"
            className="mb-4"
          >
            ← Back to Payment Options
          </Button>
        </div>
        <UPIPayment 
          userId={userId} 
          userEmail={userEmail} 
          userName={userName}
          onSuccess={onSuccess}
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Choose Payment Method</h2>
        <p className="text-white/70 text-lg">Select your preferred payment option</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* UPI Payment Option */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="h-full cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all">
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">UPI & Indian Payments</h3>
              <p className="text-white/70 mb-6">
                Pay with UPI, Cards, Net Banking, or Wallets. Optimized for Indian users with INR pricing.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-center space-x-2 text-white/80">
                  <MapPin className="w-4 h-4" />
                  <span>India-focused pricing</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-white/80">
                  <Smartphone className="w-4 h-4" />
                  <span>UPI, PhonePe, GPay, Paytm</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-white/80">
                  <CreditCard className="w-4 h-4" />
                  <span>All Indian Cards & Banks</span>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                <div className="text-green-400 font-semibold mb-2">Starting from ₹899/month</div>
                <div className="text-sm text-green-300">Save up to 30% on annual plans</div>
              </div>
              
              <Button
                onClick={() => setSelectedMethod('upi')}
                className="w-full"
                size="lg"
              >
                <Smartphone className="w-5 h-5 mr-2" />
                Pay with UPI
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* International Payment Option */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="h-full cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all">
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">International Payments</h3>
              <p className="text-white/70 mb-6">
                Pay with international credit cards, PayPal, and other global payment methods via Stripe.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-center space-x-2 text-white/80">
                  <Globe className="w-4 h-4" />
                  <span>Global payment methods</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-white/80">
                  <CreditCard className="w-4 h-4" />
                  <span>Visa, Mastercard, Amex</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-white/80">
                  <CreditCard className="w-4 h-4" />
                  <span>PayPal, Apple Pay, Google Pay</span>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
                <div className="text-purple-400 font-semibold mb-2">Starting from $11/month</div>
                <div className="text-sm text-purple-300">Secure payments via Stripe</div>
              </div>
              
              <Button
                onClick={() => setSelectedMethod('international')}
                className="w-full"
                variant="secondary"
                size="lg"
              >
                <Globe className="w-5 h-5 mr-2" />
                Pay Internationally
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="text-center">
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-semibold mb-2">🔒 Secure & Trusted</h4>
          <p className="text-white/70 text-sm">
            Both payment methods use industry-standard encryption and are PCI DSS compliant. 
            Your payment information is never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  )
}