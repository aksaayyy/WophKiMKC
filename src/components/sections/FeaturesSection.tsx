'use client'

import { motion } from 'framer-motion'
import { Zap, Brain, Palette, Users, Globe, Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Clipping',
    description: 'Our advanced AI analyzes your content to automatically identify the most engaging moments and create perfect clips.',
    color: 'from-primary-500 to-purple-500',
    delay: 0.1
  },
  {
    icon: Zap,
    title: 'Lightning Fast Processing',
    description: 'Process hours of content in minutes with our optimized cloud infrastructure and cutting-edge algorithms.',
    color: 'from-purple-500 to-pink-500',
    delay: 0.2
  },
  {
    icon: Palette,
    title: 'Smart Enhancement',
    description: 'Automatic color correction, audio enhancement, and quality optimization for professional-grade results.',
    color: 'from-pink-500 to-cyan-500',
    delay: 0.3
  },
  {
    icon: Globe,
    title: 'Multi-Platform Optimization',
    description: 'Automatically format and optimize your clips for TikTok, Instagram, YouTube Shorts, and more.',
    color: 'from-cyan-500 to-primary-500',
    delay: 0.4
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together with your team, share templates, and maintain consistent branding across all content.',
    color: 'from-primary-500 to-purple-500',
    delay: 0.5
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption, SOC2 compliance, and secure cloud processing to protect your valuable content.',
    color: 'from-purple-500 to-cyan-500',
    delay: 0.6
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Powerful Features for{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Modern Creators
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Everything you need to transform your long-form content into viral short-form videos
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: feature.delay }}
            >
              <Card className="h-full group cursor-pointer">
                <div className="relative">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-primary-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="glass rounded-3xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to experience the future of video editing?
            </h3>
            <p className="text-white/80 mb-6">
              Join thousands of creators who are already using AI to scale their content production
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary"
              >
                Start Free Trial
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary"
              >
                Schedule Demo
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}