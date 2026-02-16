import { ipcMain, IpcMainInvokeEvent } from 'electron';
import ipc from '../../shared/constants/ipc';
import * as Settings from '../ipc/settings';
import * as Buckets from '../ipc/buckets';
import * as Connections from '../ipc/connections';

interface IMessage {
  command: string;
  bucket?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    remember?: string;
  };
}
(async (ts: number) => {
  try {
    await Connections.init();
    await Buckets.init();
    await Settings.init();
    ipcMain.handle(ipc.MAIN_API, async (event: IpcMainInvokeEvent, ...args: IMessage[]) => {
      // const settings = await Settings.get();
      // const bucket = await Buckets.upsert({
      //   id: 1,
      //   bucketIds: [settings.id],
      //   name: settings.bucket,
      //   type: 'bucket',
      //   color: '#f00',
      //   icon: 'levy',
      // });
      // const settingsx = await Settings.get(bucket.bucketIds[0]);
      // console.log('bucket', JSON.stringify(bucket, null, 2));
      // console.log('settingsx', settingsx);
      // console.log('settings', settings);
      // const buckets = await Buckers.get(1);
      // console.log(setting, event, args);

      const results = await Promise.all(
        args.map(async (arg) => {
          const [command, action] = arg.command.split(':');
          switch (command) {
            case 'bucket': {
              switch (action) {
                case 'add': {
                  console.log('bucket add', arg.bucket);
                  if (!arg.bucket) break;
                  const result = await Connections.create(arg.bucket);
                  if (!result) break;
                  console.log('result', result);
                  return {
                    ...arg,
                    result,
                    ack: new Date().getTime(),
                  };
                }
                default:
                  console.log('bad action');
                  break;
              }
              break;
            }
            default:
              console.log('bad command');
              break;
          }
          return {
            ...arg,
            nak: new Date().getTime(),
          };
        }),
      );
      return {
        results,
        ack: new Date().getTime(),
      };

      return args.map(async (arg) => {
        const [command, action] = arg.command.split(':');
        // switch (command) {
        //   case 'bucket': {
        //     switch (action) {
        //       case 'add': {
        //         console.log('bucket add', arg.bucket);
        //         if (!arg.bucket) break;
        //         const result = await Connections.create(arg.bucket);
        //         console.log('result', result);
        //         return {
        //           ...arg,
        //           result: {
        //             id: result.id,
        //             accessKeyId: result.accessKeyId,
        //             region: result.region,
        //             bucket: result.bucket,
        //           },
        //           ack: new Date().getTime(),
        //         };
        //       }
        //       default:
        //         console.log('bad action');
        //         break;
        //     }
        //     break;
        //   }
        //   default:
        //     console.log('bad command');
        //     break;
        // }

        console.log('command', command, action);
        return {
          // settings,
          // bucket,
          ack: new Date().getTime(),
        };
      });
    });
    console.log(`ipc handler: ${ipc.MAIN_API} initted: ${ts}`);
  } catch (error) {
    console.error(error);
  }
})(new Date().getTime());
