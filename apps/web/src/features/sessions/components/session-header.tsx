import React from 'react';
import { Calendar, MapPin, Radio, UploadCloud } from 'lucide-react';
import { ShootSession } from '../types';
import { Badge } from '@/components/ui/badge';

interface SessionHeaderProps {
  session: ShootSession;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({ session }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-100">{session.title}</h1>
          {session.isLive && (
            <Badge variant="success" className="animate-pulse">
              <Radio className="w-3 h-3 mr-1" /> LIVE SESSION
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{session.sessionDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{session.location}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
        <UploadCloud className="w-5 h-5 text-emerald-400" />
        <div>
          <div className="text-xs text-slate-400">Sync Status</div>
          <div className="text-sm font-semibold text-slate-100">
            {session.uploadedCount} / {session.totalPhotosCount} Photos
          </div>
        </div>
      </div>
    </div>
  );
};
