import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../design-system/Button';

interface CtaBannerSectionProps {
  onStartClick: () => void;
}

export const CtaBannerSection: React.FC<CtaBannerSectionProps> = ({ onStartClick }) => {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1920&q=85"
          alt="Outdoor photographer in mountains at sunset holding professional camera"
          className="w-full h-full object-cover object-right md:object-center opacity-40 mix-blend-luminosity scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative z-10">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase font-sans">
              SIAP MEMULAI?
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] font-sans">
            Tingkatkan Alur Kerja Fotografi Anda Bersama Camera-to-Cloud
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Fokus pada karya Anda. Kami yang mengurus proses upload-nya.
          </p>

          <div className="pt-2">
            <Button
              variant="primary"
              size="xl"
              onClick={onStartClick}
              iconTrailing={<ArrowRight className="w-4 h-4 stroke-[2.5]" />}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 text-white font-semibold px-7 py-4 rounded-xl"
            >
              Mulai Sekarang
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
