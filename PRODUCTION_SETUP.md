# 🚀 Production Deployment Guide

## 📋 **Quick Setup Steps**

### **1. Install Dependencies**
```bash
cd video-clipper-pro
npm install
```

### **2. Set Up Stripe**
1. Create Stripe account: https://stripe.com
2. Get your API keys from Dashboard → Developers → API keys
3. Create products and prices:
   - Starter: $11/month, $9/month annual
   - Pro: $29/month, $24/month annual  
   - Enterprise: $79/month, $65/month annual
4. Copy the Price IDs for environment variables

### **3. Configure Environment Variables**
Create these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Required for all environments
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_secure_random_string
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (from step 2)
STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxx
STRIPE_STARTER_ANNUAL_PRICE_ID=price_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_ANNUAL_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=price_xxx
```

### **4. Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### **5. Set Up Stripe Webhook**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/v1/payments/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to environment variables

### **6. Run Database Migrations**
```bash
# In Supabase SQL Editor, run:
-- Copy content from supabase/migrations/003_subscriptions.sql
```

## ⚠️ **Important: Video Processing Limitations**

**Vercel Serverless Limitations:**
- Max execution time: 300 seconds (5 minutes)
- Memory limit: 1GB
- No persistent file system
- No background processes

**For Production Video Processing, you need:**

### **Option A: External Processing Server**
1. Deploy `version2/` folder to a VPS (DigitalOcean, Railway, etc.)
2. Update environment variables to point to external server
3. Use webhooks for communication

### **Option B: Queue-Based Processing**
1. Use Redis for job queues
2. Process videos on separate workers
3. Store results in cloud storage

### **Option C: Hybrid Approach (Recommended)**
1. Light processing (< 60 seconds) on Vercel
2. Heavy processing on external service
3. Automatic routing based on video size

## 🔧 **Production Configuration**

### **Update CLI Configuration**
```typescript
// In video-clipper-pro/src/lib/cli/ProcessingBridge.ts
export const processingBridge = new ProcessingBridge({
  cliConfig: {
    pythonPath: process.env.PYTHON_PATH || 'python3',
    cliPath: process.env.CLI_TOOL_PATH || 'https://your-processing-server.com/api/process',
    workingDirectory: process.env.CLI_WORKING_DIR || '/tmp',
    useExternalService: process.env.NODE_ENV === 'production'
  }
})
```

### **Environment-Specific Settings**
```bash
# For external processing server
EXTERNAL_PROCESSING_URL=https://your-processing-server.com
EXTERNAL_PROCESSING_API_KEY=your_api_key

# For cloud storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your-video-bucket
AWS_REGION=us-east-1
```

## 📊 **Monitoring Setup**

### **1. Error Tracking**
```bash
npm install @sentry/nextjs
```

### **2. Analytics**
- Enable Vercel Analytics in dashboard
- Set up Google Analytics (optional)
- Monitor Stripe Dashboard for payments

### **3. Uptime Monitoring**
- Use Vercel's built-in monitoring
- Set up external monitoring (UptimeRobot, Pingdom)

## 🚀 **Launch Checklist**

- [ ] All environment variables configured
- [ ] Stripe products and webhooks set up
- [ ] Database migrations run
- [ ] Payment flow tested end-to-end
- [ ] Video processing tested (if applicable)
- [ ] Error monitoring configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Performance optimized

## 🔄 **Post-Launch**

### **Immediate Tasks**
1. Monitor error logs for 24 hours
2. Test all user flows
3. Verify payment processing
4. Check webhook delivery

### **Week 1**
1. Analyze user behavior
2. Monitor performance metrics
3. Gather user feedback
4. Optimize based on real usage

### **Ongoing**
1. Regular security updates
2. Performance monitoring
3. Feature development based on feedback
4. Scale infrastructure as needed

## 📞 **Support & Maintenance**

### **Key Metrics to Monitor**
- Payment success rate
- API response times
- Error rates
- User conversion funnel
- Video processing success rate

### **Regular Tasks**
- Weekly: Review error logs and performance
- Monthly: Analyze user metrics and revenue
- Quarterly: Security audit and dependency updates

Your Video Clipper Pro is now ready for production! 🎉