import React, { useState } from 'react';
import { Check, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';

interface PricingSectionProps {
  onSelectPlan: (planName: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const [annualBilling, setAnnualBilling] = useState<boolean>(true);

  const plans = [
    {
      name: 'Starter Solo',
      badge: 'Uji Coba',
      description: 'Ideal untuk fotografer pemula atau solo yang ingin mencoba tethering otomatis.',
      monthlyPrice: '0',
      annualPrice: '0',
      period: 'Gratis Selamanya',
      cta: 'Mulai Gratis',
      popular: false,
      features: [
        '1 Perangkat Kamera Aktif',
        'Desktop Agent (macOS & Windows)',
        '10 GB Cloud Storage',
        'Dukungan JPEG & HEIC',
        'Galeri Web Standar',
        'Komunitas Support',
      ],
    },
    {
      name: 'Studio Pro',
      badge: 'Paling Populer',
      description: 'Untuk fotografer komersial, wedding, dan studio fashion dengan throughput tinggi.',
      monthlyPrice: '299.000',
      annualPrice: '239.000',
      period: 'per bulan, ditagih tahunan',
      cta: 'Pilih Studio Pro',
      popular: true,
      features: [
        'Kamera Tanpa Batas (Multi-Camera)',
        'Full RAW Support (.CR3, .ARW, .NEF, .DNG)',
        '2 TB High-Speed S3 Cloud Storage',
        'Deduplikasi SHA-256 Otomatis',
        'Private Client Portal dengan Password',
        'Real-time EXIF Telemetri Inspector',
        'Export ZIP & Lightroom Sync Companion',
        'Prioritas Support via WhatsApp & Email',
      ],
    },
    {
      name: 'Agency & Production',
      badge: 'Enterprise',
      description: 'Untuk rumah produksi, agensi kreatif, dan tim liputan acara berskala besar.',
      monthlyPrice: '899.000',
      annualPrice: '719.000',
      period: 'per bulan, ditagih tahunan',
      cta: 'Hubungi Tim Penjualan',
      popular: false,
      features: [
        'Multi-Station Tether Agents (10+ Laptop)',
        '10 TB High-Speed S3 Storage (Scaleable)',
        'Koneksi ke S3/MinIO/Cloudflare R2 Sendiri (BYOS)',
        'Custom Domain & Whitelabel Branding Klien',
        'Role-Based Access Control (Admin, Editor, Klien)',
        'REST API & Webhook Ingestion Access',
        'Dedicated SLA 99.9% Uptime',
        'Dedicated Account Manager 24/7',
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-slate-50/60 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase font-sans">
            PAKET & HARGA
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
            Investasi Sederhana untuk Efisiensi Maksimal
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            Pilih paket yang paling sesuai dengan volume pemotretan dan kebutuhan studio Anda.
          </p>

          {/* Monthly / Annual Switcher */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold ${!annualBilling ? 'text-slate-900' : 'text-slate-500'}`}>
              Bulanan
            </span>
            
            <button
              onClick={() => setAnnualBilling(!annualBilling)}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 transition-colors focus:outline-none"
              role="switch"
              aria-checked={annualBilling}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  annualBilling ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>

            <span className={`text-sm font-semibold flex items-center gap-1.5 ${annualBilling ? 'text-slate-900' : 'text-slate-500'}`}>
              <span>Tahunan</span>
              <Badge variant="brand" size="sm">
                Hemat 20%
              </Badge>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col justify-between transition-all duration-200 ${
                plan.popular
                  ? 'bg-white border-2 border-indigo-600 shadow-xl shadow-indigo-600/10'
                  : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge variant="brand" size="md" iconLeading={<Sparkles className="w-3.5 h-3.5" />}>
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    {!plan.popular && (
                      <span className="text-xs font-medium text-slate-500">{plan.badge}</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed min-h-[40px]">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pb-6 border-b border-gray-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-slate-500">Rp</span>
                    <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                      {annualBilling ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    {plan.monthlyPrice !== '0' && (
                      <span className="text-xs text-slate-500">/bln</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{plan.period}</p>
                </div>

                {/* Feature Checklist */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Fitur Unggulan:
                  </span>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-8">
                <Button
                  variant={plan.popular ? 'primary' : 'secondary'}
                  size="lg"
                  onClick={() => onSelectPlan(plan.name)}
                  className="w-full justify-center"
                >
                  {plan.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
