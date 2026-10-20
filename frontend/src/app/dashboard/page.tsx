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
  Share2,
  Star,
  Heart,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import {
  c2cClient,
  ShootSession,
  ProjectRecord,
  AgentStatusResponse,
  QueueTask,
  PhotoRecord,
  getApiHost,
} from '@/lib/api-client';
import { Button, Badge, Card } from '@/components/design-system';
import { Sidebar, Navbar } from '@/components/dashboard';

export default function PhotographerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Navigation & Layout State
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

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
  const [copiedProofLink, setCopiedProofLink] = useState<boolean>(false);

  // Smooth Navigation Handler
  const handleSelectSection = (section: string) => {
    setActiveSection(section);
    if (section === 'capture' || section === 'agent' || section === 'settings') {
      const el = document.getElementById('section-control-panel');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (section === 'queue') {
      const el = document.getElementById('section-queue');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (section === 'gallery') {
      const el = document.getElementById('section-gallery');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (section === 'storage') {
      const el = document.getElementById('section-storage');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (section === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
      eventSource = new EventSource(`${getApiHost()}/api/v1/events`);

      eventSource.addEventListener('photo:uploading', () => {
        fetchData();
      });

      eventSource.addEventListener('photo:preview_ready', () => {
        fetchData();
      });

      eventSource.addEventListener('photo:completed', () => {
        fetchData();
      });

      eventSource.addEventListener('photo:rating_updated', () => {
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
    <div className="min-h-screen bg-gray-50/50 text-gray-900 flex font-sans selection:bg-indigo-600 selection:text-white">
      {/* 1. Left Sidebar Navigation (Desktop Persistent + Mobile Sliding Drawer) */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        onSelectSession={setSelectedSessionId}
        agentStatus={agentStatus}
        queueCount={inQueueCount}
        photosCount={photos.length}
        gdriveStatus={gdriveStatus}
      />

      {/* 2. Right Main Work Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          activeSession={activeSessionObj}
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelectSession={setSelectedSessionId}
          isSyncActive={isSyncActive}
          isAgentOnline={isAgentOnline}
          gdriveStatus={gdriveStatus}
          onRefresh={fetchData}
          isRefreshing={isActionLoading}
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          onCopyProofLink={() => {
            const url = `${window.location.origin}/proof/${selectedSessionId}`;
            navigator.clipboard.writeText(url);
            setCopiedProofLink(true);
            setTimeout(() => setCopiedProofLink(false), 2500);
          }}
          copiedProofLink={copiedProofLink}
          queueCount={inQueueCount}
          photosCount={photos.length}
        />

        {/* 3. Main Content Container */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
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

          {/* Quick Onboarding / Panduan Mudah untuk Pengguna Baru */}
          <div className="bg-gradient-to-r from-indigo-50/90 via-indigo-50/40 to-white border border-indigo-100/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Sparkles className="w-5 h-5 text-indigo-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">
                    Panduan Cepat Memulai (3 Langkah):
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                    Otomatis & Tanpa Ribet
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2 bg-white/90 border border-indigo-100/80 px-3 py-2 rounded-xl shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                    <span className="font-medium">Colok kamera ke laptop via USB</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/90 border border-indigo-100/80 px-3 py-2 rounded-xl shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                    <span className="font-medium">Klik &ldquo;Mulai Hubungkan Kamera&rdquo;</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/90 border border-indigo-100/80 px-3 py-2 rounded-xl shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
                    <span className="font-medium">Foto otomatis masuk ke Drive & Klien!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Untitled UI Control Panel Card */}
          <Card
            id="section-control-panel"
            variant="default"
            padding="lg"
            className={`space-y-6 relative overflow-hidden border transition-all duration-200 shadow-xs ${
              activeSection === 'capture' || activeSection === 'agent' || activeSection === 'settings'
                ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                : 'border-gray-200/80'
            }`}
          >
            {/* Top Subtle Indigo Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Radio className="w-4 h-4" />
                </div>
                <span>Hubungkan Kamera ke Google Drive</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1 pl-10.5">
                Setiap foto yang masuk ke laptop otomatis diunggah langsung ke Google Drive secara instan, aman, dan tanpa mengurangi kualitas asli foto.
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
                  Jeda Sementara
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStartSync}
                  isLoading={isActionLoading}
                  iconLeading={<Play className="w-3.5 h-3.5 fill-current" />}
                >
                  Mulai Hubungkan Kamera
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
                <span>Folder Foto di Laptop</span>
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
                Folder tempat software kamera (Capture One, EOS Utility, Sony Imaging Edge, dll.) menyimpan foto di laptop.
              </p>
            </div>

            {/* Control B: Pilihan Sesi & Proyek Aktif */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sesi Pemotretan Aktif</span>
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
                Foto akan otomatis tersusun rapi di Google Drive: <code className="text-emerald-700 font-semibold font-mono">Shoot - {activeSessionObj?.title || 'Session'}</code>.
              </p>
            </div>

            {/* Control C: Mode Sambungan Kamera */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mode Sambungan Kamera</span>
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
                  Kamera Kabel USB (Sony, Canon, Nikon, Fujifilm)
                </option>
                <option value="adapter-usb-ptp-mtp">
                  Folder Otomatis (Capture One / Lightroom / EOS Utility)
                </option>
                <option value="sony_camera_remote_sdk">
                  Kartu Memori SD Card / DCIM Kamera
                </option>
                <option value="canon_edsdk">
                  Kamera Nirkabel / Wi-Fi Sync
                </option>
              </select>
              <p className="text-[11px] text-gray-500">
                Pilih cara kamera mentransfer foto ke laptop saat sesi pemotretan berlangsung.
              </p>
            </div>
          </div>

          {/* Google Drive Destination Highlight Banner */}
          <div id="section-storage" className="mt-2 bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-gray-700">Folder Tujuan di Google Drive: </span>
                <span className="font-mono text-emerald-700 font-bold">
                  {gdriveStatus?.target_folder_name || `Shoot - ${activeSessionObj?.title || 'Paris Fashion Week Runway Shoot'}`}
                </span>
                <span className="text-[11px] text-gray-500 ml-2">
                  (Otomatis tersimpan & terbackup)
                </span>
              </div>
            </div>
            <Badge variant="success" size="sm" iconLeading={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}>
              Google Drive Siap & Aman
            </Badge>
          </div>
        </Card>

        {/* 4. Metric Cards — Untitled UI Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <Card variant="default" padding="md" className="hover:shadow-sm transition-all border border-gray-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Foto Diambil</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                <Camera className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-gray-900 mt-2 tracking-tight">
              {totalCompleted + inQueueCount}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">Foto terdeteksi dari kamera</div>
          </Card>

          <Card variant="default" padding="md" className="hover:shadow-sm transition-all border border-gray-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tersimpan di Cloud</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                <Cloud className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-2 tracking-tight">
              {totalCompleted}
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-1">Aman di Google Drive</div>
          </Card>

          <Card variant="default" padding="md" className="hover:shadow-sm transition-all border border-gray-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sedang Dikirim</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-600 mt-2 tracking-tight">
              {inQueueCount}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">Antrean pengiriman aman</div>
          </Card>

          <Card variant="default" padding="md" className="hover:shadow-sm transition-all border border-gray-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Duplikat Dicegah</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-sky-600 mt-2 tracking-tight">
              {duplicateSkippedCount + retryingCount}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">Foto ganda tidak diupload ulang</div>
          </Card>
        </div>

        {/* 5. Two-column Layout: Upload Queue & Live Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Persistent Upload Queue (5 cols) */}
          <Card
            id="section-queue"
            variant="default"
            padding="none"
            className="lg:col-span-5 flex flex-col h-[580px] overflow-hidden border border-gray-200/80 shadow-xs"
          >
            <div className="px-5 py-4 border-b border-gray-200/80 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900">Proses Pengiriman Foto</h3>
              </div>
              <Badge variant="gray" size="sm">
                {queueTasks.length} foto diproses
              </Badge>
            </div>

            <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
              {queueTasks.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-xs space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-2">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="font-medium text-gray-600">Belum ada foto yang sedang dikirim.</p>
                  <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                    Foto yang baru dijepret kamera akan otomatis muncul dan diunggah ke Google Drive di sini.
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
                          <span className="text-gray-400">ID: {t.id.slice(0, 8)}</span>
                        </div>
                      </div>

                      {/* Status Badges — Untitled UI Badges */}
                      <div className="shrink-0">
                        {t.status === 'completed' && (
                          <Badge variant="success" size="sm" iconLeading={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}>
                            Tersimpan di Drive
                          </Badge>
                        )}
                        {t.status === 'processing' && (
                          <Badge variant="indigo" size="sm" iconLeading={<RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />}>
                            Sedang Mengunggah...
                          </Badge>
                        )}
                        {t.status === 'queued' && (
                          <Badge variant="warning" size="sm" iconLeading={<Clock className="w-3 h-3 text-amber-600" />}>
                            Menunggu Giliran
                          </Badge>
                        )}
                        {t.status === 'retrying' && (
                          <Badge variant="warning" size="sm" iconLeading={<RefreshCw className="w-3 h-3 text-amber-600" />}>
                            Mencoba Ulang ({t.retry_count})
                          </Badge>
                        )}
                        {t.status === 'duplicate_skipped' && (
                          <Badge variant="gray" size="sm" iconLeading={<Sparkles className="w-3 h-3 text-indigo-500" />}>
                            Duplikat Dilewati
                          </Badge>
                        )}
                        {t.status === 'failed' && (
                          <Badge variant="error" size="sm" iconLeading={<AlertTriangle className="w-3 h-3 text-rose-600" />}>
                            Gagal Mengunggah
                          </Badge>
                        )}
                      </div>
                    </div>

                    {t.error_message && (
                      <p className="text-[11px] text-rose-600 font-mono mt-2 truncate bg-rose-50 p-2 rounded-lg border border-rose-100">
                        Catatan: {t.error_message}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Right Column: Live Photo Gallery & EXIF Inspector (7 cols) */}
          <Card
            id="section-gallery"
            variant="default"
            padding="none"
            className="lg:col-span-7 flex flex-col h-[580px] overflow-hidden border border-gray-200/80 shadow-xs"
          >
            <div className="px-5 py-4 border-b border-gray-200/80 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Galeri Foto Masuk (Live)</h3>
                <p className="text-[11px] text-gray-500">Foto langsung muncul di sini dalam sekejap begitu kamera memotret</p>
              </div>
              <Badge variant="success" size="sm">
                {photos.length} foto tersimpan
              </Badge>
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {photos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                    <Camera className="w-7 h-7" />
                  </div>
                  <p className="font-medium text-gray-600">Belum ada foto untuk sesi ini.</p>
                  <p className="text-[11px] text-gray-400">Colok kamera ke laptop dan mulailah memotret untuk melihat foto muncul secara otomatis.</p>
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
                            src={p.preview_url.startsWith('http') ? p.preview_url : `${getApiHost()}${p.preview_url}`}
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

                        {/* Client Rating & Pick Badges */}
                        {((p.rating && p.rating > 0) || p.is_picked) && (
                          <div className="absolute bottom-2 left-2 flex items-center gap-1">
                            {p.rating && p.rating > 0 ? (
                              <span className="bg-amber-500/95 text-white backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-xs">
                                <Star className="w-2.5 h-2.5 fill-current text-white" />
                                <span>{p.rating}</span>
                              </span>
                            ) : null}
                            {p.is_picked ? (
                              <span className="bg-rose-600/95 text-white backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 shadow-xs tracking-wider">
                                <Heart className="w-2.5 h-2.5 fill-current text-white" />
                                <span>PICK</span>
                              </span>
                            ) : null}
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
                        src={selectedPhoto.preview_url.startsWith('http') ? selectedPhoto.preview_url : `${getApiHost()}${selectedPhoto.preview_url}`}
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
                          Preview Siap (File Asli Sedang Diunggah...)
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm" iconLeading={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}>
                          Foto Tersimpan Aman di Google Drive
                        </Badge>
                      )}
                    </div>

                    {/* Client Rating & Feedback */}
                    {((selectedPhoto.rating && selectedPhoto.rating > 0) || selectedPhoto.is_picked || selectedPhoto.client_feedback) && (
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-2 flex flex-wrap items-center gap-2">
                        {selectedPhoto.rating && selectedPhoto.rating > 0 ? (
                          <div className="flex items-center gap-1 text-amber-700 font-bold text-xs bg-white px-2 py-0.5 rounded border border-amber-200">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{selectedPhoto.rating} / 5 Bintang</span>
                          </div>
                        ) : null}
                        {selectedPhoto.is_picked && (
                          <Badge variant="rose" size="sm" iconLeading={<Heart className="w-3 h-3 fill-rose-600 text-rose-600" />}>
                            Pilihan Klien
                          </Badge>
                        )}
                        {selectedPhoto.client_feedback && (
                          <span className="text-[11px] text-amber-900 font-medium italic">
                            &ldquo;{selectedPhoto.client_feedback}&rdquo;
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-[11px] text-gray-600 flex flex-wrap gap-x-2 gap-y-1">
                      <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-xs">Kamera: {selectedPhoto.camera_make} {selectedPhoto.camera_model}</span>
                      <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-xs">Lensa: {selectedPhoto.lens_model || 'FE 24-70mm F2.8 GM II'}</span>
                      <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-xs">Bukaan: {selectedPhoto.aperture_f_stop ? `f/${selectedPhoto.aperture_f_stop}` : 'f/2.8'}</span>
                      <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-xs">Kecepatan: {selectedPhoto.shutter_speed_str || '1/500s'}</span>
                      <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-xs">ISO: {selectedPhoto.iso_speed || 100}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-3">
                      <span>Kode File di Drive: <code className="text-emerald-700 font-bold font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">{selectedPhoto.gdrive_file_id || 'tersimpan_di_folder'}</code></span>
                      <span>Keaslian Foto (Checksum): <code className="font-mono">{selectedPhoto.sha256_hash.slice(0, 16)}...</code></span>
                      <button
                        onClick={() => handleCopyHash(selectedPhoto.sha256_hash)}
                        className="hover:text-gray-900 text-gray-500 flex items-center gap-1"
                        title="Salin kode keaslian foto"
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
    </div>
  );
}
