'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  Radio,
  UploadCloud,
  ArrowLeft,
  RefreshCw,
  Play,
  Square,
  Folder,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  Copy,
  ChevronDown,
  Sparkles,
  Info,
  Check,
  ExternalLink,
  Cloud
} from 'lucide-react';
import {
  c2cClient,
  ShootSession,
  ProjectRecord,
  AgentStatusResponse,
  QueueTask,
  PhotoRecord
} from '@/lib/api-client';

export default function PhotographerDashboard() {
  // Session & Project State
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [sessions, setSessions] = useState<ShootSession[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj_fashion_week_2026');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('session-pfw-2026');

  // Google Drive & Cloud State
  const [gdriveStatus, setGDriveStatus] = useState<{
    provider: string;
    root_folder_id: string;
    target_folder_name?: string;
    mode: string;
    authenticated: boolean;
  } | null>(null);
  const [storageProvider, setStorageProvider] = useState<'google_drive' | 's3'>('google_drive');

  // Agent & Sync State
  const [agentStatus, setAgentStatus] = useState<AgentStatusResponse | null>(null);
  const [watchPath, setWatchPath] = useState<string>('./sample_hotfolder');
  const [isEditingPath, setIsEditingPath] = useState<boolean>(false);
  const [selectedAdapterId, setSelectedAdapterId] = useState<string>('adapter-hotfolder-tether');
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Queue & Photos State
  const [queueTasks, setQueueTasks] = useState<QueueTask[]>([]);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [projs, sessList, agent, queueData, photosList, gdrive] = await Promise.allSettled([
        c2cClient.getProjects(),
        c2cClient.getSessions(),
        c2cClient.getAgentStatus(),
        c2cClient.getAgentQueue(),
        c2cClient.getPhotos(selectedSessionId),
        c2cClient.getGDriveStatus(),
      ]);

      if (projs.status === 'fulfilled' && projs.value.length > 0) {
        setProjects(projs.value);
      }
      if (sessList.status === 'fulfilled' && sessList.value.length > 0) {
        setSessions(sessList.value);
      }
      if (agent.status === 'fulfilled') {
        setAgentStatus(agent.value);
        if (agent.value.watch_path && !isEditingPath) {
          setWatchPath(agent.value.watch_path);
        }
        if (agent.value.active_session_id && agent.value.active_session_id !== '') {
          setSelectedSessionId(agent.value.active_session_id);
        }
        if (agent.value.adapter_id) {
          setSelectedAdapterId(agent.value.adapter_id);
        }
      }
      if (queueData.status === 'fulfilled') {
        setQueueTasks(queueData.value.tasks || []);
      }
      if (photosList.status === 'fulfilled') {
        setPhotos(photosList.value || []);
      }
      if (gdrive.status === 'fulfilled') {
        setGDriveStatus(gdrive.value);
      }
    } catch (err) {
      console.warn('Polling error:', err);
    }
  };

  // Setup SSE stream and polling fallback
  useEffect(() => {
    fetchData();

    // 1. Polling fallback every 2.5 seconds
    const interval = setInterval(fetchData, 2500);

    // 2. Server-Sent Events (SSE) listener
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('http://localhost:8080/api/v1/events');

      eventSource.addEventListener('photo:uploading', () => {
        fetchData();
      });

      eventSource.addEventListener('photo:preview_ready', () => {
        fetchData();
      });

      eventSource.addEventListener('photo:completed', () => {
        fetchData();
      });

      eventSource.addEventListener('agent:status', () => {
        fetchData();
      });
    } catch (e) {
      console.warn('SSE connection failed, falling back to polling');
    }

    return () => {
      clearInterval(interval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [selectedSessionId]);

  // Handler: Start Sync
  const handleStartSync = async () => {
    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const res = await c2cClient.startAgentSync({
        watch_path: watchPath,
        session_id: selectedSessionId,
        project_id: selectedProjectId,
        adapter_id: selectedAdapterId,
      });
      setActionMessage(res.message || 'Sync berhasil dijalankan');
      await fetchData();
    } catch (err: any) {
      setActionMessage('Gagal memulai sync: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handler: Stop Sync
  const handleStopSync = async () => {
    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const res = await c2cClient.stopAgentSync();
      setActionMessage(res.message || 'Sync dihentikan');
      await fetchData();
    } catch (err: any) {
      setActionMessage('Gagal menghentikan sync: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handler: Update Folder or Session Config
  const handleSaveConfig = async () => {
    setIsActionLoading(true);
    try {
      await c2cClient.updateAgentConfig({
        watch_path: watchPath,
        session_id: selectedSessionId,
        project_id: selectedProjectId,
        adapter_id: selectedAdapterId,
      });
      setIsEditingPath(false);
      setActionMessage('Konfigurasi sync diperbarui');
      await fetchData();
    } catch (err: any) {
      setActionMessage('Gagal update konfigurasi: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const activeSessionObj = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  const isSyncActive = agentStatus?.is_running === true;
  const isAgentOnline = agentStatus?.status === 'online';

  // Metrics computation
  const totalCompleted = photos.length;
  const inQueueCount = queueTasks.filter((t) => t.status === 'queued' || t.status === 'processing').length;
  const retryingCount = queueTasks.filter((t) => t.status === 'retrying').length;
  const duplicateSkippedCount = queueTasks.filter((t) => t.status === 'duplicate_skipped').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Modern Glass Header Bar (Light Mode) */}
      <header className="h-16 border-b border-slate-200/80 bg-white/85 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                <Camera className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900 tracking-tight">
                {activeSessionObj ? activeSessionObj.title : 'Live Shoot Session'}
              </span>
            </div>

            {/* Sync Status Badge (Light Mode Pills) */}
            {isSyncActive ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                LIVE TETHER SYNCING
              </span>
            ) : isAgentOnline ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                SYNC PAUSED (READY)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                AGENT OFFLINE
              </span>
            )}
          </div>
        </div>

        {/* Right Header Status */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-emerald-800 bg-emerald-50/90 px-3 py-1.5 rounded-lg border border-emerald-200/80 flex items-center gap-2 shadow-xs">
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Drive: {gdriveStatus?.authenticated ? 'Cloud Sync Online' : 'Resumable Ingest Active'}</span>
          </div>

          <button
            onClick={fetchData}
            title="Refresh data"
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Flash Message Banner */}
        {actionMessage && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-indigo-900 shadow-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-medium">{actionMessage}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-slate-700 font-mono text-xs ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* 3. Modern Control Panel: Tether Source, Session Selection, Adapter & Start/Stop */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
          {/* Top Gradient Stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Radio className="w-4 h-4" />
                </div>
                <span>Kontrol Sinkronisasi Kamera ke Google Drive</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1 pl-9">
                Local Sync Agent (Go) memantau hotfolder tethering kamera, memvalidasi file selesai ditulis, dan mengunggah langsung ke Google Drive via Google Drive v3 Resumable Upload protocol.
              </p>
            </div>

            {/* Big Action Button: Start / Stop */}
            <div className="flex items-center gap-2 pl-9 lg:pl-0">
              {isSyncActive ? (
                <button
                  onClick={handleStopSync}
                  disabled={isActionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{isActionLoading ? 'Memproses...' : 'Hentikan Sync (Pause)'}</span>
                </button>
              ) : (
                <button
                  onClick={handleStartSync}
                  disabled={isActionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-sm hover:shadow-indigo-500/25 active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isActionLoading ? 'Memproses...' : 'Mulai Sync (Start Tether)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Configuration Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
            {/* Control A: Folder Sumber Hotfolder */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-indigo-600" />
                <span>Folder Sumber Foto (Hotfolder)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={watchPath}
                  onChange={(e) => {
                    setWatchPath(e.target.value);
                    setIsEditingPath(true);
                  }}
                  className="flex-1 bg-slate-50 hover:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none transition-all shadow-xs"
                  placeholder="./sample_hotfolder"
                />
                {isEditingPath && (
                  <button
                    onClick={handleSaveConfig}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                  >
                    Simpan
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Folder output software tethering (Capture One, EOS Utility, Sony Imaging Edge, atau DCIM).
              </p>
            </div>

            {/* Control B: Pilihan Sesi & Proyek Aktif */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Proyek & Sesi Foto Aktif</span>
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => {
                  setSelectedSessionId(e.target.value);
                  c2cClient.updateAgentConfig({ session_id: e.target.value });
                }}
                className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-all shadow-xs"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.location})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                Foto akan dialokasikan ke folder sesi Google Drive: <code className="text-emerald-600 font-semibold font-mono">Shoot - {activeSessionObj?.title || 'Session'}</code>.
              </p>
            </div>

            {/* Control C: Arsitektur Adapter Kamera */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>Camera Adapter (Pluggable)</span>
              </label>
              <select
                value={selectedAdapterId}
                onChange={(e) => {
                  setSelectedAdapterId(e.target.value);
                  c2cClient.updateAgentConfig({ adapter_id: e.target.value });
                }}
                className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-all shadow-xs"
              >
                <option value="adapter-hotfolder-tether">
                  Hotfolder Ingestion (Capture One / EOS Utility / DCIM)
                </option>
                <option value="adapter-usb-ptp-mtp">
                  Direct USB PTP/MTP Protocol (Hardware Tether)
                </option>
                <option value="sony_camera_remote_sdk">
                  Sony Camera Remote SDK (Native Control)
                </option>
                <option value="canon_edsdk">
                  Canon EDSDK Adapter
                </option>
                <option value="nikon_sdk">
                  Nikon Camera Control SDK
                </option>
              </select>
              <p className="text-[11px] text-slate-400">
                Arsitektur adapter modular memungkinkan integrasi SDK kamera langsung di masa depan.
              </p>
            </div>
          </div>

          {/* Google Drive Destination Highlight Banner (Light Mode) */}
          <div className="mt-3 bg-gradient-to-r from-emerald-50/80 to-sky-50/60 border border-emerald-200/70 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-700">Google Drive Destination: </span>
                <span className="font-mono text-emerald-700 font-bold">
                  {gdriveStatus?.target_folder_name || `Shoot - ${activeSessionObj?.title || 'Paris Fashion Week Runway Shoot'}`}
                </span>
                <span className="text-[11px] text-slate-400 ml-2 font-mono">
                  (Parent ID: {gdriveStatus?.root_folder_id || 'lensync-c2c-master-root'})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Protokol:</span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-emerald-200 text-emerald-800 font-mono text-[10px] font-semibold flex items-center gap-1 shadow-xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Google Drive v3 Resumable Stream
              </span>
            </div>
          </div>
        </div>

        {/* 4. Metric Cards (Modern Light Cards with Soft Shadows) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Foto Masuk</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {totalCompleted + inQueueCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Disinkronkan dari tethering kamera</div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Tersimpan di Google Drive</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Cloud className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-2">
              {totalCompleted}
            </div>
            <div className="text-[11px] text-emerald-600/80 font-medium mt-1">Google Drive Resumable Stream OK</div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Antrean Upload Aktif</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-amber-600 mt-2">
              {inQueueCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Antrean persisten (crash-safe)</div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Duplikat Dicegah / Retrying</span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-sky-600 mt-2">
              {duplicateSkippedCount + retryingCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Deduplikasi SHA-256 & backoff</div>
          </div>
        </div>

        {/* 5. Two-column Layout: Upload Queue & Live Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Persistent Upload Queue (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col h-[560px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Antrean Upload Persisten</h3>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-xs">
                {queueTasks.length} total tasks
              </span>
            </div>

            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {queueTasks.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="font-medium text-slate-600">Belum ada foto dalam antrean upload.</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Kamera yang memotret ke folder <code className="text-indigo-600 font-mono font-semibold">{watchPath}</code> akan otomatis masuk ke sini.
                  </p>
                </div>
              ) : (
                queueTasks.map((t) => (
                  <div key={t.id} className="p-3.5 hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-900 truncate">
                            {t.photo.file_name}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {t.photo.extension.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-3">
                          <span>{(t.photo.size_bytes / (1024 * 1024)).toFixed(1)} MB</span>
                          <span className="text-slate-400">SHA: {t.id.slice(0, 8)}</span>
                        </div>
                      </div>

                      {/* Status Badges (Light Mode) */}
                      <div className="shrink-0">
                        {t.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Uploaded (Drive)</span>
                          </span>
                        )}
                        {t.status === 'processing' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full animate-pulse shadow-xs">
                            <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                            <span>Uploading Drive</span>
                          </span>
                        )}
                        {t.status === 'queued' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full shadow-xs">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Queued</span>
                          </span>
                        )}
                        {t.status === 'retrying' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full shadow-xs">
                            <RefreshCw className="w-3 h-3 text-orange-600" />
                            <span>Retry #{t.retry_count}</span>
                          </span>
                        )}
                        {t.status === 'duplicate_skipped' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full shadow-xs">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span>Deduplicated</span>
                          </span>
                        )}
                        {t.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full shadow-xs">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Failed</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {t.error_message && (
                      <p className="text-[11px] text-rose-600 font-mono mt-1.5 truncate bg-rose-50 p-1.5 rounded-md border border-rose-100">
                        Err: {t.error_message}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Live Photo Gallery & EXIF Inspector (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col h-[560px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Live Ingestion Gallery</h3>
                <p className="text-[11px] text-slate-500">Foto masuk langsung dari kamera dan tersinkron ke Google Drive</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-xs">
                {photos.length} foto di Drive
              </span>
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {photos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <Camera className="w-7 h-7" />
                  </div>
                  <p className="font-medium text-slate-600">Belum ada foto yang tersimpan di Google Drive untuk sesi ini.</p>
                  <p className="text-[11px] text-slate-400">Ambil foto melalui tethering kamera untuk memulai sinkronisasi.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {photos.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPhoto(p)}
                      className={`group relative bg-white border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md ${
                        selectedPhoto?.id === p.id
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {/* Image Thumbnail / Card Header with Fast RAW Preview */}
                      <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50/30 relative overflow-hidden flex items-center justify-center">
                        {p.preview_url ? (
                          <img
                            src={p.preview_url.startsWith('http') ? p.preview_url : `http://localhost:8080${p.preview_url}`}
                            alt={p.original_filename}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Camera className="w-8 h-8 text-slate-300 group-hover:scale-110 group-hover:text-indigo-400 transition-all duration-300" />
                        )}

                        {/* Format Badge */}
                        <div className="absolute top-2 left-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-slate-700 border border-slate-200 shadow-xs">
                            {p.file_format}
                          </span>
                        </div>

                        {/* Dual Stream Status Badge */}
                        {p.upload_status === 'preview_ready' ? (
                          <div className="absolute top-2 right-2 bg-amber-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-sm animate-pulse" title="Preview instan siap (<1s), RAW sedang diunggah ke Google Drive">
                            <Sparkles className="w-3 h-3 text-yellow-200" />
                            <span>Preview Siap</span>
                          </div>
                        ) : (
                          <div className="absolute top-2 right-2 bg-emerald-600 text-white p-1 rounded-md shadow-xs" title="Tersimpan di Google Drive">
                            <Cloud className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Photo Metadata Footer */}
                      <div className="p-3 text-xs">
                        <p className="font-bold text-slate-900 truncate text-[11px]">
                          {p.original_filename}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate font-medium">
                          {p.camera_model || 'Sony α7 IV'}
                        </p>

                        {/* Action: Open in Google Drive */}
                        {p.gdrive_view_link ? (
                          <a
                            href={p.gdrive_view_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[10px] text-emerald-800 font-semibold transition-colors shadow-xs"
                          >
                            <ExternalLink className="w-3 h-3 text-emerald-600" />
                            <span>Buka di Google Drive</span>
                          </a>
                        ) : (
                          <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>{(p.file_size_bytes / (1024 * 1024)).toFixed(1)} MB</span>
                            <span className="text-amber-600 font-medium">Syncing RAW...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Photo EXIF Drawer (Light Mode with Instant Preview) */}
            {selectedPhoto && (
              <div className="border-t border-slate-200 bg-slate-50/95 backdrop-blur-sm p-4 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
                <div className="flex items-start gap-4">
                  {/* Photo Preview Mini-Thumbnail in Drawer */}
                  {selectedPhoto.preview_url && (
                    <div className="w-20 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-xs shrink-0 bg-slate-100">
                      <img
                        src={selectedPhoto.preview_url.startsWith('http') ? selectedPhoto.preview_url : `http://localhost:8080${selectedPhoto.preview_url}`}
                        alt={selectedPhoto.original_filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{selectedPhoto.original_filename}</span>
                      {selectedPhoto.upload_status === 'preview_ready' ? (
                        <span className="text-amber-800 bg-amber-50 border border-amber-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                          <Sparkles className="w-3 h-3 text-amber-600" /> Preview Siap (RAW Mengunggah...)
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> RAW Terkonfirmasi di Google Drive
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-1">
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">Kamera: {selectedPhoto.camera_make} {selectedPhoto.camera_model}</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">Lensa: {selectedPhoto.lens_model || 'FE 24-70mm F2.8 GM II'}</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">Aperture: {selectedPhoto.aperture_f_stop ? `f/${selectedPhoto.aperture_f_stop}` : 'f/2.8'}</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">Shutter: {selectedPhoto.shutter_speed_str || '1/500s'}</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">ISO: {selectedPhoto.iso_speed || 100}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                      <span>Drive File ID: <code className="text-emerald-700 font-bold font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{selectedPhoto.gdrive_file_id || 'syncing_in_background...'}</code></span>
                      <span>SHA-256: <code className="font-mono">{selectedPhoto.sha256_hash.slice(0, 16)}...</code></span>
                      <button
                        onClick={() => handleCopyHash(selectedPhoto.sha256_hash)}
                        className="hover:text-slate-900 text-slate-500 flex items-center gap-1"
                      >
                        {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {selectedPhoto.gdrive_view_link && (
                    <a
                      href={selectedPhoto.gdrive_view_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-sm hover:shadow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka di Google Drive</span>
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-semibold text-xs shadow-xs transition-colors"
                  >
                    Tutup Info
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
