import React from 'react';
import { ClockCircleOutlined, FolderOutlined } from '@ant-design/icons';
import { Link } from 'react-router';
import { RiFolderCloudLine } from 'react-icons/ri';
import type { MenuTheme } from 'antd';
import { Menu } from 'antd';
import { settingsAtom } from '@renderer/atoms/settings';
import { useAtom } from 'jotai';
import { useBuckets } from '@renderer/atoms/buckets';
import useRecent from '@renderer/hooks/useRecent';
import { AiOutlineHdd } from 'react-icons/ai';

function createRecentMenu(connections: { bucket: string; id: number }[]) {
  const menu = [
    {
      icon: ClockCircleOutlined,
      label: 'Recent',
    },
  ].map(({ icon, label }, index) => {
    const key = String(index + 1);
    return {
      key: `recent-${key}`,
      icon: React.createElement(icon),
      label,
      children: connections.map(({ bucket, id }, j) => ({
        key: `recent-sub-${index * 4 + j + 1}`,
        label: <Link to={`/connections/recent/${id}`}>{bucket}</Link>,
        icon: React.createElement(RiFolderCloudLine),
      })),
    };
  });
  return menu;
}

export default function SiderMenu({ onSelect }: { onSelect: (key: string) => void }) {
  const [settings] = useAtom(settingsAtom);
  const { buckets } = useBuckets();
  const [recent] = useRecent<{ bucket: string; id: number }>();

  const bucketsItems = buckets.map((bucket, index) => {
    return {
      key: `bucket-${bucket.name}-${bucket.id}`,
      label: bucket.name,
      icon: React.createElement(AiOutlineHdd),
      children: bucket.connections.filter(Boolean).map((connection, j) => ({
        key: `sub-bucket-${connection.id}-${index * 4 + j + 1}`,
        label: <Link to={`/connections/${bucket.id}/${connection.id}`}>{connection.bucket}</Link>,
        icon: React.createElement(FolderOutlined),
      })),
    };
  });
  const recentItems = createRecentMenu(recent);
  return (
    <Menu
      mode="inline"
      theme={settings.apparence.mode as MenuTheme}
      defaultSelectedKeys={['1']}
      defaultOpenKeys={[]}
      onSelect={(e) => onSelect(e.key)}
      style={{ height: '100%', borderInlineEnd: 0 }}
      // items={recent?.length ? createRecentMenu(recent as { bucket: string; id: number }[]) : []}
      items={[...recentItems, ...bucketsItems]}
    />
  );
}
