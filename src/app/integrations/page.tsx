'use client'

import { motion } from 'framer-motion'
import { Zap, Code, Puzzle, ArrowRight, Check, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

const integrations = [
  {
    name: 'Zapier',
    description: 'Automate your video processing workflow with 5000+ apps',
    icon: '⚡',
    category: 'Automation',
    status: 'Available',
    features: ['Trigger processing on new uploads', 'Auto-post to social media', 'Slack notifications']
  },
  {
    name: 'Discord Bot',
    description: 'Process videos directly from Discord servers',
    icon: '🤖',
    category: 'Communication',
    status: 'Available',
    features: ['Slash commands', 'Auto-clip detection', 'Server integration']
  },
  {
    name: 'Slack App',
    description: 'Share and process videos within your team workspace',
    icon: '💬',
    category: 'Communication', 
    status: 'Available',
    features: ['File uploads', 'Team notifications', 'Progress tracking']
  },
  {
    name: 'WordPress Plugin',
    description: 'Add video processing directly to your WordPress site',
    icon: '📝',
    category: 'CMS',
    status: 'Coming Soon',
    features: ['Shortcode support', 'Media library integration', 'Auto-embedding']
  },
  {
    name: 'Shopify App',
    description: 'Create product videos and marketing clips automatically',
    icon: '🛒',
    category: 'E-commerce',
    status: 'Coming Soon',
    features: ['Product video generation', 'Marketing automation', 'Store integration']
  },
  {
    name: 'Adobe Premiere',
    description: 'Export and import clips directly from Premiere Pro',
    icon: '🎬',
    category: 'Video Editing',
    status: 'Beta',
    features: ['Direct export', 'Project sync', 'Timeline integration']
  }
]

const sdks = [
  { name: 'JavaScript/Node.js', icon: '🟨', status: 'Available' },
  { name: 'Python', icon: '🐍', status: 'Available' },
  { name: 'PHP', icon: '🐘', status: 'Available' },
  { name: 'Ruby', icon: '💎', status: 'Coming Soon' },
  { name: 'Go', icon: '🐹', status: 'Coming Soon' },
  { name: 'Java', icon: '☕', status: 'Coming Soon' }
]

export default function IntegrationsPage() {
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
              Integrations
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Connect Video Clipper Pro with your favorite tools and platforms
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/api">
              <Button size="lg">
                <Code className="w-5 h-5 mr-2" />
                View API Docs
              </Button>
            </Link>
            <Button variant="secondary" size="lg">
              <Puzzle className="w-5 h-5 mr-2" />
              Request Integration
            </Button>
          </div>
        </motion.div>

        {/* Integrations Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Popular Integrations</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{integration.icon}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
                        <span className="text-sm text-white/60">{integration.category}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      integration.status === 'Available' ? 'bg-green-500/20 text-green-400' :
                      integration.status === 'Beta' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {integration.status}
                    </span>
                  </div>
                  <p className="text-white/80 mb-4">{integration.description}</p>
                  <ul className="space-y-2 mb-6">
                    {integration.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-sm text-white/70">
                        <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={integration.status === 'Available' ? 'primary' : 'secondary'}
                    className="w-full"
                    disabled={integration.status === 'Coming Soon'}
                  >
                    {integration.status === 'Available' ? 'Install' : 
                     integration.status === 'Beta' ? 'Join Beta' : 'Coming Soon'}
                    {integration.status === 'Available' && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* SDKs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">SDKs & Libraries</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {sdks.map((sdk, index) => (
              <Card key={sdk.name} className="text-center">
                <div className="text-4xl mb-3">{sdk.icon}</div>
                <h3 className="text-white font-medium mb-2">{sdk.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  sdk.status === 'Available' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {sdk.status}
                </span>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Card>
            <h2 className="text-2xl font-bold text-white mb-4">Need a Custom Integration?</h2>
            <p className="text-white/80 mb-6">
              We're always building new integrations. Let us know what you need!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button>
                <ExternalLink className="w-4 h-4 mr-2" />
                Request Integration
              </Button>
              <Link href="/contact">
                <Button variant="secondary">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}