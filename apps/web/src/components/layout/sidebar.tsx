import React from 'react';
import { Camera, Layers, HardDrive, Settings, Activity, FolderGit2 } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Live Shoot Session', icon: Camera, active: true },
    { label: 'Photo Gallery', icon: Layers, active: false },
    { label: 'Tethered Devices', icon: HardDrive, active: false },
    { label: 'Upload Queue', icon: Activity, active: false },
    { label: 'Projects & Clients', icon: FolderGit2, active: false },
    { label: 'Settings', icon: Settings, active: false },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/30 p-4 flex flex-col justify-between shrink-0">
      <nav className="space-y-1">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
        <div className="text-slate-400">Target S3 Storage</div>
        <div className="text-slate-200 font-mono font-medium truncate mt-0.5">minio:9000/c2c-photos</div>
        <div className="text-emerald-400 text-[11px] mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
          Ready for Ingestion
        </div>
      </div>
    </aside>
  );
};
