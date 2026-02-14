'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, LogOut, BarChart3, Activity, AlertTriangle, HardDrive,
  RefreshCw, Trash2, RotateCcw, Terminal, ChevronLeft, ChevronRight,
  Server, Layers, Scissors, Cpu, Database, Clock, Shield
} from 'lucide-react';
import {
  type AdminStats, type AdminJob, type AdminJobsResponse, type SystemInfo, type LogsResponse,
  fetchStats, fetchJobs, retryJob, deleteJob, triggerCleanup, fetchSystem, fetchLogs, verifyAdminKey
} from '@/lib/admin-api';

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    active: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    downloading: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    analyzing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    clipping: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    transcribing: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    face_tracking: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    subtitling: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    waiting: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    queued: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };
  const c = colors[status] || colors.waiting;
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c}`}>
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// UsageBar
// ---------------------------------------------------------------------------

function UsageBar({
  label,
  value,
  max,
  color,
  formatFn,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  formatFn?: (n: number) => string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const fmt = formatFn || ((n: number) => n.toString());
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300 font-medium">
          {fmt(value)} / {fmt(max)}
        </span>
      </div>
      <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Page
// ---------------------------------------------------------------------------

export default function AdminPage() {
  // Auth
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'system' | 'logs'>('overview');

  // Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [jobs, setJobs] = useState<AdminJobsResponse | null>(null);
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Jobs tab
  const [jobFilter, setJobFilter] = useState('all');
  const [jobPage, setJobPage] = useState(1);

  // Logs tab
  const [logLines, setLogLines] = useState(100);
  const logRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Auth check on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const key = sessionStorage.getItem('admin-key');
    if (key) {
      verifyAdminKey(key).then((ok) => {
        setAuthenticated(ok);
        if (!ok) sessionStorage.removeItem('admin-key');
        setAuthLoading(false);
      });
    } else {
      setAuthLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Login handler
  // ---------------------------------------------------------------------------

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    const ok = await verifyAdminKey(password);
    if (ok) {
      sessionStorage.setItem('admin-key', password);
      setAuthenticated(true);
    } else {
      setAuthError('Invalid password');
    }
  }

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  // Stats refresh every 10s
  useEffect(() => {
    if (!authenticated) return;
    const load = () => fetchStats().then(setStats).catch(console.error);
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [authenticated]);

  // Tab-specific data
  const refreshTabData = useCallback(() => {
    if (!authenticated) return;
    if (activeTab === 'jobs') fetchJobs(jobFilter, jobPage).then(setJobs).catch(console.error);
    else if (activeTab === 'system') fetchSystem().then(setSystem).catch(console.error);
    else if (activeTab === 'logs') fetchLogs(logLines).then(setLogs).catch(console.error);
  }, [authenticated, activeTab, jobFilter, jobPage, logLines]);

  useEffect(() => {
    refreshTabData();
  }, [refreshTabData]);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleLogout() {
    sessionStorage.removeItem('admin-key');
    setAuthenticated(false);
  }

  async function handleCleanup() {
    setLoading(true);
    try {
      const result = await triggerCleanup();
      alert(`Cleanup done: ${result.removed} files removed`);
      fetchStats().then(setStats);
    } catch (err: any) {
      alert(err.message);
    }
    setLoading(false);
  }

  async function handleRetryAll() {
    setLoading(true);
    try {
      const failed = await fetchJobs('failed', 1, 100);
      let count = 0;
      for (const job of failed.jobs) {
        await retryJob(job.id);
        count++;
      }
      alert(`${count} jobs queued for retry`);
      fetchStats().then(setStats);
      refreshTabData();
    } catch (err: any) {
      alert(err.message);
    }
    setLoading(false);
  }

  async function handleRetry(id: string) {
    await retryJob(id);
    refreshTabData();
    fetchStats().then(setStats);
  }

  async function handleDelete(id: string) {
    await deleteJob(id);
    refreshTabData();
    fetchStats().then(setStats);
  }

  // ---------------------------------------------------------------------------
  // Render: loading spinner
  // ---------------------------------------------------------------------------

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Scissors className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: password gate
  // ---------------------------------------------------------------------------

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/50">
            <div className="flex flex-col items-center gap-6">
              <div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10
                            flex items-center justify-center border border-primary-500/20"
              >
                <Shield className="w-8 h-8 text-primary-400" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-zinc-100">HookClip Admin</h1>
                <p className="text-sm text-zinc-500 mt-1">Enter password to continue</p>
              </div>
              <form onSubmit={handleLogin} className="w-full space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700
                             text-sm text-zinc-200 placeholder:text-zinc-600
                             focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
                             transition-all"
                />
                {authError && (
                  <p className="text-sm text-red-400 text-center">{authError}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500
                             text-white text-sm font-semibold transition-all
                             shadow-lg shadow-primary-600/20"
                >
                  Sign In
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: authenticated dashboard
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* HEADER */}
      <div className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10
                          flex items-center justify-center border border-primary-500/20"
            >
              <Scissors className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-100">
                Hook<span className="text-primary-400">Clip</span>
                <span className="text-zinc-600 font-normal ml-2 text-sm">Admin</span>
              </h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400
                       hover:text-zinc-200 hover:bg-zinc-800 transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* STATS CARDS */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Jobs */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <Layers className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{stats.total}</p>
                <p className="text-xs text-zinc-500">Total Jobs</p>
              </div>
            </div>

            {/* Active Now */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0 relative">
                <Activity className="w-6 h-6 text-yellow-400" />
                {stats.active > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{stats.active}</p>
                <p className="text-xs text-zinc-500">Active Now</p>
              </div>
            </div>

            {/* Failed */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
                <p className="text-xs text-zinc-500">Failed</p>
              </div>
            </div>

            {/* Disk Usage */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <HardDrive className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{formatBytes(stats.diskUsage)}</p>
                <p className="text-xs text-zinc-500">Disk Usage</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB BAR */}
        <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800 w-fit">
          {([
            { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
            { id: 'jobs' as const, label: 'Jobs', icon: Layers },
            { id: 'system' as const, label: 'System', icon: Server },
            { id: 'logs' as const, label: 'Logs', icon: Terminal },
          ]).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* ----------------------------------------------------------- */}
            {/* OVERVIEW TAB                                                 */}
            {/* ----------------------------------------------------------- */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Jobs Today</p>
                    </div>
                    <p className="text-3xl font-bold text-zinc-100">{stats.jobsToday}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-zinc-500" />
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Avg Processing</p>
                    </div>
                    <p className="text-3xl font-bold text-zinc-100">
                      {formatDuration(stats.avgProcessingTime)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-zinc-500" />
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Success Rate</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-400">
                      {stats.total > 0
                        ? ((stats.completed / stats.total) * 100).toFixed(1)
                        : '0'}
                      %
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCleanup}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700
                               text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white
                               disabled:opacity-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Force Cleanup
                  </button>
                  <button
                    onClick={handleRetryAll}
                    disabled={loading || stats.failed === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700
                               text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white
                               disabled:opacity-50 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" /> Retry All Failed ({stats.failed})
                  </button>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* JOBS TAB                                                     */}
            {/* ----------------------------------------------------------- */}
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                {/* Filter pills */}
                <div className="flex gap-2">
                  {['all', 'active', 'completed', 'failed', 'waiting'].map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setJobFilter(f);
                        setJobPage(1);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                        jobFilter === f
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                  <button
                    onClick={refreshTabData}
                    className="ml-auto p-2 rounded-lg hover:bg-zinc-800 text-zinc-400
                               hover:text-zinc-200 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/80">
                        <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                          Video
                        </th>
                        <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                          Platform
                        </th>
                        <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                          Clips
                        </th>
                        <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs?.jobs.map((job) => (
                        <tr
                          key={job.id}
                          className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="px-4 py-3.5 text-zinc-500 font-mono text-xs">
                            #{job.id}
                          </td>
                          <td className="px-4 py-3.5 text-zinc-200 max-w-[240px] truncate font-medium">
                            {job.videoTitle}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={job.status} />
                          </td>
                          <td className="px-4 py-3.5 text-zinc-400 capitalize">{job.platform}</td>
                          <td className="px-4 py-3.5 text-zinc-400">{job.clipCount}</td>
                          <td className="px-4 py-3.5 text-zinc-500 text-xs">
                            {formatDate(job.createdAt)}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-1">
                              {job.status === 'failed' && (
                                <button
                                  onClick={() => handleRetry(job.id)}
                                  title="Retry"
                                  className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-zinc-500
                                             hover:text-yellow-400 transition-all"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(job.id)}
                                title="Delete"
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500
                                           hover:text-red-400 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(!jobs || jobs.jobs.length === 0) && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-12 text-center text-zinc-600 text-sm"
                          >
                            No jobs found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {jobs && jobs.total > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-600">{jobs.total} total jobs</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setJobPage((p) => Math.max(1, p - 1))}
                        disabled={jobPage <= 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                   bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-all"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                      </button>
                      <span className="px-3 py-1.5 text-xs text-zinc-500">Page {jobPage}</span>
                      <button
                        onClick={() => setJobPage((p) => p + 1)}
                        disabled={jobPage * 20 >= jobs.total}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                   bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-all"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SYSTEM TAB                                                   */}
            {/* ----------------------------------------------------------- */}
            {activeTab === 'system' && system && (
              <div className="space-y-6">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
                  <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-zinc-500" /> Resource Usage
                  </h3>
                  <UsageBar
                    label="CPU"
                    value={system.cpu.usage}
                    max={100}
                    color="bg-gradient-to-r from-primary-600 to-primary-400"
                    formatFn={(n) => `${n.toFixed(1)}%`}
                  />
                  <UsageBar
                    label="Memory"
                    value={system.memory.used}
                    max={system.memory.total}
                    color="bg-gradient-to-r from-emerald-600 to-emerald-400"
                    formatFn={formatBytes}
                  />
                  <UsageBar
                    label="Disk (Downloads)"
                    value={system.disk.downloads}
                    max={system.disk.downloads + 1073741824}
                    color="bg-gradient-to-r from-orange-600 to-orange-400"
                    formatFn={formatBytes}
                  />
                  <UsageBar
                    label="Disk (Output)"
                    value={system.disk.output}
                    max={system.disk.output + 1073741824}
                    color="bg-gradient-to-r from-amber-600 to-amber-400"
                    formatFn={formatBytes}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Uptime</p>
                    </div>
                    <p className="text-xl font-bold text-zinc-100">
                      {formatUptime(system.uptime)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-4 h-4 text-zinc-500" />
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">CPU Cores</p>
                    </div>
                    <p className="text-xl font-bold text-zinc-100">{system.cpu.cores}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-zinc-500" />
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Redis</p>
                    </div>
                    <p className="text-xl font-bold text-zinc-100">{system.redis}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-4">Dependencies</h3>
                  <div className="space-y-0">
                    {Object.entries(system.dependencies).map(([name, version]) => (
                      <div
                        key={name}
                        className="flex justify-between items-center py-3 border-b border-zinc-800/50 last:border-0"
                      >
                        <span className="text-sm text-zinc-400">{name}</span>
                        <span
                          className={`text-sm font-mono px-2.5 py-0.5 rounded-md ${
                            version === 'not found'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {version}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* LOGS TAB                                                     */}
            {/* ----------------------------------------------------------- */}
            {activeTab === 'logs' && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-500">
                      {logs?.total || 0} total entries
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[50, 100, 200].map((n) => (
                      <button
                        key={n}
                        onClick={() => setLogLines(n)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          logLines === n
                            ? 'bg-primary-600 text-white'
                            : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => fetchLogs(logLines).then(setLogs)}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-all ml-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Log content */}
                <div
                  ref={logRef}
                  className="h-[600px] overflow-y-auto p-4 font-mono text-[12px] leading-6 bg-zinc-950/50
                             scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
                >
                  {logs?.lines.map((line, i) => {
                    let parsed: Record<string, string> = {};
                    try {
                      parsed = JSON.parse(line);
                    } catch {
                      // not JSON, use raw line
                    }
                    const level = parsed.level || 'info';
                    const levelColor =
                      level === 'error'
                        ? 'text-red-400'
                        : level === 'warn'
                          ? 'text-yellow-400'
                          : 'text-zinc-600';
                    const msgColor =
                      level === 'error'
                        ? 'text-red-300'
                        : level === 'warn'
                          ? 'text-yellow-200'
                          : 'text-zinc-400';
                    return (
                      <div
                        key={i}
                        className="py-0.5 hover:bg-zinc-900/80 px-2 -mx-2 rounded"
                      >
                        {parsed.timestamp && (
                          <span className="text-zinc-700 mr-3">
                            {new Date(parsed.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                        <span
                          className={`mr-3 uppercase font-bold text-[10px] ${levelColor}`}
                        >
                          {level.padEnd(5)}
                        </span>
                        <span className={msgColor}>{parsed.message || line}</span>
                      </div>
                    );
                  })}
                  {(!logs || logs.lines.length === 0) && (
                    <div className="text-zinc-700 text-center py-12">No log entries</div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
