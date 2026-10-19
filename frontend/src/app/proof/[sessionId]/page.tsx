'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Star,
  Heart,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Share2,
  ArrowLeft,
  X,
  Sparkles,
  Camera,
  ExternalLink,
  Eye,
  MessageSquare,
  Send,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  c2cClient,
  ShootSession,
  PhotoRecord,
  ProofingStats,
} from '@/lib/api-client';
import { Button, Badge, Card } from '@/components/design-system';

export default function ClientProofingPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = (params?.sessionId as string) || 'session-pfw-2026';

  // Data states
  const [session, setSession] = useState<ShootSession | null>(null);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [stats, setStats] = useState<ProofingStats>({
    total_count: 0,
    picked_count: 0,
    rated_count: 0,
    average_rating: 0,
  });
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [newPhotoAlert, setNewPhotoAlert] = useState<string | null>(null);

  // Filter & View states
  const [activeTab, setActiveTab] = useState<'all' | 'picked' | 'top_rated'>('all');
  const [gridColumns, setGridColumns] = useState<'normal' | 'large'>('normal');

  // Zoom Inspector (Lightbox Modal) states
  const [inspectorPhoto, setInspectorPhoto] = useState<PhotoRecord | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [isSavingFeedback, setIsSavingFeedback] = useState<boolean>(false);

  // Fetch session & photos
  const fetchProofingData = async () => {
    try {
      const data = await c2cClient.getProofingSession(sessionId);
      if (data) {
        setSession(data.session);
        setPhotos(data.photos);
        setStats(data.stats);
      }
    } catch (err) {
      console.warn('Failed fetching proofing data:', err);
    }
  };

  useEffect(() => {
    fetchProofingData();

    // Setup polling fallback every 3s
    const interval = setInterval(fetchProofingData, 3000);

    // Setup Server-Sent Events (SSE) for instant live tethering stream
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('http://localhost:8080/api/v1/events');

      eventSource.addEventListener('photo:preview_ready', (e: any) => {
        try {
          const payload = JSON.parse(e.data);
          const p = payload.data as PhotoRecord;
          setNewPhotoAlert(`⚡ Foto Baru Masuk: ${p.original_filename || 'Hasil Jepretan Kamera'}`);
          setTimeout(() => setNewPhotoAlert(null), 4000);
          fetchProofingData();
        } catch (_) {
          fetchProofingData();
        }
      });

      eventSource.addEventListener('photo:completed', () => {
        fetchProofingData();
      });

      eventSource.addEventListener('photo:rating_updated', (e: any) => {
        try {
          const payload = JSON.parse(e.data);
          const updatedPhoto = payload.data as PhotoRecord;
          setPhotos((prev) =>
            prev.map((item) => (item.id === updatedPhoto.id ? { ...item, ...updatedPhoto } : item))
          );
          if (inspectorPhoto && inspectorPhoto.id === updatedPhoto.id) {
            setInspectorPhoto((curr) => (curr ? { ...curr, ...updatedPhoto } : null));
          }
        } catch (_) {
          fetchProofingData();
        }
      });
    } catch (err) {
      console.warn('SSE not available, falling back to polling');
    }

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, [sessionId]);

  // Handle Star Rating Click
  const handleRatePhoto = async (photoId: string, rating: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic UI update
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === photoId) {
          return { ...p, rating };
        }
        return p;
      })
    );

    if (inspectorPhoto && inspectorPhoto.id === photoId) {
      setInspectorPhoto((curr) => (curr ? { ...curr, rating } : null));
    }

    try {
      const targetPhoto = photos.find((p) => p.id === photoId);
      await c2cClient.updatePhotoRating(photoId, {
        rating,
        is_picked: targetPhoto?.is_picked ?? false,
        client_feedback: targetPhoto?.client_feedback ?? '',
      });
      fetchProofingData();
    } catch (err) {
      console.error('Failed updating rating:', err);
    }
  };

  // Handle Pick / Favorite Toggle
  const handleTogglePick = async (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const targetPhoto = photos.find((p) => p.id === photoId);
    const newPickState = !targetPhoto?.is_picked;

    // Optimistic UI update
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === photoId) {
          return { ...p, is_picked: newPickState };
        }
        return p;
      })
    );

    if (inspectorPhoto && inspectorPhoto.id === photoId) {
      setInspectorPhoto((curr) => (curr ? { ...curr, is_picked: newPickState } : null));
    }

    try {
      await c2cClient.updatePhotoRating(photoId, {
        rating: targetPhoto?.rating ?? 0,
        is_picked: newPickState,
        client_feedback: targetPhoto?.client_feedback ?? '',
      });
      fetchProofingData();
    } catch (err) {
      console.error('Failed toggling pick:', err);
    }
  };

  // Handle Client Feedback Note Submission
  const handleSaveFeedback = async () => {
    if (!inspectorPhoto) return;
    setIsSavingFeedback(true);
    try {
      await c2cClient.updatePhotoRating(inspectorPhoto.id, {
        rating: inspectorPhoto.rating ?? 0,
        is_picked: inspectorPhoto.is_picked ?? false,
        client_feedback: feedbackInput,
      });
      setInspectorPhoto((curr) => (curr ? { ...curr, client_feedback: feedbackInput } : null));
      setPhotos((prev) =>
        prev.map((p) => (p.id === inspectorPhoto.id ? { ...p, client_feedback: feedbackInput } : p))
      );
    } catch (err) {
      console.error('Failed saving feedback:', err);
    } finally {
      setIsSavingFeedback(false);
    }
  };

  // Copy shareable proofing link to clipboard
  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Inspector Navigation
  const openInspector = (photo: PhotoRecord) => {
    setInspectorPhoto(photo);
    setFeedbackInput(photo.client_feedback || '');
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const closeInspector = () => {
    setInspectorPhoto(null);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleNextPhoto = () => {
    if (!inspectorPhoto) return;
    const currentIndex = filteredPhotos.findIndex((p) => p.id === inspectorPhoto.id);
    if (currentIndex < filteredPhotos.length - 1) {
      openInspector(filteredPhotos[currentIndex + 1]);
    }
  };

  const handlePrevPhoto = () => {
    if (!inspectorPhoto) return;
    const currentIndex = filteredPhotos.findIndex((p) => p.id === inspectorPhoto.id);
    if (currentIndex > 0) {
      openInspector(filteredPhotos[currentIndex - 1]);
    }
  };

  // Zoom manipulation
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.5, 4));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.5, 1));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };
  const handle100PercentZoom = () => {
    setZoomLevel(2.5); // 1:1 pixel sharpness inspection
    setPanPosition({ x: 0, y: 0 });
  };

  // Mouse pan/drag when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Filtered photos
  const filteredPhotos = photos.filter((p) => {
    if (activeTab === 'picked') return p.is_picked === true;
    if (activeTab === 'top_rated') return (p.rating || 0) >= 4;
    return true;
  });

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!inspectorPhoto) return;
      if (e.key === 'Escape') closeInspector();
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key >= '1' && e.key <= '5') {
        handleRatePhoto(inspectorPhoto.id, parseInt(e.key, 10));
      }
      if (e.key.toLowerCase() === 'p') {
        handleTogglePick(inspectorPhoto.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectorPhoto, filteredPhotos]);

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* 1. Header Bar — Untitled UI Client Proofing Header */}
      <header className="h-16 border-b border-gray-200/80 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button
              variant="secondary"
              size="sm"
              iconLeading={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              <span className="hidden sm:inline">Kembali ke Studio</span>
              <span className="sm:hidden">Studio</span>
            </Button>
          </Link>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900 tracking-tight">
                  {session?.title || 'Client Live Proofing'}
                </span>
                <Badge variant="success" dot={true} size="sm">
                  LIVE STREAM
                </Badge>
              </div>
              <p className="text-[11px] text-gray-500 hidden md:block">
                Klien: <span className="font-medium text-gray-700">{session?.client_name || 'Vogue Paris & Creative Team'}</span> • Fotografer: <span className="font-medium text-gray-700">{session?.photographer || 'Dani Nur Studio'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Header: Share Link & Quick Stats */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyShareLink}
            iconLeading={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          >
            {copiedLink ? 'Link Tersalin!' : 'Bagikan Link Proofing'}
          </Button>

          <Link href="/dashboard" className="hidden lg:block">
            <Badge variant="brand" size="md">
              Mode Klien / Art Director
            </Badge>
          </Link>
        </div>
      </header>

      {/* 2. Live Notification Banner for Ingested Photos */}
      {newPhotoAlert && (
        <div className="bg-indigo-600 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-sm sticky top-16 z-20">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>{newPhotoAlert}</span>
            <span className="text-indigo-200 ml-2 hidden sm:inline">(Tampil seketika tanpa refresh)</span>
          </div>
          <button onClick={() => setNewPhotoAlert(null)} className="text-indigo-200 hover:text-white">✕</button>
        </div>
      )}

      {/* 3. Main Workspace */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Session Info & Filter Controls Card */}
        <Card variant="default" padding="lg" className="border border-gray-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 pb-5 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="indigo" size="sm">
                  Public Client Portal
                </Badge>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs font-medium text-gray-500">
                  Lokasi: {session?.location || 'Grand Palais Éphémère, Paris'}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mt-1 tracking-tight">
                {session?.title || 'Live Runway Proofing Gallery'}
              </h1>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                Halaman proofing interaktif untuk klien, art director, dan agensi. Beri rating bintang (1-5), tandai foto terpilih (Pick), atau klik foto untuk membuka Zoom Inspector resolusi tinggi.
              </p>
            </div>

            {/* Quick Metrics Pills */}
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-center shadow-xs">
                <div className="text-xs font-semibold text-gray-500">Total Foto</div>
                <div className="text-lg font-bold text-gray-900">{stats.total_count}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 text-center shadow-xs">
                <div className="text-xs font-semibold text-amber-700">Foto Terpilih</div>
                <div className="text-lg font-bold text-amber-700">{stats.picked_count}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 text-center shadow-xs">
                <div className="text-xs font-semibold text-emerald-700">Rata-rata Rating</div>
                <div className="text-lg font-bold text-emerald-700">
                  {stats.average_rating > 0 ? `★ ${stats.average_rating.toFixed(1)}` : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs & Grid View Mode */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'all'
                    ? 'bg-white text-gray-900 font-semibold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Semua Foto ({photos.length})
              </button>
              <button
                onClick={() => setActiveTab('picked')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'picked'
                    ? 'bg-white text-emerald-700 font-semibold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Heart className="w-3 h-3 fill-current text-rose-500" />
                <span>Pilihan Klien ({photos.filter((p) => p.is_picked).length})</span>
              </button>
              <button
                onClick={() => setActiveTab('top_rated')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'top_rated'
                    ? 'bg-white text-amber-700 font-semibold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Star className="w-3 h-3 fill-current text-amber-400" />
                <span>Bintang 4-5 ({photos.filter((p) => (p.rating || 0) >= 4).length})</span>
              </button>
            </div>

            {/* Grid Size Switcher */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 hidden sm:inline">Ukuran Grid:</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs">
                <button
                  onClick={() => setGridColumns('normal')}
                  className={`px-2.5 py-1 text-xs font-medium ${
                    gridColumns === 'normal' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600'
                  }`}
                  title="Grid Standar (3-4 Kolom)"
                >
                  Standar
                </button>
                <button
                  onClick={() => setGridColumns('large')}
                  className={`px-2.5 py-1 text-xs font-medium ${
                    gridColumns === 'large' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600'
                  }`}
                  title="Grid Besar (2 Kolom)"
                >
                  Besar
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* 4. Photo Proofing Gallery Grid */}
        {filteredPhotos.length === 0 ? (
          <Card variant="default" padding="xl" className="text-center py-16 border border-gray-200/80">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-3">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              {activeTab === 'all'
                ? 'Belum ada foto dalam sesi ini'
                : activeTab === 'picked'
                ? 'Belum ada foto yang ditandai sebagai pilihan'
                : 'Belum ada foto dengan rating 4-5 bintang'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {activeTab === 'all'
                ? 'Foto yang dipotret melalui kabel tethering kamera akan otomatis muncul di sini.'
                : 'Pilih tab "Semua Foto" untuk memberi bintang atau menandai foto favorit.'}
            </p>
            {activeTab !== 'all' && (
              <Button variant="secondary" size="sm" onClick={() => setActiveTab('all')} className="mt-4">
                Lihat Semua Foto
              </Button>
            )}
          </Card>
        ) : (
          <div
            className={`grid gap-5 ${
              gridColumns === 'normal'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-2'
            }`}
          >
            {filteredPhotos.map((photo) => {
              const currentRating = photo.rating || 0;
              const isPicked = photo.is_picked || false;

              return (
                <div
                  key={photo.id}
                  onClick={() => openInspector(photo)}
                  className={`group relative bg-white border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md ${
                    isPicked
                      ? 'border-emerald-500 ring-2 ring-emerald-500/15'
                      : 'border-gray-200/80 hover:border-indigo-400'
                  }`}
                >
                  {/* Photo Thumbnail Container */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 via-gray-50 to-indigo-50/20 relative overflow-hidden flex items-center justify-center">
                    {photo.preview_url ? (
                      <img
                        src={
                          photo.preview_url.startsWith('http')
                            ? photo.preview_url
                            : `http://localhost:8080${photo.preview_url}`
                        }
                        alt={photo.original_filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <Camera className="w-10 h-10 text-gray-300 group-hover:scale-110 group-hover:text-indigo-400 transition-all duration-300" />
                    )}

                    {/* Top Left: File Format Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-sm text-gray-700 border border-gray-200 shadow-xs">
                        {photo.file_format}
                      </span>
                    </div>

                    {/* Top Right: Pick / Favorite Toggle Button */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleTogglePick(photo.id, e)}
                        title={isPicked ? 'Hapus dari Pilihan' : 'Tandai sebagai Pilihan Klien'}
                        className={`p-1.5 rounded-lg backdrop-blur-sm transition-all shadow-xs ${
                          isPicked
                            ? 'bg-rose-500 text-white shadow-rose-500/25'
                            : 'bg-white/90 text-gray-500 hover:text-rose-600 hover:bg-white'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isPicked ? 'fill-current' : ''}`} />
                      </button>

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openInspector(photo);
                        }}
                        title="Buka Zoom Inspector"
                        className="p-1.5 rounded-lg bg-black/50 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Picked Ribbon Banner */}
                    {isPicked && (
                      <div className="absolute bottom-2.5 left-2.5 bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Client Pick</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content & Interactive Rating Bar */}
                  <div className="p-3.5 space-y-2.5">
                    <div>
                      <p className="font-semibold text-gray-900 text-xs truncate">
                        {photo.original_filename}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate font-medium">
                        {photo.camera_model || 'Sony α7 IV'} • {photo.lens_model || '24-70mm GM II'}
                      </p>
                    </div>

                    {/* 1-5 Star Interactive Rating System */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={(e) => handleRatePhoto(photo.id, star === currentRating ? 0 : star, e)}
                            className="p-0.5 hover:scale-125 transition-transform"
                            title={`Beri rating ${star} bintang`}
                          >
                            <Star
                              className={`w-4 h-4 transition-colors ${
                                star <= currentRating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-200 hover:text-amber-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      <span className="text-[10px] font-mono font-semibold text-gray-500">
                        {currentRating > 0 ? `${currentRating}/5 ★` : 'Belum dinilai'}
                      </span>
                    </div>

                    {/* Client Feedback Note Snippet */}
                    {photo.client_feedback && (
                      <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-2 text-[10px] text-indigo-900 flex items-start gap-1.5">
                        <MessageSquare className="w-3 h-3 text-indigo-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1 italic font-medium">{photo.client_feedback}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. ZOOM INSPECTOR (Lightbox Full-Screen Modal) */}
      {inspectorPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col text-white animate-fadeIn select-none">
          {/* Lightbox Top Header */}
          <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm tracking-tight text-white">
                {inspectorPhoto.original_filename}
              </span>
              <span className="text-xs text-slate-400">
                ({filteredPhotos.findIndex((p) => p.id === inspectorPhoto.id) + 1} dari {filteredPhotos.length})
              </span>
              {inspectorPhoto.is_picked && (
                <span className="bg-emerald-500/90 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Client Pick
                </span>
              )}
            </div>

            {/* Middle: High Precision Zoom Controls */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/15">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="p-1.5 rounded-lg hover:bg-white/15 disabled:opacity-30 text-white transition-colors"
                title="Perkecil Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-medium px-2 min-w-[50px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                className="p-1.5 rounded-lg hover:bg-white/15 disabled:opacity-30 text-white transition-colors"
                title="Perbesar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-white/20 mx-1" />
              <button
                onClick={handle100PercentZoom}
                className="px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-white/15 text-indigo-300 transition-colors"
                title="Zoom 1:1 Resolusi Penuh (Ketajaman Sensor)"
              >
                1:1 Pixel Crop
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 rounded-lg hover:bg-white/15 text-slate-300 transition-colors"
                title="Reset ke Layar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right: Close Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={closeInspector}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Tutup Inspector (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image Canvas with Pan & Drag */}
          <div
            className={`flex-1 relative overflow-hidden flex items-center justify-center ${
              zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Prev Photo Arrow Button */}
            <button
              onClick={handlePrevPhoto}
              disabled={filteredPhotos.findIndex((p) => p.id === inspectorPhoto.id) <= 0}
              className="absolute left-6 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 flex items-center justify-center text-white disabled:opacity-20 transition-all shadow-lg hover:scale-105"
              title="Foto Sebelumnya (Panah Kiri)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Image Stage */}
            <div
              style={{
                transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${
                  panPosition.y / zoomLevel
                }px)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              className="max-w-[90%] max-h-[85%] flex items-center justify-center select-none"
            >
              {inspectorPhoto.preview_url ? (
                <img
                  src={
                    inspectorPhoto.preview_url.startsWith('http')
                      ? inspectorPhoto.preview_url
                      : `http://localhost:8080${inspectorPhoto.preview_url}`
                  }
                  alt={inspectorPhoto.original_filename}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="w-96 h-72 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-slate-400">
                  <Camera className="w-12 h-12 mb-2" />
                  <span>Preview belum tersedia</span>
                </div>
              )}
            </div>

            {/* Next Photo Arrow Button */}
            <button
              onClick={handleNextPhoto}
              disabled={
                filteredPhotos.findIndex((p) => p.id === inspectorPhoto.id) >=
                filteredPhotos.length - 1
              }
              className="absolute right-6 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 flex items-center justify-center text-white disabled:opacity-20 transition-all shadow-lg hover:scale-105"
              title="Foto Selanjutnya (Panah Kanan)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Pan Hint Overlay */}
            {zoomLevel > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-slate-300 border border-white/10 pointer-events-none">
                Geser (drag) kursor untuk memeriksa ketajaman fokus di berbagai area foto
              </div>
            )}
          </div>

          {/* Lightbox Bottom Inspector & Rating Toolbar */}
          <div className="border-t border-white/10 bg-black/60 backdrop-blur-lg px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Star Rating & Pick Actions */}
            <div className="flex items-center gap-6">
              {/* Star Rating Bar */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Rating Klien (1-5 Star):
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() =>
                        handleRatePhoto(
                          inspectorPhoto.id,
                          star === (inspectorPhoto.rating || 0) ? 0 : star
                        )
                      }
                      className="p-1 hover:scale-125 transition-transform"
                      title={`Beri rating ${star} bintang (Tekan angka ${star})`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= (inspectorPhoto.rating || 0)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-amber-300 ml-2">
                    {inspectorPhoto.rating ? `${inspectorPhoto.rating}/5` : '0/5'}
                  </span>
                </div>
              </div>

              <div className="h-8 w-px bg-white/15 hidden sm:block" />

              {/* Pick / Favorite Toggle Button */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Pilihan Final:
                </span>
                <Button
                  variant={inspectorPhoto.is_picked ? 'success' : 'outline-white'}
                  size="sm"
                  onClick={() => handleTogglePick(inspectorPhoto.id)}
                  iconLeading={<Heart className={`w-3.5 h-3.5 ${inspectorPhoto.is_picked ? 'fill-current' : ''}`} />}
                >
                  {inspectorPhoto.is_picked ? 'Pilihan Klien (Picked)' : 'Tandai Foto (Tekan P)'}
                </Button>
              </div>
            </div>

            {/* Middle: EXIF Telemetry Badges */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-300">
              <span className="bg-white/10 px-2 py-1 rounded border border-white/10">
                {inspectorPhoto.camera_model || 'Sony α7 IV'}
              </span>
              <span className="bg-white/10 px-2 py-1 rounded border border-white/10">
                {inspectorPhoto.lens_model || '24-70mm F2.8'}
              </span>
              <span className="bg-white/10 px-2 py-1 rounded border border-white/10">
                {inspectorPhoto.aperture_f_stop ? `f/${inspectorPhoto.aperture_f_stop}` : 'f/2.8'}
              </span>
              <span className="bg-white/10 px-2 py-1 rounded border border-white/10">
                {inspectorPhoto.shutter_speed_str || '1/500s'}
              </span>
              <span className="bg-white/10 px-2 py-1 rounded border border-white/10">
                ISO {inspectorPhoto.iso_speed || 100}
              </span>
            </div>

            {/* Right: Feedback Note Input & Google Drive Link */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 flex-1 md:w-80">
                <input
                  type="text"
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveFeedback();
                  }}
                  placeholder="Catatan untuk fotografer/retoucher..."
                  className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveFeedback}
                  isLoading={isSavingFeedback}
                  iconLeading={<Send className="w-3 h-3" />}
                >
                  Kirim
                </Button>
              </div>

              {inspectorPhoto.gdrive_view_link && (
                <a
                  href={inspectorPhoto.gdrive_view_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex"
                >
                  <Button variant="secondary" size="sm" iconLeading={<ExternalLink className="w-3.5 h-3.5" />}>
                    Drive RAW
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
