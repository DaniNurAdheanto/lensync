import React, { useState } from 'react';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchLiveSession: (config: {
    camera: string;
    tetherType: string;
    storage: string;
    projectName: string;
  }) => void;
}

export const GetStartedModal: React.FC<GetStartedModalProps> = ({
  isOpen,
  onClose,
  onLaunchLiveSession,
}) => {
  const [camera, setCamera] = useState('Canon EOS R5 Mark II');
  const [tetherType, setTetherType] = useState('USB-C 3.2 High-Speed Tether');
  const [storage, setStorage] = useState('MinIO Local Storage (c2c-photos)');
  const [projectName, setProjectName] = useState('Paris Fashion Week 2026 - Main Runway');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLaunchLiveSession({
      camera,
      tetherType,
      storage,
      projectName,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-gray-200 shadow-2xl p-6 sm:p-8 animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 mb-6">
          <Badge variant="brand" size="md" iconLeading={<Sparkles className="w-3.5 h-3.5" />}>
            Mulai Sesi Pemotretan Baru
          </Badge>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
            Konfigurasi Kamera & Cloud
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Pilih kamera dan target penyimpanan cloud untuk langsung mencoba live ingestion.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              Nama Proyek / Sesi Pemotretan
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all text-xs sm:text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              Model Kamera Utama
            </label>
            <select
              value={camera}
              onChange={(e) => setCamera(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all text-xs sm:text-sm bg-white cursor-pointer"
            >
              <option value="Canon EOS R5 Mark II">Canon EOS R5 Mark II (.CR3 RAW)</option>
              <option value="Sony α7R V">Sony α7R V (.ARW RAW)</option>
              <option value="Sony α7 IV">Sony α7 IV (.ARW RAW)</option>
              <option value="Nikon Z8">Nikon Z8 (.NEF RAW)</option>
              <option value="Fujifilm X-T5">Fujifilm X-T5 (.RAF RAW)</option>
              <option value="Apple iPhone 16 Pro">Apple iPhone 16 Pro (ProRAW .DNG / HEIC)</option>
              <option value="Google Pixel 9 Pro">Google Pixel 9 Pro (Android MTP .DNG)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              Koneksi Tethering
            </label>
            <select
              value={tetherType}
              onChange={(e) => setTetherType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all text-xs sm:text-sm bg-white cursor-pointer"
            >
              <option value="USB-C 3.2 High-Speed Tether">USB-C 3.2 High-Speed Tether (10 Gbps)</option>
              <option value="Dedicated Hotfolder Watcher">Dedicated Hotfolder Watcher (Capture One / Lightroom)</option>
              <option value="Android Smartphone MTP">Android Smartphone MTP</option>
              <option value="iOS Direct DCIM Cable">iOS Direct DCIM Cable</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              Target Cloud Storage (S3-Compatible)
            </label>
            <select
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all text-xs sm:text-sm bg-white cursor-pointer"
            >
              <option value="MinIO Local Storage (c2c-photos)">MinIO Local Storage (c2c-photos)</option>
              <option value="AWS S3 (Standard Storage)">AWS S3 (Standard Bucket)</option>
              <option value="Cloudflare R2 (Zero Egress)">Cloudflare R2 (Zero Egress)</option>
              <option value="Google Cloud Storage">Google Cloud Storage</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              Batal
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              iconTrailing={<ArrowRight className="w-4 h-4" />}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
            >
              Mulai Sesi Sekarang
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
