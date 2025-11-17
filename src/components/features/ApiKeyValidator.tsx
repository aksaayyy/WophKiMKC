'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Key, Check, X, Loader, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ApiKeyValidatorProps {
  onValidKey?: (key: string) => void
}

export function ApiKeyValidator({ onValidKey }: ApiKeyValidatorProps) {
  const [apiKey, setApiKey] = useState('')
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle')
  const [keyInfo, setKeyInfo] = useState<any>(null)

  const validateApiKey = async () => {
    if (!apiKey.trim()) return

    setValidationStatus('validating')
    
    try {
      // Call real API endpoint
      const response = await fetch(`/api/v1/keys?key=${encodeURIComponent(apiKey)}`)
      const data = await response.json()
      
      if (response.ok) {
        setValidationStatus('valid')
        setKeyInfo({
          tier: data.plan.charAt(0).toUpperCase() + data.plan.slice(1),
          requests_remaining: data.requests_remaining,
          requests_limit: data.requests_limit,
          expires_at: new Date(data.expires_at).toLocaleDateString(),
          created_at: new Date(data.created_at).toLocaleDateString()
        })
        onValidKey?.(apiKey)
      } else {
        setValidationStatus('invalid')
        setKeyInfo(null)
      }
    } catch (error) {
      console.error('API validation error:', error)
      setValidationStatus('invalid')
      setKeyInfo(null)
    }
  }

  const getStatusIcon = () => {
    switch (validationStatus) {
      case 'validating':
        return <Loader className="w-5 h-5 text-blue-400 animate-spin" />
      case 'valid':
        return <Check className="w-5 h-5 text-green-400" />
      case 'invalid':
        return <X className="w-5 h-5 text-red-400" />
      default:
        return <Key className="w-5 h-5 text-white/60" />
    }
  }

  const getStatusColor = () => {
    switch (validationStatus) {
      case 'valid':
        return 'border-green-500/50 bg-green-500/10'
      case 'invalid':
        return 'border-red-500/50 bg-red-500/10'
      case 'validating':
        return 'border-blue-500/50 bg-blue-500/10'
      default:
        return 'border-white/20'
    }
  }

  return (
    <Card className={`transition-all duration-300 ${getStatusColor()}`}>
      <div className="flex items-center space-x-3 mb-4">
        {getStatusIcon()}
        <h3 className="text-lg font-semibold text-white">API Key Validation</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Enter your API key (e.g., vcp_...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="font-mono"
          />
          <Button 
            onClick={validateApiKey}
            disabled={validationStatus === 'validating' || !apiKey.trim()}
          >
            {validationStatus === 'validating' ? 'Validating...' : 'Validate'}
          </Button>
        </div>

        {validationStatus === 'valid' && keyInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/30 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2 mb-3">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-medium">Valid API Key</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/60">Plan:</span>
                <span className="text-white ml-2 font-medium">{keyInfo.tier}</span>
              </div>
              <div>
                <span className="text-white/60">Requests:</span>
                <span className="text-white ml-2">{keyInfo.requests_remaining}/{keyInfo.requests_limit}</span>
              </div>
              <div>
                <span className="text-white/60">Created:</span>
                <span className="text-white ml-2">{keyInfo.created_at}</span>
              </div>
              <div>
                <span className="text-white/60">Expires:</span>
                <span className="text-white ml-2">{keyInfo.expires_at}</span>
              </div>
            </div>
          </motion.div>
        )}

        {validationStatus === 'invalid' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-medium">Invalid API Key</span>
            </div>
            <p className="text-white/60 text-sm mt-2">
              Please check your API key format. It should start with 'vcp_' and be at least 20 characters long.
            </p>
          </motion.div>
        )}
      </div>
    </Card>
  )
}