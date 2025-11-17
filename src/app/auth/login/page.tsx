'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AuthForm } from '@/components/features/AuthForm'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check URL parameters for mode
    const urlMode = searchParams.get('mode')
    if (urlMode === 'register') {
      setMode('register')
    }
  }, [searchParams])

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AuthForm
            mode={mode}
            onModeChange={setMode}
            onSuccess={() => router.push('/dashboard')}
          />
        </motion.div>
      </div>
    </div>
  )
}