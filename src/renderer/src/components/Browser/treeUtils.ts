import { FOLDER } from '../../../../shared/constants/object-type';
import type { DataType } from './types';
import { getPathPrefixes, getParentPath, normalizePath } from './pathUtils';

/** Unique folder paths that must exist as nodes, sorted by path (parent before child). */
export function getSortedFolderPaths(flat: Omit<DataType, 'children'>[]): string[] {
  const set = flat.reduce<Set<string>>((acc, item) => {
    getPathPrefixes(item.path).forEach((p) => acc.add(p));
    return acc;
  }, new Set());
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Synthetic folder node (path prefix not present in API data); uses stable id for table key. */
export function createFolderNode(pathPrefix: string): DataType {
  const pathKey = normalizePath(pathPrefix);
  const id = `folder:${pathKey}`;
  return {
    id,
    key: id,
    path: pathPrefix,
    type: FOLDER,
    size: 0,
    lastModified: new Date(0),
    storageClass: '',
    children: [],
  };
}

/** Build path → node map from tree (one entry per path; node is from tree). */
export function buildPathMap(nodes: DataType[]): Map<string, DataType> {
  return nodes.reduce<Map<string, DataType>>((acc, n) => {
    const key = normalizePath(n.path);
    const childMap = n.children?.length ? buildPathMap(n.children) : new Map();
    return new Map([...acc, ...childMap, [key, n]]);
  }, new Map());
}

/** Return new roots with the node at pathKey replaced by newNode. Preserves key/id on updated nodes. */
export function replaceNodeInTree(
  roots: DataType[],
  pathKey: string,
  newNode: DataType,
): DataType[] {
  return roots.map((node) => {
    if (normalizePath(node.path) === pathKey) return newNode;
    if (node.children?.length) {
      const children = replaceNodeInTree(node.children, pathKey, newNode);
      return { ...node, key: node.id, children };
    }
    return { ...node, key: node.id };
  });
}

/** Return new roots with node added under parentPath (or at root if parentPath === ''). */
export function addNodeToTree(roots: DataType[], parentPath: string, node: DataType): DataType[] {
  if (parentPath === '') return [...roots, node];
  const parentKey = normalizePath(parentPath);
  return roots.map((n) => {
    if (normalizePath(n.path) !== parentKey) {
      if (n.children?.length) {
        const children = addNodeToTree(n.children, parentPath, node);
        return { ...n, key: n.id, children };
      }
      return { ...n, key: n.id };
    }
    return { ...n, key: n.id, children: [...(n.children ?? []), node] };
  });
}

/**
 * Builds a tree from flat S3 paths using "/" as folder separator.
 * Pure functional style: map, reduce, filter, sort; no side effects; returns new objects.
 */
export function transformPlainS3PathToTreeTableData(
  flat: Omit<DataType, 'children'>[],
): DataType[] {
  const sortedFlat = [...flat].sort((a, b) => a.path.localeCompare(b.path));
  const sortedFolderPaths = getSortedFolderPaths(sortedFlat);

  const folderPathsDeepFirst = [...sortedFolderPaths].sort((a, b) => b.localeCompare(a));
  const initialFolderMap = new Map(
    sortedFolderPaths.map((pathPrefix) => [
      normalizePath(pathPrefix),
      createFolderNode(pathPrefix),
    ]),
  );
  const folderMapWithChildren = folderPathsDeepFirst.reduce<Map<string, DataType>>((map, path) => {
    const node = map.get(normalizePath(path))!;
    const parentPath = getParentPath(path);
    if (parentPath === '') return map;
    const parent = map.get(normalizePath(parentPath))!;
    const newParent: DataType = {
      ...parent,
      key: parent.id,
      children: [...(parent.children ?? []), node],
    };
    return new Map(map).set(normalizePath(parentPath), newParent);
  }, initialFolderMap);

  const folderRoots = sortedFolderPaths
    .filter((p) => getParentPath(p) === '')
    .map((p) => folderMapWithChildren.get(normalizePath(p))!);

  const pathToNode = buildPathMap(folderRoots);

  const { roots } = sortedFlat.reduce<{ roots: DataType[]; pathToNode: Map<string, DataType> }>(
    (acc, item) => {
      const key = normalizePath(item.path);
      const parentPath = getParentPath(item.path);
      const existingFolder = item.type === FOLDER ? acc.pathToNode.get(key) : undefined;

      if (existingFolder) {
        const newNode: DataType = {
          ...item,
          key: item.id,
          children: existingFolder.children ?? [],
        };
        const newRoots = replaceNodeInTree(acc.roots, key, newNode);
        const newMap = new Map(acc.pathToNode).set(key, newNode);
        return { roots: newRoots, pathToNode: newMap };
      }

      const node: DataType = {
        ...item,
        key: item.id,
        children: item.type === FOLDER ? [] : undefined,
      };
      const newRoots = addNodeToTree(acc.roots, parentPath, node);
      const newMap = new Map(acc.pathToNode).set(key, node);
      return { roots: newRoots, pathToNode: newMap };
    },
    { roots: folderRoots, pathToNode },
  );

  return roots;
}
