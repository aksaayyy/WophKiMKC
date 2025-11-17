/**
 * Stripe Configuration
 * Handles Stripe client and server-side setup
 */

import { loadStripe, Stripe } from '@stripe/stripe-js'
import StripeServer from 'stripe'

// Client-side Stripe
let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Server-side Stripe
export const stripe = new StripeServer(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Pricing configuration
export const PRICING_PLANS = {
  starter: {
    name: 'Starter',
    monthlyPriceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
    annualPriceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID!,
    features: {
      videos: 20,
      youtubeVideos: 10,
      quality: 'standard',
      support: 'email'
    }
  },
  pro: {
    name: 'Pro',
    monthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    annualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
    features: {
      videos: 200,
      youtubeVideos: 'unlimited',
      quality: 'high',
      support: 'priority'
    }
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPriceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
    annualPriceId: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID!,
    features: {
      videos: 'unlimited',
      youtubeVideos: 'unlimited',
      quality: 'premium',
      support: 'dedicated'
    }
  }
} as const

export type PlanType = keyof typeof PRICING_PLANS
export type BillingInterval = 'monthly' | 'annual'

/**
 * Get price ID for a plan and billing interval
 */
export function getPriceId(plan: PlanType, interval: BillingInterval): string {
  const planConfig = PRICING_PLANS[plan]
  return interval === 'monthly' ? planConfig.monthlyPriceId : planConfig.annualPriceId
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}