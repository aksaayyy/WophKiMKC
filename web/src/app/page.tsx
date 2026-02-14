'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Scissors, Zap, Brain, Mic, ScanFace, Layers, ArrowRight,
  Gauge, Sparkles, Upload, Monitor, Clock, Shield,
  ChevronRight, Play, Star, Globe
} from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Hook Detection',
    description: 'GPT-4o analyzes transcripts to find the most viral-worthy moments with hook scoring.',
    color: 'from-violet-500 to-purple-600',
    badge: 'GPT-4o Mini',
  },
  {
    icon: Mic,
    title: 'Auto Transcription',
    description: 'Faster-Whisper runs locally for instant, free speech-to-text with word-level timestamps.',
    color: 'from-cyan-500 to-blue-600',
    badge: 'Faster-Whisper',
  },
  {
    icon: ScanFace,
    title: 'Face Tracking',
    description: 'MediaPipe detects the active speaker and auto-crops 9:16 around them for podcasts.',
    color: 'from-pink-500 to-rose-600',
    badge: 'MediaPipe',
  },
  {
    icon: Sparkles,
    title: 'Smart Subtitles',
    description: 'Karaoke-style word highlights burned directly into clips. Two styles to choose from.',
    color: 'from-amber-500 to-orange-600',
    badge: 'FFmpeg ASS',
  },
  {
    icon: Gauge,
    title: 'Blazing Downloads',
    description: '16 parallel connections via aria2c. Download hour-long podcasts in seconds.',
    color: 'from-emerald-500 to-green-600',
    badge: 'aria2c',
  },
  {
    icon: Layers,
    title: 'Batch Processing',
    description: 'Drop up to 20 YouTube URLs at once. All process in parallel with live progress.',
    color: 'from-blue-500 to-indigo-600',
    badge: 'BullMQ',
  },
];

const PLATFORMS = [
  { name: 'YouTube Shorts', aspect: '9:16' },
  { name: 'TikTok', aspect: '9:16' },
  { name: 'Instagram Reels', aspect: '9:16' },
];

const TECH_STACK = [
  { name: 'FFmpeg', role: 'Video Processing' },
  { name: 'yt-dlp', role: 'Video Download' },
  { name: 'aria2c', role: 'Fast Downloads' },
  { name: 'Faster-Whisper', role: 'Transcription' },
  { name: 'GPT-4o Mini', role: 'Hook Scoring' },
  { name: 'MediaPipe', role: 'Face Detection' },
  { name: 'Next.js 14', role: 'Frontend' },
  { name: 'Express + BullMQ', role: 'Backend & Queue' },
  { name: 'Redis', role: 'Job Management' },
];

