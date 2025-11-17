'use client'

import { motion } from 'framer-motion'
import { Shield, Lock, Eye, Database, Users, Mail } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const sections = [
  {
    icon: Database,
    title: 'Information We Collect',
    content: [
      'Account information (email, name, profile details)',
      'Video files and content you upload for processing',
      'Usage data and analytics to improve our service',
      'Payment information (processed securely by Stripe)',
      'Device and browser information for optimization'
    ]
  },
  {
    icon: Eye,
    title: 'How We Use Your Information',
    content: [
      'Process your videos and provide our core services',
      'Communicate with you about your account and updates',
      'Improve our AI algorithms and service quality',
      'Provide customer support and technical assistance',
      'Comply with legal obligations and prevent fraud'
    ]
  },
  {
    icon: Shield,
    title: 'Data Protection',
    content: [
      'All data is encrypted in transit and at rest',
      'Videos are processed securely and deleted after 30 days',
      'We use industry-standard security measures',
      'Regular security audits and penetration testing',
      'SOC 2 Type II compliance (coming 2025)'
    ]
  },
  {
    icon: Users,
    title: 'Data Sharing',
    content: [
      'We never sell your personal information to third parties',
      'Video content is only accessed by our AI processing systems',
      'Limited sharing with service providers under strict agreements',
      'Legal compliance when required by law enforcement',
      'Anonymous analytics data may be used for research'
    ]
  }
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Privacy{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-4">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-white/60">
            Last updated: January 27, 2025
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <Card>
            <div className="flex items-start space-x-4">
              <Lock className="w-8 h-8 text-primary-400 mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-white mb-3">Our Commitment to Privacy</h2>
                <p className="text-white/80 leading-relaxed">
                  At Video Clipper Pro, we believe privacy is a fundamental right. We're committed to being 
                  transparent about our data practices and giving you control over your information. This 
                  policy applies to all users of our website, API, and services.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Sections */}
        <div className="space-y-8 mb-12">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white mb-4">{section.title}</h2>
                    <ul className="space-y-3">
                      {section.content.map((item, i) => (
                        <li key={i} className="flex items-start text-white/80">
                          <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Your Rights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <Card>
            <h2 className="text-xl font-semibold text-white mb-6">Your Rights and Choices</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-white font-medium mb-3">Access and Control</h3>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li>• View and download your personal data</li>
                  <li>• Update your account information</li>
                  <li>• Delete your account and data</li>
                  <li>• Opt out of marketing communications</li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-medium mb-3">Data Portability</h3>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li>• Export your processed videos</li>
                  <li>• Download your account data</li>
                  <li>• Transfer data to other services</li>
                  <li>• Request data correction</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-12"
        >
          <Card>
            <h2 className="text-xl font-semibold text-white mb-4">Cookies and Tracking</h2>
            <p className="text-white/80 mb-4">
              We use cookies and similar technologies to improve your experience, analyze usage, and provide personalized content.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Essential</h4>
                <p className="text-white/70 text-sm">Required for basic functionality</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Analytics</h4>
                <p className="text-white/70 text-sm">Help us understand usage patterns</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Marketing</h4>
                <p className="text-white/70 text-sm">Personalize your experience</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card>
            <div className="flex items-start space-x-4">
              <Mail className="w-8 h-8 text-primary-400 mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-white mb-3">Questions About Privacy?</h2>
                <p className="text-white/80 mb-4">
                  If you have any questions about this privacy policy or how we handle your data, 
                  please don't hesitate to contact us.
                </p>
                <div className="space-y-2 text-white/70">
                  <p>Email: <span className="text-primary-400">aksaayyy6@gmail.com</span></p>
                  <p>Data Protection Officer: <span className="text-primary-400">privacy@videoclipperpro.com</span></p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}