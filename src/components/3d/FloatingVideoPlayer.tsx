'use client'

import { useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Play, Pause, Volume2, Maximize } from 'lucide-react'

interface FloatingVideoPlayerProps {
  className?: string
}

export function FloatingVideoPlayer({ className }: FloatingVideoPlayerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springX = useSpring(x, { stiffness: 300, damping: 30 })
  const springY = useSpring(y, { stiffness: 300, damping: 30 })
  
  const rotateX = useTransform(springY, [-100, 100], [10, -10])
  const rotateY = useTransform(springX, [-100, 100], [-10, 10])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!ref.current) return
      
      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      x.set((event.clientX - centerX) / 5)
      y.set((event.clientY - centerY) / 5)
    }

    const handleMouseLeave = () => {
      x.set(0)
      y.set(0)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [x, y])

  return (
    <motion.div
      ref={ref}
      className={`relative perspective-1000 ${className}`}
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      <motion.div
        className="relative transform-3d"
        style={{
          rotateX,
          rotateY,
          x: springX,
          y: springY,
        }}
      >
        {/* Main video container */}
        <div className="relative w-full max-w-2xl mx-auto">
          {/* Glass container */}
          <div className="glass rounded-3xl p-4 shadow-float">
            {/* Video screen */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden">
              {/* Video content */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-purple-500/20 to-cyan-500/20">
                {/* Simulated video frames */}
                <div className="absolute inset-4 grid grid-cols-3 gap-2">
                  {[...Array(9)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="bg-white/10 rounded-lg"
                      animate={{
                        opacity: [0.3, 0.8, 0.3],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.button
                    className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group hover:bg-white/30 transition-all duration-300"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="w-8 h-8 text-white ml-1 group-hover:scale-110 transition-transform" fill="currentColor" />
                  </motion.button>
                </div>
                
                {/* Progress bar */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/20 rounded-full h-1 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary-500 to-cyan-500"
                      initial={{ width: '0%' }}
                      animate={{ width: '60%' }}
                      transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-3">
                    <button className="hover:scale-110 transition-transform">
                      <Play className="w-5 h-5" />
                    </button>
                    <button className="hover:scale-110 transition-transform">
                      <Volume2 className="w-5 h-5" />
                    </button>
                    <span className="text-sm">2:34 / 5:42</span>
                  </div>
                  <button className="hover:scale-110 transition-transform">
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Processing indicators */}
            <div className="mt-4 flex items-center justify-between text-white/80 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>AI Processing Active</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-primary-500 rounded-full" />
                  <span>4K Enhanced</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-purple-500 rounded-full" />
                  <span>Auto Clips</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-cyan-500 rounded-full" />
                  <span>Smart Audio</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Floating elements */}
          <motion.div
            className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full flex items-center justify-center"
            animate={{
              y: [0, -10, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="w-3 h-3 bg-white rounded-full" />
          </motion.div>
          
          <motion.div
            className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-r from-cyan-500 to-primary-500 rounded-2xl opacity-80"
            animate={{
              rotate: [0, -180, -360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          
          {/* Shadow */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-3/4 h-8 bg-black/20 rounded-full blur-xl" />
        </div>
      </motion.div>
    </motion.div>
  )
}