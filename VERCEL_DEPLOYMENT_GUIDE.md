# ⚡ Vercel Deployment Guide

## 🎯 **Vercel Deployment Strategy**

Deploy the web interface to Vercel for maximum speed and scalability, with external video processing.

## ⚠️ **Important Limitations**

### **Vercel Serverless Constraints**
- **Execution Time**: 10s (Hobby), 60s (Pro), 300s (Enterprise)
- **Memory**: 1GB maximum
- **File System**: Ephemeral (no persistent storage)
- **Background Jobs**: Not supported
- **Python**: Limited support

### **Recommended Architecture**
```
┌─────────────────┐    ┌─────────────────┐
│     Vercel      │    │   External VPS  │
│                 │    │                 │
│ • Web Interface │◄──►│ • Video Proc.   │
│ • API Routes    │    │ • Python Tools  │
│ • Auth & Pay    │    │ • File Storage  │
│ • Light Proc.   │    │ • Heavy Proc.   │
└─────────────────┘    └─────────────────┘
```

## 🚀 **Step-by-Step Deployment**

### **1. Pre-Deployment Setup (10 minutes)**

```bash
# Ensure your project builds locally
cd video-clipper-pro
npm install
npm run build
npm run type-check

# Test the application
npm run dev
# Verify all pages load correctly
```

### **2. Vercel Account Setup (5 minutes)**

1. **Create Vercel Account**: https://vercel.com
2. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```
3. **Login to Vercel**:
   ```bash
   vercel login
   ```

### **3. Project Configuration (5 minutes)**

```bash
# Initialize Vercel project
vercel

# Follow the prompts:
# ? Set up and deploy "video-clipper-pro"? [Y/n] y
# ? Which scope do you want to deploy to? [Your Account]
# ? Link to existing project? [y/N] n
# ? What's your project's name? video-clipper-pro
# ? In which directory is your code located? ./
```

### **4. Environment Variables Setup (15 minutes)**

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add all these variables:

```bash
# Database & Auth
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NEXT_PUBLIC_API_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=your_secure_random_string_32_chars_min
NEXTAUTH_URL=https://your-project.vercel.app

# Stripe Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs
STRIPE_STARTER_MONTHLY_PRICE_ID=price_starter_monthly_id
STRIPE_STARTER_ANNUAL_PRICE_ID=price_starter_annual_id
STRIPE_PRO_MONTHLY_PRICE_ID=price_pro_monthly_id
STRIPE_PRO_ANNUAL_PRICE_ID=price_pro_annual_id
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_enterprise_monthly_id
STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=price_enterprise_annual_id

# UPI Payments
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# External Processing (if using external VPS)
EXTERNAL_PROCESSING_URL=https://your-processing-server.com
EXTERNAL_PROCESSING_API_KEY=your_api_key

# File Storage (cloud storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your-video-bucket
AWS_REGION=us-east-1
```

### **5. Build Configuration (5 minutes)**

Update `vercel.json` for optimal configuration:

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
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ]
}
```

### **6. Deploy to Production (2 minutes)**

```bash
# Deploy to production
vercel --prod

# Your app will be available at:
# https://your-project.vercel.app
```

## 🔧 **Post-Deployment Configuration**

### **1. Custom Domain Setup (10 minutes)**

1. **Add Domain in Vercel Dashboard**:
   - Go to Project Settings → Domains
   - Add your custom domain (e.g., `videoclipper.com`)

2. **Configure DNS**:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.19
   ```

3. **SSL Certificate**:
   - Automatically provisioned by Vercel
   - Usually takes 5-10 minutes

### **2. Webhook Configuration**

#### **Stripe Webhooks**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/v1/payments/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.*`
   - `invoice.payment_*`

#### **Razorpay Webhooks**
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook: `https://yourdomain.com/api/v1/payments/upi/webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`

### **3. Database Migrations (5 minutes)**

Run in Supabase SQL Editor:
```sql
-- Execute all migration files
-- 001_initial_schema.sql
-- 002_rls_policies.sql
-- 003_subscriptions.sql
```

## 🎯 **Video Processing Solutions**

Since Vercel has limitations for video processing, here are your options:

### **Option 1: External Processing Service (Recommended)**

Update your processing bridge to use external service:

```typescript
// src/lib/cli/ProcessingBridge.ts
const useExternalProcessing = process.env.NODE_ENV === 'production'

if (useExternalProcessing) {
  // Send job to external VPS
  const response = await fetch(process.env.EXTERNAL_PROCESSING_URL + '/process', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EXTERNAL_PROCESSING_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jobId,
      videoUrl,
      parameters
    })
  })
} else {
  // Use local processing (development)
  // ... existing code
}
```

