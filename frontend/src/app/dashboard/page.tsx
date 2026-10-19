'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Copy,
  Sparkles,
  Info,
  Check,
  ExternalLink,
  Cloud,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import {
  c2cClient,
  ShootSession,
  ProjectRecord,
  AgentStatusResponse,
  QueueTask,
  PhotoRecord,
} from '@/lib/api-client';
import { Button, Badge, Card } from '@/components/design-system';

export default function PhotographerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

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
    <div className="min-h-screen bg-gray-50/50 text-gray-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* 1. Header Bar — Untitled UI Glass Header */}
      <header className="h-16 border-b border-gray-200/80 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button
              variant="secondary"
              size="sm"
              iconLeading={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Kembali ke Beranda
            </Button>
          </Link>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                <Camera className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm text-gray-900 tracking-tight">
                {activeSessionObj ? activeSessionObj.title : 'Live Shoot Session'}
              </span>
            </div>

            {/* Sync Status Badge — Untitled UI Badge */}
            <Badge
              variant={isSyncActive ? 'success' : isAgentOnline ? 'warning' : 'error'}
              dot={true}
              size="md"
            >
              {isSyncActive
                ? 'LIVE TETHER SYNCING'
                : isAgentOnline
                ? 'SYNC PAUSED (READY)'
                : 'AGENT OFFLINE'}
            </Badge>
          </div>
        </div>

        {/* Right Header Status */}
        <div className="flex items-center gap-3">
          <Badge
            variant="success"
            size="md"
            iconLeading={<Cloud className="w-3.5 h-3.5" />}
            className="hidden sm:inline-flex"
          >
            Google Drive: {gdriveStatus?.authenticated ? 'Cloud Sync Online' : 'Resumable Ingest Active'}
          </Badge>

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchData}
            title="Refresh data"
            aria-label="Refresh data"
            iconLeading={<RefreshCw className={`w-3.5 h-3.5 ${isActionLoading ? 'animate-spin' : ''}`} />}
          />

          {/* User Profile & Logout */}
          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="flex items-center gap-2">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-gray-900 leading-tight truncate max-w-[140px]">
                    {user.full_name}
                  </div>
                  <div className="text-[11px] text-gray-500 capitalize truncate max-w-[140px]">
                    {user.studio_name || user.role}
                  </div>
                </div>
              </div>

              <Button
                variant="tertiary"
                size="sm"
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                title="Keluar dari akun (Logout)"
                aria-label="Logout"
                iconLeading={<LogOut className="w-3.5 h-3.5 text-gray-500 hover:text-rose-600" />}
              >
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="primary" size="sm">
                Masuk
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Flash Message Banner */}
        {actionMessage && (
          <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-indigo-900 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-medium">{actionMessage}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-gray-400 hover:text-gray-700 font-mono text-xs ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* 3. Untitled UI Control Panel Card */}
        <Card variant="default" padding="lg" className="space-y-6 relative overflow-hidden border border-gray-200/80 shadow-xs">
          {/* Top Subtle Indigo Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Radio className="w-4 h-4" />
                </div>
                <span>Kontrol Sinkronisasi Kamera ke Google Drive</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1 pl-10.5">
                Local Sync Agent (Go) memantau hotfolder tethering kamera, memvalidasi file selesai ditulis, dan mengunggah langsung ke Google Drive via Google Drive v3 Resumable Upload protocol.
              </p>
            </div>

            {/* Start / Stop Button */}
            <div className="flex items-center gap-2 pl-10.5 lg:pl-0">
              {isSyncActive ? (
                <Button
                  variant="destructive"
                  size="md"
                  onClick={handleStopSync}
                  isLoading={isActionLoading}
                  iconLeading={<Square className="w-3.5 h-3.5 fill-current" />}
                >
                  Hentikan Sync (Pause)
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStartSync}
                  isLoading={isActionLoading}
                  iconLeading={<Play className="w-3.5 h-3.5 fill-current" />}
                >
                  Mulai Sync (Start Tether)
                </Button>
              )}
            </div>
          </div>

          {/* Configuration Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
            {/* Control A: Folder Sumber Hotfolder */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
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
                  className="flex-1 rounded-lg border border-gray-300 text-xs font-mono text-gray-900 bg-white placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 py-2 px-3.5 shadow-xs transition-colors focus:outline-none"
                  placeholder="./sample_hotfolder"
                />
                {isEditingPath && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveConfig}
                    isLoading={isActionLoading}
                  >
                    Simpan
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-gray-500">
                Folder output software tethering (Capture One, EOS Utility, Sony Imaging Edge, atau DCIM).
              </p>
            </div>

            {/* Control B: Pilihan Sesi & Proyek Aktif */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Proyek & Sesi Foto Aktif</span>
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => {
                  setSelectedSessionId(e.target.value);
                  c2cClient.updateAgentConfig({ session_id: e.target.value });
                }}
                className="w-full rounded-lg border border-gray-300 text-xs font-medium text-gray-900 bg-white hover:border-gray-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 py-2 px-3.5 shadow-xs transition-colors focus:outline-none"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.location})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500">
                Foto akan dialokasikan ke folder sesi Google Drive: <code className="text-emerald-700 font-semibold font-mono">Shoot - {activeSessionObj?.title || 'Session'}</code>.
              </p>
            </div>

            {/* Control C: Arsitektur Adapter Kamera */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>Camera Adapter (Pluggable)</span>
              </label>
              <select
                value={selectedAdapterId}
                onChange={(e) => {
                  setSelectedAdapterId(e.target.value);
                  c2cClient.updateAgentConfig({ adapter_id: e.target.value });
                }}
                className="w-full rounded-lg border border-gray-300 text-xs font-medium text-gray-900 bg-white hover:border-gray-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 py-2 px-3.5 shadow-xs transition-colors focus:outline-none"
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
              <p className="text-[11px] text-gray-500">
                Arsitektur adapter modular memungkinkan integrasi SDK kamera langsung di masa depan.
              </p>
            </div>
          </div>

          {/* Google Drive Destination Highlight Banner */}
          <div className="mt-2 bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-gray-700">Google Drive Destination: </span>
                <span className="font-mono text-emerald-700 font-bold">
                  {gdriveStatus?.target_folder_name || `Shoot - ${activeSessionObj?.title || 'Paris Fashion Week Runway Shoot'}`}
                </span>
                <span className="text-[11px] text-gray-500 ml-2 font-mono">
                  (Parent ID: {gdriveStatus?.root_folder_id || 'lensync-c2c-master-root'})
                </span>
              </div>
            </div>
            <Badge variant="success" size="sm" iconLeading={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}>
              Google Drive v3 Resumable Stream
            </Badge>
          </div>
        </Card>

        {/* 4. Metric Cards — Untitled UI Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <Card variant="default" padding="md" className="hover:shadow-sm transition-all border border-gray-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Foto Masuk</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                <Camera className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-gray-900 mt-2 tracking-tight">
              {totalCompleted + inQueueCount}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">Disinkronkan dari tethering kamera</div>
          </Card>

          <Card variant="default" padding="md" className="hover:shadow-sm transition-all border border-gray-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tersimpan di Drive</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                <Cloud className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-2 tracking-tight">
              {totalCompleted}
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-1">Google Drive Resumable Stream OK</div>
          </Card>

          <Card variant="default" padding="md" className="hover:shadow-sm transition-all border border-gray-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Antrean Upload Aktif</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-600 mt-2 tracking-tight">
              {inQueueCount}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">Antrean persisten (crash-safe)</div>
          </Card>

          <Card variant="default" padding="md" className="hover:shadow-sm transition-all border border-gray-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deduplikasi & Retry</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-sky-600 mt-2 tracking-tight">
              {duplicateSkippedCount + retryingCount}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">Deduplikasi SHA-256 & backoff</div>
          </Card>
        </div>

        {/* 5. Two-column Layout: Upload Queue & Live Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Persistent Upload Queue (5 cols) */}
          <Card
            variant="default"
            padding="none"
            className="lg:col-span-5 flex flex-col h-[580px] overflow-hidden border border-gray-200/80 shadow-xs"
          >
            <div className="px-5 py-4 border-b border-gray-200/80 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900">Antrean Upload Persisten</h3>
              </div>
              <Badge variant="gray" size="sm">
                {queueTasks.length} total tasks
              </Badge>
            </div>

            <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
              {queueTasks.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-xs space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-2">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="font-medium text-gray-600">Belum ada foto dalam antrean upload.</p>
                  <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                    Kamera yang memotret ke folder <code className="text-indigo-600 font-mono font-semibold">{watchPath}</code> akan otomatis masuk ke sini.
                  </p>
                </div>
              ) : (
                queueTasks.map((t) => (
                  <div key={t.id} className="p-4 hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-gray-900 truncate">
                            {t.photo.file_name}
                          </span>
                          <Badge variant="gray" size="sm">
                            {t.photo.extension.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-1 flex items-center gap-3">
                          <span>{(t.photo.size_bytes / (1024 * 1024)).toFixed(1)} MB</span>
                          <span className="text-gray-400">SHA: {t.id.slice(0, 8)}</span>
                        </div>
                      </div>

                      {/* Status Badges — Untitled UI Badges */}
                      <div className="shrink-0">
                        {t.status === 'completed' && (
                          <Badge variant="success" size="sm" iconLeading={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}>
                            Uploaded (Drive)
                          </Badge>
                        )}
                        {t.status === 'processing' && (
                          <Badge variant="indigo" size="sm" iconLeading={<RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />}>
                            Uploading Drive
                          </Badge>
                        )}
                        {t.status === 'queued' && (
                          <Badge variant="warning" size="sm" iconLeading={<Clock className="w-3 h-3 text-amber-600" />}>
                            Queued
                          </Badge>
                        )}
                        {t.status === 'retrying' && (
                          <Badge variant="warning" size="sm" iconLeading={<RefreshCw className="w-3 h-3 text-amber-600" />}>
                            Retry #{t.retry_count}
                          </Badge>
                        )}
                        {t.status === 'duplicate_skipped' && (
                          <Badge variant="gray" size="sm" iconLeading={<Sparkles className="w-3 h-3 text-indigo-500" />}>
                            Deduplicated
                          </Badge>
                        )}
                        {t.status === 'failed' && (
                          <Badge variant="error" size="sm" iconLeading={<AlertTriangle className="w-3 h-3 text-rose-600" />}>
                            Failed
                          </Badge>
                        )}
                      </div>
                    </div>

                    {t.error_message && (
                      <p className="text-[11px] text-rose-600 font-mono mt-2 truncate bg-rose-50 p-2 rounded-lg border border-rose-100">
                        Err: {t.error_message}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Right Column: Live Photo Gallery & EXIF Inspector (7 cols) */}
          <Card
            variant="default"
            padding="none"
            className="lg:col-span-7 flex flex-col h-[580px] overflow-hidden border border-gray-200/80 shadow-xs"
          >
            <div className="px-5 py-4 border-b border-gray-200/80 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Live Ingestion Gallery</h3>
                <p className="text-[11px] text-gray-500">Foto masuk langsung dari kamera dan tersinkron ke Google Drive</p>
              </div>
              <Badge variant="success" size="sm">
                {photos.length} foto di Drive
              </Badge>
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {photos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                    <Camera className="w-7 h-7" />
                  </div>
                  <p className="font-medium text-gray-600">Belum ada foto yang tersimpan di Google Drive untuk sesi ini.</p>
                  <p className="text-[11px] text-gray-400">Ambil foto melalui tethering kamera untuk memulai sinkronisasi.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {photos.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPhoto(p)}
                      className={`group relative bg-white border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 shadow-xs hover:shadow-sm ${
                        selectedPhoto?.id === p.id
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                          : 'border-gray-200/80 hover:border-indigo-300'
                      }`}
                    >
                      {/* Image Thumbnail / Card Header with Fast RAW Preview */}
                      <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 via-gray-50 to-indigo-50/20 relative overflow-hidden flex items-center justify-center">
                        {p.preview_url ? (
                          <img
                            src={p.preview_url.startsWith('http') ? p.preview_url : `http://localhost:8080${p.preview_url}`}
                            alt={p.original_filename}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Camera className="w-8 h-8 text-gray-300 group-hover:scale-110 group-hover:text-indigo-400 transition-all duration-300" />
                        )}

                        {/* Format Badge */}
                        <div className="absolute top-2 left-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-sm text-gray-700 border border-gray-200 shadow-xs">
                            {p.file_format}
                          </span>
                        </div>

                        {/* Dual Stream Status Badge */}
                        {p.upload_status === 'preview_ready' ? (
                          <div
                            className="absolute top-2 right-2 bg-amber-500/95 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-sm"
                            title="Preview instan siap (<1s), RAW sedang diunggah ke Google Drive"
                          >
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
                        <p className="font-semibold text-gray-900 truncate text-[11px]">
                          {p.original_filename}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate font-medium">
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
                          <div className="mt-2 pt-1.5 border-t border-gray-100 flex justify-between text-[10px] text-gray-500 font-mono">
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

            {/* Selected Photo EXIF Drawer */}
            {selectedPhoto && (
              <div className="border-t border-gray-200/80 bg-gray-50/80 backdrop-blur-sm p-4 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-4">
                  {/* Photo Preview Mini-Thumbnail in Drawer */}
                  {selectedPhoto.preview_url && (
                    <div className="w-20 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-xs shrink-0 bg-gray-100">
                      <img
                        src={selectedPhoto.preview_url.startsWith('http') ? selectedPhoto.preview_url : `http://localhost:8080${selectedPhoto.preview_url}`}
                        alt={selectedPhoto.original_filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{selectedPhoto.original_filename}</span>
                      {selectedPhoto.upload_status === 'preview_ready' ? (
                        <Badge variant="warning" size="sm" iconLeading={<Sparkles className="w-3 h-3 text-amber-600" />}>
                          Preview Siap (RAW Mengunggah...)
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm" iconLeading={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}>
                          RAW Terkonfirmasi di Google Drive
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-600 flex flex-wrap gap-x-2 gap-y-1">
                      <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-xs">Kamera: {selectedPhoto.camera_make} {selectedPhoto.camera_model}</span>
                      <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-xs">Lensa: {selectedPhoto.lens_model || 'FE 24-70mm F2.8 GM II'}</span>
                      <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-xs">Aperture: {selectedPhoto.aperture_f_stop ? `f/${selectedPhoto.aperture_f_stop}` : 'f/2.8'}</span>
                      <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-xs">Shutter: {selectedPhoto.shutter_speed_str || '1/500s'}</span>
                      <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-xs">ISO: {selectedPhoto.iso_speed || 100}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-3">
                      <span>Drive File ID: <code className="text-emerald-700 font-bold font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">{selectedPhoto.gdrive_file_id || 'syncing_in_background...'}</code></span>
                      <span>SHA-256: <code className="font-mono">{selectedPhoto.sha256_hash.slice(0, 16)}...</code></span>
                      <button
                        onClick={() => handleCopyHash(selectedPhoto.sha256_hash)}
                        className="hover:text-gray-900 text-gray-500 flex items-center gap-1"
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
                    >
                      <Button
                        variant="success"
                        size="sm"
                        iconLeading={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Buka di Google Drive
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedPhoto(null)}
                  >
                    Tutup Info
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
