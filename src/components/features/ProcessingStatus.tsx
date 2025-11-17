'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, CheckCircle, Clock, Cpu, Download, Play, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface ProcessingStatusProps {
  file: File | null
  config: any
  jobId?: string
}

const processingSteps = [
  { id: 'initializing', title: 'Initializing', description: 'Starting advanced CLI processing' },
  { id: 'analyzing', title: 'Analyzing Video', description: 'AI is analyzing your content with smart selection' },
  { id: 'processing', title: 'Processing Clips', description: 'Generating optimized clips with CLI tools' },
  { id: 'enhancing', title: 'Enhancing Quality', description: 'Applying audio and color enhancements' },
  { id: 'finalizing', title: 'Finalizing', description: 'Preparing your professional-quality clips' }
]

export function ProcessingStatus({ file, config, jobId }: ProcessingStatusProps) {
  const { session } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [jobStatus, setJobStatus] = useState<any>(null)
  const [outputFiles, setOutputFiles] = useState<string[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [cliMetrics, setCLIMetrics] = useState<any>(null)
  const [processingSource, setProcessingSource] = useState<string>('unknown')

  // Fetch job status if jobId is provided
  useEffect(() => {
    if (!jobId || !session) return

    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`/api/v1/status/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setJobStatus(data)
          
          // Update CLI-specific information
          if (data.cli_metrics) {
            setCLIMetrics(data.cli_metrics)
          }
          
          if (data.processing_source) {
            setProcessingSource(data.processing_source)
          }
          
          // Update progress based on CLI stage
          if (data.stage) {
            const stageIndex = processingSteps.findIndex(step => step.id === data.stage)
            if (stageIndex >= 0) {
              setCurrentStep(stageIndex)
            }
          }
          
          setProgress(data.progress || 0)
          
          if (data.status === 'completed' && (data.clips || data.output_files)) {
            // Handle both new clips format and legacy output_files format
            const files = data.clips ? data.clips.map((clip: any) => clip.url) : data.output_files
            setOutputFiles(files)
            setIsCompleted(true)
            setProgress(100)
            setCompletedSteps(processingSteps.map(step => step.id))
            
            // Redirect to downloads page after a short delay
            setTimeout(() => {
              router.push(`/dashboard/job/${jobId}`)
            }, 3000)
          } else if (data.status === 'processing') {
            setProgress(data.progress || 50)
          } else if (data.status === 'failed') {
            setProgress(0)
          }
        }
      } catch (error) {
        console.error('Error fetching job status:', error)
      }
    }

    fetchJobStatus()
    const interval = setInterval(fetchJobStatus, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [jobId, session, router])

  // Simulate progress if no real job status
  useEffect(() => {
    if (jobId || isCompleted) return

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 5
        
        // Update current step based on progress
        const stepProgress = newProgress / 100 * processingSteps.length
        const newCurrentStep = Math.floor(stepProgress)
        
        if (newCurrentStep !== currentStep && newCurrentStep < processingSteps.length) {
          setCurrentStep(newCurrentStep)
          if (newCurrentStep > 0) {
            setCompletedSteps(prev => [...prev, processingSteps[newCurrentStep - 1].id])
          }
        }
        
        if (newProgress >= 100) {
          clearInterval(interval)
          setCompletedSteps(processingSteps.map(step => step.id))
          setIsCompleted(true)
          return 100
        }
        
        return newProgress
      })
    }, 300)

    return () => clearInterval(interval)
  }, [currentStep, jobId, isCompleted])

  // Handle download for individual files
  const handleDownload = async (fileUrl: string, filename: string) => {
    if (!session) {
      alert('Please sign in to download files.')
      return
    }
    
    try {
      // Extract jobId and filename from the fileUrl
      // fileUrl format: /processed/userId/jobId/filename.mp4
      const pathParts = fileUrl.split('/')
      const jobIdFromUrl = pathParts[pathParts.length - 2] // Second to last part
      const filenameFromUrl = pathParts[pathParts.length - 1] // Last part
      
      // Use the new video API endpoint
      const apiUrl = `/api/v1/video/${jobIdFromUrl}/${filenameFromUrl}`
      
      console.log('Downloading:', apiUrl)
      console.log('Using token:', session.access_token ? 'Present' : 'Missing')
      
      // The new video API doesn't require authentication headers
      // First check if the file exists by making a HEAD request
      const checkResponse = await fetch(apiUrl, { 
        method: 'HEAD'
      })
      
      if (!checkResponse.ok) {
        console.error('File check failed:', checkResponse.status)
        throw new Error(`File not available: ${checkResponse.status}`)
      }
      
      // Fetch the file (no auth headers needed for the new API)
      const downloadResponse = await fetch(apiUrl)
      
      if (!downloadResponse.ok) {
        throw new Error(`Download failed: ${downloadResponse.status}`)
      }
      
      // Get the file as a blob
      const blob = await downloadResponse.blob()
      
      // Create a download URL from the blob
      const downloadUrl = window.URL.createObjectURL(blob)
      
      // Create a temporary link and click it
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(downloadUrl)
      
      console.log('Download completed for:', filename)
      
    } catch (error: any) {
      console.error('Download error:', error)
      alert(`Failed to download ${filename}. Error: ${error.message || 'Unknown error'}`)
    }
  }

  // Handle batch download of all files
  const handleBatchDownload = async () => {
    if (!session || outputFiles.length === 0) {
      alert('Please sign in to download files.')
      return
    }
    
    const confirmed = confirm(`Download all ${outputFiles.length} clips? This will start ${outputFiles.length} downloads.`)
    if (!confirmed) return
    
    console.log(`Starting batch download of ${outputFiles.length} clips`)
    
    // Download all clips with a small delay between each to avoid overwhelming the browser
    outputFiles.forEach((fileUrl, index) => {
      const filename = `clip_${index + 1}.mp4`
      
      setTimeout(() => {
        console.log(`Downloading clip ${index + 1}/${outputFiles.length}:`, filename)
        handleDownload(fileUrl, filename)
      }, index * 1000) // 1 second delay between downloads
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="text-center">
        {/* Header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Cpu className="w-10 h-10 text-white" />
          </motion.div>
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-4">
          Processing Your Video
        </h2>
        
        <p className="text-white/80 mb-4">
          Our advanced CLI engine is creating professional-quality clips from your content
        </p>
        
        {/* CLI Processing Info */}
        {processingSource === 'cli' && (
          <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3 mb-6">
            <p className="text-sm text-primary-200">
              <strong>CLI Integration Active:</strong> Using advanced video processing with AI features
            </p>
          </div>
        )}
        
        {/* CLI Metrics */}
        {cliMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-sm text-white/60 mb-1">Stage</div>
              <div className="text-lg font-semibold text-white">
                {cliMetrics.current_stage}/{cliMetrics.total_stages}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-sm text-white/60 mb-1">Overall</div>
              <div className="text-lg font-semibold text-white">
                {cliMetrics.overall_progress}%
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-sm text-white/60 mb-1">Elapsed</div>
              <div className="text-lg font-semibold text-white">
                {Math.floor(cliMetrics.elapsed_time / 60)}:{(cliMetrics.elapsed_time % 60).toString().padStart(2, '0')}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-sm text-white/60 mb-1">ETA</div>
              <div className="text-lg font-semibold text-white">
                {cliMetrics.estimated_time_remaining ? 
                  `${Math.ceil(cliMetrics.estimated_time_remaining / 60)}m` : 
                  'Calculating...'
                }
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-white/80 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 via-purple-500 to-cyan-500"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Processing Steps */}
        <div className="space-y-4 mb-8">
          {processingSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id)
            const isCurrent = index === currentStep
            const isPending = index > currentStep

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center space-x-4 p-4 rounded-xl transition-all ${
                  isCurrent ? 'bg-primary-500/20 border border-primary-500/30' :
                  isCompleted ? 'bg-green-500/20 border border-green-500/30' :
                  'bg-white/5 border border-white/10'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-500' :
                  isCurrent ? 'bg-primary-500' :
                  'bg-white/20'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Zap className="w-6 h-6 text-white" />
                    </motion.div>
                  ) : (
                    <Clock className="w-6 h-6 text-white/60" />
                  )}
                </div>
                
                <div className="flex-1 text-left">
                  <h3 className={`font-semibold ${
                    isCompleted ? 'text-green-400' :
                    isCurrent ? 'text-white' :
                    'text-white/60'
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm ${
                    isCompleted ? 'text-green-400/80' :
                    isCurrent ? 'text-white/80' :
                    'text-white/40'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Processing Info */}
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="glass rounded-lg p-4">
            <div className="text-white/60 mb-1">File</div>
            <div className="text-white font-medium">{file?.name || 'Unknown'}</div>
          </div>
          <div className="glass rounded-lg p-4">
            <div className="text-white/60 mb-1">Quality</div>
            <div className="text-white font-medium capitalize">{config.quality || 'Standard'}</div>
          </div>
          <div className="glass rounded-lg p-4">
            <div className="text-white/60 mb-1">Clips</div>
            <div className="text-white font-medium">{config.clipCount || 5} clips</div>
          </div>
        </div>

        {/* Download Section */}
        {isCompleted && outputFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-green-500/10 border border-green-500/20 rounded-xl"
          >
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
              <h3 className="text-xl font-bold text-green-400">Processing Complete!</h3>
            </div>
            
            <p className="text-white/80 mb-6">
              Your clips are ready for download. We've generated {outputFiles.length} amazing clips from your video.
            </p>
            
            <div className="grid gap-3">
              {outputFiles.map((fileUrl, index) => (
                <div key={fileUrl} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Play className="w-5 h-5 text-primary-400" />
                    <span className="text-white font-medium">Clip {index + 1}</span>
                    <span className="text-white/60 text-sm">{fileUrl.split('/').pop()}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(fileUrl, `clip_${index + 1}.mp4`)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <Button
                onClick={handleBatchDownload}
                className="btn-primary"
              >
                <Download className="w-5 h-5 mr-2" />
                Download All Clips
              </Button>
              
              <Button
                variant="secondary"
                onClick={() => router.push('/process')}
              >
                Process Another Video
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View in Dashboard
              </Button>
            </div>
          </motion.div>
        )}

        {progress < 100 && !isCompleted && (
          <p className="text-white/60 text-sm mt-6">
            This usually takes 2-5 minutes depending on video length and quality settings
          </p>
        )}

        {jobStatus?.status === 'failed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <div className="flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-red-400 mr-3" />
              <h3 className="text-xl font-bold text-red-400">Processing Failed</h3>
            </div>
            
            <p className="text-white/80 mb-4">
              {jobStatus.error_message || 'Something went wrong during processing. Please try again.'}
            </p>
            
            <Button
              onClick={() => router.push('/process')}
              className="btn-primary"
            >
              Try Again
            </Button>
          </motion.div>
        )}
      </Card>
    </div>
  )
}