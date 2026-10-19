import React from 'react';
import { UploadCloud, CheckCircle, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { Badge } from '../../components/design-system/Badge';
import { Button } from '../../components/design-system/Button';

export interface UploadQueueItem {
  id: string;
  filename: string;
  format: 'RAW' | 'JPEG';
  sizeBytes: number;
  progressPercent: number;
  status: 'queued' | 'uploading' | 'completed' | 'failed';
  speedMBs?: number;
  errorMessage?: string;
}

export const UploadQueueList: React.FC<{
  items: UploadQueueItem[];
  onRetry?: (id: string) => void;
}> = ({ items, onRetry }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-sm text-gray-900">Ingestion & Upload Queue</h3>
        </div>
        <span className="text-xs font-mono text-gray-500">{items.length} items</span>
      </div>

      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            Tidak ada foto dalam antrean. Hubungkan kamera dan ambil foto!
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-gray-900 truncate">
                    {item.filename}
                  </span>
                  <Badge size="sm" variant={item.format === 'RAW' ? 'indigo' : 'gray'}>
                    {item.format}
                  </Badge>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {(item.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>

                {item.status === 'uploading' && (
                  <div className="mt-2 space-y-1">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                      <span>{item.progressPercent}% transferred</span>
                      {item.speedMBs && <span>{item.speedMBs.toFixed(1)} MB/s</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {item.status === 'completed' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    <span>Uploaded</span>
                  </span>
                )}
                {item.status === 'queued' && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <Clock className="w-4 h-4" />
                    <span>Waiting</span>
                  </span>
                )}
                {item.status === 'failed' && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      <span>Failed</span>
                    </span>
                    {onRetry && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onRetry(item.id)}
                        iconLeading={<RefreshCw className="w-3 h-3" />}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
