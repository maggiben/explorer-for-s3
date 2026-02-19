import React, { useEffect, useState } from 'react';
import { Flex, Pagination, Space, Switch, Table } from 'antd';
import type { TableColumnsType, TableProps } from 'antd';
import ipc from '../../../../shared/constants/ipc';
import { useParams } from 'react-router';


type TableRowSelection<T extends object = object> = TableProps<T>['rowSelection'];

interface DataType {
  key: React.ReactNode;
  name: string;
  age: number;
  address: string;
  children?: DataType[];
  listItemHeight?: number;
}

const columns: TableColumnsType<DataType> = [
  {
    title: 'path',
    dataIndex: 'path',
    key: 'path',
  },
  {
    title: 'size',
    dataIndex: 'size',
    key: 'size',
    width: '12%',
  },
  {
    title: 'type',
    dataIndex: 'type',
    width: '10%',
    key: 'type',
  },
  {
    title: 'storageClass',
    dataIndex: 'storageClass',
    width: '20%',
    key: 'storageClass',
  },
];

// const data: DataType[] = [
//   {
//     key: 1,
//     name: 'John Brown sr.',
//     age: 60,
//     address: 'New York No. 1 Lake Park',
//     children: [
//       {
//         key: 11,
//         name: 'John Brown',
//         age: 42,
//         address: 'New York No. 2 Lake Park',
//       },
//       {
//         key: 12,
//         name: 'John Brown jr.',
//         age: 30,
//         address: 'New York No. 3 Lake Park',
//         children: [
//           {
//             key: 121,
//             name: 'Jimmy Brown',
//             age: 16,
//             address: 'New York No. 3 Lake Park',
//           },
//         ],
//       },
//       {
//         key: 13,
//         name: 'Jim Green sr.',
//         age: 72,
//         address: 'London No. 1 Lake Park',
//         children: [
//           {
//             key: 131,
//             name: 'Jim Green',
//             age: 42,
//             address: 'London No. 2 Lake Park',
//             children: [
//               {
//                 key: 1311,
//                 name: 'Jim Green jr.',
//                 age: 25,
//                 address: 'London No. 3 Lake Park',
//               },
//               {
//                 key: 1312,
//                 name: 'Jimmy Green sr.',
//                 age: 18,
//                 address: 'London No. 4 Lake Park',
//               },
//             ],
//           },
//         ],
//       },
//     ],
//   },
//   {
//     key: 2,
//     name: 'Joe Black',
//     age: 32,
//     address: 'Sydney No. 1 Lake Park',
//   },
// ];

async function connect(id: number) {
  try {
    const payload = {
      ts: new Date().getTime(),
      command: 'connections:connect',
      id,
    };
    const result = window.electron.ipcRenderer.invoke(ipc.MAIN_API, payload);
    console.log(result);
    return await result.then(({ results, ack }) => ack && results.shift());
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

// rowSelection objects indicates the need for row selection
const rowSelection: TableRowSelection<DataType> = {
  onChange: (selectedRowKeys, selectedRows, info) => {
    console.log(
      `selectedRowKeys: ${selectedRowKeys}`,
      'selectedRows: ',
      selectedRows,
      'info',
      info,
    );
  },
  onSelect: (record, selected, selectedRows) => {
    console.log(record, selected, selectedRows);
  },
};

export default function Browser() {
  const params = useParams();
  const [data, setData] = useState<DataType[]>([]);

  useEffect(() => {
    if (!params.id || !params.id.match(/[0-9]/)) return;
    connect(parseInt(params.id, 10))
      .then((result) => {
        console.log('result', result);
        setData(result[0]);
      })
      .catch(console.error);
  }, []);
  return (
    <Flex
      vertical
      style={{
        maxHeight: 'calc(100vh - 80px)',
      }}
    >
      <div
        style={{
          flex: 1,
          flexGrow: 1,
          overflow: 'auto',
          maxHeight: 'calc(100vh - 80px)',
        }}
      >
        <Table<DataType>
          columns={columns}
          rowSelection={{ ...rowSelection }}
          dataSource={data}
          sticky
          pagination={false}
        />
      </div>
    </Flex>
  );
}
