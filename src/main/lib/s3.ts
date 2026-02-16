import { ipcRenderer } from 'electron';
import ipc from '@shared/constants/ipc';

/**
 * @param {string} method
 * @param {Object} data
 * @returns {Promise<*>}
 */
async function sendApiRequest<T>({ method, data }: { method: string; data?: unknown }): Promise<T> {
  const [error, result] = await ipcRenderer.invoke(ipc.MAIN_API, { method, data });

  if (error) {
    throw error;
  }

  return result as Promise<T>;
}

/**
 * @param {{dirname, keyword, after, limit}} data
 * @returns {Promise<{
 * 	hasNextPage,
 * 	items: Array<{id, type, path, basename, dirname, updatedAt, createdAt}>,
 * }>}
 */
export async function getObjects(data: {
  dirname: string;
  keyword: string;
  after: number;
  limit: number;
}) {
  return sendApiRequest<{
    hasNextPage: boolean;
    items: Array<{
      id: string;
      type: string;
      path: string;
      basename: string;
      dirname: string;
      updatedAt: string;
      createdAt: string;
    }>;
  }>({ method: 'getObjects', data });
}

/**
 * @param {{id: number}} data
 * @returns {Promise<{
 * 	id, type, url, basename, dirname, path, size, storageClass, lastModified, updatedAt, createdAt,
 * 	objectHeaders,
 * }>}
 */
export async function getObject(data: { id: number }) {
  return sendApiRequest<{
    id: string;
    type: string;
    url: string;
    basename: string;
    dirname: string;
    path: string;
    size: number;
    storageClass: string;
    lastModified: string;
    updatedAt: string;
    createdAt: string;
    objectHeaders: string;
  }>({ method: 'getObject', data });
}

/**
 * @param {{dirname: (null|string), basename: string}} data
 * @returns {Promise<{id, type, path, basename, dirname, updatedAt, createdAt}>}
 */
export async function createFolder(data: { dirname: null | string; basename: string }) {
  return sendApiRequest<{
    id: string;
    type: string;
    path: string;
    basename: string;
    dirname: string;
    updatedAt: string;
    createdAt: string;
  }>({ method: 'createFolder', data });
}

/**
 * @param {function(event, {Bucket: string, Key: string, loaded: number, part: number, total: number})} onProgress
 * @param {{localPath: string, dirname: string}} data
 * @returns {Promise<ObjectModel>}
 */
export async function createFile({ onProgress, ...data }) {
  const id = Math.random().toString(36);
  const channel = `createFile.onProgress:${id}`;

  try {
    if (typeof onProgress === 'function') {
      ipcRenderer.on(channel, onProgress);
    }

    return await sendApiRequest({
      method: 'createFile',
      data: { ...data, onProgressChannel: channel },
    });
  } finally {
    if (typeof onProgress === 'function') {
      ipcRenderer.off(channel, onProgress);
    }
  }
}

export default {
  /**
   * @param {function(event, {basename: string, total: number, loaded: number})} onProgress
   * @param {{localPath: string, dirname: string, ids: Array<number>}} data
   * @returns {Promise<*>}
   */
  async downloadObjects({ onProgress, ...data }) {
    const id = Math.random().toString(36);
    const channel = `downloadObjects.onProgress:${id}`;

    try {
      if (typeof onProgress === 'function') {
        ipcRenderer.on(channel, onProgress);
      }

      return await sendApiRequest({
        method: 'downloadObjects',
        data: { ...data, onProgressChannel: channel },
      });
    } finally {
      if (typeof onProgress === 'function') {
        ipcRenderer.off(channel, onProgress);
      }
    }
  },
  /**
   * @param {{ids: Array<number>}} data
   * @returns {Promise<null>}
   */
  deleteObjects(data) {
    return sendApiRequest({ method: 'deleteObjects', data });
  },
  /**
   * @returns {Promise<null|{id, accessKeyId, bucket, region, updatedAt, createdAt}>}
   */
  getSettings() {
    return sendApiRequest({ method: 'getSettings' });
  },
  /**
   * @param {{accessKeyId: string, secretAccessKey: string, region: string, bucket: string}} data
   * @returns {Promise<{id, accessKeyId, bucket, region, updatedAt, createdAt}>}
   */
  updateS3Settings(data) {
    return sendApiRequest({ method: 'updateS3Settings', data });
  },
  /**
   * @returns {Promise<null>}
   */
  syncObjectsFromS3() {
    return sendApiRequest({ method: 'syncObjectsFromS3' });
  },
};
