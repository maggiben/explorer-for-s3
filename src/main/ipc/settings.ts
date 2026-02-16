import Settings from '../models/data/settings-model';
import { MAIN_SETTINGS_ID } from '../../shared/constants/settings';

export async function init() {
  try {
    // This will create the table if it doesn't exist
    await Settings.sync({ alter: true });
    console.log('Settings table synced successfully');
  } catch (error) {
    console.error('Failed to sync Settings table', error);
  }
}

export async function create({
  id,
  accessKeyId,
  secretAccessKey,
  region,
  bucket,
}: {
  id?: number;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}) {
  try {
    const settings = await Settings.create({
      id: id ?? MAIN_SETTINGS_ID,
      accessKeyId,
      secretAccessKey,
      region,
      bucket,
    });
    if (!settings) {
      throw new Error('failed to get settings');
    }
  } catch (error) {
    console.error(error);
  }
}
/**
 * @param {string} accessKeyId
 * @param {string} secretAccessKey
 * @param {string} region
 * @param {string} bucket
 * @returns {Promise<Settings>}
 */
export async function upsert({
  id,
  accessKeyId,
  secretAccessKey,
  region,
  bucket,
}: {
  id?: number;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}) {
  try {
    await Settings.upsert({
      id: id ?? MAIN_SETTINGS_ID,
      accessKeyId,
      secretAccessKey,
      region,
      bucket,
    });
    const settings = await Settings.findOne({ where: { id: MAIN_SETTINGS_ID } });
    if (!settings) {
      throw new Error('failed to get settings');
    }
    return settings.toJSON();
  } catch (error) {
    console.error(error);
    return {};
  }
}

export async function get(id?: number): Promise<Settings> {
  try {
    const settings = await Settings.findOne({ where: { id: id ?? MAIN_SETTINGS_ID } });

    if (!settings) {
      throw new Error('failed to get settings');
    }
    return settings;
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
}
