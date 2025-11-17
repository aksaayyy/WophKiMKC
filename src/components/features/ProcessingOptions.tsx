'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Zap, Users, Globe, Play, Scissors } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ProcessingOptionsProps {
  file: File
  onStartProcessing: (config: any) => void
}

const qualityPresets = [
  { id: 'standard', name: 'Standard', description: 'Good quality, fast processing', icon: Zap },
  { id: 'high', name: 'High Quality', description: 'Enhanced quality, moderate speed', icon: Settings },
  { id: 'premium', name: 'Premium', description: 'Best quality, AI enhanced', icon: Users }
]

const platforms = [
  { id: 'youtube', name: 'YouTube Shorts', color: 'from-red-500 to-red-600' },
  { id: 'tiktok', name: 'TikTok', color: 'from-pink-500 to-purple-600' },
  { id: 'instagram', name: 'Instagram Reels', color: 'from-purple-500 to-pink-500' },
  { id: 'twitter', name: 'Twitter', color: 'from-blue-400 to-blue-600' }
]

export function ProcessingOptions({ file, onStartProcessing }: ProcessingOptionsProps) {
  const [selectedQuality, setSelectedQuality] = useState('standard')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['youtube'])
  const [clipCount, setClipCount] = useState(5)
  const [aiEnhancement, setAiEnhancement] = useState(true)
  const [autoCaption, setAutoCaption] = useState(false)
  const [minClipLength, setMinClipLength] = useState(15) // seconds
  const [maxClipLength, setMaxClipLength] = useState(60) // seconds

  const handleStartProcessing = () => {
    const config = {
      quality: selectedQuality,
      platforms: selectedPlatforms,
      clipCount,
      aiEnhancement,
      autoCaption,
      minClipLength,
      maxClipLength
    }
    onStartProcessing(config)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Video Preview */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-xl font-semibold text-white mb-4">Video Preview</h3>
            <div className="aspect-video bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center mb-4">
              <Play className="w-16 h-16 text-white/60" />
            </div>
            <div className="space-y-2 text-sm text-white/80">
              <div className="flex justify-between">
                <span>File:</span>
                <span>{file.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span>{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>~5:42</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Configuration Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quality Preset */}
          <Card>
            <h3 className="text-xl font-semibold text-white mb-6">Quality Preset</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {qualityPresets.map((preset) => (
                <motion.div
                  key={preset.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedQuality === preset.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  onClick={() => setSelectedQuality(preset.id)}
                >
                  <preset.icon className="w-8 h-8 text-primary-400 mb-3" />
                  <h4 className="text-white font-semibold mb-1">{preset.name}</h4>
                  <p className="text-white/60 text-sm">{preset.description}</p>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Platform Selection */}
          <Card>
            <h3 className="text-xl font-semibold text-white mb-6">Target Platforms</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {platforms.map((platform) => (
                <motion.div
                  key={platform.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  onClick={() => {
                    if (selectedPlatforms.includes(platform.id)) {
                      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id))
                    } else {
                      setSelectedPlatforms([...selectedPlatforms, platform.id])
                    }
                  }}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${platform.color} mb-3`} />
                  <h4 className="text-white font-semibold">{platform.name}</h4>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Clip Length Customization */}
          <Card>
            <h3 className="text-xl font-semibold text-white mb-6">Clip Length Settings</h3>
            <div className="space-y-6">
              {/* Min Clip Length */}
              <div>
                <label className="block text-white/80 mb-2">Minimum Clip Length: {minClipLength} seconds</label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={minClipLength}
                  onChange={(e) => setMinClipLength(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-sm text-white/60 mt-1">
                  <span>5s</span>
                  <span>30s</span>
                </div>
              </div>

              {/* Max Clip Length */}
              <div>
                <label className="block text-white/80 mb-2">Maximum Clip Length: {maxClipLength} seconds</label>
                <input
                  type="range"
                  min="30"
                  max="120"
                  value={maxClipLength}
                  onChange={(e) => setMaxClipLength(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-sm text-white/60 mt-1">
                  <span>30s</span>
                  <span>120s</span>
                </div>
              </div>

              <div className="text-white/60 text-sm">
                <Scissors className="w-4 h-4 inline mr-1" />
                Clips will be between {minClipLength}-{maxClipLength} seconds long
              </div>
            </div>
          </Card>

          {/* Advanced Options */}
          <Card>
            <h3 className="text-xl font-semibold text-white mb-6">Advanced Options</h3>
            <div className="space-y-6">
              {/* Clip Count */}
              <div>
                <label className="block text-white/80 mb-2">Number of Clips: {clipCount}</label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={clipCount}
                  onChange={(e) => setClipCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-sm text-white/60 mt-1">
                  <span>3</span>
                  <span>10</span>
                </div>
              </div>

              {/* Toggle Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">AI Enhancement</h4>
                    <p className="text-white/60 text-sm">Automatic quality improvement</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      aiEnhancement ? 'bg-primary-500' : 'bg-white/20'
                    }`}
                    onClick={() => setAiEnhancement(!aiEnhancement)}
                  >
                    <motion.div
                      className="w-5 h-5 bg-white rounded-full"
                      animate={{ x: aiEnhancement ? 26 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Auto Captions</h4>
                    <p className="text-white/60 text-sm">Generate captions automatically</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      autoCaption ? 'bg-primary-500' : 'bg-white/20'
                    }`}
                    onClick={() => setAutoCaption(!autoCaption)}
                  >
                    <motion.div
                      className="w-5 h-5 bg-white rounded-full"
                      animate={{ x: autoCaption ? 26 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>
              </div>
            </div>
          </Card>

          {/* Start Processing Button */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={handleStartProcessing}
              disabled={selectedPlatforms.length === 0}
              className="w-full sm:w-auto"
            >
              Start Processing
            </Button>
            <p className="text-white/60 text-sm mt-2">
              Estimated processing time: 2-5 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}