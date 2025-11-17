'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useScrollToSection() {
  const router = useRouter()

  const scrollToSection = (sectionId: string) => {
    // First check if we're already on the homepage
    if (window.location.pathname === '/') {
      // We're on the homepage, scroll to the section directly
      const element = document.getElementById(sectionId)
      if (element) {
        // Add offset for fixed header (adjust the -80 value based on your header height)
        const headerOffset = 80
        const elementPosition = element.offsetTop - headerOffset
        
        window.scrollTo({
          top: elementPosition,
          behavior: 'smooth'
        })
      }
    } else {
      // We're on a different page, navigate to homepage with hash first
      router.push(`/#${sectionId}`)
      
      // Then scroll to the section after a delay to ensure page load
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          const headerOffset = 80
          const elementPosition = element.offsetTop - headerOffset
          
          window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
          })
        }
      }, 1000) // Increased delay to ensure all components are loaded
    }
  }

  // Handle hash navigation when the page loads
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const sectionId = hash.replace('#', '')
      // Wait for components to mount
      const timer = setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          const headerOffset = 80
          const elementPosition = element.offsetTop - headerOffset
          
          window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
          })
        }
      }, 500) // Delay to ensure all components are loaded
      
      return () => clearTimeout(timer)
    }
  }, [])

  return { scrollToSection }
}