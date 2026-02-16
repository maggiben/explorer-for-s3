import { Button, Typography } from 'antd';
import Versions from './Versions';
import ipc from '../../../shared/constants/ipc';
const { Title } = Typography;
export default function Welcome() {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping');
  const update = () =>
    window.electron.ipcRenderer.invoke(ipc.MAIN_API, { ts: new Date().getTime() });
  return (
    <>
      <Title>Hello World</Title>
      <Button type="primary" onClick={() => ipcHandle()}>
        Click Me
      </Button>
      <br />
      <br />
      <Button
        onClick={async () => {
          const [command] = await update();
          console.log(command);
        }}
      >
        Update
      </Button>
      <br />
      <br />
      <Versions />
    </>
  );
}
