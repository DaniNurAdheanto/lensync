import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Camera to Cloud (C2C) | Real-time Ingestion',
  description: 'Automated camera-to-cloud photo ingestion platform via USB tethering',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
