'use client';
import { useState, useEffect, useCallback } from 'react';
import { Scissors, RotateCcw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UrlInput } from '@/components/UrlInput';
import { ProcessingOptions } from '@/components/ProcessingOptions';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { ClipResults } from '@/components/ClipResults';
import { BatchStatus } from '@/components/BatchStatus';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useJob } from '@/hooks/useJob';
import { useBatch } from '@/hooks/useBatch';
import { createJob, createBatch, getJobStatus, getUploadConfig, type JobStatus } from '@/lib/api';
import { DEFAULT_OPTIONS } from '@/lib/constants';

type Phase = 'idle' | 'submitting' | 'processing' | 'completed' | 'failed';

export default function Home() {
  const [url, setUrl] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [batchUrls, setBatchUrls] = useState('');
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [phase, setPhase] = useState<Phase>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadConfigured, setUploadConfigured] = useState(false);

  const { data: jobData } = useJob(phase === 'processing' && !batchId ? jobId : null);
  const { data: batchData } = useBatch(phase === 'processing' && batchId ? batchId : null);

  // Check upload config on mount
  useEffect(() => {
    getUploadConfig()
      .then(c => setUploadConfigured(c.configured))
      .catch(() => {});
  }, []);

  // Watch single job status transitions
  useEffect(() => {
    if (!jobData || batchId) return;
    if (jobData.status === 'completed' || jobData.status === 'ready') {
      setPhase('completed');
    } else if (jobData.status === 'failed') {
      setError(jobData.error || 'Processing failed');
      setPhase('failed');
    }
  }, [jobData, batchId]);

  // Watch batch status transitions
  useEffect(() => {
    if (!batchData || !batchId) return;
    if (batchData.completed + batchData.failed >= batchData.totalJobs) {
      setPhase('completed');
    }
  }, [batchData, batchId]);

  const handleSubmit = async () => {
    setError(null);
    setPhase('submitting');

    try {
      if (batchMode) {
        const urls = batchUrls
          .split('\n')
          .map(u => u.trim())
          .filter(u => u.length > 0);

        if (urls.length === 0) {
          throw new Error('Please enter at least one URL');
        }

        const result = await createBatch(urls, options);
        setBatchId(result.batchId);
        setJobId(null);
        setPhase('processing');
      } else {
        const result = await createJob(url, options);
        setJobId(result.jobId);
        setBatchId(null);
        setPhase('processing');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start processing');
      setPhase('failed');
    }
  };

  const handleReset = () => {
    setUrl('');
    setBatchUrls('');
    setJobId(null);
    setBatchId(null);
    setError(null);
    setPhase('idle');
  };

  const handleRefresh = useCallback(async () => {
    if (!jobId) return;
    const status = await getJobStatus(jobId);
    // Force re-render by transitioning phase
    if (status.status === 'completed' || status.status === 'ready') {
      setPhase('completed');
    }
  }, [jobId]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/10 mb-6">
          <Scissors className="w-8 h-8 text-primary-400" />
        </div>
        <h1 className="text-4xl font-bold text-zinc-50 mb-3">
          Hook<span className="text-primary-400">Clip</span>
        </h1>
        <p className="text-zinc-500 text-lg">
          Generate engaging hook clips from YouTube videos
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* IDLE / SUBMITTING */}
        {(phase === 'idle' || phase === 'submitting') && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Batch mode toggle */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setBatchMode(!batchMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  batchMode
                    ? 'bg-primary-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Batch Mode
              </button>
            </div>

            {batchMode ? (
              <div className="space-y-2">
                <textarea
                  value={batchUrls}
                  onChange={(e) => setBatchUrls(e.target.value)}
                  placeholder={"Paste YouTube URLs, one per line...\nhttps://youtube.com/watch?v=...\nhttps://youtube.com/watch?v=..."}
                  disabled={phase === 'submitting'}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 disabled:opacity-50 resize-none"
                />
                <p className="text-xs text-zinc-500">
                  {batchUrls.split('\n').filter(u => u.trim()).length} URL(s) entered (max 20)
                </p>
              </div>
            ) : (
              <UrlInput
                value={url}
                onChange={setUrl}
                onSubmit={handleSubmit}
                disabled={phase === 'submitting'}
                error={error || undefined}
              />
            )}

            <ProcessingOptions options={options} onChange={setOptions} />

            <Button
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={
                (batchMode
                  ? batchUrls.split('\n').filter(u => u.trim()).length === 0
                  : !url.trim()) || phase === 'submitting'
              }
            >
              {phase === 'submitting' ? (
                <>
                  <Scissors className="w-5 h-5 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Scissors className="w-5 h-5" />
                  {batchMode ? 'Process Batch' : 'Generate Clips'}
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* PROCESSING */}
        {phase === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              {batchId && batchData ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-100">Batch Processing</h3>
                    <p className="text-sm text-zinc-500">Processing {batchData.totalJobs} videos</p>
                  </div>
                  <BatchStatus batch={batchData} />
                </div>
              ) : jobData ? (
                <ProcessingStatus job={jobData} />
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  <Scissors className="w-8 h-8 mx-auto mb-3 animate-spin text-primary-400" />
                  <p>Starting up...</p>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* COMPLETED */}
        {phase === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {batchId && batchData ? (
              <div className="space-y-4">
                <Card>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-100">Batch Complete</h3>
                      <p className="text-sm text-zinc-500">
                        {batchData.completed} completed, {batchData.failed} failed
                      </p>
                    </div>
                    <BatchStatus batch={batchData} />
                  </div>
                </Card>
                {batchData.jobs
                  .filter(j => j.status === 'completed' || j.status === 'ready')
                  .map(job => (
                    <div key={job.jobId} className="space-y-2">
                      <h4 className="text-sm font-medium text-zinc-300 px-1">{job.videoTitle}</h4>
                      <ClipResults
                        clips={job.clips}
                        jobId={job.jobId}
                        videoTitle={job.videoTitle}
                        uploadConfigured={uploadConfigured}
                        onRefresh={handleRefresh}
                      />
                    </div>
                  ))}
              </div>
            ) : jobData ? (
              <ClipResults
                clips={jobData.clips}
                jobId={jobData.jobId}
                videoTitle={jobData.videoTitle}
                uploadConfigured={uploadConfigured}
                onRefresh={handleRefresh}
              />
            ) : null}

            <Button variant="secondary" className="w-full" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
              Process Another Video
            </Button>
          </motion.div>
        )}

        {/* FAILED */}
        {phase === 'failed' && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Card className="border-red-500/20">
              <div className="text-center space-y-3">
                <p className="text-red-400">{error || 'Something went wrong'}</p>
              </div>
            </Card>
            <Button variant="secondary" className="w-full" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
