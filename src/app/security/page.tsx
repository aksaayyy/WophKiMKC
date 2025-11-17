'use client'

import { motion } from 'framer-motion'
import { Shield, Lock, Eye, Server, Key, Award, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const securityFeatures = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'All data is encrypted using AES-256 encryption in transit and at rest',
    details: [
      'TLS 1.3 for data in transit',
      'AES-256-GCM for data at rest',
      'Perfect Forward Secrecy',
      'HSTS enforcement'
    ],
    status: 'Implemented'
  },
  {
    icon: Key,
    title: 'API Security',
    description: 'Robust authentication and authorization mechanisms',
    details: [
      'JWT-based authentication',
      'Rate limiting per API key',
      'IP whitelisting available',
      'Scope-based permissions'
    ],
    status: 'Implemented'
  },
  {
    icon: Server,
    title: 'Infrastructure Security',
    description: 'Enterprise-grade cloud infrastructure with multiple security layers',
    details: [
      'AWS VPC with private subnets',
      'WAF protection against attacks',
      'DDoS mitigation',
      'Regular security patches'
    ],
    status: 'Implemented'
  },
  {
    icon: Eye,
    title: 'Monitoring & Logging',
    description: 'Comprehensive security monitoring and incident response',
    details: [
      '24/7 security monitoring',
      'Automated threat detection',
      'Audit logs for all actions',
      'Real-time alerting'
    ],
    status: 'Implemented'
  }
]

const certifications = [
  {
    name: 'SOC 2 Type II',
    status: 'In Progress',
    description: 'Security, availability, and confidentiality controls',
    expectedDate: 'Q2 2025'
  },
  {
    name: 'ISO 27001',
    status: 'Planned',
    description: 'Information security management system',
    expectedDate: 'Q4 2025'
  },
  {
    name: 'GDPR Compliant',
    status: 'Certified',
    description: 'European data protection regulation compliance',
    expectedDate: 'Current'
  },
  {
    name: 'CCPA Compliant',
    status: 'Certified',
    description: 'California Consumer Privacy Act compliance',
    expectedDate: 'Current'
  }
]

const securityPractices = [
  'Regular penetration testing by third-party security firms',
  'Automated vulnerability scanning and dependency checks',
  'Multi-factor authentication for all administrative access',
  'Zero-trust network architecture implementation',
  'Regular security training for all team members',
  'Incident response plan with 24-hour notification',
  'Data backup and disaster recovery procedures',
  'Secure development lifecycle (SDLC) practices'
]

export default function SecurityPage() {
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
              Security
            </span>{' '}
            First
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Your data security is our top priority. Learn about our comprehensive security measures and compliance standards.
          </p>
        </motion.div>

        {/* Security Overview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <Card>
            <div className="flex items-start space-x-4">
              <Shield className="w-12 h-12 text-primary-400 mt-2" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Enterprise-Grade Security</h2>
                <p className="text-white/80 mb-6 leading-relaxed">
                  Video Clipper Pro implements multiple layers of security to protect your data and ensure 
                  the integrity of our services. From encryption to access controls, we follow industry 
                  best practices and maintain compliance with major security standards.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
                    <div className="text-white font-medium">99.9% Uptime</div>
                    <div className="text-white/60 text-sm">Reliable and secure</div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <Lock className="w-6 h-6 text-blue-400 mb-2" />
                    <div className="text-white font-medium">256-bit Encryption</div>
                    <div className="text-white/60 text-sm">Military-grade security</div>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <Eye className="w-6 h-6 text-purple-400 mb-2" />
                    <div className="text-white font-medium">24/7 Monitoring</div>
                    <div className="text-white/60 text-sm">Continuous protection</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Security Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Security Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      {feature.status}
                    </span>
                  </div>
                  <p className="text-white/80 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-center text-sm text-white/70">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Security Standards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <Card>
            <h2 className="text-2xl font-bold text-white mb-6">Industry-Leading Security Standards</h2>
            <p className="text-white/80 mb-6">
              We implement multiple layers of security protection using industry best practices and cutting-edge technology to keep your data safe.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-3">Authentication & Authorization</h3>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li>• Multi-factor authentication support</li>
                  <li>• Role-based access controls</li>
                  <li>• Session management and timeout</li>
                  <li>• API key security with scoped permissions</li>
                </ul>
              </div>
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-3">Data Protection</h3>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li>• End-to-end encryption for all data</li>
                  <li>• Secure data transmission protocols</li>
                  <li>• Automated data backup and recovery</li>
                  <li>• Privacy-first architecture design</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Certifications & Compliance</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <Card key={cert.name}>
                <div className="text-center">
                  <Award className="w-8 h-8 text-primary-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">{cert.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium mb-3 inline-block ${
                    cert.status === 'Certified' ? 'bg-green-500/20 text-green-400' :
                    cert.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {cert.status}
                  </span>
                  <p className="text-white/70 text-sm mb-2">{cert.description}</p>
                  <p className="text-white/60 text-xs">{cert.expectedDate}</p>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Security Practices */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <Card>
            <h2 className="text-2xl font-bold text-white mb-6">Security Practices</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {securityPractices.map((practice, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">{practice}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Incident Response */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-16"
        >
          <Card>
            <div className="flex items-start space-x-4">
              <AlertTriangle className="w-8 h-8 text-yellow-400 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Incident Response</h2>
                <p className="text-white/80 mb-6">
                  In the unlikely event of a security incident, we have a comprehensive response plan:
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-white font-semibold mb-2">Detection</h3>
                    <p className="text-white/70 text-sm">
                      Automated monitoring systems detect anomalies within minutes
                    </p>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Response</h3>
                    <p className="text-white/70 text-sm">
                      Immediate containment and investigation by our security team
                    </p>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Communication</h3>
                    <p className="text-white/70 text-sm">
                      Transparent communication with affected users within 24 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Contact Security Team */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <div className="text-center">
              <Shield className="w-12 h-12 text-primary-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Security Questions?</h2>
              <p className="text-white/80 mb-6">
                Have security questions or want to report a vulnerability? Our security team is here to help.
              </p>
              <div className="space-y-2 text-white/70">
                <p>Security Team: <span className="text-primary-400">security@videoclipperpro.com</span></p>
                <p>Bug Bounty: <span className="text-primary-400">bounty@videoclipperpro.com</span></p>
                <p>PGP Key: <span className="text-primary-400">Download Public Key</span></p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}