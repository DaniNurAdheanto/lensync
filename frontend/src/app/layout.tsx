import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Camera-to-Cloud | Take a Shot. Let It Sync.',
  description: 'Otomatis upload foto dari kamera DSLR/Mirrorless & smartphone melalui USB tethering langsung ke Cloud Storage.',
};

import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="bg-white text-slate-900 antialiased font-sans selection:bg-indigo-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
