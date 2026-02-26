/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import {
  getSortedFolderPaths,
  createFolderNode,
  buildPathMap,
  replaceNodeInTree,
  addNodeToTree,
  transformPlainS3PathToTreeTableData,
} from './treeUtils';
import { FOLDER } from '@shared/constants/object-type';
import type { DataType } from './types';

const file = (path: string, id = path): Omit<DataType, 'children'> => ({
  id,
  key: id,
  path,
  type: 2,
  size: 0,
  lastModified: new Date(0),
  storageClass: '',
});

describe('treeUtils', () => {
  describe('getSortedFolderPaths', () => {
    it('returns unique folder prefixes sorted', () => {
      const flat = [file('a/b/file.txt'), file('a/c/other.txt')];
      expect(getSortedFolderPaths(flat)).toEqual(['a', 'a/b', 'a/c']);
    });
  });

  describe('createFolderNode', () => {
    it('creates folder node with stable id', () => {
      const node = createFolderNode('a/b');
      expect(node.type).toBe(FOLDER);
      expect(node.path).toBe('a/b');
      expect(node.id).toBe('folder:a/b');
      expect(node.children).toEqual([]);
    });
  });

  describe('buildPathMap', () => {
    it('builds path -> node map from tree', () => {
      const roots: DataType[] = [
        {
          id: '1',
          path: 'a',
          type: FOLDER,
          size: 0,
          lastModified: new Date(0),
          storageClass: '',
          children: [
            {
              id: '2',
              path: 'a/b',
              type: FOLDER,
              size: 0,
              lastModified: new Date(0),
              storageClass: '',
              children: [],
            },
          ],
        },
      ];
      const map = buildPathMap(roots);
      expect(map.get('a')?.path).toBe('a');
      expect(map.get('a/b')?.path).toBe('a/b');
    });
  });

  describe('replaceNodeInTree', () => {
    it('replaces node at pathKey', () => {
      const roots: DataType[] = [
        { id: '1', path: 'a', type: FOLDER, size: 0, lastModified: new Date(0), storageClass: '', children: [] },
      ];
      const newNode: DataType = {
        id: '1-new',
        path: 'a',
        type: FOLDER,
        size: 0,
        lastModified: new Date(0),
        storageClass: '',
        children: [],
      };
      const out = replaceNodeInTree(roots, 'a', newNode);
      expect(out[0].id).toBe('1-new');
    });
  });

  describe('addNodeToTree', () => {
    it('adds node at root when parentPath is empty', () => {
      const roots: DataType[] = [];
      const node: DataType = {
        id: 'n',
        path: 'x',
        type: FOLDER,
        size: 0,
        lastModified: new Date(0),
        storageClass: '',
        children: [],
      };
      expect(addNodeToTree(roots, '', node)).toEqual([node]);
    });
    it('adds node under parent', () => {
      const roots: DataType[] = [
        { id: 'a', path: 'a', type: FOLDER, size: 0, lastModified: new Date(0), storageClass: '', children: [] },
      ];
      const node: DataType = {
        id: 'b',
        path: 'a/b',
        type: FOLDER,
        size: 0,
        lastModified: new Date(0),
        storageClass: '',
        children: [],
      };
      const out = addNodeToTree(roots, 'a', node);
      expect(out[0].children).toHaveLength(1);
      expect(out[0].children![0].path).toBe('a/b');
    });
  });

  describe('transformPlainS3PathToTreeTableData', () => {
    it('builds tree from flat S3 paths', () => {
      const flat = [file('a/file1.txt'), file('a/b/file2.txt')];
      const tree = transformPlainS3PathToTreeTableData(flat);
      expect(tree.length).toBeGreaterThan(0);
      const rootA = tree.find((n) => n.path === 'a' || n.path === 'a/');
      expect(rootA).toBeDefined();
    });
  });
});
