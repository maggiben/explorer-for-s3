import React from 'react';
import { HomeOutlined } from '@ant-design/icons';
import { Routes, Route, HashRouter, Link, useLocation } from 'react-router';
import { ConfigProvider, Breadcrumb, Layout, theme, Space } from 'antd';
import type { SiderTheme } from 'antd/es/layout/Sider';
import { useAtom } from 'jotai';
import { settingsAtom } from './atoms/settings';

import Connection from './components/Connection/Connection';
import Browser from './components/Browser/Browser';
import Welcome from './components/Welcome';
import { mergeDeep } from '../../shared/lib/utils';
import SiderMenu from './components/SiderMenu';
import { useBuckets } from './atoms/buckets';
import { useConnections } from './atoms/connection';
import type { IBucket } from '../../types/IBucket';
import type { IConnection } from '../../types/IConnection';

const { Content, Sider } = Layout;

/** Segment-to-label map for breadcrumb; unknown segments (e.g. ids) shown as-is. */
const SEGMENT_LABELS: Record<string, string> = {
  connections: 'Connections',
  new: 'New Connection',
  browse: 'Browse',
  recent: 'Recent',
  motd: 'MOTD',
  s3: 'S3',
};

function BreadcrumbNav({
  buckets,
  connections,
}: {
  buckets: IBucket[];
  connections: IConnection[];
}) {
  const location = useLocation();
  const pathname = location.pathname || '/';
  const segments = pathname.split('/').filter(Boolean);

  const items = [
    {
      title: (
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <HomeOutlined />
          <span>Home</span>
        </Link>
      ),
    },
    ...segments.map((segment, i) => {
      const href = '/' + segments.slice(0, i + 1).join('/');
      const label = SEGMENT_LABELS[segment] ?? segment;
      if (segments[i - 1] === 'connections' || segments[i - 1] === 'recent') {
        const bucket = buckets.find((bucket) => bucket.id === parseInt(segment, 10));
        if (bucket) {
          return {
            title: <span>{bucket.name}</span>,
          };
        }
      }
      if (segments[i - 2] === 'connections' || segments[i - 2] === 'recent') {
        const connection = connections.find(
          (connection) => connection.id === parseInt(segment, 10),
        );
        if (connection) {
          return {
            title: <span>{connection.bucket}</span>,
          };
        }
      }
      if (segments[i - 1] === 'browse') {
        const connection = connections.find(
          (connection) => connection.id === parseInt(segment, 10),
        );
        if (connection) {
          return {
            title: <span>{connection.bucket}</span>,
          };
        }
      }
      if (segment === 'buckets') {
        return {
          title: <Link to={href}>{label}</Link>,
        };
      }
      const isLast = i === segments.length - 1;
      return {
        // title: isLast ? <span>{label}</span> : <Link to={href}>{label}</Link>,
        title: <span>{label}</span>,
      };
    }),
  ];

  return <Breadcrumb items={items} style={{ margin: '16px 0' }} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, setSettings] = useAtom(settingsAtom);
  const { buckets } = useBuckets();
  const { connections } = useConnections();
  const algorithm = settings.apparence.mode === 'dark' ? [theme.darkAlgorithm] : [];
  return (
    <HashRouter>
      <ConfigProvider theme={{ ...settings.apparence.theme, algorithm }}>
        <Layout style={{ minHeight: '100vh', minWidth: '100vw' }}>
          <Layout>
            <Sider
              width={200}
              theme={settings.apparence.mode as SiderTheme}
              collapsible
              collapsed={settings.apparence.sider?.collapsed}
              onCollapse={async (value) => {
                const newSettings = await window.settings.set(
                  mergeDeep({
                    ...settings,
                    apparence: {
                      ...settings.apparence,
                      sider: {
                        collapsed: value,
                      },
                    },
                  }),
                );
                console.log('newSetting', newSettings);
                setSettings(newSettings);
              }}
            >
              <Space vertical style={{ width: '100%' }}>
                <SiderMenu onSelect={(key) => console.log('key', key)} />
              </Space>
            </Sider>
            <Layout style={{ padding: '0 24px 24px' }}>
              <BreadcrumbNav buckets={buckets} connections={connections} />
              <Content>
                <Routes>
                  <Route index path="/" element={<Welcome />} />
                  <Route path="/new" element={<Connection />} />
                  <Route path="/connections/:bucket/:id" element={<Connection />} />
                  <Route path="/connections/recent/:id" element={<Connection />} />
                  <Route path="/browse" element={<Browser />} />
                  <Route path="/browse/:id" element={<Browser />} />
                  <Route path="/motd" element={children} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </ConfigProvider>
    </HashRouter>
  );
}
