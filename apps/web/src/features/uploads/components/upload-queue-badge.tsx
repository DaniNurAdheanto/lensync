import React from 'react';
import { ArrowUpCircle, CheckCircle, Clock } from 'lucide-react';
import { UploadQueueItem } from '../types';

interface UploadQueueProps {
  items: UploadQueueItem[];
}

export const UploadQueueList: React.FC<UploadQueueProps> = ({ items }) => {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium text-slate-200">{item.filename}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {item.format}
              </span>
            </div>
            <span className="text-slate-400 font-mono">
              {(item.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                item.status === 'completed'
                  ? 'bg-emerald-500'
                  : item.status === 'uploading'
                  ? 'bg-sky-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${item.progressPercent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
