'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Book, 
  Play, 
  Upload, 
  Settings, 
  Download, 
  Users, 
  CreditCard,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Lightbulb,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface GuideSection {
  id: string
  title: string
  icon: React.ComponentType<any>
  description: string
  items: GuideItem[]
}

interface GuideItem {
  title: string
  description: string
  type: 'tutorial' | 'tip' | 'warning' | 'info'
  content: React.ReactNode
  videoUrl?: string
  externalLink?: string
}

interface UserGuideProps {
  onClose?: () => void
}

export function UserGuide({ onClose }: UserGuideProps) {
  const [activeSection, setActiveSection] = useState<string>('getting-started')
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const sections: GuideSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Play,
      description: 'Learn the basics of Video Clipper Pro',
      items: [
        {
          title: 'Creating Your First Clip',
          description: 'Step-by-step guide to upload and process your first video',
          type: 'tutorial',
          content: (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-blue-200 font-medium mb-2">Quick Start Steps:</h4>
                <ol className="list-decimal list-inside space-y-2 text-white/80 text-sm">
                  <li>Go to the Process page</li>
                  <li>Upload your video file or paste a YouTube URL</li>
                  <li>Choose your platform (TikTok, Instagram, YouTube Shorts)</li>
                  <li>Select the number of clips you want</li>
                  <li>Click "Start Processing" and wait for results</li>
                </ol>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-green-200 text-sm">
                  💡 <strong>Pro Tip:</strong> Videos between 5-60 minutes work best for clip generation
                </p>
              </div>
            </div>
          )
        }
      ]
    }
  ]

  const activeGuideSection = sections.find(s => s.id === activeSection)

  const getTypeIcon = (type: GuideItem['type']) => {
    switch (type) {
      case 'tutorial':
        return <Play className="w-4 h-4 text-blue-400" />
      case 'tip':
        return <Lightbulb className="w-4 h-4 text-yellow-400" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'info':
        return <HelpCircle className="w-4 h-4 text-purple-400" />
    }
  }

  const getTypeColor = (type: GuideItem['type']) => {
    switch (type) {
      case 'tutorial':
        return 'border-blue-500/20 bg-blue-500/10'
      case 'tip':
        return 'border-yellow-500/20 bg-yellow-500/10'
      case 'warning':
        return 'border-red-500/20 bg-red-500/10'
      case 'info':
        return 'border-purple-500/20 bg-purple-500/10'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Book className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">User Guide</h1>
            <p className="text-white/60">Everything you need to know about Video Clipper Pro</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Close Guide
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <h3 className="text-lg font-semibold text-white mb-4">Sections</h3>
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <section.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{section.title}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeGuideSection && (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <activeGuideSection.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{activeGuideSection.title}</h2>
                      <p className="text-white/60 text-sm">{activeGuideSection.description}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {activeGuideSection.items.map((item, index) => {
                      const itemId = `${activeSection}-${index}`
                      const isExpanded = expandedItems.includes(itemId)

                      return (
                        <div key={itemId} className={`border rounded-lg ${getTypeColor(item.type)}`}>
                          <button
                            onClick={() => toggleItem(itemId)}
                            className="w-full flex items-center justify-between p-4 text-left"
                          >
                            <div className="flex items-center space-x-3">
                              {getTypeIcon(item.type)}
                              <div>
                                <h3 className="text-white font-medium">{item.title}</h3>
                                <p className="text-white/60 text-sm">{item.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {item.externalLink && (
                                <ExternalLink className="w-4 h-4 text-white/40" />
                              )}
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-white/60" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-white/60" />
                              )}
                            </div>
                          </button>
                          
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 pt-0 border-t border-white/10">
                                  {item.content}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}