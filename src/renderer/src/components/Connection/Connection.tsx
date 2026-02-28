import type { FormProps } from 'antd';
import { useNavigate, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { Button, Typography, Checkbox, Form, Input, Space } from 'antd';
import Icon, { DeleteOutlined } from '@ant-design/icons';
import { connectionAtom, useConnections } from '@renderer/atoms/connection';
import { useAtom } from 'jotai';
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

async function saveConnection(connection: FieldType) {
  try {
    const result = connection.id
      ? await window.connections.upsert(connection)
      : await window.connections.add(connection);
    return result;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export default function Connection() {
  const navigate = useNavigate();
  const [connection, setConnection] = useAtom(connectionAtom);
  const { set: setConnections } = useConnections();
  const [, setRecent] = useRecent();
  const [form] = Form.useForm();
  const params = useParams();
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (!params.id || !params.id.match(/[0-9]/)) {
      setIsEditing(true);
      setConnection({
        accessKeyId: '',
        secretAccessKey: '',
        region: '',
        bucket: '',
        endpoint: '',
        remember: true,
      });
      form.resetFields();
      return;
    }
    setIsEditing(false);
    window.connections
      .get(parseInt(params.id, 10))
      .then(async (connection) => {
        setConnection(connection);
        form.resetFields();
        await form.setFieldsValue({
          ...connection,
          secretAccessKey: getRandomPassword(getRandomRange(8, 16)),
        });
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, connection.id]);

  return (
    <>
      <Title level={2} editable>
        <Space>
          <Icon component={s3Icon} />
          {connection.bucket || 'New Bucket'}
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
            const result = await saveConnection(...args);
            if (!result) return;
            await setRecent();
            await setConnections();
            navigate(`/browse/${result.id}`);
          } else {
            navigate(`/browse/${connection.id}`);
          }
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
          {/* <Select
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
          /> */}
          <Input disabled={!isEditing} />
        </Form.Item>

        <Form.Item<FieldType>
          label="Bucket"
          name="bucket"
          rules={[{ required: true, message: 'Please input your bucket!' }]}
        >
          <Input disabled={!isEditing} />
        </Form.Item>
        <Form.Item<FieldType>
          label="Endpoint"
          name="endpoint"
          rules={[{ required: false, message: 'Please input your endpoint!' }]}
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
              <Space align="center">
                <Button
                  type="default"
                  htmlType="button"
                  onClick={async () => {
                    try {
                      await form.resetFields();
                      setIsEditing(true);
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                >
                  Edit
                </Button>
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  onClick={async () => {
                    try {
                      connection.id && (await window.connections.delete(connection.id!));
                      await setRecent();
                      navigate(`/`);
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                >
                  Delete
                </Button>
              </Space>
            )}
          </Space>
        </Form.Item>
      </Form>
    </>
  );
}
