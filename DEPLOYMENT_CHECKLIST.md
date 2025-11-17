# 🚀 Vercel Deployment Checklist

## 💳 **Payment Gateway Setup**

### **1. Stripe Configuration**
- [ ] Create Stripe account (https://stripe.com)
- [ ] Get API keys from Stripe Dashboard
- [ ] Create products and prices in Stripe Dashboard:
  - [ ] Starter Monthly ($11/month)
  - [ ] Starter Annual ($9/month, billed annually)
  - [ ] Pro Monthly ($29/month)
  - [ ] Pro Annual ($24/month, billed annually)
  - [ ] Enterprise Monthly ($79/month)
  - [ ] Enterprise Annual ($65/month, billed annually)
- [ ] Set up webhook endpoint in Stripe Dashboard
- [ ] Configure webhook events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`

### **2. Database Schema Updates**
```sql
-- Add subscription table to Supabase
CREATE TABLE user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'pro', 'enterprise')),
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
  FOR ALL USING (auth.role() = 'service_role');
```

## 🔧 **Environment Variables for Production**

### **Required Environment Variables:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App URLs
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app

# Authentication
NEXTAUTH_SECRET=your_production_secret_key
NEXTAUTH_URL=https://your-domain.vercel.app

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs
STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxx
STRIPE_STARTER_ANNUAL_PRICE_ID=price_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_ANNUAL_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=price_xxx

# CLI Configuration (for serverless functions)
PYTHON_PATH=python3
CLI_TOOL_PATH=scripts/process_video.py
```

## 🏗️ **Vercel Deployment Configuration**

### **1. Create vercel.json**
```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 300
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

### **2. Build Configuration**
- [ ] Ensure `npm run build` works locally
- [ ] Check TypeScript compilation: `npm run type-check`
- [ ] Verify all dependencies are in package.json
- [ ] Test production build: `npm run start`

## 🔒 **Security Checklist**

### **1. Environment Security**
- [ ] Use strong, unique secrets for production
- [ ] Never commit .env files to git
- [ ] Use Vercel environment variables dashboard
- [ ] Enable Stripe webhook signature verification

### **2. API Security**
- [ ] Implement rate limiting
- [ ] Validate all API inputs
- [ ] Use HTTPS only in production
- [ ] Secure file upload handling

### **3. Database Security**
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Review and test all RLS policies
- [ ] Use service role key only for admin operations
- [ ] Implement proper user authentication

## 📁 **File System Considerations**

### **⚠️ Important: Vercel Limitations**
Vercel serverless functions have limitations that affect video processing:

1. **Execution Time Limit**: 10 seconds (Hobby), 60 seconds (Pro), 300 seconds (Enterprise)
2. **Memory Limit**: 1GB max
3. **No Persistent File System**: Files are ephemeral
4. **No Background Processes**: Can't run long video processing

### **🔄 Recommended Architecture for Production:**

#### **Option 1: External Processing Service**
- Deploy video processing to a VPS/dedicated server
- Use Vercel for web interface only
- Communicate via webhooks/API calls

#### **Option 2: Queue-Based Processing**
- Use Redis/BullMQ for job queues
- Process videos on separate workers
- Store results in cloud storage (AWS S3, Cloudflare R2)

#### **Option 3: Hybrid Approach**
- Light processing on Vercel (< 60 seconds)
- Heavy processing on external service
- Automatic fallback based on video size

## 🚀 **Deployment Steps**

### **1. Pre-deployment**
- [ ] Run all tests: `npm test`
- [ ] Check build: `npm run build`
- [ ] Verify environment variables
- [ ] Test Stripe integration in test mode

### **2. Vercel Setup**
- [ ] Connect GitHub repository to Vercel
- [ ] Configure environment variables in Vercel dashboard
- [ ] Set up custom domain (optional)
- [ ] Configure deployment settings

### **3. Post-deployment**
- [ ] Test all API endpoints
- [ ] Verify Stripe webhooks are working
- [ ] Test user registration and authentication
- [ ] Test video processing (if applicable)
- [ ] Monitor error logs

### **4. Stripe Production Setup**
- [ ] Switch to live Stripe keys
- [ ] Update webhook URL to production domain
- [ ] Test payment flow end-to-end
- [ ] Set up Stripe Dashboard monitoring

## 📊 **Monitoring & Analytics**

### **1. Error Monitoring**
- [ ] Set up Vercel Analytics
- [ ] Configure error tracking (Sentry, LogRocket)
- [ ] Monitor API response times
- [ ] Set up uptime monitoring

### **2. Business Metrics**
- [ ] Track subscription conversions
- [ ] Monitor payment failures
- [ ] Analyze user engagement
- [ ] Set up revenue tracking

## 🔄 **Post-Launch Tasks**

### **1. Performance Optimization**
- [ ] Optimize images and assets
- [ ] Implement caching strategies
- [ ] Monitor Core Web Vitals
- [ ] Optimize API response times

### **2. User Experience**
- [ ] Set up customer support system
- [ ] Create user documentation
- [ ] Implement feedback collection
- [ ] Monitor user behavior

### **3. Scaling Preparation**
- [ ] Plan for increased traffic
- [ ] Optimize database queries
- [ ] Implement CDN for static assets
- [ ] Prepare horizontal scaling strategy

## ⚠️ **Critical Notes for Video Processing**

Since your app processes videos, consider these Vercel limitations:

1. **File Size Limits**: Vercel has request size limits
2. **Processing Time**: Video processing often exceeds serverless limits
3. **Storage**: No persistent storage on Vercel

**Recommended Solution:**
- Use Vercel for the web interface
- Deploy video processing to Railway, DigitalOcean, or AWS EC2
- Use cloud storage for video files
- Implement webhook communication between services

This ensures your web interface is fast and scalable while video processing runs on appropriate infrastructure.