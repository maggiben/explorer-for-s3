/**
 * Small crypto utility
 * Benjamin Maggi 2026
 * LIC: MIT
 */

import path from 'path';
import fs from 'fs';
import { safeStorage, app } from 'electron';
import crypto from 'crypto';
import { KEY_FILENAME } from '../../shared/constants/config';

export const KEY_PATH = path.join(app.getPath('userData'), KEY_FILENAME);

const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Load or create master key protected by safeStorage
 */
export function getOrCreateMasterKey(newKey = crypto.randomBytes(KEY_LENGTH).toString('base64')) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure storage is not available on this system');
  }

  if (fs.existsSync(KEY_PATH)) {
    const encryptedKey = fs.readFileSync(KEY_PATH);
    return safeStorage.decryptString(encryptedKey);
  }

  const encrypted = safeStorage.encryptString(newKey);

  fs.writeFileSync(KEY_PATH, encrypted);

  return newKey;
}

export function encrypt(data: Buffer): Buffer {
  const base64Key = getOrCreateMasterKey();
  const key = Buffer.from(base64Key, 'base64'); // 32 bytes
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]);
}

export function decrypt(payload: Buffer): Buffer {
  const base64Key = getOrCreateMasterKey();
  const key = Buffer.from(base64Key, 'base64'); // 32 bytes

  const iv = payload.subarray(0, IV_LENGTH);
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
