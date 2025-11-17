'use client'

import { HeroSection } from '@/components/sections/HeroSection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { HowItWorksSection } from '@/components/sections/HowItWorksSection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { CTASection } from '@/components/sections/CTASection'
import { ParticleBackground } from '@/components/3d/ParticleBackground'
import { useScrollToSection } from '@/hooks/useScrollToSection'

export default function HomePage() {
  // Initialize the scroll to section hook to handle hash navigation
  useScrollToSection()
  return (
    <div className="relative">
      <ParticleBackground />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* How It Works Section */}
      <HowItWorksSection />
      
      {/* Testimonials Section */}
      <TestimonialsSection />
      
      {/* CTA Section */}
      <CTASection />
    </div>
  )
}