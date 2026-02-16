import type { FormProps } from 'antd';
import { Button, Typography, Checkbox, Form, Input, Select } from 'antd';
import { connectionAtom } from '@renderer/atoms/connection';
import { useAtom } from 'jotai';
import ipc from '../../../shared/constants/ipc';
import regions from '../../../shared/constants/regions.json';

const { Title } = Typography;

type FieldType = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  remember?: boolean;
  onFinish: () => Promise<FieldType | undefined>;
};

const onFinish = async (bucket: FieldType): Promise<FieldType | undefined> => {
  try {
    const payload = {
      ts: new Date().getTime(),
      command: 'bucket:add',
      bucket,
    };
    const result = await window.electron.ipcRenderer.invoke(ipc.MAIN_API, payload);
    if (!result && !result.ack && result.ack < payload.ts) {
      throw new Error('no result!');
    }
    console.log(result);
    return result;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
  console.log('Failed:', errorInfo);
};

export default function NewBucket() {
  const [connection, setConnection] = useAtom(connectionAtom);
  return (
    <>
      <Title level={2} editable>
        {connection.bucket || 'New Bucket'}
      </Title>
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={connection}
        onFinish={async (...args) => {
          const result = await onFinish(...args);
          if (result) {
            await setConnection(result);
          }
        }}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item<FieldType>
          label="Access Key"
          name="accessKeyId"
          rules={[{ required: true, message: 'Please input your access key!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType>
          label="Secret"
          name="secretAccessKey"
          rules={[{ required: true, message: 'Please input your secret!' }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item<FieldType>
          label="Region"
          name="region"
          rules={[{ required: true, message: 'Please input your region!' }]}
        >
          <Select
            showSearch={{
              filterOption: (input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
            }}
            placeholder="Select a person"
            options={regions.map((region) => ({
              value: region.code,
              label: region.code,
            }))}
          />
        </Form.Item>

        <Form.Item<FieldType>
          label="Bucket"
          name="bucket"
          rules={[{ required: true, message: 'Please input your bucket!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType> name="remember" valuePropName="checked" label={null}>
          <Checkbox>Remember me</Checkbox>
        </Form.Item>

        <Form.Item label={null}>
          <Button type="primary" htmlType="submit">
            Connect
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}
