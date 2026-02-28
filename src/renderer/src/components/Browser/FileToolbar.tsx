import { Flex, Space, Button, Divider, Input } from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  PlusOutlined,
  CopyOutlined,
  ScissorOutlined,
  CopyFilled,
} from '@ant-design/icons';
import { AiOutlineSave } from 'react-icons/ai';
import { useState } from 'react';
import SaveBucketModal from '../SaveBucketModal';
import { IBucket } from '../../../../types/IBucket';

interface DataType {
  id: string;
  key?: React.Key;
  type: number;
  path: string;
  size: number;
  lastModified: Date;
  storageClass: string;
  children?: DataType[];
}

export default function FileToolbar({
  selected,
  connectionId,
  refreshList,
}: {
  selected: DataType[];
  connectionId: number;
  refreshList: (connectionId: number) => Promise<void>;
}) {
  const [showSaveBucketModal, setShowSaveBucketModal] = useState(false);
  const handleSaveBucketModal = () => {
    setShowSaveBucketModal(true);
  };
  const handleDelete = async () => {
    if (!connectionId) return;
    try {
      await window.objects.deleteObjects({
        ids: selected.map(({ id }) => id) as string[],
        connectionId,
      });
      await refreshList(connectionId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateFolder = async () => {
    if (!connectionId) return;
    try {
      await window.objects.createFolder({
        basename: 'music',
        // basename: 'music/jazz',
        // basename: 'music',
        connectionId,
      });
      await refreshList(connectionId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = () => {
    console.log('search');
  };

  return (
    <>
      <Flex wrap gap="small" align="center">
        <Space.Compact>
          <Button icon={<PlusOutlined />} onClick={handleCreateFolder}></Button>
          <Button icon={<DeleteOutlined />} shape="square" danger onClick={handleDelete}></Button>
        </Space.Compact>
        <Divider vertical />
        <Space.Compact>
          <Button icon={<ScissorOutlined />}></Button>
          <Button icon={<CopyOutlined />}></Button>
          <Button icon={<CopyFilled />}></Button>
        </Space.Compact>
        <Space.Compact>
          <Button icon={<AiOutlineSave />} onClick={handleSaveBucketModal}>
            Save To
          </Button>
        </Space.Compact>
        <Flex justify="end" flex={1}>
          <Space.Compact>
            <Input defaultValue="" />
            <Button icon={<SearchOutlined />} onClick={handleSearch}></Button>
          </Space.Compact>
        </Flex>
      </Flex>
      <SaveBucketModal
        open={showSaveBucketModal}
        onClose={async (value) => {
          console.log('value', value);
          if (value) {
            const bucket = await window.buckets.get(value);
            const result = await window.buckets.upsert({
              ...bucket,
              connectionIds: [...bucket.connectionIds, connectionId!],
            } as IBucket);
            console.log('result', result);
          }
          setShowSaveBucketModal(false);
        }}
        connectionId={connectionId}
      />
    </>
  );
}
