'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MapPin, Clock, Users, Zap, Heart, Globe, Code, Palette, BarChart3, Headphones } from 'lucide-react'
import Link from 'next/link'

const perks = [
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Remote First',
    description: 'Work from anywhere in the world with flexible hours'
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Health & Wellness',
    description: 'Comprehensive health insurance and wellness stipend'
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Learning Budget',
    description: '$2000 annual budget for courses, conferences, and books'
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Equity Package',
    description: 'Own a piece of the company with competitive equity'
  }
]

const openPositions = [
  {
    id: 1,
    title: 'Senior Full Stack Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    icon: <Code className="w-6 h-6" />,
    description: 'Build scalable video processing infrastructure and user-facing features using React, Node.js, and AI/ML technologies.',
    requirements: [
      '5+ years of full-stack development experience',
      'Experience with React, Node.js, and TypeScript',
      'Knowledge of video processing and FFmpeg',
      'Experience with cloud platforms (AWS/GCP)',
      'Understanding of AI/ML concepts'
    ]
  },
  {
    id: 2,
    title: 'AI/ML Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    icon: <Zap className="w-6 h-6" />,
    description: 'Develop and optimize machine learning models for video analysis, content detection, and automated clipping.',
    requirements: [
      'PhD or Masters in Computer Science, AI, or related field',
      'Experience with PyTorch, TensorFlow, or similar frameworks',
      'Computer vision and video processing expertise',
      'Experience with model deployment and optimization',
      'Knowledge of transformer architectures'
    ]
  },
  {
    id: 3,
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    icon: <Palette className="w-6 h-6" />,
    description: 'Design intuitive user experiences for creators and shape the future of video editing tools.',
    requirements: [
      '4+ years of product design experience',
      'Proficiency in Figma and design systems',
      'Experience with video/media applications',
      'Strong understanding of user research',
      'Portfolio showcasing complex product work'
    ]
  },
  {
    id: 4,
    title: 'Growth Marketing Manager',
    department: 'Marketing',
    location: 'Remote',
    type: 'Full-time',
    icon: <BarChart3 className="w-6 h-6" />,
    description: 'Drive user acquisition and retention through data-driven marketing strategies and creative campaigns.',
    requirements: [
      '3+ years of growth marketing experience',
      'Experience with SaaS or creator tools',
      'Proficiency in analytics tools and A/B testing',
      'Content marketing and social media expertise',
      'Understanding of creator economy trends'
    ]
  },
  {
    id: 5,
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'Remote',
    type: 'Full-time',
    icon: <Headphones className="w-6 h-6" />,
    description: 'Help creators succeed with Video Clipper Pro and build lasting relationships with our community.',
    requirements: [
      '2+ years of customer success experience',
      'Experience with creator tools or media software',
      'Excellent communication and problem-solving skills',
      'Understanding of video content creation',
      'Passion for helping creators grow'
    ]
  }
]

const values = [
  {
    title: 'Creator First',
    description: 'Every decision we make starts with how it impacts creators and their success.'
  },
  {
    title: 'Innovation',
    description: 'We push the boundaries of what\'s possible with AI and video technology.'
  },
  {
    title: 'Transparency',
    description: 'Open communication, honest feedback, and clear expectations for everyone.'
  },
  {
    title: 'Quality',
    description: 'We ship fast but never compromise on the quality of our products or code.'
  }
]

export default function Careers() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Join Our Mission
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Help us democratize video creation with AI. We're building the future of content creation 
            and looking for passionate people to join our remote-first team.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-6 text-white/80"
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>15+ Team Members</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span>8 Countries</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span>1M+ Videos Processed</span>
            </div>
          </motion.div>
        </div>

        {/* Company Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 h-full">
                  <h3 className="text-lg font-semibold text-white mb-3">{value.title}</h3>
                  <p className="text-gray-300 text-sm">{value.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Perks & Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Why Work With Us</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map((perk, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center">
                  <div className="text-purple-400 mb-4 flex justify-center">
                    {perk.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{perk.title}</h3>
                  <p className="text-gray-300 text-sm">{perk.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Open Positions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Open Positions</h2>
          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-purple-400 mt-1">
                          {position.icon}
                        </div>
                        <div>
                          <h3 className="text-2xl font-semibold text-white mb-2">{position.title}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-4">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{position.department}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{position.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{position.type}</span>
                            </div>
                          </div>
                          <p className="text-gray-200 mb-4">{position.description}</p>
                          
                          <div>
                            <h4 className="text-white font-semibold mb-2">Requirements:</h4>
                            <ul className="text-gray-300 text-sm space-y-1">
                              {position.requirements.map((req, reqIndex) => (
                                <li key={reqIndex} className="flex items-start gap-2">
                                  <span className="text-purple-400 mt-1">•</span>
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:ml-6">
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 w-full lg:w-auto">
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Application Process */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Hiring Process</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Application', description: 'Submit your application and portfolio' },
              { step: '2', title: 'Screening', description: 'Initial call with our team' },
              { step: '3', title: 'Technical', description: 'Technical interview or design challenge' },
              { step: '4', title: 'Final', description: 'Meet the team and culture fit' }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-300 text-sm">{step.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm border-white/20 p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Don't See Your Role?</h3>
            <p className="text-gray-300 mb-6">
              We're always looking for talented people to join our team. Send us your resume and tell us how you'd like to contribute to Video Clipper Pro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3">
                  Get In Touch
                </Button>
              </Link>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-3">
                View All Benefits
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}