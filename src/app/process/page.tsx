'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Settings, Play, Download, ArrowRight } from 'lucide-react'
import { VideoUpload } from '@/components/features/VideoUpload'
import { ProcessingOptions } from '@/components/features/ProcessingOptions'
import { ProcessingStatus } from '@/components/features/ProcessingStatus'
import { Card } from '@/components/ui/Card'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useVideoJobs } from '@/hooks/useVideoJobs'
import { useAuth } from '@/hooks/useAuth'

type ProcessingStep = 'upload' | 'configure' | 'processing' | 'complete'

export default function ProcessPage() {
  return (
    <AuthGuard>
      <ProcessPageContent />
    </AuthGuard>
  )
}

function ProcessPageContent() {
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null)
  const [processingConfig, setProcessingConfig] = useState({})
  const [jobId, setJobId] = useState<string | null>(null)
  const { createJob } = useVideoJobs()
  const { session } = useAuth()

  const steps = [
    { id: 'upload', title: 'Upload Video', icon: Upload },
    { id: 'configure', title: 'Configure', icon: Settings },
    { id: 'processing', title: 'Processing', icon: Play },
    { id: 'complete', title: 'Download', icon: Download },
  ]

  const handleFileUpload = (file: File, filePath?: string, jobId?: string) => {
    setUploadedFile(file)
    setUploadedFilePath(filePath || null)
    if (jobId) {
      setJobId(jobId)
      // If we have a job ID, skip configuration and go straight to processing
      setCurrentStep('processing')
    } else {
      // Always go to configure step to let user set clip count, quality, etc.
      setCurrentStep('configure')
    }
  }

  const handleStartProcessing = async (config: any) => {
    setProcessingConfig(config)
    setCurrentStep('processing')
    
    if (!uploadedFile || !session) {
      console.error('No file uploaded or user not authenticated')
      setCurrentStep('configure')
      return
    }
    
    try {
      // Send file directly to process API with FormData
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('platform', config.platforms?.[0] || 'tiktok')
      formData.append('quality', config.quality || 'standard')
      formData.append('clipCount', (config.clipCount || 5).toString())
      formData.append('enhanceAudio', config.aiEnhancement ? 'true' : 'false')
      formData.append('colorCorrection', config.aiEnhancement ? 'true' : 'false')
      formData.append('smartSelection', config.aiEnhancement ? 'true' : 'false')
      formData.append('minClipLength', (config.minClipLength || 15).toString())
      formData.append('maxClipLength', (config.maxClipLength || 60).toString())
      
      console.log('Starting processing with config:', config)
      
      const response = await fetch('/api/v1/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Processing started:', result)
      
      if (result.jobId) {
        setJobId(result.jobId)
      } else {
        throw new Error('No job ID returned from server')
      }
      
    } catch (error: any) {
      console.error('Processing error:', error)
      alert(`Failed to start processing: ${error.message || 'Unknown error'}`)
      setCurrentStep('configure')
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Process Your{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Video
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Upload your video and let our AI create amazing clips in minutes
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center justify-center space-x-4 md:space-x-8">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index
              const StepIcon = step.icon

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <motion.div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-primary border-primary-500 shadow-glow'
                          : isCompleted
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-white/30 bg-white/5'
                      }`}
                      whileHover={{ scale: 1.1 }}
                    >
                      <StepIcon className={`w-6 h-6 ${isActive || isCompleted ? 'text-white' : 'text-white/60'}`} />
                    </motion.div>
                    <span className={`text-sm mt-2 ${isActive ? 'text-white' : 'text-white/60'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${isCompleted ? 'bg-primary-500' : 'bg-white/20'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {currentStep === 'upload' && (
            <VideoUpload onFileUpload={handleFileUpload} />
          )}
          
          {currentStep === 'configure' && uploadedFile && (
            <ProcessingOptions
              file={uploadedFile}
              onStartProcessing={handleStartProcessing}
            />
          )}
          
          {currentStep === 'processing' && (
            <ProcessingStatus
              file={uploadedFile}
              config={processingConfig}
              jobId={jobId || undefined}
            />
          )}
          
          {currentStep === 'complete' && (
            <Card className="max-w-2xl mx-auto text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Download className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Processing Complete!
                </h2>
                <p className="text-white/80 mb-8">
                  Your clips are ready for download. We've created 5 amazing clips from your video.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary"
                  >
                    Download All Clips
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary"
                    onClick={() => {
                      setCurrentStep('upload')
                      setUploadedFile(null)
                      setProcessingConfig({})
                    }}
                  >
                    Process Another Video
                  </motion.button>
                </div>
              </motion.div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}