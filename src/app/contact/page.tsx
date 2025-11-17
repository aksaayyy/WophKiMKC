'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageSquare, Phone, MapPin, Send, Clock, Users, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Get help with technical issues and account questions',
    contact: 'aksaayyy6@gmail.com',
    responseTime: '< 24 hours'
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Chat with our support team in real-time',
    contact: 'Available 9 AM - 6 PM EST',
    responseTime: '< 5 minutes'
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Speak directly with our team (Enterprise only)',
    contact: 'Schedule a call',
    responseTime: 'Same day'
  }
]

const offices = [
  {
    city: 'San Francisco',
    address: '123 Tech Street, SF, CA 94105',
    timezone: 'PST (UTC-8)'
  },
  {
    city: 'Remote First',
    address: 'We work from everywhere',
    timezone: 'Global Team'
  }
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setSubmitted(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

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
            Get in{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Touch
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Have questions? Need help? Want to share feedback? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Methods */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Contact Methods</h2>
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <method.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{method.title}</h3>
                      <p className="text-white/70 text-sm mb-3">{method.description}</p>
                      <div className="text-primary-400 font-medium mb-1">{method.contact}</div>
                      <div className="flex items-center text-xs text-white/60">
                        <Clock className="w-3 h-3 mr-1" />
                        {method.responseTime}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Office Locations */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">Our Locations</h3>
              <div className="space-y-4">
                {offices.map((office, index) => (
                  <Card key={office.city}>
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-primary-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="text-white font-medium">{office.city}</div>
                        <div className="text-white/70 text-sm">{office.address}</div>
                        <div className="text-white/60 text-xs">{office.timezone}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
              
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
                  <p className="text-white/70">
                    Thanks for reaching out. We'll get back to you within 24 hours.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Name *</label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Email *</label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">Subject *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      required
                    >
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing Question</option>
                      <option value="feature">Feature Request</option>
                      <option value="partnership">Partnership</option>
                      <option value="press">Press Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">Message *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us how we can help..."
                      rows={6}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 resize-none"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Card>
            <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <div className="flex items-center mb-3">
                  <Users className="w-5 h-5 text-primary-400 mr-2" />
                  <h3 className="text-white font-semibold">Account & Billing</h3>
                </div>
                <p className="text-white/70 text-sm">
                  Questions about your subscription, payments, or account settings.
                </p>
              </div>
              <div>
                <div className="flex items-center mb-3">
                  <Zap className="w-5 h-5 text-primary-400 mr-2" />
                  <h3 className="text-white font-semibold">Technical Support</h3>
                </div>
                <p className="text-white/70 text-sm">
                  Help with processing issues, API integration, or platform bugs.
                </p>
              </div>
              <div>
                <div className="flex items-center mb-3">
                  <MessageSquare className="w-5 h-5 text-primary-400 mr-2" />
                  <h3 className="text-white font-semibold">Feature Requests</h3>
                </div>
                <p className="text-white/70 text-sm">
                  Suggestions for new features or improvements to existing ones.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}