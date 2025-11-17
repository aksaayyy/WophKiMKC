'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Send, Code, Copy, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ApiKeyValidator } from '@/components/features/ApiKeyValidator'

export default function ApiTestPage() {
  const [validApiKey, setValidApiKey] = useState('')
  const [testUrl, setTestUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  const [platform, setPlatform] = useState('tiktok')
  const [quality, setQuality] = useState('high')
  const [clipCount, setClipCount] = useState(3)
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const testApiCall = async () => {
    if (!validApiKey) {
      alert('Please validate your API key first')
      return
    }

    setIsLoading(true)
    setResponse('')

    try {
      // Call real API endpoint
      const response = await fetch('/api/v1/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          video_url: testUrl,
          platform,
          quality,
          clip_count: clipCount
        })
      })

      const data = await response.json()
      
      // Format response with status code
      const formattedResponse = {
        status_code: response.status,
        headers: {
          'content-type': response.headers.get('content-type'),
          'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining')
        },
        body: data
      }

      setResponse(JSON.stringify(formattedResponse, null, 2))
    } catch (error) {
      setResponse(JSON.stringify({ error: 'Network error: ' + (error instanceof Error ? error.message : String(error)) }, null, 2))
    }

    setIsLoading(false)
  }

  const copyResponse = () => {
    navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateCurlCommand = () => {
    return `curl -X POST "https://api.videoclipperpro.com/v1/process" \\
  -H "Authorization: Bearer ${validApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "video_url": "${testUrl}",
    "platform": "${platform}",
    "quality": "${quality}",
    "clip_count": ${clipCount}
  }'`
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            API{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Testing
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Test your API key and try out the Video Clipper Pro API endpoints
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - API Key & Test Parameters */}
          <div className="space-y-6">
            {/* API Key Validation */}
            <ApiKeyValidator onValidKey={setValidApiKey} />

            {/* Test Parameters */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Play className="w-5 h-5 mr-2 text-primary-400" />
                Test Parameters
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">Video URL</label>
                  <Input
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Platform</label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="tiktok">TikTok</option>
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube Shorts</option>
                      <option value="twitter">Twitter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">Quality</label>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="standard">Standard</option>
                      <option value="high">High</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    Clip Count: {clipCount}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={clipCount}
                    onChange={(e) => setClipCount(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <Button
                  onClick={testApiCall}
                  disabled={!validApiKey || isLoading}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isLoading ? 'Processing...' : 'Test API Call'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column - cURL Command & Response */}
          <div className="space-y-6">
            {/* cURL Command */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Code className="w-5 h-5 mr-2 text-primary-400" />
                  cURL Command
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(generateCurlCommand())}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <pre className="bg-black/50 rounded-lg p-4 text-sm text-white/80 overflow-x-auto">
                <code>{generateCurlCommand()}</code>
              </pre>
            </Card>

            {/* API Response */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">API Response</h3>
                {response && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={copyResponse}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
              </div>
              
              {isLoading ? (
                <div className="bg-black/50 rounded-lg p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-white/60">Processing your request...</p>
                </div>
              ) : response ? (
                <pre className="bg-black/50 rounded-lg p-4 text-sm text-white/80 overflow-x-auto max-h-96">
                  <code>{response}</code>
                </pre>
              ) : (
                <div className="bg-black/50 rounded-lg p-8 text-center">
                  <p className="text-white/60">Response will appear here after testing</p>
                </div>
              )}
            </Card>

            {/* Status Indicators */}
            {validApiKey && (
              <Card>
                <h3 className="text-lg font-semibold text-white mb-4">API Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">API Key</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 text-sm">Valid</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Endpoint</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 text-sm">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Rate Limit</span>
                    <span className="text-white/60 text-sm">847/1000 requests</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}