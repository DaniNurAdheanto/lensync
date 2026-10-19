import React from 'react';
import { ArrowRight, Zap, ShieldCheck, Clock, Camera, Radio, Wifi, CheckCircle2 } from 'lucide-react';
import { Button } from '../design-system/Button';

interface HeroSectionProps {
  onStartClick: () => void;
  onHowItWorksClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartClick,
  onHowItWorksClick,
}) => {
  return (
    <section id="home" className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-white">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-50/70 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-24 left-1/10 w-72 h-72 bg-blue-50/50 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Text & Value Propositions */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase font-sans">
                  FOR PROFESSIONAL PHOTOGRAPHERS
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-[64px] font-extrabold text-slate-900 tracking-tight leading-[1.08] font-sans">
                Take a Shot.
                <br />
                <span className="text-slate-900">Let It Sync.</span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
                Camera-to-Cloud menghubungkan kamera Anda langsung ke cloud storage melalui USB tethering,
                sehingga foto langsung terunggah otomatis tanpa perlu upload manual.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
              <Button
                variant="primary"
                size="xl"
                onClick={onStartClick}
                iconTrailing={<ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
              >
                Mulai Sekarang
              </Button>

              <Button
                variant="secondary"
                size="xl"
                onClick={onHowItWorksClick}
                className="bg-white hover:bg-slate-50 border-gray-300 text-slate-700"
              >
                Lihat Cara Kerja
              </Button>
            </div>

            {/* 4 Feature Micro-Badges */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-100">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Zap className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  Otomatis Upload ke Cloud
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  Aman & Terpercaya
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  Hemat Waktu
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Camera className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  Dukung Berbagai Merek Kamera
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity Photographer Desk Mockup */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              
              {/* Outer Glow & Shadow Base */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200/80 bg-slate-900">
                {/* Real Photo Setup Backdrop: Camera + Laptop Tethering */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                  <img
                    src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85"
                    alt="Sony Alpha Professional Camera and Laptop USB Tethering"
                    className="w-full h-full object-cover object-center opacity-90 hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Subtle Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                  
                  {/* Floating Live Ingestion Status Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md rounded-xl p-4 border border-slate-700/80 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold text-white font-mono">TETHER ACTIVE: Sony α7 IV</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          USB 3.2 10Gbps
                        </span>
                      </div>

                      <span className="text-xs font-mono font-semibold text-emerald-400">
                        48.5 MB/s
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: 'DSC_4892.ARW', status: 'COMPLETED', time: '1s ago' },
                        { name: 'DSC_4893.ARW', status: 'COMPLETED', time: '3s ago' },
                        { name: 'DSC_4894.ARW', status: 'STREAMING', time: '74%' },
                        { name: 'DSC_4895.ARW', status: 'QUEUED', time: 'Buffer' },
                      ].map((file, i) => (
                        <div key={i} className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono">
                          <div className="text-slate-300 truncate font-medium">{file.name}</div>
                          <div className={`mt-0.5 font-semibold ${
                            file.status === 'COMPLETED' ? 'text-emerald-400' :
                            file.status === 'STREAMING' ? 'text-sky-400' : 'text-amber-400'
                          }`}>
                            {file.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Camera Compatibility Pill */}
              <div className="absolute -top-4 -left-4 bg-white rounded-xl py-2 px-3.5 border border-gray-200 shadow-lg flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Direct RAW + JPG Sync</span>
              </div>

              {/* Floating Cloud Storage Pill */}
              <div className="absolute -bottom-3 -right-3 bg-white rounded-xl py-2 px-3.5 border border-gray-200 shadow-lg flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Wifi className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Auto Presigned S3 Stream</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
