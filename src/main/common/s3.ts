
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import * as OBJECT_TYPE from '../../shared/constants/object-type';
import { get } from '../ipc/connections';

/**
 * Sync all objects on S3 to local database.
 * @returns {Promise<void>}
 */
export async function syncObjectsFromS3(connectionId) {
  const connection = await get(connectionId, false);
  if (!connection) return;
  const client = new S3Client({
    region: connection.region,
    credentials: {
      accessKeyId: connection.accessKeyId,
      secretAccessKey: connection.secretAccessKey,
    },
  });
  const scanObjects = async (continuationToken?: string) => {
    const pathSet = new Set();
    const result = await client.send(
      new ListObjectsV2Command({
        Bucket: connection.bucket,
        ContinuationToken: continuationToken,
      }),
    );
    const convertS3Object = ({
      Key,
      Size,
      LastModified,
      StorageClass,
    }: {
      Key?: string;
      Size?: number;
      LastModified?: Date;
      StorageClass?: string;
    }) => ({
      type: Key?.slice(-1) === '/' ? OBJECT_TYPE.FOLDER : OBJECT_TYPE.FILE,
      path: Key,
      lastModified: LastModified ?? new Date(0), // default date if missing
      size: Size ?? 0, // default size if missing
      storageClass: StorageClass ?? 'STANDARD', // default storage class if missing
    });

    const results = await Promise.all([
      result?.Contents?.map((content) => {
        const pieces = content.Key?.split('/').slice(0, -1) ?? [];

        return [
          convertS3Object(content),
          ...pieces.map((_, index) =>
            convertS3Object({
              Key: `${pieces.slice(0, index + 1).join('/')}/`,
            }),
          ),
        ];
      })
        .flat()
        .filter((object) => {
          if (!object) return;
          if (object.type === OBJECT_TYPE.FILE) {
            pathSet.add(object.path);
            return true;
          }

          if (pathSet.has(object.path)) {
            return false;
          }

          pathSet.add(object.path);
          return true;
        }),
      { updateOnDuplicate: ['type', 'lastModified', 'size', 'updatedAt', 'storageClass'] },
      result.NextContinuationToken ? scanObjects(result.NextContinuationToken) : null,
    ]);

    console.log('results', results);
    return results;
  };

  try {
    const result = await scanObjects();
    console.log('tree', result);
    return result;
  } catch (error) {
    console.error(error);
    return [];
  }
  // // Remove missing objects.
  // await ObjectModel.destroy({
  //   where: { updatedAt: { [Op.lt]: start } },
  // });
}

/**
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/headobjectcommand.html
 * @param {string} path
 * @param {Object} options
 * @returns {Promise<HeadObjectCommandOutput>}
 */
export async function headObject(path, connectionId: number, options?: Record<string, unknown> ) {
  const connection = await get(connectionId, false);
  if (!connection) return;
  const client = new S3Client({
    region: connection.region,
    credentials: {
      accessKeyId: connection.accessKeyId,
      secretAccessKey: connection.secretAccessKey,
    },
  });
  const headObjectCommand = new HeadObjectCommand({
    ...options,
    Bucket: connection.bucket,
    Key: path,
  });

  return client.send(headObjectCommand);
}

/**
 * @param {string} path
 * @param {number} expiresIn - Expires in seconds. Default is 24 hours.
 * @returns {Promise<string>}
 */
export async function getSignedUrl(path, { expiresIn = 24 * 60 * 60 } = {}, connectionId) {
  const connection = await get(connectionId, false);
  if (!connection) return;
  const client = new S3Client({
    region: connection.region,
    credentials: {
      accessKeyId: connection.accessKeyId,
      secretAccessKey: connection.secretAccessKey,
    },
  });
  const getObjectCommand = new GetObjectCommand({
    Bucket: connection.bucket,
    Key: path,
  });

  return awsGetSignedUrl(client, getObjectCommand, { expiresIn });
}

/**
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html
 * @param {string} path
 * @returns {Promise<GetObjectCommandOutput>}
 */
export async function getObject(path, connectionId) {
  const connection = await get(connectionId, false);
  if (!connection) return;
  const client = new S3Client({
    region: connection.region,
    credentials: {
      accessKeyId: connection.accessKeyId,
      secretAccessKey: connection.secretAccessKey,
    },
  });
  const getObjectCommand = new GetObjectCommand({
    Bucket: connection.bucket,
    Key: path,
  });

  return client.send(getObjectCommand);
}

/**
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/putobjectcommand.html
 * @param {string} path
 * @param {Object} options
 * @returns {Promise<PutObjectCommandOutput>}
 */
export async function putObject(path, options = {}, connectionId) {
  const connection = await get(connectionId, false);
  if (!connection) return;
  const client = new S3Client({
    region: connection.region,
    credentials: {
      accessKeyId: connection.accessKeyId,
      secretAccessKey: connection.secretAccessKey,
    },
  });
  const putObjectCommand = new PutObjectCommand({
    ...options,
    Bucket: connection.bucket,
    Key: path,
    // ...(options.Body == null ? { Body: null, ContentLength: 0 } : {}),
  });

  return client.send(putObjectCommand);
}

/**
 * @param {string} path
 * @param {Buffer|Stream} content
 * @param {Object} options
 * @param {function({Bucket: string, Key: string, loaded: number, part: number, total: number})} onProgress
 * @returns {Promise<CompleteMultipartUploadCommandOutput | AbortMultipartUploadCommandOutput>}
 */
export async function upload({ path, content, options, onProgress }, connectionId) {
  const connection = await get(connectionId, false);
  if (!connection) return;
  const client = new S3Client({
    region: connection.region,
    credentials: {
      accessKeyId: connection.accessKeyId,
      secretAccessKey: connection.secretAccessKey,
    },
  });
  const upload = new Upload({
    client,
    params: {
      ...options,
      Bucket: connection.bucket,
      Key: path,
      Body: content,
    },
  });

  if (onProgress) {
    upload.on('httpUploadProgress', onProgress);
  }

  return upload.done();
}

/**
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/deleteobjectscommand.html
 * @param {Array<string>} paths
 * @returns {Promise<DeleteObjectsCommandOutput>}
 */
export async function deleteObjects(paths: string[], connectionId) {
  const connection = await get(connectionId, false);
  if (!connection) return;
  const client = new S3Client({
    region: connection.region,
    credentials: {
      accessKeyId: connection.accessKeyId,
      secretAccessKey: connection.secretAccessKey,
    },
  });
  const deleteObjectsCommand = new DeleteObjectsCommand({
    Bucket: connection.bucket,
    Delete: {
      Objects: paths.map((path) => ({ Key: path })),
    },
  });

  return client.send(deleteObjectsCommand);
}
