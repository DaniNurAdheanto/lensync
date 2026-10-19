export interface ShootSession {
  id: string;
  projectId: string;
  title: string;
  sessionDate: string;
  location: string;
  isLive: boolean;
  totalPhotosCount: number;
  uploadedCount: number;
}