### **Option 2: Light Processing Only**

Modify the CLI manager to handle only light processing:

```typescript
// src/lib/cli/CLIProcessManager.ts
const MAX_PROCESSING_TIME = 240 // 4 minutes (safe margin)

if (estimatedProcessingTime > MAX_PROCESSING_TIME) {
  throw new Error('Video too large for serverless processing. Please use a smaller file.')
}
```

### **Option 3: Queue-Based Processing**

Use Vercel with external queue system:

```typescript
// Add job to queue instead of processing directly
await addToProcessingQueue({
  jobId,
  userId,
  videoUrl,
  parameters
})

// Return immediately with job ID
return { jobId, status: 'queued' }
```

## 📊 **Performance Optimization**

### **1. Vercel Analytics Setup**

```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to your app
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### **2. Edge Functions for API Routes**

```typescript
// src/app/api/status/route.ts
export const runtime = 'edge'

export async function GET(request: Request) {
  // This will run on Vercel Edge Network
  // Faster response times globally
}
```

### **3. Image Optimization**

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
}
```

## 🔍 **Monitoring & Debugging**

### **1. Vercel Logs**

```bash
# View real-time logs
vercel logs --follow

# View function logs
vercel logs --since=1h
```

### **2. Error Tracking**

```bash
# Install Sentry for error tracking
npm install @sentry/nextjs

# Configure Sentry
# sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

### **3. Performance Monitoring**

```typescript
// Add performance monitoring
export async function middleware(request: NextRequest) {
  const start = Date.now()
  
  const response = NextResponse.next()
  
  const duration = Date.now() - start
  console.log(`${request.method} ${request.url} - ${duration}ms`)
  
  return response
}
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: Build Failures**

```bash
# Check build logs
vercel logs --since=1h

# Common fixes:
# 1. TypeScript errors
npm run type-check

# 2. Missing environment variables
# Add in Vercel dashboard

# 3. Import errors
# Check all imports are correct
```

### **Issue 2: API Timeouts**

```typescript
// Increase timeout for specific routes
// vercel.json
{
  "functions": {
    "src/app/api/process/route.ts": {
      "maxDuration": 300
    }
  }
}
```

### **Issue 3: File Upload Issues**

```typescript
// Handle large file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
}
```

## 💰 **Cost Optimization**

### **Vercel Pricing Tiers**
| Plan | Cost | Limits | Best For |
|------|------|--------|----------|
| **Hobby** | Free | 100GB bandwidth | Development |
| **Pro** | $20/month | 1TB bandwidth | Small business |
| **Enterprise** | Custom | Unlimited | Large scale |

### **Cost-Saving Tips**
1. **Optimize images** - Use Next.js Image component
2. **Enable caching** - Set proper cache headers
3. **Minimize API calls** - Batch requests when possible
4. **Use Edge functions** - Faster and cheaper than serverless

## 🎯 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Application builds successfully
- [ ] All environment variables configured
- [ ] Database migrations ready
- [ ] Payment gateways configured
- [ ] Domain and SSL ready

### **Post-Deployment**
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Webhooks configured and tested
- [ ] Database migrations executed
- [ ] Payment flows tested
- [ ] Monitoring and analytics set up
- [ ] Error tracking configured

## 🎉 **Success Metrics**

After deployment, monitor these metrics:

### **Performance**
- Page load time < 2 seconds
- API response time < 500ms
- 99.9% uptime

### **User Experience**
- Payment success rate > 95%
- Error rate < 1%
- User conversion rate

### **Business**
- Monthly recurring revenue
- User acquisition cost
- Customer lifetime value

## 🚀 **Final Deployment Command**

```bash
# One-command deployment
#!/bin/bash
echo "🚀 Deploying to Vercel..."

# Build and deploy
npm run build
vercel --prod

echo "✅ Deployment completed!"
echo "🌐 Your app is live at: https://your-domain.vercel.app"
echo "📊 Monitor at: https://vercel.com/dashboard"
```

## 🎯 **Conclusion**

**Vercel Deployment is Perfect For:**
- ✅ Fast global CDN delivery
- ✅ Automatic scaling
- ✅ Zero server maintenance
- ✅ Built-in analytics
- ✅ Easy custom domains

**Limitations to Consider:**
- ⚠️ Processing time limits
- ⚠️ No persistent storage
- ⚠️ Higher costs at scale

**Total deployment time: ~45 minutes**
**Monthly cost: $20-50 (Vercel Pro + external processing)**

Your web interface will be blazingly fast on Vercel! 🚀