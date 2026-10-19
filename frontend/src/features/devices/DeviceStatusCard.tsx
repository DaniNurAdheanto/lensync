import React from 'react';
import { Camera, Battery, HardDrive, Wifi, Smartphone } from 'lucide-react';
import { Card } from '../../components/design-system/Card';
import { Badge } from '../../components/design-system/Badge';
import { Button } from '../../components/design-system/Button';

export interface DeviceInfo {
  id: string;
  name: string;
  brand: 'Canon' | 'Sony' | 'Nikon' | 'Fujifilm' | 'Smartphone';
  model: string;
  connectionType: 'USB-C 3.2' | 'USB PTP' | 'MTP';
  status: 'connected' | 'capturing' | 'transferring' | 'offline';
  batteryPercentage: number;
  freeStorageGB: number;
  totalShotsThisSession: number;
}

export const DeviceStatusCard: React.FC<{
  device: DeviceInfo;
  onDisconnect?: () => void;
}> = ({ device, onDisconnect }) => {
  const isPhone = device.brand === 'Smartphone';

  return (
    <Card variant="default" padding="md" className="border-gray-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            {isPhone ? <Smartphone className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900 text-sm">{device.model}</h4>
              <Badge
                size="sm"
                variant={
                  device.status === 'connected' || device.status === 'transferring'
                    ? 'success'
                    : device.status === 'capturing'
                    ? 'warning'
                    : 'gray'
                }
                dot
              >
                {device.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Protocol: {device.connectionType} • {device.brand}
            </p>
          </div>
        </div>

        {onDisconnect && (
          <Button variant="secondary" size="sm" onClick={onDisconnect}>
            Disconnect
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 text-center">
        <div className="bg-gray-50 p-2.5 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
            <Battery className="w-3.5 h-3.5 text-emerald-600" />
            <span>Battery</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">{device.batteryPercentage}%</p>
        </div>

        <div className="bg-gray-50 p-2.5 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
            <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
            <span>Card Free</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">{device.freeStorageGB} GB</p>
        </div>

        <div className="bg-gray-50 p-2.5 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
            <Wifi className="w-3.5 h-3.5 text-blue-600" />
            <span>Session Shots</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">{device.totalShotsThisSession}</p>
        </div>
      </div>
    </Card>
  );
};
