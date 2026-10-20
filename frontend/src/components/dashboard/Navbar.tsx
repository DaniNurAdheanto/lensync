'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Camera,
  RefreshCw,
  ExternalLink,
  Share2,
  Check,
  Cloud,
  ChevronDown,
  Bell,
  Sparkles,
  Layers,
  UploadCloud,
  Radio,
  SlidersHorizontal,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { ShootSession } from '@/lib/api-client';
import { Badge, Button } from '@/components/design-system';

export interface NavbarProps {
  onToggleMobileSidebar: () => void;
  activeSession: ShootSession | undefined;
  sessions: ShootSession[];
  selectedSessionId: string;
  onSelectSession: (id: string) => void;
  isSyncActive: boolean;
  isAgentOnline: boolean;
  gdriveStatus: {
    provider: string;
    root_folder_id: string;
    target_folder_name?: string;
    authenticated: boolean;
  } | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeSection: string;
  onSelectSection: (section: string) => void;
  onCopyProofLink: () => void;
  copiedProofLink: boolean;
  queueCount: number;
  photosCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
  activeSession,
  sessions,
  selectedSessionId,
  onSelectSession,
  isSyncActive,
  isAgentOnline,
  gdriveStatus,
  onRefresh,
  isRefreshing,
  activeSection,
  onSelectSection,
  onCopyProofLink,
  copiedProofLink,
  queueCount,
  photosCount,
}) => {
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const quickNavTabs = [
    { id: 'overview', label: 'Ringkasan', icon: Radio },
    { id: 'capture', label: 'Sambungan Kamera', icon: Camera },
    { id: 'queue', label: 'Pengiriman Foto', icon: UploadCloud, count: queueCount },
    { id: 'gallery', label: 'Galeri Foto', icon: Layers, count: photosCount },
  ];

  return (
    <header className="h-16 border-b border-gray-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Hamburger, Breadcrumbs & Live Status */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu button */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Hierarchy (shown on wide screens) */}
        <nav aria-label="Breadcrumb" className="hidden 2xl:flex items-center gap-2 text-xs shrink-0">
          <Link
            href="/"
            className="text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="font-medium">Beranda</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500 font-medium truncate max-w-[130px]">
            {activeSession ? activeSession.title : 'Sesi Aktif'}
          </span>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gray-900 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            <span>Pemotretan Langsung</span>
          </span>
        </nav>

        {/* Live Sync Status Badge — Untitled UI Badge */}
        <div className="flex items-center shrink-0">
          <Badge
            variant={isSyncActive ? 'success' : isAgentOnline ? 'warning' : 'gray'}
            dot={true}
            size="md"
          >
            {isSyncActive
              ? 'KAMERA TERHUBUNG'
              : isAgentOnline
              ? 'SIAP MEMOTRET'
              : 'BELUM TERHUBUNG'}
          </Badge>
        </div>
      </div>

      {/* Center: In-Page Quick Navigation Tabs (Visible on large screens) */}
      <div className="hidden xl:flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/70 shadow-xs">
        {quickNavTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectSection(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Session Switcher, Proofing Share, Drive Badge & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Session Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-800 shadow-xs transition-colors"
            title="Ganti Sesi Pemotretan"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="max-w-[110px] md:max-w-[150px] truncate font-semibold">
              {activeSession ? activeSession.title : 'Pilih Sesi'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          </button>

          {isSessionDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                Pilih Sesi Aktif
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectSession(s.id);
                      setIsSessionDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-indigo-50/60 transition-colors ${
                      selectedSessionId === s.id
                        ? 'font-bold text-indigo-600 bg-indigo-50/40'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-semibold">{s.title}</div>
                      <div className="text-[10px] text-gray-400 truncate font-mono">
                        {s.location} • {s.session_date}
                      </div>
                    </div>
                    {selectedSessionId === s.id && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Client Proofing Quick Actions */}
        <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50/70 border border-indigo-100 p-1 rounded-lg">
          <Link href={`/proof/${selectedSessionId}`} target="_blank">
            <Button
              variant="tertiary"
              size="sm"
              iconLeading={<ExternalLink className="w-3.5 h-3.5 text-indigo-600" />}
              title="Buka Portal Proofing Klien / Art Director"
            >
              <span className="hidden xl:inline text-indigo-700 font-medium">Review Klien</span>
            </Button>
          </Link>

          <Button
            variant="secondary"
            size="sm"
            onClick={onCopyProofLink}
            iconLeading={
              copiedProofLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
              )
            }
            title="Salin link review untuk dikirim ke klien atau art director"
          >
            <span>{copiedProofLink ? 'Link Tersalin!' : 'Salin Link'}</span>
          </Button>
        </div>

        {/* Google Drive Status Badge */}
        <Badge
          variant="success"
          size="md"
          iconLeading={<Cloud className="w-3.5 h-3.5 text-emerald-600" />}
          className="hidden md:inline-flex"
        >
          {gdriveStatus?.authenticated ? 'Google Drive Siap' : 'Drive Tersambung'}
        </Badge>

        {/* Notification Bell with Event Preview */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors relative"
            title="Notifikasi Aktivitas Sinkronisasi"
            aria-label="Aktivitas Terbaru"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-1.5 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-900">Aktivitas Real-Time</span>
                <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                  SSE Online
                </span>
              </div>
              <div className="py-2 space-y-2 text-xs">
                <div className="flex items-start gap-2 text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Foto Baru Terdeteksi</p>
                    <p className="text-[11px] text-gray-500">
                      Sinkronisasi tethering otomatis ke Google Drive aktif.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Portal Proofing Terkoneksi</p>
                    <p className="text-[11px] text-gray-500">
                      Art director dapat memberi rating bintang 1–5 secara live.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Refresh Data Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          title="Refresh Data & Antrean"
          aria-label="Refresh data"
          iconLeading={
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`}
            />
          }
        />
      </div>
    </header>
  );
};
