export interface IConnection {
  id?: number;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint?: string;
  bucket: string;
  remember?: boolean;
}
