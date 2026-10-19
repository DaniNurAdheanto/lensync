import React from 'react';
import {
  CheckCircle2,
  HardDrive,
  Layers,
  Search,
  Share2,
  Activity,
  FolderOpen,
  ArrowUpRight,
  Shield,
  Smartphone,
  Laptop
} from 'lucide-react';

export const FeaturesShowcaseSection: React.FC = () => {
  const checklistItems = [
    'Manajemen proyek & sesi pemotretan',
    'Monitoring upload real-time',
    'Galeri foto dengan pencarian dan filter',
    'Berbagi galeri dengan klien (private link)',
  ];

  return (
    <section id="features" className="py-20 lg:py-28 bg-[#090D16] text-white relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* Left Column: Value Proposition & Checklist */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase font-sans">
                SATU PLATFORM, SEMUA KEBUTUHAN
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight font-sans">
                Kelola Proyek, Pantau Upload, Akses Galeri
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Dashboard web kami memudahkan Anda mengelola proyek pemotretan, memantau proses upload secara real-time,
                dan mengakses galeri foto dengan aman.
              </p>
            </div>

            {/* 4 Checkmark Bullets */}
            <div className="space-y-4">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4 fill-indigo-400/20 text-indigo-400" />
                  </div>
                  <span className="text-sm font-semibold text-slate-200">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Extra Benefit Callout */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white">Privasi Terjaga Penuh: </span>
                Link klien diamankan dengan enkripsi token sekali pakai & password opsional.
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity Laptop + Smartphone Mockup */}
          <div className="lg:col-span-7 relative">
            <div className="relative mx-auto max-w-2xl lg:max-w-none">
              
              {/* Laptop Shell Mockup */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
                {/* Laptop Top Browser/App Bar */}
                <div className="h-9 bg-slate-950 px-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="text-slate-400 text-[11px] ml-3 font-sans font-medium flex items-center gap-1">
                      <span>Camera-to-Cloud Dashboard</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">https://app.c2c.cloud/project-overview</span>
                </div>

                {/* Dashboard Inside Laptop */}
                <div className="grid grid-cols-12 bg-white text-slate-900 min-h-[380px] text-xs">
                  {/* Left Mini Sidebar */}
                  <div className="col-span-3 bg-slate-50 border-r border-gray-200 p-3 space-y-4">
                    <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5 pb-2 border-b border-gray-200">
                      <div className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                        C2C
                      </div>
                      <span>Dashboard</span>
                    </div>

                    <div className="space-y-1 font-medium text-[11px]">
                      <div className="px-2 py-1.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold flex items-center gap-2">
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Projects</span>
                      </div>
                      <div className="px-2 py-1.5 rounded-md text-slate-600 hover:bg-gray-100 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Gallery</span>
                      </div>
                      <div className="px-2 py-1.5 rounded-md text-slate-600 hover:bg-gray-100 flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>Devices</span>
                      </div>
                      <div className="px-2 py-1.5 rounded-md text-slate-600 hover:bg-gray-100 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Settings</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Dashboard Panel */}
                  <div className="col-span-9 p-4 space-y-4 bg-white overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">Project Overview</h4>
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Synchronized
                      </span>
                    </div>

                    {/* 4 Stat Metric Cards (Exactly as in reference image) */}
                    <div className="grid grid-cols-4 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                        <div className="text-[10px] text-slate-500 font-medium">Total Photos</div>
                        <div className="text-base font-bold text-slate-900 mt-0.5">1,248</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                        <div className="text-[10px] text-slate-500 font-medium">Uploaded</div>
                        <div className="text-base font-bold text-emerald-600 mt-0.5">1,200</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
                        <div className="text-[10px] text-slate-500 font-medium">Pending</div>
                        <div className="text-base font-bold text-amber-600 mt-0.5">32</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100">
                        <div className="text-[10px] text-slate-500 font-medium">Failed</div>
                        <div className="text-base font-bold text-rose-600 mt-0.5">16</div>
                      </div>
                    </div>

                    {/* Recent Uploads Table (Exactly as in reference image) */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden text-[11px]">
                      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 font-semibold text-slate-700 flex justify-between">
                        <span>Recent Uploads</span>
                        <span className="text-[10px] font-normal text-slate-500 font-mono">Queue depth: 32</span>
                      </div>
                      <div className="divide-y divide-gray-100 font-mono">
                        {[
                          { file: 'DSC_0012.RAW', size: '48.2 MB', status: 'Completed', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', time: '10:24' },
                          { file: 'DSC_0013.JPG', size: '12.4 MB', status: 'Uploading', color: 'text-sky-700 bg-sky-50 border-sky-200', time: '10:22' },
                          { file: 'DSC_0014.RAW', size: '52.1 MB', status: 'Completed', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', time: '10:20' },
                          { file: 'DSC_0015.JPG', size: '11.8 MB', status: 'Completed', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', time: '10:18' },
                          { file: 'DSC_0016.RAW', size: '49.7 MB', status: 'Failed', color: 'text-rose-700 bg-rose-50 border-rose-200', time: '10:12' },
                        ].map((row, i) => (
                          <div key={i} className="px-3 py-1.5 flex items-center justify-between text-[11px] hover:bg-slate-50">
                            <span className="font-medium text-slate-900 w-28 truncate">{row.file}</span>
                            <span className="text-slate-500">{row.size}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-medium border ${row.color}`}>
                              {row.status}
                            </span>
                            <span className="text-slate-400">{row.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smartphone Preview Mockup Positioned Over Laptop (Right Side) */}
              <div className="absolute -bottom-6 -right-4 sm:-right-8 w-44 sm:w-52 rounded-[28px] bg-slate-950 p-2.5 shadow-2xl border-4 border-slate-700/80 hidden sm:block">
                {/* Speaker pill notch */}
                <div className="w-16 h-3 bg-slate-900 rounded-full mx-auto mb-2" />
                
                {/* Screen inside phone */}
                <div className="bg-white rounded-[20px] overflow-hidden p-2 text-slate-900 min-h-[260px] flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-1 border-b border-gray-100 text-[10px] font-bold">
                      <span>‹ My Project</span>
                      <Search className="w-3 h-3 text-slate-400" />
                    </div>

                    {/* Small Photo Grid 2-cols */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <img
                        src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=250&q=80"
                        alt="Photo 1"
                        className="rounded aspect-[3/4] object-cover w-full"
                      />
                      <img
                        src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=250&q=80"
                        alt="Photo 2"
                        className="rounded aspect-[3/4] object-cover w-full"
                      />
                      <img
                        src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=250&q=80"
                        alt="Photo 3"
                        className="rounded aspect-[3/4] object-cover w-full"
                      />
                      <img
                        src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=250&q=80"
                        alt="Photo 4"
                        className="rounded aspect-[3/4] object-cover w-full"
                      />
                    </div>
                  </div>

                  {/* Mobile Bottom Navigation Bar */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-around text-[9px] text-slate-400">
                    <span className="text-indigo-600 font-bold">Photos</span>
                    <span>Uploads</span>
                    <span>Share</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
