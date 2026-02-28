import type { InputRef } from 'antd';
import { useCallback, useRef, useState } from 'react';
import { Button, Input, Space, Modal, Divider, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useBuckets } from '@renderer/atoms/buckets';

export default function SaveBucketModal({
  open,
  onClose,
  connectionId,
}: {
  open: boolean;
  onClose: (value: number | undefined | false) => void;
  connectionId: number;
}) {
  const { buckets, set: setBuckets } = useBuckets();
  const inputSaveToRef = useRef<InputRef>(null);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<number | undefined>(undefined);
  const onNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);
  const addSaveToItem = async () => {
    if (!name) return;
    const payload = {
      name,
      type: 'BUCKET',
      color: '#fafafa',
      icon: 'moon',
      connectionIds: [],
    };
    const bucket = await window.buckets.add(payload);
    console.log('bucket added', payload, bucket);
    await setBuckets();
  };

  const handleSaveToOk = () => {
    onClose(selected);
  };

  const handleSaveToCancel = () => {
    onClose(false);
  };

  const onSelect = (value: number) => {
    setSelected(value);
  };

  return (
    <>
      <Modal
        title="Basic Modal"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        onOk={handleSaveToOk}
        onCancel={handleSaveToCancel}
      >
        <Select
          style={{ width: 300 }}
          placeholder="custom dropdown render"
          popupRender={(menu) => (
            <>
              {menu}
              <Divider style={{ margin: '8px 0' }} />
              <Space style={{ padding: '0 8px 4px' }}>
                <Input
                  placeholder="Please enter item"
                  ref={inputSaveToRef}
                  value={name}
                  onChange={onNameChange}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={addSaveToItem}
                  disabled={!name}
                >
                  Add item
                </Button>
              </Space>
            </>
          )}
          onSelect={onSelect}
          options={buckets.map((bucket) => ({ label: bucket.name, value: bucket.id }))}
        />
      </Modal>
    </>
  );
}
