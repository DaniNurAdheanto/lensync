'use client';

import React from 'react';
import Link from 'next/link';
import {
  Camera,
  UploadCloud,
  Layers,
  Share2,
  Cloud,
  FolderKanban,
  Cpu,
  Settings,
  X,
  LogOut,
  Search,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  HardDrive,
  Sparkles,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { ShootSession, AgentStatusResponse } from '@/lib/api-client';
import { useAuth } from '@/features/auth/AuthContext';
import { Badge, Button } from '@/components/design-system';

export interface SidebarProps {
  activeSection: string;
  onSelectSection: (section: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  sessions: ShootSession[];
  selectedSessionId: string;
  onSelectSession: (sessionId: string) => void;
  agentStatus: AgentStatusResponse | null;
  queueCount: number;
  photosCount: number;
  gdriveStatus: {
    provider: string;
    root_folder_id: string;
    target_folder_name?: string;
    authenticated: boolean;
  } | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  isMobileOpen,
  onCloseMobile,
  sessions,
  selectedSessionId,
  onSelectSession,
  agentStatus,
  queueCount,
  photosCount,
  gdriveStatus,
}) => {
  const { user, logout } = useAuth();
  const isSyncActive = agentStatus?.is_running === true;
  const isAgentOnline = agentStatus?.status === 'online';

  const navMenuItems = [
    {
      group: 'MENU UTAMA',
      items: [
        {
          id: 'overview',
          label: 'Ringkasan',
          icon: Radio,
          badge: isSyncActive ? 'AKTIF' : null,
          badgeVariant: 'success' as const,
        },
        {
          id: 'capture',
          label: 'Sambungan Kamera',
          icon: Camera,
          badge: isSyncActive ? 'Tersambung' : 'Siaga',
          badgeVariant: isSyncActive ? ('success' as const) : ('gray' as const),
        },
        {
          id: 'queue',
          label: 'Proses Pengiriman',
          icon: UploadCloud,
          badge: queueCount > 0 ? `${queueCount} foto` : null,
          badgeVariant: 'warning' as const,
        },
        {
          id: 'gallery',
          label: 'Galeri Foto',
          icon: Layers,
          badge: photosCount > 0 ? `${photosCount} foto` : null,
          badgeVariant: 'indigo' as const,
        },
      ],
    },
    {
      group: 'KOLABORASI & KLIEN',
      items: [
        {
          id: 'proofing',
          label: 'Review & Pilihan Klien',
          icon: Share2,
          badge: 'Buka Portal',
          badgeVariant: 'brand' as const,
          isExternal: true,
          href: `/proof/${selectedSessionId}`,
        },
        {
          id: 'storage',
          label: 'Penyimpanan Drive',
          icon: Cloud,
          badge: gdriveStatus?.authenticated ? 'Tersambung' : 'Siap',
          badgeVariant: 'success' as const,
        },
        {
          id: 'sessions',
          label: 'Daftar Sesi Foto',
          icon: FolderKanban,
          badge: `${sessions.length} Sesi`,
          badgeVariant: 'gray' as const,
        },
      ],
    },
    {
      group: 'PENGATURAN ALAT',
      items: [
        {
          id: 'agent',
          label: 'Penghubung Laptop',
          icon: Cpu,
          badge: isAgentOnline ? 'Siap' : 'Terputus',
          badgeVariant: isAgentOnline ? ('success' as const) : ('error' as const),
        },
        {
          id: 'settings',
          label: 'Pengaturan',
          icon: SlidersHorizontal,
        },
      ],
    },
  ];

  const handleNavClick = (item: any) => {
    if (item.isExternal && item.href) {
      window.open(item.href, '_blank');
      return;
    }
    onSelectSection(item.id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200/80 text-gray-900 select-none">
      {/* 1. Header: Brand Logo & Workspace */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-gray-900">
                Lensync
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-mono leading-none">
              Camera-to-Cloud
            </p>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Tutup menu sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Studio Workspace Switcher Card */}
      <div className="px-3.5 pt-3.5 pb-2">
        <div className="bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/80 rounded-xl p-2.5 transition-colors cursor-pointer group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-indigo-600 shadow-xs">
                {user?.studio_name?.charAt(0) || 'D'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-900 truncate">
                  {user?.studio_name || 'Dani Nur Studio'}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Studio Terhubung</span>
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 transition-colors shrink-0" />
          </div>
        </div>
      </div>

      {/* 3. Search / Quick Filter Bar */}
      <div className="px-3.5 py-1.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari foto, sesi, atau alat..."
            className="w-full pl-8 pr-12 py-1.5 text-xs bg-gray-50/60 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold px-1 py-0.5 bg-white border border-gray-200 text-gray-400 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* 4. Navigation Menu Sections */}
      <div className="flex-1 overflow-y-auto px-3.5 py-2 space-y-5">
        {navMenuItems.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
              {section.group}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item: any) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-xs'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-indigo-600'
                            : 'text-gray-500 group-hover:text-gray-700'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <Badge variant={item.badgeVariant || 'gray'} size="sm">
                          {item.badge}
                        </Badge>
                      )}
                      {item.isExternal && (
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 5. Google Drive Storage Quota Card (Untitled UI Stat Card) */}
      <div className="p-3.5 border-t border-gray-100 bg-gray-50/40">
        <div className="bg-white border border-gray-200/90 rounded-xl p-3 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Cloud className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-gray-800">
                Penyimpanan Drive
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {gdriveStatus?.authenticated ? 'Tersambung' : 'Siap'}
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-gray-500 font-mono mb-1">
              <span>84.2 GB terpakai</span>
              <span className="text-gray-700 font-bold">2 TB</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-full"
                style={{ width: '4.2%' }}
              />
            </div>
          </div>

          <div className="text-[10px] text-gray-500 flex items-center justify-between pt-0.5">
            <span className="truncate max-w-[140px]" title={gdriveStatus?.target_folder_name || 'Folder: Fashion Week 2026'}>
              📁 {gdriveStatus?.target_folder_name || 'Shoot - Paris Fashion Week'}
            </span>
            <span className="text-indigo-600 font-medium hover:underline cursor-pointer">
              Kelola
            </span>
          </div>
        </div>
      </div>

      {/* 6. Footer: User Profile & Quick Logout */}
      <div className="p-3.5 border-t border-gray-200/80 bg-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-900 truncate">
              {user?.full_name || 'Dani Nur Adheanto'}
            </div>
            <div className="text-[11px] text-gray-500 capitalize truncate">
              {user?.studio_name || user?.role || 'Photographer'}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
          title="Keluar dari akun (Logout)"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Fixed on lg and above) */}
      <aside className="hidden lg:block w-72 shrink-0 h-screen sticky top-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
