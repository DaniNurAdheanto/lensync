import React from 'react';
import { CloudCheck, Image as ImageIcon, Camera, Eye } from 'lucide-react';
import { Badge } from '../../components/design-system/Badge';

export interface PhotoItem {
  id: string;
  filename: string;
  thumbnailUrl: string;
  capturedAt: string;
  cameraModel: string;
  exif: {
    lens: string;
    focalLength: string;
    aperture: string;
    shutterSpeed: string;
    iso: number;
  };
  fileSizeBytes: number;
  format: 'RAW' | 'JPEG';
  isCloudSynced: boolean;
}

export const PhotoThumbnailGrid: React.FC<{
  photos: PhotoItem[];
  onSelectPhoto?: (photo: PhotoItem) => void;
}> = ({ photos, onSelectPhoto }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          onClick={() => onSelectPhoto?.(photo)}
          className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
            <img
              src={photo.thumbnailUrl}
              alt={photo.filename}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute top-2 left-2 flex items-center gap-1">
              <Badge size="sm" variant={photo.format === 'RAW' ? 'indigo' : 'gray'}>
                {photo.format}
              </Badge>
            </div>
            {photo.isCloudSynced && (
              <div className="absolute top-2 right-2 bg-emerald-600/90 text-white p-1 rounded-md backdrop-blur-xs">
                <CloudCheck className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <div className="p-3">
            <p className="text-xs font-semibold text-gray-900 truncate font-mono">
              {photo.filename}
            </p>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">
              {photo.exif.aperture} • {photo.exif.shutterSpeed} • ISO {photo.exif.iso}
            </p>
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
              <span>{photo.cameraModel}</span>
              <span>{(photo.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
