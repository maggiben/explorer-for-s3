import { FolderOutlined, FileOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Flex } from 'antd';
import { toHumanSize } from '../../../../shared/lib/utils';
import { FOLDER, FILE } from '../../../../shared/constants/object-type';
import type { DataType } from './types';
import { basename } from './pathUtils';

export const typeToIcon = [
  { type: FOLDER, icon: FolderOutlined },
  { type: FILE, icon: FileOutlined },
];

function pathDisplayName(path: string): string {
  if (
    path
      .split(/\/(\/)/)
      .slice(0, -1)
      .pop() === '/'
  ) {
    return '/';
  }
  return basename(path);
}

export const columns: TableColumnsType<DataType> = [
  {
    title: 'path',
    dataIndex: 'path',
    key: 'path',
    ellipsis: true,
    render: (path: string, record: DataType) => {
      const { icon: Icon } = typeToIcon.find((e) => e.type === record.type) ?? {};
      const name = pathDisplayName(path);
      return (
        <Flex align="center" gap={8} style={{ overflow: 'ellipsis' }}>
          {Icon ? <Icon /> : null}
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{name}</span>
        </Flex>
      );
    },
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
