'use client'

import { ReactNode } from 'react'
import { Toaster } from '@/components/ui/toast'
import { AuthProvider } from '@/hooks/useAuth'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  )
}