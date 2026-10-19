export interface TetheredDevice {
  id: string;
  deviceUid: string;
  name: string;
  deviceType: 'dslr_camera' | 'mirrorless_camera' | 'smartphone_android' | 'smartphone_ios' | 'desktop_agent';
  modelName: string;
  status: 'offline' | 'online' | 'tethered' | 'syncing' | 'error';
  batteryLevel?: number;
  firmwareVersion?: string;
  storageRemainingGb?: number;
}
