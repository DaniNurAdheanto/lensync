import React, { useState } from 'react';
import { Camera, Check, ShieldCheck, HelpCircle } from 'lucide-react';
import { Badge } from '../design-system/Badge';

export const CameraCompatibilitySection: React.FC = () => {
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  const supportedCameras = [
    { brand: 'Canon', models: 'EOS R5 Mark II, R5, R6 Mark II, R3, 5D Mark IV, 1D X Mark III', ext: '.CR3, .CR2' },
    { brand: 'Sony', models: 'α1, α7R V, α7 IV, α7S III, α9 III, FX3, FX30', ext: '.ARW' },
    { brand: 'Nikon', models: 'Z9, Z8, Z6 III, Z7 II, D850, D6', ext: '.NEF' },
    { brand: 'Fujifilm', models: 'GFX 100 II, X-T5, X-H2S, X-T4', ext: '.RAF' },
    { brand: 'Panasonic', models: 'Lumix S5 IIX, S1H, GH6, G9 II', ext: '.RW2' },
    { brand: 'Leica', models: 'SL2, SL3, M11, Q3', ext: '.DNG' },
    { brand: 'Smartphones', models: 'Apple iPhone (iOS DCIM), Samsung Galaxy, Google Pixel (Android MTP)', ext: '.HEIC, .JPG, .DNG' },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase font-sans">
            DIPERCAYA OLEH FOTOGRAFER PROFESIONAL
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
            Bekerja dengan Kamera Favorit Anda
          </h2>
        </div>

        {/* Featured Brand Logos Bar (Exactly matching image.png) */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 py-8 px-6 rounded-2xl bg-slate-50/70 border border-gray-200/80 max-w-4xl mx-auto">
          {/* Canon Logo */}
          <div className="flex items-center">
            <span className="text-2xl sm:text-3xl font-serif font-black tracking-tighter text-slate-800 hover:text-red-600 transition-colors cursor-default">
              Canon
            </span>
          </div>

          {/* SONY Logo */}
          <div className="flex items-center">
            <span className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-slate-900 hover:text-indigo-600 transition-colors cursor-default">
              SONY
            </span>
          </div>

          {/* Nikon Logo */}
          <div className="flex items-center">
            <span className="text-2xl sm:text-3xl font-serif italic font-black tracking-tight text-slate-900 hover:text-amber-500 transition-colors cursor-default">
              Nikon
            </span>
          </div>

          {/* Divider Line */}
          <div className="hidden md:block w-px h-8 bg-gray-300" />

          {/* Text note */}
          <div className="text-center md:text-left">
            <p className="text-sm font-medium text-slate-600">
              Dan merek kamera lainnya yang kompatibel.
            </p>
          </div>
        </div>

        {/* Interactive Compatibility Drawer */}
        <div className="mt-10 max-w-4xl mx-auto pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Protokol Tethering yang Didukung:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                USB-C PTP
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                Android MTP
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                iOS DCIM
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Hotfolder Auto-Watch
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {supportedCameras.map((cam, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-gray-200/80 bg-white hover:border-indigo-200 hover:shadow-xs transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-slate-900">{cam.brand}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                    {cam.ext}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-snug">
                  {cam.models}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
