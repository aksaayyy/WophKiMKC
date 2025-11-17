'use client'

import { motion } from 'framer-motion'
import { Book, Code, Zap, Users, ArrowRight, Search, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

const docSections = [
  {
    icon: Zap,
    title: 'Quick Start',
    description: 'Get up and running in minutes',
    items: [
      'Create your first clip',
      'Upload methods',
      'Platform optimization',
      'Download results'
    ],
    color: 'from-primary-500 to-purple-500'
  },
  {
    icon: Code,
    title: 'API Reference',
    description: 'Complete API documentation',
    items: [
      'Authentication',
      'Endpoints',
      'Rate limits',
      'Error codes'
    ],
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Users,
    title: 'Integrations',
    description: 'Connect with your tools',
    items: [
      'Zapier workflows',
      'Discord bot',
      'Slack app',
      'Custom webhooks'
    ],
    color: 'from-pink-500 to-cyan-500'
  },
  {
    icon: Book,
    title: 'Guides & Tutorials',
    description: 'Learn best practices',
    items: [
      'Content optimization',
      'Platform strategies',
      'Batch processing',
      'Advanced features'
    ],
    color: 'from-cyan-500 to-primary-500'
  }
]

const popularDocs = [
  { title: 'Getting Started with Video Clipper Pro', category: 'Quick Start', readTime: '5 min' },
  { title: 'API Authentication Guide', category: 'API', readTime: '3 min' },
  { title: 'Platform Optimization Settings', category: 'Guide', readTime: '8 min' },
  { title: 'Webhook Integration', category: 'Integration', readTime: '10 min' },
  { title: 'Batch Processing Tutorial', category: 'Advanced', readTime: '12 min' }
]

export default function DocsPage() {
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
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Documentation
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Everything you need to know about Video Clipper Pro
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
            <Input
              placeholder="Search documentation..."
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Documentation Sections */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {docSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="h-full hover:scale-105 transition-transform cursor-pointer">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${section.color} flex items-center justify-center mb-4`}>
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{section.title}</h3>
                <p className="text-white/70 mb-4">{section.description}</p>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-center text-sm text-white/60">
                      <ArrowRight className="w-3 h-3 mr-2 text-primary-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Popular Documentation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8">Popular Documentation</h2>
          <div className="space-y-4">
            {popularDocs.map((doc, index) => (
              <Card key={doc.title} className="hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Book className="w-5 h-5 text-primary-400" />
                    <div>
                      <h3 className="text-white font-medium">{doc.title}</h3>
                      <div className="flex items-center space-x-3 text-sm text-white/60">
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span>{doc.readTime} read</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/40" />
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid md:grid-cols-3 gap-6"
        >
          <Card>
            <Code className="w-8 h-8 text-primary-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-3">API Reference</h3>
            <p className="text-white/70 mb-4">
              Complete API documentation with examples and SDKs.
            </p>
            <Link href="/api">
              <Button variant="secondary" className="w-full">
                View API Docs
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>

          <Card>
            <Zap className="w-8 h-8 text-primary-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-3">Quick Start</h3>
            <p className="text-white/70 mb-4">
              Get started with your first video clip in under 5 minutes.
            </p>
            <Link href="/process">
              <Button variant="secondary" className="w-full">
                Start Processing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>

          <Card>
            <Users className="w-8 h-8 text-primary-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-3">Community</h3>
            <p className="text-white/70 mb-4">
              Join our community for tips, tricks, and support.
            </p>
            <Link href="/community">
              <Button variant="secondary" className="w-full">
                Join Community
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}