/**
 * @fileoverview Shared TypeScript Interfaces and Types for Camera-to-Cloud API
 */

export type PhotoFormat =
  | 'RAW_CR3'
  | 'RAW_CR2'
  | 'RAW_ARW'
  | 'RAW_NEF'
  | 'RAW_DNG'
  | 'JPEG'
  | 'HEIC'
  | 'TIFF';

export type DeviceType =
  | 'dslr_camera'
  | 'mirrorless_camera'
  | 'smartphone_android'
  | 'smartphone_ios'
  | 'desktop_agent';

export type DeviceStatus = 'offline' | 'online' | 'tethered' | 'syncing' | 'error';

export type UploadStatus = 'queued' | 'uploading' | 'completed' | 'failed' | 'paused';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'photographer' | 'assistant' | 'client' | 'editor';
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientName?: string;
  description?: string;
  ownerId: string;
  storageFolderPrefix: string;
  isActive: boolean;
  createdAt: string;
}

export interface ShootSession {
  id: string;
  projectId: string;
  title: string;
  sessionDate: string;
  location?: string;
  isLive: boolean;
  createdAt: string;
}

export interface Device {
  id: string;
  deviceUid: string;
  name: string;
  deviceType: DeviceType;
  modelName?: string;
  serialNumber?: string;
  status: DeviceStatus;
  agentVersion?: string;
  lastHeartbeat?: string;
  currentSessionId?: string;
}

export interface Photo {
  id: string;
  sessionId: string;
  deviceId?: string;
  originalFilename: string;
  fileFormat: PhotoFormat;
  fileSizeBytes: number;
  sha256Hash: string;
  s3Bucket: string;
  s3KeyOriginal: string;
  s3KeyPreview?: string;
  s3KeyThumbnail?: string;
  
  // EXIF
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  focalLengthMm?: number;
  apertureFStop?: number;
  shutterSpeedStr?: string;
  isoSpeed?: number;
  capturedAt?: string;

  uploadStatus: UploadStatus;
  uploadedAt?: string;
  createdAt: string;
}

export interface UploadRequest {
  sessionId: string;
  deviceId?: string;
  originalFilename: string;
  fileSizeBytes: number;
  sha256Hash: string;
  fileFormat: PhotoFormat;
}

export interface UploadResponse {
  photoId: string;
  uploadTaskId: string;
  presignedUrl: string;
  s3Key: string;
  alreadyUploaded: boolean;
}

export interface ConfirmUploadRequest {
  photoId: string;
  uploadTaskId: string;
  success: boolean;
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  focalLengthMm?: number;
  apertureFStop?: number;
  shutterSpeedStr?: string;
  isoSpeed?: number;
  capturedAt?: string;
}
