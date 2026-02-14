'use client';
import { useState } from 'react';
import { Download, Upload, ExternalLink, Clock, Zap } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { getClipDownloadUrl, triggerUpload, type ClipInfo } from '@/lib/api';
import { formatTime } from '@/lib/utils';

interface ClipResultsProps {
  clips: ClipInfo[];
  jobId: string;
  videoTitle: string;
  uploadConfigured: boolean;
  onRefresh: () => void;
}

export function ClipResults({ clips, jobId, videoTitle, uploadConfigured, onRefresh }: ClipResultsProps) {
  const [uploading, setUploading] = useState(false);

  const handleDownload = (clip: ClipInfo) => {
    const url = getClipDownloadUrl(jobId, clip.filename);
    const a = document.createElement('a');
    a.href = url;
    a.download = clip.filename;
    a.click();
  };

  const handleDownloadAll = () => {
    clips.forEach((clip, i) => {
      setTimeout(() => handleDownload(clip), i * 1000);
    });
  };

  const handleUploadAll = async () => {
    setUploading(true);
    try {
      await triggerUpload(jobId);
      // Poll for updated status
      setTimeout(onRefresh, 2000);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">{clips.length} Clips Ready</h3>
          <p className="text-sm text-zinc-500">{videoTitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleDownloadAll}>
            <Download className="w-4 h-4" />
            Download All
          </Button>
          {uploadConfigured && (
            <Button size="sm" onClick={handleUploadAll} disabled={uploading}>
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload All'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {clips.map((clip, i) => (
          <Card key={clip.filename} className="!p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400 font-bold">
                  {i + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200">Clip {i + 1}</span>
                    {clip.hookScore > 0 && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">
                        <Zap className="w-3 h-3" />
                        {(clip.hookScore * 100).toFixed(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Starts at {formatTime(clip.startTime)}
                    </span>
                    <span>{clip.duration}s</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {clip.youtubeUrl && (
                  <a
                    href={clip.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View
                  </a>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleDownload(clip)}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
