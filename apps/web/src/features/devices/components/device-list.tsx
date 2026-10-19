import React from 'react';
import { Camera, Smartphone, Cpu, CheckCircle2, Clock } from 'lucide-react';
import { TetheredDevice } from '../types';
import { Badge } from '@/components/ui/badge';

interface DeviceListProps {
  devices: TetheredDevice[];
}

export const DeviceList: React.FC<DeviceListProps> = ({ devices }) => {
  return (
    <div className="space-y-3">
      {devices.map((device) => {
        const isCamera = device.deviceType === 'dslr_camera' || device.deviceType === 'mirrorless_camera';
        const isPhone = device.deviceType === 'smartphone_android' || device.deviceType === 'smartphone_ios';
        
        return (
          <div
            key={device.id}
            className="flex items-center justify-between p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center text-slate-300">
                {isCamera ? (
                  <Camera className="w-5 h-5 text-emerald-400" />
                ) : isPhone ? (
                  <Smartphone className="w-5 h-5 text-sky-400" />
                ) : (
                  <Cpu className="w-5 h-5 text-purple-400" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-100 flex items-center gap-2">
                  <span>{device.name}</span>
                  <span className="text-xs text-slate-400">({device.modelName})</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  UID: {device.deviceUid}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant={device.status === 'tethered' ? 'success' : 'neutral'}>
                {device.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
};
