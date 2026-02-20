export interface IConnection {
  id?: number;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  remember?: boolean;
}
