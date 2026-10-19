export const SUPPORTED_RAW_FORMATS = [
  { ext: '.CR3', name: 'Canon RAW 3', mime: 'image/x-canon-cr3' },
  { ext: '.CR2', name: 'Canon RAW 2', mime: 'image/x-canon-cr2' },
  { ext: '.ARW', name: 'Sony Alpha RAW', mime: 'image/x-sony-arw' },
  { ext: '.NEF', name: 'Nikon Electronic Format', mime: 'image/x-nikon-nef' },
  { ext: '.DNG', name: 'Adobe Digital Negative', mime: 'image/x-adobe-dng' },
  { ext: '.JPG', name: 'Standard JPEG', mime: 'image/jpeg' },
  { ext: '.JPEG', name: 'Standard JPEG', mime: 'image/jpeg' },
  { ext: '.HEIC', name: 'High Efficiency Image Container', mime: 'image/heic' },
] as const;

export const CAMERA_BRANDS = [
  {
    name: 'Canon',
    models: ['EOS R5 Mark II', 'EOS R6 Mark II', 'EOS R3', 'EOS 1D X Mark III', 'EOS R8'],
    protocol: 'USB-C PTP / Canon ED-SDK',
  },
  {
    name: 'Sony',
    models: ['Alpha 1', 'Alpha 7R V', 'Alpha 7 IV', 'FX3', 'Alpha 9 III'],
    protocol: 'USB 3.2 Gen 2 / Sony Camera Remote SDK',
  },
  {
    name: 'Nikon',
    models: ['Z9', 'Z8', 'Z6 III', 'Zf', 'D850'],
    protocol: 'USB-C PTP / Nikon Tether Protocol',
  },
  {
    name: 'Fujifilm',
    models: ['GFX 100 II', 'X-H2S', 'X-T5', 'GFX 50S II'],
    protocol: 'USB-C Tether Shooting Auto',
  },
  {
    name: 'Smartphone',
    models: ['iPhone 16 Pro Max', 'Samsung Galaxy S24 Ultra', 'Google Pixel 9 Pro'],
    protocol: 'USB-C MTP / File Streaming Bridge',
  },
] as const;

export const API_ENDPOINTS = {
  HEALTH: '/health',
  AUTH_LOGIN: '/auth/login',
  AUTH_ME: '/auth/me',
  SESSIONS: '/sessions',
  DEVICES: '/devices',
  UPLOADS_REQUEST_URL: '/uploads/request-presigned-url',
  UPLOADS_CONFIRM: '/uploads/confirm',
  PHOTOS: '/photos',
} as const;
