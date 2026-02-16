import Connections from '../models/data/connections-model';

export async function init() {
  try {
    // This will create the table if it doesn't exist
    await Connections.sync({ alter: true });
    console.log('Connections table synced successfully');
  } catch (error) {
    console.error('Failed to sync Connections table', error);
  }
}

export async function create({
  accessKeyId,
  secretAccessKey,
  region,
  bucket,
}: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}): Promise<
  | {
      id: number;
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
      bucket: string;
    }
  | undefined
> {
  try {
    console.log('creating connection');
    const result = await Connections.create({
      accessKeyId,
      secretAccessKey,
      region,
      bucket,
    });
    if (!result) {
      throw new Error('failed to get settings');
    }
    console.log('inserted');
    return result.toJSON();
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
/**
 * @param {string} accessKeyId
 * @param {string} secretAccessKey
 * @param {string} region
 * @param {string} bucket
 * @returns {Promise<Connections>}
 */
export async function upsert({
  id,
  accessKeyId,
  secretAccessKey,
  region,
  bucket,
}: {
  id: number;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}) {
  try {
    await Connections.upsert({
      id,
      accessKeyId,
      secretAccessKey,
      region,
      bucket,
    });
    const result = await Connections.findOne({ where: { id } });
    if (!result) {
      throw new Error('failed to get bucket');
    }
    return result.toJSON();
  } catch (error) {
    console.error(error);
    return {};
  }
}

export async function get(id?: number): Promise<Connections> {
  try {
    const settings = await Connections.findOne({ where: { id } });

    if (!settings) {
      throw new Error('failed to get bucket');
    }
    return settings;
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
}
