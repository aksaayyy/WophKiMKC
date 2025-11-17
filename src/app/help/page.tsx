'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserGuide } from '@/components/features/UserGuide'
import { Search, MessageCircle, Book, Video, Zap, Shield, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function HelpCenter() {
  const [showUserGuide, setShowUserGuide] = useState(false)
  const categories = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Getting Started",
      description: "Learn the basics of Video Clipper Pro",
      articles: [
        "How to upload your first video",
        "Understanding AI clip selection",
        "Exporting and downloading clips",
        "Account setup and preferences"
      ]
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: "Video Processing",
      description: "Everything about video processing and AI features",
      articles: [
        "Supported video formats",
        "Processing time and quality",
        "AI enhancement features",
        "Batch processing videos"
      ]
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Account & Billing",
      description: "Manage your account and subscription",
      articles: [
        "Subscription plans and pricing",
        "Payment methods and billing",
        "Account security settings",
        "Cancellation and refunds"
      ]
    },
    {
      icon: <Book className="w-8 h-8" />,
      title: "API & Integrations",
      description: "Developer resources and integrations",
      articles: [
        "API documentation",
        "SDK installation guide",
        "Webhook setup",
        "Third-party integrations"
      ]
    }
  ]

  const popularArticles = [
    "How to get the best AI-generated clips",
    "Troubleshooting upload issues",
    "Understanding processing credits",
    "Optimizing videos for different platforms",
    "Setting up automated workflows"
  ]

  if (showUserGuide) {
    return <UserGuide onClose={() => setShowUserGuide(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Help Center
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Find answers to your questions and learn how to get the most out of Video Clipper Pro
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles..."
              className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* User Guide CTA */}
        <div className="mb-12">
          <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm border-purple-500/30 p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                  <Book className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Complete User Guide</h3>
                  <p className="text-gray-300 text-lg">
                    Comprehensive documentation with step-by-step tutorials, tips, and troubleshooting
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowUserGuide(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 flex items-center space-x-2"
              >
                <span>Open Guide</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link href="/contact">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 hover:bg-white/20 transition-colors cursor-pointer">
              <MessageCircle className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Contact Support</h3>
              <p className="text-gray-300">Get help from our support team</p>
            </Card>
          </Link>
          
          <Link href="/docs">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 hover:bg-white/20 transition-colors cursor-pointer">
              <Book className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Documentation</h3>
              <p className="text-gray-300">Detailed guides and references</p>
            </Card>
          </Link>
          
          <Link href="/community">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 hover:bg-white/20 transition-colors cursor-pointer">
              <MessageCircle className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Community</h3>
              <p className="text-gray-300">Connect with other creators</p>
            </Card>
          </Link>
        </div>

        {/* Help Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Browse by Category</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {categories.map((category, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
                <div className="flex items-start gap-4">
                  <div className="text-purple-400">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{category.title}</h3>
                    <p className="text-gray-300 mb-4">{category.description}</p>
                    <ul className="space-y-2">
                      {category.articles.map((article, articleIndex) => (
                        <li key={articleIndex}>
                          <a href="#" className="text-purple-300 hover:text-purple-200 transition-colors">
                            {article}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Popular Articles */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Popular Articles</h2>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8">
            <ul className="space-y-4">
              {popularArticles.map((article, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <a href="#" className="text-white hover:text-purple-300 transition-colors text-lg">
                    {article}
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Still Need Help */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm border-white/20 p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Still Need Help?</h3>
            <p className="text-gray-300 mb-6">
              Can't find what you're looking for? Our support team is here to help you succeed.
            </p>
            <Link href="/contact">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3">
                Contact Support
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}