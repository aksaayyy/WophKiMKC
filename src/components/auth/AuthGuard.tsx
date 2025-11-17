'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { motion } from 'framer-motion'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, fallback, redirectTo = '/auth/login' }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
              className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Lock className="w-8 h-8 text-white" />
            </motion.div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              Authentication Required
            </h1>
            <p className="text-white/80 mb-8">
              You need to sign in to access this feature. Create an account or sign in to continue.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => router.push('/auth/login?mode=register')}
                className="btn-primary"
              >
                Create Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="secondary"
                onClick={() => router.push('/auth/login')}
              >
                Sign In
              </Button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-white/60 text-sm">
                New to Video Clipper Pro? 
                <button 
                  onClick={() => router.push('/')}
                  className="text-primary-400 hover:text-primary-300 ml-1 underline"
                >
                  Learn more about our features
                </button>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}