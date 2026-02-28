import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { TableProps } from 'antd';
import { Flex, Table, notification, Divider } from 'antd';
import { useParams } from 'react-router';
import { FILE, FOLDER } from '../../../../shared/constants/object-type';
import FileToolbar from './FileToolbar';
import { columns } from './tableColumns';
import { basename } from './pathUtils';
import { transformPlainS3PathToTreeTableData } from './treeUtils';
import { getLocalPaths, runUploadWithNotification } from './uploadHelper';
import type { DataType } from './types';

type TableRowSelection<T extends object = object> = TableProps<T>['rowSelection'];

const DOWNLOAD_URL_MIME = 'application/octet-stream';

export default function Browser() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Omit<DataType, 'children'>[]>([]);
  const [selected, setSelected] = useState<DataType[]>([]);
  const [api, contextHolder] = notification.useNotification();
  const connectionId = parseInt(params.id!, 10);
  const dragUrlRef = useRef<{ path: string; url: string } | null>(null);

  const refreshList = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      const result = await window.connections.connect(id);
      return setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const treeData = useMemo(() => transformPlainS3PathToTreeTableData(data), [data]);

  const rowSelection: TableRowSelection<DataType> = {
    onChange: (_selectedRowKeys, selectedRows) => {
      setSelected(selectedRows);
    },
  };

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }, []);

  const runUploads = useCallback(
    async (localPaths: string[], dirname?: string) => {
      if (!connectionId || !Number.isFinite(connectionId)) return;
      try {
        await Promise.all(
          localPaths.map((localPath) =>
            runUploadWithNotification({
              id: window.crypto.randomUUID(),
              connectionId,
              localPath,
              dirname,
              api,
              onEnd: () => refreshList(connectionId),
            }),
          ),
        );
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : 'Upload failed');
      }
    },
    [connectionId, api, refreshList],
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (connectionId == null || !Number.isFinite(connectionId)) return;
      const files = Array.from(event.dataTransfer.files);
      const localPaths = await getLocalPaths(files);
      if (localPaths.length === 0) return;
      await runUploads(localPaths);
    },
    [connectionId, runUploads],
  );

  useEffect(() => {
    if (connectionId && Number.isFinite(connectionId)) {
      refreshList(connectionId);
    }
  }, [connectionId, refreshList]);

  const handleRowDropOnFolder = useCallback(
    async (event: React.DragEvent, folderPath: string) => {
      event.preventDefault();
      event.stopPropagation();
      if (connectionId == null || !Number.isFinite(connectionId)) return;
      const localPaths = await getLocalPaths(Array.from(event.dataTransfer.files));
      if (localPaths.length === 0) return;
      await runUploads(localPaths, folderPath);
    },
    [connectionId, runUploads],
  );

  const handleDragStart = useCallback(
    (event: React.DragEvent, record: DataType) => {
      if (record.type !== FILE || connectionId == null) return;
      const name = basename(record.path) || 'download';
      const cached = dragUrlRef.current;
      if (cached?.path === record.path && cached.url) {
        try {
          event.dataTransfer.setData('DownloadURL', `${DOWNLOAD_URL_MIME}:${name}:${cached.url}`);
          event.dataTransfer.effectAllowed = 'copy';
          return;
        } catch {
          // fall through to main-process drag
        }
      }
      event.preventDefault();
      event.stopPropagation();
      window.api.startDrag({
        connectionId,
        path: record.path,
        basename: name,
      });
    },
    [connectionId],
  );

  return (
    <Flex
      vertical
      onDragOver={(e) => !treeData.length && handleDragOver(e)}
      onDrop={(e) => !treeData.length && handleDrop(e)}
    >
      {contextHolder}
      <div style={{ flex: 1, flexGrow: 1, overflow: 'hidden' }}>
        <FileToolbar selected={selected} connectionId={connectionId} refreshList={refreshList} />
        <Divider style={{ margin: '10px 0' }} />
        <div style={{ flex: 1, flexGrow: 1, overflow: 'auto' }}>
          <Table<DataType>
            rowKey="id"
            columns={columns}
            rowSelection={rowSelection}
            dataSource={treeData}
            pagination={false}
            sticky
            loading={loading}
            scroll={{ y: 'calc(100vh - 180px)' }}
            onRow={(record) => ({
              draggable: true,
              onDragStart: (e: React.DragEvent) => handleDragStart(e, record),
              onDragEnd: () => {
                dragUrlRef.current = null;
              },
              onDragOver: (e: React.DragEvent) => {
                if (record.type === FOLDER) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'move';
                }
              },
              onDrop: (e: React.DragEvent) => {
                if (record.type === FOLDER) {
                  handleRowDropOnFolder(e, record.path);
                }
              },
            })}
          />
        </div>
      </div>
    </Flex>
  );
}
