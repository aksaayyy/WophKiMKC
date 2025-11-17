# Video Clipper Pro

AI-powered video processing platform for creating engaging short-form content.

## Features

- 🎬 AI-powered video clipping
- 🎤 Automatic caption generation
- 🎨 Video enhancement and optimization
- 📱 Multi-platform formatting (TikTok, Instagram, YouTube Shorts)
- 🎵 Background music with auto-ducking
- 👥 Team collaboration
- 💳 Subscription management

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Payments:** Stripe
- **3D Graphics:** Three.js, React Three Fiber

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Deployment

This project is deployed on Vercel. Push to the main branch to trigger automatic deployment.

## License

Private - All rights reserved
