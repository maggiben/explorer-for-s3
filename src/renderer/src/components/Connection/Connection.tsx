import type { FormProps } from 'antd';
import { useNavigate, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { Button, Typography, Checkbox, Form, Input, Select, Space } from 'antd';
import Icon from '@ant-design/icons';
import { connectionAtom } from '@renderer/atoms/connection';
import { useAtom } from 'jotai';
import ipc from '../../../../shared/constants/ipc';
import regions from '../../../../shared/constants/regions.json';
import { getRandomPassword, getRandomRange } from '../../../../shared/lib/utils';
import s3Icon from '../../assets/icons/s3.svg?react';
import useRecent from '@renderer/hooks/useRecent';
import type { IConnection } from '../../../../types/IConnection';

const { Title } = Typography;

type FieldType = IConnection & {
  onFinish: () => Promise<FieldType | undefined>;
};

const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
  console.log('Failed:', errorInfo);
};

async function upsertConnection(connection: FieldType) {
  try {
    // const payload = {
    //   ts: new Date().getTime(),
    //   command: connection.id ? 'connections:upsert' : 'connections:add',
    //   connection,
    // };
    // const result = window.electron.ipcRenderer.invoke(ipc.MAIN_API, payload);
    // console.log(result);
    const result = connection.id
      ? window.connections.upsert(connection)
      : window.connections.add(connection);
    console.log('result', result); 
    return await result;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export default function Connection() {
  const navigate = useNavigate();
  const [connection, setConnection] = useAtom(connectionAtom);
  const [, setRecent] = useRecent();
  const [form] = Form.useForm();
  const params = useParams();
  const [isEditing, setIsEditing] = useState<boolean>(true);

  useEffect(() => {
    if (!params.id || !params.id.match(/[0-9]/)) return;
    setIsEditing(false);
    console.log('getId', params.id);

    window.connections
      .get(parseInt(params.id, 10))
      .then(async (con) => {
        console.log('connnn', con);
        setConnection(con);
        await form.resetFields();
        await form.setFieldsValue({
          ...con,
          secretAccessKey: getRandomPassword(getRandomRange(8, 16)),
        });
        // form.
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  return (
    <>
      <Title level={2} editable>
        <Space>
          <Icon component={s3Icon} />
          {connection.bucket || 'New Bucket'} {isEditing ? 'edit' : 'noedit'}
        </Space>
      </Title>
      <Form
        name="basic"
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 16 }}
        // style={{ maxWidth: 600 }}
        initialValues={connection}
        onFinish={async (...args) => {
          console.log(args);
          if (isEditing) {
            const result = await upsertConnection(...args);
            console.log('result', result);
            await setRecent();
          }
          return navigate(`/browse/${args.shift()?.id}`);
        }}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item<FieldType> label="Id" name="id" hidden rules={[{ required: false }]}>
          <Input />
        </Form.Item>

        <Form.Item<FieldType>
          label="Access Key"
          name="accessKeyId"
          rules={[{ required: true, message: 'Please input your access key!' }]}
        >
          <Input disabled={!isEditing} />
        </Form.Item>

        <Form.Item<FieldType>
          label="Secret"
          name="secretAccessKey"
          rules={[{ required: true, message: 'Please input your secret!' }]}
        >
          <Input.Password disabled={!isEditing} />
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
            disabled={!isEditing}
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
          <Input disabled={!isEditing} />
        </Form.Item>

        <Form.Item<FieldType> name="remember" valuePropName="checked" label={null}>
          <Checkbox disabled={!isEditing}>Remember me</Checkbox>
        </Form.Item>

        <Form.Item label={null}>
          <Space align="center">
            <Button type="primary" htmlType="submit">
              Connect
            </Button>

            {isEditing ? (
              <Button
                type="default"
                htmlType="button"
                onClick={async () => {
                  try {
                    const formValues = await form.validateFields();
                    const connection = await upsertConnection(formValues);
                    await setRecent();
                    console.log('connection', connection);
                  } catch (error) {
                    console.error(error);
                  }
                }}
              >
                Save
              </Button>
            ) : (
              <Button
                type="default"
                htmlType="button"
                onClick={async () => {
                  try {
                    const formValues = await form.validateFields();
                    const connection = await upsertConnection(formValues);
                    await setRecent();
                    console.log('connection', connection);
                  } catch (error) {
                    console.error(error);
                  }
                }}
              >
                Edit
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </>
  );
}
