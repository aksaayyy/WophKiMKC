'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X, CheckCircle, AlertCircle, Settings } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useVideoJobs } from '@/hooks/useVideoJobs'
import { useTemplates } from '@/hooks/useTemplates'

interface VideoUploadProps {
  onFileUpload?: (file: File, filePath?: string, jobId?: string) => void
}

export function VideoUpload({ onFileUpload }: VideoUploadProps) {
  const { user, session } = useAuth()
  const { createJob } = useVideoJobs()
  const { templates } = useTemplates()
  
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  
  // YouTube URL support
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isProcessingYouTube, setIsProcessingYouTube] = useState(false)
  
  // Processing settings
  const [platform, setPlatform] = useState('tiktok')
  const [quality, setQuality] = useState('high')
  const [clipCount, setClipCount] = useState(3)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  
  // Advanced CLI features
  const [enhanceAudio, setEnhanceAudio] = useState(false)
  const [colorCorrection, setColorCorrection] = useState(false)
  const [smartSelection, setSmartSelection] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Clip length customization
  const [minClipLength, setMinClipLength] = useState(15)
  const [maxClipLength, setMaxClipLength] = useState(60)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File size must be less than 500MB')
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Please upload a valid video file (MP4, MOV, AVI, MKV)')
      } else {
        setError('Invalid file. Please try again.')
      }
      setUploadStatus('error')
      return
    }

    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
      setUploadStatus('uploading')
      
      // Upload file to server
      uploadToServer(file)
    }
  }, [onFileUpload])

  const uploadToServer = async (file: File) => {
    if (!user || !session) {
      setUploadStatus('error')
      setError('Please sign in to upload videos')
      return
    }

    try {
      // Step 1: Upload file to server
      setUploadProgress(20)
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/v1/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const uploadResult = await uploadResponse.json()
      setUploadProgress(50)

      setUploadProgress(70)

      // Step 3: File uploaded successfully - don't start processing yet
      setUploadProgress(100)
      setUploadStatus('success')
      
      // Call the callback with file info and path but no job ID (so user can configure)
      onFileUpload?.(file, uploadResult.file.path)
      
      console.log('File uploaded successfully:', uploadResult.file.path)
      
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.')
    }
  }

  const validateYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/,
      /^https?:\/\/(www\.)?youtube\.com\/shorts\//,
      /^https?:\/\/(www\.)?youtube\.com\/live\//
    ]
    return patterns.some(pattern => pattern.test(url))
  }

  const processYouTubeVideo = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL')
      return
    }

    if (!validateYouTubeUrl(youtubeUrl)) {
      setError('Please enter a valid YouTube URL')
      return
    }

    if (!user || !session) {
      setError('Please sign in to process videos')
      return
    }

    setIsProcessingYouTube(true)
    setError(null)

    try {
      // Send YouTube URL to YouTube processing API
      const response = await fetch('/api/v1/youtube/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          youtube_url: youtubeUrl,
          platform,
          quality,
          clipCount,
          enhanceAudio,
          colorCorrection,
          smartSelection,
          minClipLength,
          maxClipLength
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Processing failed')
      }

      // Create a mock file object for the callback
      // Using Blob to create a mock file since File constructor has issues
      const blob = new Blob([''], { type: 'video/mp4' })
      const mockFile = Object.assign(blob, {
        name: `youtube_${Date.now()}.mp4`,
        lastModified: Date.now(),
        webkitRelativePath: ''
      }) as File
      
      // Call the callback with the mock file and job ID
      onFileUpload?.(mockFile, undefined, result.job_id)
      
      console.log('YouTube processing started:', result)
      
    } catch (error) {
      console.error('YouTube processing error:', error)
      setError(error instanceof Error ? error.message : 'Processing failed. Please try again.')
    } finally {
      setIsProcessingYouTube(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: false
  })

  const resetUpload = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setUploadStatus('idle')
    setError(null)
    setJobId(null)
    setShowSettings(false)
    setYoutubeUrl('')
    setIsProcessingYouTube(false)
  }

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setPlatform(template.settings.platform_target || 'tiktok')
      setQuality(template.settings.quality_preset === 'social' ? 'standard' : 
                template.settings.quality_preset === 'pro' ? 'high' : 'premium')
      setClipCount(template.settings.clip_count)
      setSelectedTemplate(templateId)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          {uploadStatus === 'idle' && (
            <motion.div
              key="upload-zone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <div
                {...getRootProps()}
                className={`cursor-pointer transition-all duration-300 ${
                  isDragActive ? 'bg-primary-500/20 border-primary-500' : 'hover:bg-white/5'
                }`}
              >
              <input {...getInputProps()} />
              <div className="text-center py-16">
                <motion.div
                  animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-8"
                >
                  <Upload className="w-12 h-12 text-white" />
                </motion.div>
                
                <h3 className="text-2xl font-bold text-white mb-4">
                  {isDragActive ? 'Drop your video here' : 'Upload Your Video'}
                </h3>
                
                <p className="text-white/80 mb-8 max-w-md mx-auto">
                  Drag and drop your video file here, or click to browse. 
                  We support MP4, MOV, AVI, MKV files up to 500MB.
                </p>
                
                <Button className="btn-primary">
                  Choose File
                </Button>
                
                {/* YouTube URL Input */}
                <div className="my-8 p-6 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-4">Or Process a YouTube Video</h4>
                  <div className="space-y-4">
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button
                      onClick={processYouTubeVideo}
                      disabled={isProcessingYouTube || !youtubeUrl.trim()}
                      className="w-full btn-primary"
                    >
                      {isProcessingYouTube ? 'Processing...' : 'Process YouTube Video'}
                    </Button>
                  </div>
                </div>
                
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-center space-x-4">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Processing Settings
                    </Button>
                  </div>

                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white/5 rounded-xl p-6 space-y-4"
                    >
                      {/* Template Selection */}
                      {templates.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Use Template
                          </label>
                          <select
                            value={selectedTemplate || ''}
                            onChange={(e) => e.target.value ? applyTemplate(e.target.value) : setSelectedTemplate(null)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                          >
                            <option value="">Custom Settings</option>
                            {templates.map(template => (
                              <option key={template.id} value={template.id}>
                                {template.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Platform Selection */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Platform
                        </label>
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

                      {/* Quality Selection */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Quality
                        </label>
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

                      {/* Clip Count */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Number of Clips: {clipCount}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={clipCount}
                          onChange={(e) => setClipCount(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      {/* Clip Length Settings */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Clip Length: {minClipLength}-{maxClipLength}s
                        </label>
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <label className="text-xs text-white/60 mb-1 block">Min: {minClipLength}s</label>
                            <input
                              type="range"
                              min="5"
                              max="30"
                              value={minClipLength}
                              onChange={(e) => setMinClipLength(parseInt(e.target.value))}
                              className="w-full"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-white/60 mb-1 block">Max: {maxClipLength}s</label>
                            <input
                              type="range"
                              min="30"
                              max="120"
                              value={maxClipLength}
                              onChange={(e) => setMaxClipLength(parseInt(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Advanced CLI Features */}
                      <div className="border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-sm font-medium text-white">
                            Advanced Features
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-xs"
                          >
                            {showAdvanced ? 'Hide' : 'Show'}
                          </Button>
                        </div>

                        {showAdvanced && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                          >
                            {/* Smart Selection */}
                            <div className="flex items-center justify-between">
                              <div>
                                <label className="text-sm font-medium text-white">
                                  AI Smart Selection
                                </label>
                                <p className="text-xs text-white/60">
                                  Use AI to select the best moments for clips
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={smartSelection}
                                  onChange={(e) => setSmartSelection(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                              </label>
                            </div>

                            {/* Audio Enhancement */}
                            <div className="flex items-center justify-between">
                              <div>
                                <label className="text-sm font-medium text-white">
                                  Audio Enhancement
                                </label>
                                <p className="text-xs text-white/60">
                                  Improve audio quality and normalize levels
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={enhanceAudio}
                                  onChange={(e) => setEnhanceAudio(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                              </label>
                            </div>

                            {/* Color Correction */}
                            <div className="flex items-center justify-between">
                              <div>
                                <label className="text-sm font-medium text-white">
                                  Color Correction
                                </label>
                                <p className="text-xs text-white/60">
                                  Automatically enhance colors and contrast
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={colorCorrection}
                                  onChange={(e) => setColorCorrection(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                              </label>
                            </div>

                            {/* Feature Info */}
                            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3 mt-4">
                              <p className="text-xs text-primary-200">
                                <strong>CLI Integration:</strong> These features use our advanced video processing engine for professional-quality results.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <div className="flex items-center justify-center space-x-8 text-sm text-white/60">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Secure Upload</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Fast Processing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>AI Enhanced</span>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </motion.div>
          )}

          {(uploadStatus === 'uploading' || uploadStatus === 'success') && selectedFile && (
            <motion.div
              key="upload-progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-12"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6"
                >
                  {uploadStatus === 'success' ? (
                    <CheckCircle className="w-10 h-10 text-white" />
                  ) : (
                    <File className="w-10 h-10 text-white" />
                  )}
                </motion.div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  {uploadStatus === 'success' ? 'Upload Complete!' : 'Uploading...'}
                </h3>
                
                <div className="flex items-center justify-center space-x-4 text-white/80">
                  <span>{selectedFile.name}</span>
                  <span>•</span>
                  <span>{formatFileSize(selectedFile.size)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto mb-8">
                <div className="flex justify-between text-sm text-white/80 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-500 to-cyan-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {uploadStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <p className="text-green-400 mb-4">
                    Your video has been uploaded successfully!
                  </p>
                  <p className="text-white/80 mb-4 text-sm">
                    Next: Configure your processing settings
                  </p>
                  <div className="space-y-2">
                    <Button onClick={resetUpload} variant="secondary" className="w-full">
                      Upload Another Video
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {uploadStatus === 'error' && (
            <motion.div
              key="upload-error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              >
                <AlertCircle className="w-10 h-10 text-red-400" />
              </motion.div>
              
              <h3 className="text-xl font-bold text-white mb-4">Upload Failed</h3>
              <p className="text-red-400 mb-8">{error}</p>
              
              <Button onClick={resetUpload} className="btn-primary">
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}