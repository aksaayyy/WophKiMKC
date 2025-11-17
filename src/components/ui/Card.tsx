'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'gradient'
  hover3d?: boolean
  glow?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', hover3d = true, glow = false, children, ...props }, ref) => {
    const baseClasses = 'rounded-2xl p-6 transition-all duration-500'
    
    const variants = {
      glass: 'glass shadow-3d',
      solid: 'bg-white/5 border border-white/10',
      gradient: 'bg-gradient-to-br from-white/10 to-white/5 border border-white/20'
    }

    const hoverClasses = hover3d ? 'hover:shadow-float hover:-translate-y-2' : ''
    const glowClasses = glow ? 'hover:shadow-glow' : ''

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          hoverClasses,
          glowClasses,
          className
        )}
        whileHover={hover3d ? { y: -8, rotateX: 5 } : undefined}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        {...(props as any)}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

export { Card }