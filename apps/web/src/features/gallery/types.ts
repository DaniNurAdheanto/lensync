export interface GalleryPhoto {
  id: string;
  originalFilename: string;
  fileFormat: string;
  fileSizeBytes: number;
  thumbnailUrl: string;
  cameraModel?: string;
  lensModel?: string;
  iso?: number;
  shutterSpeed?: string;
  aperture?: number;
  focalLength?: number;
  capturedAt: string;
  uploadStatus: 'queued' | 'uploading' | 'completed' | 'failed';
}
