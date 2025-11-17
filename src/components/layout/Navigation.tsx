'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Play, Sparkles, User, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useScrollToSection } from '@/hooks/useScrollToSection'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { name: 'Features', href: '/#features', isSection: true },
  { name: 'How it Works', href: '/#how-it-works', isSection: true },
  { name: 'YouTube Clipper', href: '/youtube', isSection: false },
  { name: 'Pricing', href: '/pricing', isSection: false },
  { name: 'Dashboard', href: '/dashboard', isSection: false },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { scrollToSection } = useScrollToSection()
  const { user, signOut, loading } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSectionClick = (href: string) => {
    const sectionId = href.replace('/#', '')
    scrollToSection(sectionId)
    setIsOpen(false) // Close mobile menu
  }

  const handleLinkClick = (href: string) => {
    // For regular links, we just close the mobile menu
    setIsOpen(false)
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-dark shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Play className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-pulse">
                <Sparkles className="w-2 h-2 text-white absolute top-0.5 left-0.5" />
              </div>
            </div>
            <span className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
              Video Clipper Pro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              item.isSection ? (
                <button
                  key={item.name}
                  onClick={() => handleSectionClick(item.href)}
                  className="text-white/80 hover:text-white transition-colors duration-300 relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary group-hover:w-full transition-all duration-300" />
                </button>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => handleLinkClick(item.href)}
                  className="text-white/80 hover:text-white transition-colors duration-300 relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary group-hover:w-full transition-all duration-300" />
                </Link>
              )
            ))}
          </div>

          {/* CTA Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg glass text-white hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm">{user.email?.split('@')[0] || 'User'}</span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 glass-dark rounded-lg shadow-lg border border-white/10 py-2"
                    >
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-white font-medium">{user.email || 'User'}</p>
                        <p className="text-white/60 text-sm capitalize">{(user as any).subscription_tier || 'free'} Plan</p>
                      </div>
                      
                      <Link
                        href="/dashboard"
                        className="flex items-center space-x-2 px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                        onClick={() => {
                          setShowUserMenu(false)
                          setIsOpen(false)
                        }}
                      >
                        <User className="w-4 h-4" />
                        <span>Dashboard</span>
                      </Link>
                      
                      <Link
                        href="/process"
                        className="flex items-center space-x-2 px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                        onClick={() => {
                          setShowUserMenu(false)
                          setIsOpen(false)
                        }}
                      >
                        <Play className="w-4 h-4" />
                        <span>Process Video</span>
                      </Link>
                      
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center space-x-2 px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                        onClick={() => {
                          setShowUserMenu(false)
                          setIsOpen(false)
                        }}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      
                      <button
                        onClick={() => {
                          signOut()
                          setShowUserMenu(false)
                          setIsOpen(false)
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="text-white hover:text-primary-400">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/login?mode=register" onClick={() => setIsOpen(false)}>
                  <Button className="btn-primary">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg glass text-white hover:bg-white/10 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-dark border-t border-white/10"
          >
            <div className="px-4 py-6 space-y-4">
              {navItems.map((item) => (
                item.isSection ? (
                  <button
                    key={item.name}
                    onClick={() => handleSectionClick(item.href)}
                    className="block text-white/80 hover:text-white transition-colors py-2 text-left w-full"
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block text-white/80 hover:text-white transition-colors py-2"
                  >
                    {item.name}
                  </Link>
                )
              ))}
              <div className="pt-4 space-y-3">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-white font-medium">{user.email || 'User'}</p>
                      <p className="text-white/60 text-sm capitalize">{(user as any).subscription_tier || 'free'} Plan</p>
                    </div>
                    
                    <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full text-white justify-start">
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    
                    <Link href="/process" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full text-white justify-start">
                        <Play className="w-4 h-4 mr-2" />
                        Process Video
                      </Button>
                    </Link>
                    
                    <Link href="/dashboard/settings" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full text-white justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                    
                    <Button
                      variant="ghost"
                      className="w-full text-white justify-start"
                      onClick={() => {
                        signOut()
                        setIsOpen(false)
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full text-white">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/login?mode=register" onClick={() => setIsOpen(false)}>
                      <Button className="w-full btn-primary">
                        Get Started Free
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}