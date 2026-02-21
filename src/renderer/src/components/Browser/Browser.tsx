import React, { useEffect, useState } from 'react';
import { FolderOutlined, FileOutlined } from '@ant-design/icons';
import type { TableColumnsType, TableProps } from 'antd';
import { Flex, Table, Progress, notification } from 'antd';
import { useParams } from 'react-router';
import { toHumanSize } from '../../../../shared/lib/utils';
import { FOLDER, FILE } from '../../../../shared/constants/object-type';
import type { IpcMainInvokeEvent } from 'electron';

type TableRowSelection<T extends object = object> = TableProps<T>['rowSelection'];

interface DataType {
  id?: string;
  key?: React.ReactNode;
  type: number;
  path: string;
  size: number;
  lastModified: Date;
  storageClass: string;
  children?: DataType[];
  listItemHeight?: number;
}

const columns: TableColumnsType<DataType> = [
  {
    title: 'type',
    dataIndex: 'type',
    width: '10%',
    key: 'type',
    render: (type: number) => {
      const { icon } =
        [
          { type: FOLDER, icon: FolderOutlined },
          { type: FILE, icon: FileOutlined },
        ].find((icon) => icon.type === type) ?? {};
      if (!icon) {
        return type;
      }
      return React.createElement(icon);
    },
  },
  {
    title: 'path',
    dataIndex: 'path',
    key: 'path',
  },
  {
    title: 'size',
    dataIndex: 'size',
    key: 'size',
    width: '12%',
    render: (value: number) => toHumanSize(value, 0),
  },
  {
    title: 'Last Modified',
    dataIndex: 'lastModified',
    width: '28%',
    key: 'lastModified',
    render: (value: Date) => value.toLocaleString(),
  },
];

// const data: DataType[] = [
//   {
//     key: 1,
//     name: 'John Brown sr.',
//     age: 60,
//     address: 'New York No. 1 Lake Park',
//     children: [
//       {
//         key: 11,
//         name: 'John Brown',
//         age: 42,
//         address: 'New York No. 2 Lake Park',
//       },
//       {
//         key: 12,
//         name: 'John Brown jr.',
//         age: 30,
//         address: 'New York No. 3 Lake Park',
//         children: [
//           {
//             key: 121,
//             name: 'Jimmy Brown',
//             age: 16,
//             address: 'New York No. 3 Lake Park',
//           },
//         ],
//       },
//       {
//         key: 13,
//         name: 'Jim Green sr.',
//         age: 72,
//         address: 'London No. 1 Lake Park',
//         children: [
//           {
//             key: 131,
//             name: 'Jim Green',
//             age: 42,
//             address: 'London No. 2 Lake Park',
//             children: [
//               {
//                 key: 1311,
//                 name: 'Jim Green jr.',
//                 age: 25,
//                 address: 'London No. 3 Lake Park',
//               },
//               {
//                 key: 1312,
//                 name: 'Jimmy Green sr.',
//                 age: 18,
//                 address: 'London No. 4 Lake Park',
//               },
//             ],
//           },
//         ],
//       },
//     ],
//   },
//   {
//     key: 2,
//     name: 'Joe Black',
//     age: 32,
//     address: 'Sydney No. 1 Lake Park',
//   },
// ];

// rowSelection objects indicates the need for row selection
const rowSelection: TableRowSelection<DataType> = {
  onChange: (selectedRowKeys, selectedRows, info) => {
    console.log(
      `selectedRowKeys: ${selectedRowKeys}`,
      'selectedRows: ',
      selectedRows,
      'info',
      info,
    );
  },
  onSelect: (record, selected, selectedRows) => {
    console.log(record, selected, selectedRows);
  },
};

async function getLocalPaths(files: File[]): Promise<string[]> {
  return Promise.all(files.map((file) => window.api.getFilePath(file)));
}

