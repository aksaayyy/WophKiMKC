'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Zap, Crown, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    monthlyPrice: 11,
    annualPrice: 9, // ~18% discount
    description: 'Perfect for individual creators',
    icon: Zap,
    color: 'from-primary-500 to-purple-500',
    features: [
      '20 videos per month',
      '10 YouTube videos per month',
      'AI-powered clipping',
      'Basic quality enhancement',
      '1080p output',
      'Standard processing speed',
      'Email support'
    ],
    popular: false
  },
  {
    name: 'Pro',
    monthlyPrice: 29,
    annualPrice: 24, // ~17% discount
    description: 'For serious content creators',
    icon: Crown,
    color: 'from-purple-500 to-pink-500',
    features: [
      '200 videos per month',
      'Unlimited YouTube videos',
      'Advanced AI features',
      'Smart chunked YouTube download',
      'Super resolution (4K)',
      'Multi-platform optimization',
      'Audio enhancement',
      'Color correction',
      'Priority support',
      'Team collaboration',
      'Custom templates'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    monthlyPrice: 79,
    annualPrice: 65, // ~18% discount
    description: 'For teams and agencies',
    icon: Rocket,
    color: 'from-pink-500 to-cyan-500',
    features: [
      'Unlimited videos',
      'Unlimited YouTube processing',
      'All AI features',
      'Premium quality processing',
      'Fastest processing speed',
      'White-label solution',
      'API access',
      'Dedicated support',
      'Advanced analytics',
      'Custom integrations',
      'Bulk YouTube processing'
    ],
    popular: false
  }
]

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Simple{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your content creation needs. All plans include our core AI features.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={`${!isAnnual ? 'text-white' : 'text-white/60'} transition-colors`}>
              Monthly
            </span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAnnual(!isAnnual)}
              className={`w-12 h-6 rounded-full relative transition-colors ${
                isAnnual ? 'bg-primary-500' : 'bg-white/20'
              }`}
            >
              <motion.div
                className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                animate={{ x: isAnnual ? 26 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </motion.button>
            <span className={`${isAnnual ? 'text-white' : 'text-white/60'} transition-colors`}>
              Annual
            </span>
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-sm">
              Save up to 20%
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              {plan.popular && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-primary px-4 py-2 rounded-full text-white text-sm font-semibold z-10"
                >
                  Most Popular
                </motion.div>
              )}
              
              <Card className={`h-full ${plan.popular ? 'ring-2 ring-primary-500 shadow-glow' : ''}`}>
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${plan.color} flex items-center justify-center mx-auto mb-6`}>
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-white/60 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-white">
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-white/60 ml-1">/month</span>
                    </div>
                    {isAnnual && (
                      <div className="text-sm text-green-400 mt-1">
                        Billed annually (${plan.annualPrice * 12}/year)
                      </div>
                    )}
                  </div>
                  
                  <Link href="/auth/login?mode=register">
                    <Button 
                      className={`w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                      size="lg"
                    >
                      {plan.popular ? 'Start Free Trial' : 'Get Started'}
                    </Button>
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + featureIndex * 0.1 }}
                      className="flex items-center space-x-3"
                    >
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-white/80">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">
              Frequently Asked Questions
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div>
                <h3 className="text-white font-semibold mb-2">Can I cancel anytime?</h3>
                <p className="text-white/70">Absolutely! Cancel your subscription at any time with just one click. No hassle, no questions asked, and no cancellation fees.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">What if I'm not satisfied?</h3>
                <p className="text-white/70">We're confident you'll love Video Clipper Pro! If you're not completely satisfied within the first 30 days, we'll refund your money, no questions asked.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Is there a free trial?</h3>
                <p className="text-white/70">Yes! Start with a 14-day free trial on any plan. No credit card required to get started - experience the full power of our AI video processing.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">What happens after I cancel?</h3>
                <p className="text-white/70">You'll continue to have access to all features until the end of your current billing period. Your data is safely stored for 90 days in case you want to return.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">What video formats do you support?</h3>
                <p className="text-white/70">We support all major video formats including MP4, MOV, AVI, MKV, WebM, and more. Upload from any device or platform.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">How does billing work?</h3>
                <p className="text-white/70">Simple and transparent billing. Monthly plans are billed monthly, annual plans save you money with one yearly payment. Change or cancel anytime.</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}