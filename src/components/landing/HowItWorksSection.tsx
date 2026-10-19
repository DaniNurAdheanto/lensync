import React from 'react';
import { Camera, Folder, CloudUpload, LayoutGrid, ArrowRight } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '1',
      title: '1. Kamera ke Laptop',
      description:
        'Hubungkan kamera melalui USB dan gunakan software tethering sesuai merek kamera Anda.',
      icon: Camera,
    },
    {
      number: '2',
      title: '2. Deteksi Foto Baru',
      description:
        'Aplikasi kami memantau folder foto secara otomatis dan memastikan file sudah selesai.',
      icon: Folder,
    },
    {
      number: '3',
      title: '3. Upload ke Cloud',
      description:
        'Foto langsung diunggah ke cloud storage dengan aman dan stabil.',
      icon: CloudUpload,
    },
    {
      number: '4',
      title: '4. Pantau di Dashboard',
      description:
        'Lihat status upload, kelola proyek, dan akses galeri foto kapan saja, dari mana saja.',
      icon: LayoutGrid,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase font-sans">
            CARA KERJA
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
            Dari Kamera ke Cloud, Otomatis
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            Proses yang sederhana, hasil yang maksimal. Kami membuat alur kerja Anda lebih efisien,
            dari pemotretan hingga penyimpanan di cloud.
          </p>
        </div>

        {/* 4-Step Horizontal Pipeline */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-gray-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300 group"
                >
                  {/* Step Icon in soft blue/indigo square */}
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50/90 border border-indigo-100/80 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-xs">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 mb-2 font-sans">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Connector Arrow for Desktop */}
                  {idx < steps.length - 1 && (
                    <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-gray-200 items-center justify-center text-gray-400 shadow-xs">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
