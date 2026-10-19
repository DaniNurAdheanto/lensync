import React from 'react';
import { Calendar, User, FolderGit2, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../components/design-system/Badge';

export interface ActiveSessionProps {
  session: {
    id: string;
    title: string;
    photographer: string;
    location: string;
    totalSyncedPhotos: number;
    totalSizeMB: number;
    isStreaming: boolean;
  };
}

export const ActiveSessionHeader: React.FC<ActiveSessionProps> = ({ session }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">{session.title}</h2>
          <Badge variant={session.isStreaming ? 'success' : 'gray'} dot size="md">
            {session.isStreaming ? 'LIVE SYNC ACTIVE' : 'PAUSED'}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-gray-400" />
            {session.photographer}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {session.location}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-mono">
            <FolderGit2 className="w-3.5 h-3.5 text-gray-400" />
            ID: {session.id}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xs text-gray-500 font-medium">Cloud Synchronized</p>
          <div className="flex items-center gap-1.5 justify-end mt-0.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-base font-bold text-gray-900 font-mono">
              {session.totalSyncedPhotos} Photos ({session.totalSizeMB > 1024 ? `${(session.totalSizeMB / 1024).toFixed(1)} GB` : `${session.totalSizeMB} MB`})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
