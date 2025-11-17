'use client'

import { motion } from 'framer-motion'
import { Users, Target, Zap, Heart, Award, Globe } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const stats = [
  { label: 'Videos Processed', value: '1M+', icon: Zap },
  { label: 'Happy Creators', value: '10K+', icon: Users },
  { label: 'Countries Served', value: '50+', icon: Globe },
  { label: 'Uptime', value: '99.9%', icon: Award }
]

const team = [
  {
    name: 'aksaayyyNova',
    role: 'Founder & CEO',
    bio: 'Passionate about democratizing video creation with AI technology.',
    avatar: '👨‍💻'
  },
  {
    name: 'AI Team',
    role: 'Machine Learning Engineers',
    bio: 'Building the next generation of video processing algorithms.',
    avatar: '🤖'
  },
  {
    name: 'Community',
    role: 'Content Creators',
    bio: 'Our amazing community of creators who inspire us every day.',
    avatar: '🎨'
  }
]

const values = [
  {
    icon: Target,
    title: 'Innovation First',
    description: 'We push the boundaries of what\'s possible with AI and video technology.'
  },
  {
    icon: Users,
    title: 'Creator-Focused',
    description: 'Every feature we build is designed with creators\' needs in mind.'
  },
  {
    icon: Heart,
    title: 'Community Driven',
    description: 'We listen to our community and build based on real feedback.'
  },
  {
    icon: Zap,
    title: 'Speed & Quality',
    description: 'Fast processing without compromising on output quality.'
  }
]

export default function AboutPage() {
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
            About{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Video Clipper Pro
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            We're on a mission to democratize video creation by making professional-quality 
            video editing accessible to everyone through the power of AI.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <Card key={stat.label} className="text-center">
              <stat.icon className="w-8 h-8 text-primary-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-white/60">{stat.label}</div>
            </Card>
          ))}
        </motion.div>

        {/* Story */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-white/80">
                <p>
                  Video Clipper Pro was born from a simple frustration: creating engaging short-form 
                  content was taking too long and required expensive tools that most creators couldn't afford.
                </p>
                <p>
                  We saw content creators spending hours manually editing long videos into clips, 
                  often missing the best moments and struggling with technical complexity. 
                  There had to be a better way.
                </p>
                <p>
                  That's when we decided to harness the power of AI to automate the entire process. 
                  Our advanced algorithms can analyze hours of content in minutes, identify the most 
                  engaging moments, and create platform-optimized clips automatically.
                </p>
                <p>
                  Today, Video Clipper Pro helps thousands of creators worldwide turn their long-form 
                  content into viral short clips, saving time and increasing their reach across all platforms.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                <div className="text-6xl">🎬</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={value.title}>
                <value.icon className="w-8 h-8 text-primary-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-3">{value.title}</h3>
                <p className="text-white/70">{value.description}</p>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Meet the Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={member.name} className="text-center">
                <div className="text-6xl mb-4">{member.avatar}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{member.name}</h3>
                <div className="text-primary-400 mb-3">{member.role}</div>
                <p className="text-white/70">{member.bio}</p>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Card>
            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-6">
              To empower every creator with AI-powered tools that make professional video editing 
              accessible, fast, and affordable. We believe great content shouldn't be limited by 
              technical barriers or expensive software.
            </p>
            <div className="text-4xl">🚀</div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}