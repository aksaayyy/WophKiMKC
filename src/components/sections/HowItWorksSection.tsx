'use client'

import { motion } from 'framer-motion'
import { Upload, Settings, Zap, Download } from 'lucide-react'

const steps = [
  {
    icon: Upload,
    title: 'Upload Your Video',
    description: 'Simply drag and drop your long-form video content into our secure platform.',
    color: 'from-primary-500 to-purple-500'
  },
  {
    icon: Settings,
    title: 'AI Analysis',
    description: 'Our AI analyzes your content to identify the most engaging moments and scenes.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Zap,
    title: 'Smart Processing',
    description: 'Advanced algorithms create optimized clips with perfect timing and quality.',
    color: 'from-pink-500 to-cyan-500'
  },
  {
    icon: Download,
    title: 'Download & Share',
    description: 'Get your professionally edited clips ready for all social media platforms.',
    color: 'from-cyan-500 to-primary-500'
  }
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How It{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Transform your content in just four simple steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-r ${step.color} flex items-center justify-center mx-auto mb-6`}>
                <step.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{step.title}</h3>
              <p className="text-white/70">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}