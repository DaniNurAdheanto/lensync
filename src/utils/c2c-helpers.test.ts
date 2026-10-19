import test from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, isRawExtension, isValidSha256, getFileCategory } from './c2c-helpers.ts';

test('formatBytes correctly formats file sizes', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(47185920), '45 MB');
});

test('isRawExtension detects DSLR/mirrorless RAW files', () => {
  assert.equal(isRawExtension('IMG_001.CR3'), true);
  assert.equal(isRawExtension('DSC_4892.NEF'), true);
  assert.equal(isRawExtension('_DSC1029.ARW'), true);
  assert.equal(isRawExtension('PHOTO.DNG'), true);
  assert.equal(isRawExtension('photo.jpg'), false);
  assert.equal(isRawExtension('document.pdf'), false);
});

test('isValidSha256 validates 64-character hex strings', () => {
  assert.equal(isValidSha256('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'), true);
  assert.equal(isValidSha256('invalid-short-hash'), false);
});

test('getFileCategory maps extensions to appropriate buckets', () => {
  assert.equal(getFileCategory('IMG_123.CR3'), 'raw');
  assert.equal(getFileCategory('shot.JPEG'), 'jpeg');
  assert.equal(getFileCategory('iphone.heic'), 'heic');
  assert.equal(getFileCategory('archive.zip'), 'other');
});