export default function Browser() {
  const params = useParams();
  const [data, setData] = useState<DataType[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const copyNotification = (key: string) => () => {
    api.open({
      key,
      title: 'Notification Title',
      description: (
        <Flex gap="small" vertical>
          <Progress percent={progress} />
        </Flex>
      ),
      duration: false,
    });
  };
  const connectionId = params.id ? parseInt(params.id, 10) : undefined;

  const refreshList = (connectionId?: number) => {
    if (!connectionId || !Number.isFinite(connectionId)) return;
    window.connections
      .connect(connectionId)
      .then((result) => setData(Array.isArray(result) ? result : []))
      .catch((err) => console.error(err));
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (connectionId == null || !Number.isFinite(connectionId)) return;

    // const objectId = event.dataTransfer.getData(S3_OBJECT_ID_KEY);
    // if (objectId) return;

    const files = Array.from(event.dataTransfer.files);
    // const filePaths = await Promise.all(files.map((file) => window.api.getFilePath(file)));
    console.log(event.dataTransfer.getData('text/plain'));
    const localPaths = await getLocalPaths(files);
    // console.log('localPaths', localPaths, files, files.map((f) => (f as File & { path?: string }).path ?? ''));
    if (localPaths.length === 0) return;

    setUploading(true);
    const notificationKey = window.crypto.randomUUID();
    // copyNotification(notificationKey)();
    try {
      const results = await Promise.all(
        localPaths.map(async (localPath, index) => {
          const rate = 1 / localPaths.length;
          const newFile = await window.objects.createFile({
            id: window.crypto.randomUUID(),
            connectionId,
            localPath,
            dirname: undefined,
            onProgress: (
              event: IpcMainInvokeEvent,
              { loaded, total }: { loaded: number; total: number; part: number },
            ) => {
              const p = Math.round(index * rate * 100 + (loaded / total) * rate * 100);
              api.open({
                key: notificationKey,
                title: `file ${localPath} progress`,
                description: (
                  <Flex gap="small" vertical>
                    <Progress percent={p} />
                  </Flex>
                ),
                duration: false,
              });
              console.log('progress', p);
              setProgress(p);
              if (p >= 100) setUploading(false);
            },
            onEnd: () => {},
          });
          console.log('newFile', newFile);
          return newFile;
        }),
      );
      console.log('results', results);
      refreshList(connectionId);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  useEffect(() => {
    refreshList(connectionId);
  }, [connectionId]);

  return (
    <Flex
      vertical
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        maxHeight: 'calc(100vh - 80px)',
      }}
    >
      {contextHolder}
      <div
        style={{
          flex: 1,
          flexGrow: 1,
          overflow: 'auto',
          maxHeight: 'calc(100vh - 80px)',
        }}
      >
        {uploading && (
          <Flex gap="small" vertical>
            <Progress percent={progress} />
          </Flex>
        )}
        <Table<DataType>
          rowKey="id"
          columns={columns}
          rowSelection={{ ...rowSelection }}
          dataSource={data}
          sticky
          pagination={false}
          onRow={(record) => {
            return {
              draggable: true,
              onDragStart: (event: React.DragEvent) => {
                event.preventDefault();
                window.api.startDrag(record.path);
              },
            };
          }}
          // onRow={(record) => {
          //   const folderPath =
          //     record.type === FOLDER && record.path ? record.path.replace(/\/$/, '') : '';
          //   return {
          //     draggable: true,
          //     onDragStart: (e: React.DragEvent) => {
          //       e.dataTransfer.setData(
          //         S3_OBJECT_ID_KEY,
          //         String(record.id ?? record.key ?? record.path),
          //       );
          //       e.dataTransfer.effectAllowed = 'move';
          //     },
          //     onDragOver: (e: React.DragEvent) => {
          //       if (record.type === FOLDER) {
          //         e.preventDefault();
          //         e.stopPropagation();
          //         e.dataTransfer.dropEffect = 'move';
          //       }
          //     },
          //     onDrop: async (e: React.DragEvent) => {
          //       e.preventDefault();
          //       e.stopPropagation();
          //       if (record.type !== FOLDER || !connectionId) return;
          //       // LOCAL FILE UPLOAD
          //       const files = Array.from(e.dataTransfer.files);
          //       if (!files.length) return;

          //       try {
          //         for (const file of files) {
          //           await window.objects.createFile({
          //             connectionId,
          //             file,
          //             dirname: folderPath,
          //             mimeType: file.type || 'application/octet-stream',
          //             onProgressChannel: undefined,
          //           });
          //         }
          //         refreshList();
          //       } catch (err) {
          //         console.error(err);
          //         alert(err instanceof Error ? err.message : 'Upload failed');
          //       } finally {
          //         setUploading(false);
          //       }
          //       // const sourceId = e.dataTransfer.getData('text/plain');

          //       // console.log('sourceId', sourceId);

          //       // if (!sourceId) {
          //       //   const files = Array.from(e.dataTransfer.files);
          //       //   const localPaths = getLocalPaths(files);
          //       //   if (localPaths.length === 0) return;
          //       //   setUploading(true);
          //       //   try {
          //       //     for (const localPath of localPaths) {
          //       //       await window.objects.createFile({
          //       //         connectionId,
          //       //         localPath,
          //       //         dirname: folderPath,
          //       //         onProgressChannel: undefined,
          //       //       });
          //       //     }
          //       //     refreshList();
          //       //   } catch (err) {
          //       //     console.error(err);
          //       //     alert(err instanceof Error ? err.message : 'Upload failed');
          //       //   } finally {
          //       //     setUploading(false);
          //       //   }
          //       //   return;
          //       // }

          //       // if (sourceId === record.id) return;
          //       // try {
          //       //   await window.objects.copyObjects({
          //       //     connectionId,
          //       //     sourceIds: [sourceId],
          //       //     targetDirname: folderPath,
          //       //     move: true,
          //       //   });
          //       //   refreshList();
          //       // } catch (err) {
          //       //   console.error(err);
          //       //   alert(err instanceof Error ? err.message : 'Move failed');
          //       // }
          //     },
          //   };
          // }}
        />
      </div>
    </Flex>
  );
}
