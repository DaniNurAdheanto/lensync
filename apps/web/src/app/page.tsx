'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { SessionHeader } from '@/features/sessions/components/session-header';
import { DeviceList } from '@/features/devices/components/device-list';
import { UploadQueueList } from '@/features/uploads/components/upload-queue-badge';
import { PhotoGrid } from '@/features/gallery/components/photo-grid';
import { Card, CardHeader } from '@/components/ui/card';
import { TetheredDevice } from '@/features/devices/types';
import { ShootSession } from '@/features/sessions/types';
import { UploadQueueItem } from '@/features/uploads/types';
import { GalleryPhoto } from '@/features/gallery/types';

export default function DashboardPage() {
  const [session] = useState<ShootSession>({
    id: 'ses_paris_fw_01',
    projectId: 'proj_fashion_week_2026',
    title: 'Paris Fashion Week 2026 - Main Runway Shoot',
    sessionDate: '18 October 2026',
    location: 'Studio Marais, Paris, France',
    isLive: true,
    totalPhotosCount: 142,
    uploadedCount: 139,
  });

  const [devices] = useState<TetheredDevice[]>([
    {
      id: 'dev_canon_r5_01',
      deviceUid: 'CANON-EOS-R5-SN98271',
      name: 'Primary Camera (A-Cam)',
      deviceType: 'mirrorless_camera',
      modelName: 'Canon EOS R5 Mark II',
      status: 'tethered',
      batteryLevel: 88,
    },
    {
      id: 'dev_pixel_phone_01',
      deviceUid: 'GOOGLE-PIXEL-9PRO-USB',
      name: 'Mobile Backup (B-Cam)',
      deviceType: 'smartphone_android',
      modelName: 'Google Pixel 9 Pro',
      status: 'tethered',
      batteryLevel: 94,
    },
    {
      id: 'dev_agent_mbp',
      deviceUid: 'AGENT-MACBOOK-M2MAX',
      name: 'Tether Station Laptop',
      deviceType: 'desktop_agent',
      modelName: 'MacBook Pro 16" (M2 Max)',
      status: 'online',
    },
  ]);

  const [uploadQueue] = useState<UploadQueueItem[]>([
    {
      id: 'q_1',
      filename: 'IMG_4892.CR3',
      fileSizeBytes: 47185920,
      format: 'RAW',
      progressPercent: 78,
      status: 'uploading',
      speedMbps: 45.2,
    },
    {
      id: 'q_2',
      filename: 'IMG_4893.CR3',
      fileSizeBytes: 46137344,
      format: 'RAW',
      progressPercent: 12,
      status: 'queued',
    },
  ]);

  const [photos] = useState<GalleryPhoto[]>([
    {
      id: 'ph_1',
      originalFilename: 'IMG_4890.CR3',
      fileFormat: 'RAW_CR3',
      fileSizeBytes: 48500000,
      thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
      cameraModel: 'Canon EOS R5',
      iso: 200,
      shutterSpeed: '1/320s',
      aperture: 2.8,
      capturedAt: '2026-10-18T20:15:22Z',
      uploadStatus: 'completed',
    },
    {
      id: 'ph_2',
      originalFilename: 'IMG_4889.CR3',
      fileFormat: 'RAW_CR3',
      fileSizeBytes: 47200000,
      thumbnailUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
      cameraModel: 'Canon EOS R5',
      iso: 200,
      shutterSpeed: '1/320s',
      aperture: 2.8,
      capturedAt: '2026-10-18T20:14:50Z',
      uploadStatus: 'completed',
    },
    {
      id: 'ph_3',
      originalFilename: 'IMG_4888.CR3',
      fileFormat: 'RAW_CR3',
      fileSizeBytes: 49100000,
      thumbnailUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
      cameraModel: 'Canon EOS R5',
      iso: 400,
      shutterSpeed: '1/250s',
      aperture: 2.0,
      capturedAt: '2026-10-18T20:12:10Z',
      uploadStatus: 'completed',
    },
    {
      id: 'ph_4',
      originalFilename: 'IMG_4887.CR3',
      fileFormat: 'RAW_CR3',
      fileSizeBytes: 46800000,
      thumbnailUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=600&q=80',
      cameraModel: 'Canon EOS R5',
      iso: 100,
      shutterSpeed: '1/500s',
      aperture: 1.8,
      capturedAt: '2026-10-18T20:10:04Z',
      uploadStatus: 'completed',
    },
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <SessionHeader session={session} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader
                  title="Live Shoot Gallery"
                  subtitle="Latest photos uploaded directly from camera tethering buffer"
                />
                <PhotoGrid photos={photos} />
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="Tethered Devices"
                  subtitle="USB PTP/MTP & Active Hotfolder"
                />
                <DeviceList devices={devices} />
              </Card>

              <Card>
                <CardHeader
                  title="Upload Queue"
                  subtitle="Background S3 multipart workers"
                />
                <UploadQueueList items={uploadQueue} />
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
