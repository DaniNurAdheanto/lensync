import React from 'react';
import { Accordion } from '../design-system/Accordion';
import { HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const faqItems = [
    {
      id: 'faq-1',
      question: 'Bagaimana cara kamera terhubung ke Camera-to-Cloud?',
      answer:
        'Cukup hubungkan kamera DSLR atau Mirrorless Anda ke laptop (macOS atau Windows) menggunakan kabel tethering USB-C atau USB 3.0 standar. Aplikasi Desktop Agent kami akan secara otomatis memantau folder hasil tethering (dari Canon EOS Utility, Sony Imaging Edge, Nikon NX Tether, atau Capture One) dan langsung menyinkronkan file baru ke cloud dalam hitungan detik.',
    },
    {
      id: 'faq-2',
      question: 'Apakah file foto RAW berukuran besar didukung?',
      answer:
        'Ya! Camera-to-Cloud dirancang khusus untuk alur kerja fotografi profesional. Kami mendukung penuh file RAW Canon (.CR3, .CR2), Sony (.ARW), Nikon (.NEF), Adobe (.DNG), Fujifilm (.RAF), JPEG kualitas penuh, dan format iPhone Apple ProRAW/HEIC dengan upload multipart berkecepatan tinggi.',
    },
    {
      id: 'faq-3',
      question: 'Apa yang terjadi jika koneksi internet terputus di tengah sesi pemotretan?',
      answer:
        'Tidak ada file yang hilang. Desktop Agent memiliki sistem antrean lokal (Local Upload Queue) dengan fitur auto-retry dan debounce buffer. Foto tetap aman tersimpan di kartu memori kamera dan hard disk laptop Anda. Saat koneksi internet kembali pulih, proses upload akan berlanjut secara otomatis tanpa intervensi manual.',
    },
    {
      id: 'faq-4',
      question: 'Apakah klien atau tim kreatif bisa melihat foto secara langsung?',
      answer:
        'Bisa! Anda dapat membagikan private link sesi pemotretan kepada art director, stylist, atau klien. Mereka dapat membuka link tersebut dari browser handphone, tablet, atau laptop tanpa perlu mengunduh aplikasi untuk melihat preview foto real-time, memberi rating bintang, atau memilih foto favorit.',
    },
    {
      id: 'faq-5',
      question: 'Apakah saya membutuhkan hardware khusus yang mahal?',
      answer:
        'Tidak sama sekali. Anda hanya membutuhkan kamera yang mendukung tethering USB, kabel USB kamera standar, laptop biasa, dan koneksi internet (Wi-Fi studio atau tethering 4G/5G dari smartphone).',
    },
    {
      id: 'faq-6',
      question: 'Apakah saya bisa menggunakan S3 storage atau MinIO milik studio saya sendiri?',
      answer:
        'Tentu saja. Platform kami mendukung Bring Your Own Storage (BYOS) dengan protokol S3-compatible seperti AWS S3, Cloudflare R2, MinIO on-premise, Wasabi, atau Google Cloud Storage.',
    },
  ];

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase font-sans">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            Semua yang perlu Anda ketahui tentang alur kerja Camera-to-Cloud.
          </p>
        </div>

        {/* Untitled UI Accordion */}
        <Accordion items={faqItems} defaultOpenId="faq-1" />

        {/* Support Callout */}
        <div className="mt-12 p-6 rounded-2xl bg-gray-50 border border-gray-200 text-center space-y-3">
          <h4 className="text-base font-bold text-slate-900">Masih punya pertanyaan lain?</h4>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Tim teknis dan fotografer kami siap membantu setup tethering kamera Anda.
          </p>
          <div>
            <a
              href="mailto:support@c2c.studio"
              className="inline-flex items-center text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Hubungi Tim Support Kami →
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
