import { Button, Typography, Flex, Col, Row, theme, Space, Divider, Avatar, Switch } from 'antd';
import { BulbFilled, MoonFilled, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import Versions from './Versions';
import ipc from '../../../shared/constants/ipc';
import { ExtractAtomValue, useAtom } from 'jotai';
import { settingsAtom } from '@renderer/atoms/settings';
const { Title } = Typography;
export default function Welcome() {
  const navigate = useNavigate();
  const [settings, setSettings] = useAtom(settingsAtom);

  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping');

  const darkMode = async () => {
    const { results } = await window.electron.ipcRenderer.invoke(ipc.MAIN_API, {
      command: 'settings:set',
      settings: {
        apparence: {
          mode: 'dark',
        },
      },
    });
    const { apparence } = results.shift() as ExtractAtomValue<typeof settingsAtom>;
    setSettings({
      ...settings,
      apparence: {
        ...apparence,
        theme: {
          algorithm: [theme.darkAlgorithm],
        },
      },
    });
  };

  const lightMode = async () => {
    const { results } = await window.electron.ipcRenderer.invoke(ipc.MAIN_API, {
      command: 'settings:set',
      settings: {
        apparence: {
          mode: 'light',
        },
      },
    });

    const { apparence } = results.shift() as ExtractAtomValue<typeof settingsAtom>;
    setSettings({
      ...settings,
      apparence: {
        ...apparence,
        theme: {
          algorithm: [theme.defaultAlgorithm],
        },
      },
    });
  };

  return (
    <Flex vertical justify="space-between" style={{ height: '100%' }}>
      <Space align="center">
        <Title style={{ marginBottom: 0 }}>Welcome:&nbsp;</Title>
        <Avatar shape="square" icon={<UserOutlined />} />
        <Title level={2} style={{ marginBottom: 0 }}>
          {settings.username}
        </Title>
      </Space>
      <Flex vertical style={{ flexGrow: 1 }}>
        <Row>
          <Divider />
          <Col span={24}>
            <Space>
              <Button onClick={() => navigate('/new')} type="primary">
                New Connection
              </Button>
              Mode:
              <Switch
                defaultChecked
                onChange={(e) => {
                  e ? lightMode() : darkMode();
                }}
                checkedChildren={<BulbFilled />}
                unCheckedChildren={<MoonFilled />}
              />
              <Button type="primary" onClick={() => ipcHandle()}>
                Ping
              </Button>
            </Space>
          </Col>
        </Row>
      </Flex>
      <Flex align="center" justify="flex-end">
        <Versions />
      </Flex>
    </Flex>
  );
}
