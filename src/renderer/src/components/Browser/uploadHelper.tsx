import { Flex, Progress, Space, Button, notification } from 'antd';
import type { IpcMainInvokeEvent } from 'electron';

export async function getLocalPaths(files: File[]): Promise<string[]> {
  return Promise.all(files.map((file) => window.api.getFilePath(file)));
}

export interface UploadOptions {
  id: string;
  connectionId: number;
  localPath: string;
  dirname?: string;
  api: ReturnType<typeof notification.useNotification>[0];
  onEnd: () => void;
}

export async function runUploadWithNotification({
  id,
  connectionId,
  localPath,
  dirname,
  api,
  onEnd,
}: UploadOptions): Promise<unknown> {
  const cancelButton = (
    <Space>
      <Button type="primary" size="small" onClick={() => window.objects.abortCreateFile(id)}>
        Cancel
      </Button>
    </Space>
  );

  api.open({
    key: id,
    title: `Starting ${localPath}`,
    description: (
      <Flex gap="small" vertical>
        <Progress percent={0} />
      </Flex>
    ),
    btn: cancelButton,
    duration: false,
  });

  return window.objects
    .createFile({
      id,
      connectionId,
      localPath,
      dirname,
      onProgress: (
        _event: IpcMainInvokeEvent,
        { loaded, total }: { loaded: number; total: number; part: number },
      ) => {
        const progress = Math.round((loaded / total) * 100);
        api.open({
          key: id,
          title: `Uploading ${localPath}`,
          description: (
            <Flex gap="small" vertical>
              <Progress percent={progress} />
            </Flex>
          ),
          btn: cancelButton,
          duration: false,
        });
      },
      onEnd: () => {
        api.destroy(id);
        onEnd();
      },
    })
    .catch((err) => {
      api.destroy(id);
      onEnd();
      throw err;
    });
}
