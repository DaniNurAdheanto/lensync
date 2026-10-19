export const SUPPORTED_RAW_FORMATS = [
  '.CR3', // Canon Raw 3
  '.CR2', // Canon Raw 2
  '.ARW', // Sony Alpha Raw
  '.NEF', // Nikon Electronic Format
  '.DNG', // Adobe Digital Negative
  '.RAF', // Fujifilm Raw
  '.RW2', // Panasonic Lumix
];

export const SUPPORTED_IMAGE_FORMATS = [
  ...SUPPORTED_RAW_FORMATS,
  '.JPG',
  '.JPEG',
  '.HEIC',
  '.TIFF',
];

export const DEFAULT_SESSION_NAME = 'Studio Tethering Session';
