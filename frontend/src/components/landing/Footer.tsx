import React from 'react';
import { Camera } from 'lucide-react';

interface FooterProps {
  onToggleWorkbench: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onToggleWorkbench }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Camera className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                Camera-to-Cloud
              </span>
            </div>

            <p className="text-slate-400 leading-relaxed max-w-sm">
              Platform otomatis upload foto dari kamera DSLR/Mirrorless & smartphone melalui USB tethering langsung ke S3-compatible cloud storage secara real-time.
            </p>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>Semua Sistem Beroperasi Normal (99.98% Uptime)</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
              Produk
            </h4>
            <ul className="space-y-2">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Desktop Agent (Go)</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Web Dashboard</a></li>
              <li><button onClick={onToggleWorkbench} className="hover:text-white transition-colors text-left cursor-pointer">Live Ingestion Stream</button></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">S3 Object Storage</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Keamanan & Enkripsi</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
              Kompatibilitas
            </h4>
            <ul className="space-y-2">
              <li><span className="hover:text-white cursor-default">Canon EOS (.CR3 / .CR2)</span></li>
              <li><span className="hover:text-white cursor-default">Sony Alpha (.ARW)</span></li>
              <li><span className="hover:text-white cursor-default">Nikon Z & D (.NEF)</span></li>
              <li><span className="hover:text-white cursor-default">Fujifilm X & GFX (.RAF)</span></li>
              <li><span className="hover:text-white cursor-default">Smartphone (Android & iOS)</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
              Developer
            </h4>
            <ul className="space-y-2">
              <li><button onClick={onToggleWorkbench} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors text-left cursor-pointer">Live Session Monitor</button></li>
              <li><a href="#features" className="hover:text-white transition-colors">Arsitektur S3 Multipart</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">OpenAPI 3.1 Specs</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Docker Compose Stack</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">PostgreSQL Migrations</a></li>
            </ul>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} Camera-to-Cloud (C2C). Dibuat dengan prinsip Untitled UI Design System.
          </div>
          <div className="flex items-center gap-6">
            <a href="#home" className="hover:text-slate-400 transition-colors">Privasi</a>
            <a href="#home" className="hover:text-slate-400 transition-colors">Ketentuan</a>
            <button onClick={onToggleWorkbench} className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">
              Dashboard
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
