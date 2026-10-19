export interface UploadQueueItem {
  id: string;
  filename: string;
  fileSizeBytes: number;
  format: string;
  progressPercent: number;
  status: 'queued' | 'uploading' | 'completed' | 'failed';
  speedMbps?: number;
}
