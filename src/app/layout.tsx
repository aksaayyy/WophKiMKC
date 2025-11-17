import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Video Clipper Pro - AI-Powered Video Processing',
  description: 'Transform your videos with AI-powered clipping, enhancement, and optimization. Create stunning short-form content in minutes.',
  keywords: 'video editing, AI video processing, short form content, video clips, social media videos',
  authors: [{ name: 'Video Clipper Pro Team' }],
  creator: 'Video Clipper Pro',
  publisher: 'Video Clipper Pro',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://videoclipperpro.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Video Clipper Pro - AI-Powered Video Processing',
    description: 'Transform your videos with AI-powered clipping, enhancement, and optimization.',
    url: 'https://videoclipperpro.com',
    siteName: 'Video Clipper Pro',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Video Clipper Pro - AI Video Processing',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Video Clipper Pro - AI-Powered Video Processing',
    description: 'Transform your videos with AI-powered clipping, enhancement, and optimization.',
    images: ['/og-image.jpg'],
    creator: '@videoclipperpro',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}