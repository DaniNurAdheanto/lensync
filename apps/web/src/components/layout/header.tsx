import React from 'react';
import { Camera, Cloud, Wifi, Bell, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/badge';

export const Header: React.FC = () => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 tracking-tight">Camera to Cloud</span>
            <Badge variant="info">v0.1-alpha</Badge>
          </div>
          <p className="text-[11px] text-slate-400">Live Ingestion & USB Tether Stream</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 font-medium">Agent Connected</span>
        </div>

        <button className="p-2 text-slate-400 hover:text-slate-200 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
