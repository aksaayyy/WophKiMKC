'use client'

import { motion } from 'framer-motion'
import { FileText, Scale, Shield, AlertTriangle, Users, Mail } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const sections = [
  {
    icon: Users,
    title: 'Acceptance of Terms',
    content: `By accessing and using Video Clipper Pro, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
  },
  {
    icon: Shield,
    title: 'Use License',
    content: `Permission is granted to temporarily download one copy of Video Clipper Pro per device for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose or for any public display; attempt to reverse engineer any software contained on the website; remove any copyright or other proprietary notations from the materials.`
  },
  {
    icon: FileText,
    title: 'User Content',
    content: `You retain ownership of any intellectual property rights that you hold in content you upload to our service. When you upload content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, adapt, publish, translate and distribute it in any media for the purpose of providing our services. You represent and warrant that you have all necessary rights to grant us this license.`
  },
  {
    icon: AlertTriangle,
    title: 'Prohibited Uses',
    content: `You may not use our service: for any unlawful purpose or to solicit others to perform unlawful acts; to violate any international, federal, provincial or state regulations, rules, laws, or local ordinances; to infringe upon or violate our intellectual property rights or the intellectual property rights of others; to harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate; to submit false or misleading information; to upload or transmit viruses or any other type of malicious code.`
  }
]

const additionalTerms = [
  {
    title: 'Service Availability',
    content: 'We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be announced in advance.'
  },
  {
    title: 'Payment Terms',
    content: 'Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law.'
  },
  {
    title: 'Data Retention',
    content: 'Uploaded videos are automatically deleted after 30 days. Processed clips are available for download for 7 days after completion.'
  },
  {
    title: 'API Usage',
    content: 'API usage is subject to rate limits and fair use policies. Excessive usage may result in temporary suspension of service.'
  },
  {
    title: 'Intellectual Property',
    content: 'All software, algorithms, and proprietary technology remain the exclusive property of Video Clipper Pro.'
  },
  {
    title: 'Termination',
    content: 'We may terminate or suspend your account immediately for violations of these terms or for any other reason at our sole discretion.'
  }
]

export default function TermsPage() {
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
            Terms of{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Service
            </span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-4">
            Please read these terms carefully before using Video Clipper Pro.
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
              <Scale className="w-8 h-8 text-primary-400 mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-white mb-3">Agreement Overview</h2>
                <p className="text-white/80 leading-relaxed">
                  These Terms of Service ("Terms") govern your use of Video Clipper Pro's website, 
                  services, and API (collectively, the "Service") operated by Video Clipper Pro ("us", "we", or "our"). 
                  By using our Service, you agree to these Terms.
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
                    <p className="text-white/80 leading-relaxed">{section.content}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Terms */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <Card>
            <h2 className="text-xl font-semibold text-white mb-6">Additional Terms and Conditions</h2>
            <div className="space-y-6">
              {additionalTerms.map((term, index) => (
                <div key={term.title} className="border-l-2 border-primary-500/30 pl-4">
                  <h3 className="text-white font-medium mb-2">{term.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{term.content}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Limitation of Liability */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-12"
        >
          <Card>
            <h2 className="text-xl font-semibold text-white mb-4">Limitation of Liability</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-white/80 text-sm">
                  In no event shall Video Clipper Pro, nor its directors, employees, partners, agents, 
                  suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, 
                  or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
                  or other intangible losses, resulting from your use of the service.
                </p>
              </div>
            </div>
            <p className="text-white/70 text-sm">
              Some jurisdictions do not allow the exclusion of certain warranties or the exclusion or 
              limitation of liability for consequential or incidental damages, so the limitations above 
              may not apply to you.
            </p>
          </Card>
        </motion.div>

        {/* Changes to Terms */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mb-12"
        >
          <Card>
            <h2 className="text-xl font-semibold text-white mb-4">Changes to Terms</h2>
            <p className="text-white/80 mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
              If a revision is material, we will try to provide at least 30 days notice prior to any new 
              terms taking effect.
            </p>
            <p className="text-white/70 text-sm">
              What constitutes a material change will be determined at our sole discretion. By continuing 
              to access or use our Service after those revisions become effective, you agree to be bound 
              by the revised terms.
            </p>
          </Card>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Card>
            <div className="flex items-start space-x-4">
              <Mail className="w-8 h-8 text-primary-400 mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-white mb-3">Questions About These Terms?</h2>
                <p className="text-white/80 mb-4">
                  If you have any questions about these Terms of Service, please contact us.
                </p>
                <div className="space-y-2 text-white/70">
                  <p>Email: <span className="text-primary-400">aksaayyy6@gmail.com</span></p>
                  <p>Legal: <span className="text-primary-400">legal@videoclipperpro.com</span></p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}