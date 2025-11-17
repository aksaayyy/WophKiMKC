'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Code, Key, Zap, Shield, Copy, Check, ExternalLink, Book, Terminal } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const apiEndpoints = [
  {
    method: 'POST',
    endpoint: '/api/v1/process',
    description: 'Process a video file or URL',
    params: [
      { name: 'video_url', type: 'string', required: true, description: 'Video URL or file path' },
      { name: 'platform', type: 'string', required: false, description: 'Target platform (tiktok, instagram, youtube)' },
      { name: 'quality', type: 'string', required: false, description: 'Quality preset (standard, high, premium)' },
      { name: 'clip_count', type: 'number', required: false, description: 'Number of clips to generate (1-10)' }
    ]
  },
  {
    method: 'GET',
    endpoint: '/api/v1/status/{job_id}',
    description: 'Check processing status',
    params: [
      { name: 'job_id', type: 'string', required: true, description: 'Job ID returned from process endpoint' }
    ]
  },
  {
    method: 'GET',
    endpoint: '/api/v1/download/{job_id}',
    description: 'Download processed clips',
    params: [
      { name: 'job_id', type: 'string', required: true, description: 'Job ID of completed processing' }
    ]
  }
]

const codeExamples = {
  curl: `curl -X POST "https://api.videoclipperpro.com/v1/process" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "video_url": "https://youtube.com/watch?v=example",
    "platform": "tiktok",
    "quality": "high",
    "clip_count": 3
  }'`,
  
  javascript: `const response = await fetch('https://api.videoclipperpro.com/v1/process', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    video_url: 'https://youtube.com/watch?v=example',
    platform: 'tiktok',
    quality: 'high',
    clip_count: 3
  })
});

const result = await response.json();
console.log(result);`,

  python: `import requests

url = "https://api.videoclipperpro.com/v1/process"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "video_url": "https://youtube.com/watch?v=example",
    "platform": "tiktok",
    "quality": "high",
    "clip_count": 3
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result)`
}

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    requests: '100 requests/month',
    features: ['Basic video processing', 'Standard quality', 'Email support'],
    color: 'from-gray-500 to-gray-600'
  },
  {
    name: 'Pro',
    price: '$29',
    requests: '1,000 requests/month',
    features: ['Advanced AI processing', 'High quality output', 'Priority support', 'Webhook notifications'],
    color: 'from-primary-500 to-purple-500',
    popular: true
  },
  {
    name: 'Enterprise',
    price: '$99',
    requests: '10,000 requests/month',
    features: ['Premium quality', 'Custom integrations', 'Dedicated support', 'SLA guarantee'],
    color: 'from-purple-500 to-pink-500'
  }
]

export default function APIPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('curl')
  const [apiKey, setApiKey] = useState('')
  const [copied, setCopied] = useState(false)

  const generateApiKey = () => {
    const key = 'vcp_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setApiKey(key)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Video Clipper Pro{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              API
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Integrate AI-powered video processing into your applications with our simple REST API
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={generateApiKey}>
              <Key className="w-5 h-5 mr-2" />
              Generate API Key
            </Button>
            <Button variant="secondary" size="lg">
              <Book className="w-5 h-5 mr-2" />
              View Documentation
            </Button>
          </div>
        </motion.div>

        {/* API Key Section */}
        {apiKey && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Your API Key</h3>
                  <p className="text-white/60 text-sm">Keep this key secure and don't share it publicly</p>
                </div>
                <Shield className="w-8 h-8 text-primary-400" />
              </div>
              <div className="mt-4 flex items-center space-x-2">
                <Input
                  value={apiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="secondary"
                  onClick={() => copyToClipboard(apiKey)}
                  className="shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Quick Start</h2>
          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Terminal className="w-6 h-6 mr-2 text-primary-400" />
                Code Examples
              </h3>
              <div className="mb-4">
                <div className="flex space-x-2 mb-4">
                  {Object.keys(codeExamples).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        selectedLanguage === lang
                          ? 'bg-primary-500 text-white'
                          : 'bg-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <pre className="bg-black/50 rounded-lg p-4 text-sm text-white/80 overflow-x-auto">
                    <code>{codeExamples[selectedLanguage as keyof typeof codeExamples]}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeExamples[selectedLanguage as keyof typeof codeExamples])}
                    className="absolute top-2 right-2 p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/60" />}
                  </button>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-primary-400" />
                Response Format
              </h3>
              <pre className="bg-black/50 rounded-lg p-4 text-sm text-white/80 overflow-x-auto">
                <code>{`{
  "job_id": "job_abc123",
  "status": "processing",
  "estimated_time": 120,
  "message": "Video processing started"
}

// Status Check Response
{
  "job_id": "job_abc123",
  "status": "completed",
  "progress": 100,
  "clips": [
    {
      "id": "clip_1",
      "url": "https://cdn.videoclipperpro.com/...",
      "duration": 15,
      "platform": "tiktok"
    }
  ]
}`}</code>
              </pre>
            </Card>
          </div>
        </motion.div>

        {/* API Endpoints */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">API Endpoints</h2>
          <div className="space-y-6">
            {apiEndpoints.map((endpoint, index) => (
              <Card key={index}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        endpoint.method === 'POST' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-white font-mono">{endpoint.endpoint}</code>
                    </div>
                    <p className="text-white/80">{endpoint.description}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-3">Parameters</h4>
                  <div className="space-y-2">
                    {endpoint.params.map((param, paramIndex) => (
                      <div key={paramIndex} className="flex items-start space-x-4 text-sm">
                        <code className="text-primary-400 font-mono min-w-0 flex-shrink-0">{param.name}</code>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          param.required ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {param.required ? 'required' : 'optional'}
                        </span>
                        <span className="text-white/60">{param.type}</span>
                        <span className="text-white/80">{param.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">API Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`relative ${tier.popular ? 'ring-2 ring-primary-500' : ''}`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-primary px-4 py-1 rounded-full text-white text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{tier.name}</h3>
                  <div className="text-3xl font-bold text-white mb-1">{tier.price}</div>
                  <div className="text-white/60 text-sm">{tier.requests}</div>
                </div>
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-white/80">
                      <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full bg-gradient-to-r ${tier.color}`}
                  variant={tier.popular ? 'primary' : 'secondary'}
                >
                  Get Started
                </Button>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <Card>
            <h2 className="text-2xl font-bold text-white mb-4">Need Help?</h2>
            <p className="text-white/80 mb-6">
              Our team is here to help you integrate and get the most out of our API
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary">
                <ExternalLink className="w-4 h-4 mr-2" />
                Documentation
              </Button>
              <Button variant="secondary">
                <Code className="w-4 h-4 mr-2" />
                SDK & Libraries
              </Button>
              <Button>
                Contact Support
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}