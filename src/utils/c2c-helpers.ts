export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function isRawExtension(filename: string): boolean {
  const ext = filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toUpperCase();
  const rawExtensions = ['CR2', 'CR3', 'ARW', 'NEF', 'DNG', 'RAF', 'RW2'];
  return rawExtensions.includes(ext);
}

export function isValidSha256(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

export function getFileCategory(filename: string): 'raw' | 'jpeg' | 'heic' | 'other' {
  const ext = filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
  if (['cr2', 'cr3', 'arw', 'nef', 'dng', 'raf', 'rw2'].includes(ext)) return 'raw';
  if (['jpg', 'jpeg'].includes(ext)) return 'jpeg';
  if (['heic', 'heif'].includes(ext)) return 'heic';
  return 'other';
}
