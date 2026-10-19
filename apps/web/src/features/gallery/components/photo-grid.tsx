import React from 'react';
import { Camera, Eye, Download, Info } from 'lucide-react';
import { GalleryPhoto } from '../types';
import { Badge } from '@/components/ui/badge';

interface PhotoGridProps {
  photos: GalleryPhoto[];
  onSelectPhoto?: (photo: GalleryPhoto) => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onSelectPhoto }) => {
  if (photos.length === 0) {
    return (
      <div className="border border-dashed border-slate-800 rounded-xl p-12 text-center">
        <Camera className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h4 className="text-sm font-medium text-slate-300">No photos ingested yet</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Connect your camera via USB tethering to the desktop agent or shoot photos into the hotfolder.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          onClick={() => onSelectPhoto?.(photo)}
          className="group relative bg-slate-900 border border-slate-800 rounded-lg overflow-hidden hover:border-slate-700 transition-all cursor-pointer"
        >
          {/* Aspect preview container */}
          <div className="aspect-[3/2] bg-slate-950 relative flex items-center justify-center overflow-hidden">
            {photo.thumbnailUrl ? (
              <img
                src={photo.thumbnailUrl}
                alt={photo.originalFilename}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-600">
                <Camera className="w-8 h-8 mb-1" />
                <span className="text-[10px] uppercase font-mono">{photo.fileFormat}</span>
              </div>
            )}

            <div className="absolute top-2 right-2">
              <Badge variant="info" className="text-[10px] px-1.5 py-0.5">
                {photo.fileFormat}
              </Badge>
            </div>
          </div>

          {/* Metadata Card Footer */}
          <div className="p-2.5">
            <div className="text-xs font-mono font-medium text-slate-200 truncate">
              {photo.originalFilename}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
              <span>{photo.cameraModel || 'EOS R5'}</span>
              <span>ISO {photo.iso || 100} • {photo.shutterSpeed || '1/250s'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
