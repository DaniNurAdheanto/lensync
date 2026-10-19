'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Camera, Radio, UploadCloud, ArrowLeft, RefreshCw, Smartphone, Laptop, CheckCircle2 } from 'lucide-react';

export default function PhotographerDashboard() {
  const [photos] = useState([
    {
      id: 'ph_1',
      name: 'DSC_0012.RAW',
      size: '48.2 MB',
      format: 'RAW (.ARW)',
      camera: 'Sony α7 IV',
      iso: 100,
      shutter: '1/500s',
      f: 'f/2.8',
      status: 'completed',
      img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 'ph_2',
      name: 'DSC_0013.JPG',
      size: '12.4 MB',
      format: 'JPEG',
      camera: 'Sony α7 IV',
      iso: 100,
      shutter: '1/500s',
      f: 'f/2.8',
      status: 'completed',
      img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 'ph_3',
      name: 'DSC_0014.RAW',
      size: '52.1 MB',
      format: 'RAW (.ARW)',
      camera: 'Sony α7 IV',
      iso: 200,
      shutter: '1/320s',
      f: 'f/2.0',
      status: 'completed',
      img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=500&q=80',
    },
    {
      id: 'ph_4',
      name: 'DSC_0015.JPG',
      size: '11.8 MB',
      format: 'JPEG',
      camera: 'Sony α7 IV',
      iso: 400,
      shutter: '1/250s',
      f: 'f/1.8',
      status: 'completed',
      img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=500&q=80',
    },
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Landing Page</span>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white">Paris Fashion Week 2026</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse">
              <Radio className="w-2.5 h-2.5" /> LIVE TETHER
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>MinIO S3: 48.5 MB/s</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Total Photos Ingested</div>
            <div className="text-2xl font-bold text-white mt-1">1,248</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Synced to S3 Cloud</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">1,200</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Uploading / Pending</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">32</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Active Devices</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1">2 Tethered</div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">Live Ingestion Stream</h3>
              <p className="text-xs text-slate-400">Foto masuk langsung dari Sony α7 IV via USB-C tethering</p>
            </div>
            <span className="text-xs font-mono text-slate-400">Folder: /Pictures/C2C_HotFolder</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden group">
                <div className="aspect-[3/2] overflow-hidden relative">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/75 text-emerald-300 border border-emerald-500/30">
                    {p.format}
                  </span>
                </div>
                <div className="p-3 text-xs font-mono">
                  <div className="font-semibold text-white truncate">{p.name}</div>
                  <div className="text-slate-400 text-[11px] mt-1 flex justify-between">
                    <span>{p.size}</span>
                    <span>ISO {p.iso} • {p.shutter}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
