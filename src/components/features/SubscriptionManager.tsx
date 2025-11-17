'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getStripe } from '@/lib/stripe'

interface SubscriptionManagerProps {
  userId: string
  currentPlan?: string
  currentInterval?: string
}

export function SubscriptionManager({ userId, currentPlan, currentInterval }: SubscriptionManagerProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (plan: string, interval: string) => {
    setLoading(`${plan}-${interval}`)

    try {
      // Create checkout session
      const response = await fetch('/api/v1/payments/create-checkout', {
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

      const { sessionId, url } = await response.json()

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url
      } else {
        // Use Stripe.js for embedded checkout
        const stripe = await getStripe()
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId })
        }
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to start subscription process. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: 11,
      annualPrice: 9,
      features: ['20 videos/month', '10 YouTube videos/month', 'Basic AI features']
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 29,
      annualPrice: 24,
      features: ['200 videos/month', 'Unlimited YouTube', 'Advanced AI features'],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: 79,
      annualPrice: 65,
      features: ['Unlimited videos', 'Unlimited YouTube', 'Premium features']
    }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h2>
        <p className="text-white/70">Upgrade to unlock more features and higher limits</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.popular ? 'ring-2 ring-primary-500' : ''}>
            {plan.popular && (
              <div className="bg-primary-500 text-white text-center py-2 text-sm font-semibold rounded-t-xl -mx-6 -mt-6 mb-6">
                Most Popular
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-white mb-4">
                ${plan.monthlyPrice}<span className="text-lg text-white/60">/mo</span>
              </div>
              <div className="text-sm text-white/60 mb-4">
                or ${plan.annualPrice}/mo billed annually
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white/80">{feature}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => handleSubscribe(plan.id, 'monthly')}
                disabled={loading === `${plan.id}-monthly`}
                className="w-full"
                variant={plan.popular ? 'primary' : 'secondary'}
              >
                {loading === `${plan.id}-monthly` ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                Subscribe Monthly
              </Button>

              <Button
                onClick={() => handleSubscribe(plan.id, 'annual')}
                disabled={loading === `${plan.id}-annual`}
                className="w-full"
                variant="outline"
              >
                {loading === `${plan.id}-annual` ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                Subscribe Annually (Save 20%)
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}