const STEPS = [
  {
    step: '01',
    title: 'Paste URL',
    description: 'Drop any YouTube video or podcast link. Supports videos up to 4+ hours.',
    icon: Globe,
  },
  {
    step: '02',
    title: 'AI Analyzes',
    description: 'Transcription + LLM scoring finds the most engaging, shareable moments.',
    icon: Brain,
  },
  {
    step: '03',
    title: 'Clips Generated',
    description: 'Perfectly cropped 9:16 clips with optional subtitles and face tracking.',
    icon: Scissors,
  },
  {
    step: '04',
    title: 'Download & Upload',
    description: 'Download clips or upload directly to YouTube Shorts with one click.',
    icon: Upload,
  },
];

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count}{suffix}</>;
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 overflow-hidden">
      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-zinc-100">
              Hook<span className="text-primary-400">Clip</span>
            </span>
          </div>
          <Link
            href="/app"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500
                       text-white text-sm font-semibold transition-all shadow-lg shadow-primary-600/25
                       hover:shadow-primary-500/30 hover:-translate-y-0.5"
          >
            Launch App <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full
                          bg-primary-500/5 blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full
                          bg-violet-500/5 blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-500/20
                            bg-primary-500/5 text-primary-400 text-xs font-semibold mb-8">
              <Zap className="w-3.5 h-3.5" />
              AI-Powered Clip Generation
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              <span className="text-zinc-100">Turn Videos Into</span>
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Viral Clips
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Paste a YouTube link. AI finds the most engaging moments, crops for mobile,
              adds subtitles, and delivers ready-to-post clips in seconds.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/app"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary-600 hover:bg-primary-500
                           text-white text-base font-semibold transition-all shadow-xl shadow-primary-600/30
                           hover:shadow-primary-500/40 hover:-translate-y-0.5"
              >
                <Play className="w-5 h-5" /> Start Clipping — Free
              </Link>
              <a
                href="#features"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-zinc-800
                           text-zinc-300 text-base font-medium hover:bg-zinc-900 hover:text-white transition-all"
              >
                See Features <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-zinc-100"><AnimatedCounter target={3} /></p>
              <p className="text-xs text-zinc-500 mt-1">Detection Modes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-zinc-100"><AnimatedCounter target={9} suffix="+" /></p>
              <p className="text-xs text-zinc-500 mt-1">AI Models Used</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-zinc-100"><AnimatedCounter target={16} suffix="x" /></p>
              <p className="text-xs text-zinc-500 mt-1">Parallel Downloads</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PLATFORMS BAR */}
      <section className="border-y border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-center gap-8 sm:gap-16 flex-wrap">
          <span className="text-xs text-zinc-600 uppercase tracking-widest font-semibold">Export to</span>
          {PLATFORMS.map(p => (
            <div key={p.name} className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-400 font-medium">{p.name}</span>
              <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{p.aspect}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100">
              Everything You Need to Go Viral
            </h2>
            <p className="mt-4 text-zinc-500 max-w-xl mx-auto">
              Powered by cutting-edge AI and video processing tools. No compromises.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6
                             hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color}
                                    flex items-center justify-center shadow-lg opacity-90`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-800 px-2 py-1 rounded-md
                                     border border-zinc-700/50 uppercase tracking-wider">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100">
              Four Steps to Viral Content
            </h2>
            <p className="mt-4 text-zinc-500">From YouTube link to ready-to-post clip in under a minute.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative text-center p-6"
                >
                  <div className="text-5xl font-black text-zinc-800/50 mb-4">{step.step}</div>
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto mb-4
                                  flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-200 mb-2">{step.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{step.description}</p>
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-16 -right-3 text-zinc-800">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="py-24 px-6 border-t border-zinc-800/50 bg-zinc-900/20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100">
              Built With the Best
            </h2>
            <p className="mt-4 text-zinc-500">Enterprise-grade tools, open-source heart.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {TECH_STACK.map(tech => (
              <div
                key={tech.name}
                className="flex items-center gap-4 px-5 py-4 rounded-xl border border-zinc-800
                           bg-zinc-900/50 hover:border-zinc-700 transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{tech.name}</p>
                  <p className="text-xs text-zinc-500">{tech.role}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SPECS BAR */}
      <section className="py-16 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <Clock className="w-5 h-5 text-primary-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-zinc-100">4+ hrs</p>
              <p className="text-xs text-zinc-500 mt-1">Max Video Length</p>
            </div>
            <div className="text-center p-4">
              <Layers className="w-5 h-5 text-primary-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-zinc-100">20 URLs</p>
              <p className="text-xs text-zinc-500 mt-1">Per Batch</p>
            </div>
            <div className="text-center p-4">
              <Shield className="w-5 h-5 text-primary-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-zinc-100">1080p</p>
              <p className="text-xs text-zinc-500 mt-1">Output Quality</p>
            </div>
            <div className="text-center p-4">
              <Star className="w-5 h-5 text-primary-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-zinc-100">10 Clips</p>
              <p className="text-xs text-zinc-500 mt-1">Per Video</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-zinc-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600
                            flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-500/20">
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
              Ready to Create Viral Clips?
            </h2>
            <p className="text-zinc-500 mb-8 text-lg">
              No sign-up needed. Paste a link and start clipping.
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-primary-600 hover:bg-primary-500
                         text-white text-lg font-semibold transition-all shadow-xl shadow-primary-600/30
                         hover:shadow-primary-500/40 hover:-translate-y-0.5"
            >
              Launch HookClip <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-semibold text-zinc-400">HookClip</span>
          </div>
          <p className="text-xs text-zinc-600">Built with AI. Designed for creators.</p>
        </div>
      </footer>
    </div>
  );
}
