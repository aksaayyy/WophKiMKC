'use client';
import { Settings2 } from 'lucide-react';
import { PLATFORMS, DETECTION_MODES, type ProcessingOptionsType } from '@/lib/constants';

interface ProcessingOptionsProps {
  options: ProcessingOptionsType;
  onChange: (options: ProcessingOptionsType) => void;
}

export function ProcessingOptions({ options, onChange }: ProcessingOptionsProps) {
  return (
    <div className="space-y-5 p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
      <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
        <Settings2 className="w-4 h-4" />
        Processing Options
      </div>

      {/* Detection Mode */}
      <div className="space-y-2">
        <label className="text-sm text-zinc-400">Detection Mode</label>
        <div className="space-y-2">
          {DETECTION_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => onChange({ ...options, detectionMode: mode.id })}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                options.detectionMode === mode.id
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  options.detectionMode === mode.id ? 'text-primary-400' : 'text-zinc-300'
                }`}>
                  {mode.label}
                </span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  options.detectionMode === mode.id
                    ? 'border-primary-500'
                    : 'border-zinc-600'
                }`}>
                  {options.detectionMode === mode.id && (
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                  )}
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Platform */}
      <div className="space-y-2">
        <label className="text-sm text-zinc-400">Platform</label>
        <div className="flex gap-2">
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => onChange({ ...options, platform: p.id })}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                options.platform === p.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clip Count */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-sm text-zinc-400">Number of Clips</label>
          <span className="text-sm font-medium text-zinc-200">{options.clipCount}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={options.clipCount}
          onChange={(e) => onChange({ ...options, clipCount: parseInt(e.target.value) })}
          className="w-full accent-primary-500"
        />
        <div className="flex justify-between text-xs text-zinc-600">
          <span>1</span>
          <span>10</span>
        </div>
      </div>

      {/* Clip Duration */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-sm text-zinc-400">Clip Duration</label>
          <span className="text-sm font-medium text-zinc-200">{options.clipDuration}s</span>
        </div>
        <input
          type="range"
          min={15}
          max={90}
          step={5}
          value={options.clipDuration}
          onChange={(e) => onChange({ ...options, clipDuration: parseInt(e.target.value) })}
          className="w-full accent-primary-500"
        />
        <div className="flex justify-between text-xs text-zinc-600">
          <span>15s</span>
          <span>90s</span>
        </div>
      </div>

      {/* Auto Subtitles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm text-zinc-300">Auto Subtitles</label>
            <p className="text-xs text-zinc-500">Burn subtitles into clips</p>
          </div>
          <button
            onClick={() => onChange({ ...options, enableSubtitles: !options.enableSubtitles })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              options.enableSubtitles ? 'bg-primary-600' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                options.enableSubtitles ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {options.enableSubtitles && (
          <div className="flex gap-2 ml-1">
            {(['standard', 'highlight'] as const).map(style => (
              <button
                key={style}
                onClick={() => onChange({ ...options, subtitleStyle: style })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  options.subtitleStyle === style
                    ? 'bg-primary-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {style === 'standard' ? 'Standard' : 'Word Highlight'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Face Tracking */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-zinc-300">Face Tracking</label>
          <p className="text-xs text-zinc-500">Smart crop to active speaker</p>
        </div>
        <button
          onClick={() => onChange({ ...options, enableFaceTracking: !options.enableFaceTracking })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            options.enableFaceTracking ? 'bg-primary-600' : 'bg-zinc-700'
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              options.enableFaceTracking ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
