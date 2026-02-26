export interface DataType {
  id: string;
  key?: string | number;
  type: number;
  path: string;
  size: number;
  lastModified: Date;
  storageClass: string;
  children?: DataType[];
  listItemHeight?: number;
}
