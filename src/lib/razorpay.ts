/**
 * Razorpay Configuration for UPI Payments
 * Easy UPI integration for Indian users
 */

import Razorpay from 'razorpay'

// Server-side Razorpay instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// Client-side Razorpay script loader
export const loadRazorpay = (): Promise<any> => {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => {
      resolve((window as any).Razorpay)
    }
    document.body.appendChild(script)
  })
}

// UPI-focused pricing plans (in INR)
export const UPI_PRICING_PLANS = {
  starter: {
    name: 'Starter',
    monthlyPrice: 899, // ₹899 (~$11)
    annualPrice: 7999, // ₹7999 (~$96, save ₹1789)
    features: {
      videos: 20,
      youtubeVideos: 10,
      quality: 'standard',
      support: 'email'
    }
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 2399, // ₹2399 (~$29)
    annualPrice: 19999, // ₹19999 (~$240, save ₹8789)
    features: {
      videos: 200,
      youtubeVideos: 'unlimited',
      quality: 'high',
      support: 'priority'
    }
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPrice: 6499, // ₹6499 (~$79)
    annualPrice: 54999, // ₹54999 (~$660, save ₹22489)
    features: {
      videos: 'unlimited',
      youtubeVideos: 'unlimited',
      quality: 'premium',
      support: 'dedicated'
    }
  }
} as const

export type UPIPlanType = keyof typeof UPI_PRICING_PLANS
export type UPIBillingInterval = 'monthly' | 'annual'

/**
 * Get price for a plan and billing interval
 */
export function getUPIPrice(plan: UPIPlanType, interval: UPIBillingInterval): number {
  const planConfig = UPI_PRICING_PLANS[plan]
  return interval === 'monthly' ? planConfig.monthlyPrice : planConfig.annualPrice
}

/**
 * Format INR price for display
 */
export function formatINRPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Create Razorpay order options
 */
export function createRazorpayOptions(
  orderId: string,
  amount: number,
  plan: UPIPlanType,
  interval: UPIBillingInterval,
  userEmail: string,
  userName: string,
  onSuccess: (response: any) => void,
  onFailure: (error: any) => void
) {
  return {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: amount * 100, // Amount in paise
    currency: 'INR',
    name: 'Video Clipper Pro',
    description: `${UPI_PRICING_PLANS[plan].name} Plan - ${interval}`,
    image: '/logo.png', // Your logo
    order_id: orderId,
    handler: onSuccess,
    prefill: {
      name: userName,
      email: userEmail,
    },
    notes: {
      plan,
      interval,
      address: 'Video Clipper Pro Subscription'
    },
    theme: {
      color: '#6366f1' // Your brand color
    },
    method: {
      upi: true,
      card: true,
      netbanking: true,
      wallet: true,
    },
    modal: {
      ondismiss: onFailure
    }
  }
}