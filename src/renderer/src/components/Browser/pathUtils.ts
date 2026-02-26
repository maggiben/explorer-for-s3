const S3_SEP = '/';

/** Last path segment (no folder prefix). Handles trailing slash: "movies/" → "movies". */
export function basename(s3Path: string): string {
  const trimmed = s3Path.replace(/\/$/, '');
  const i = trimmed.lastIndexOf(S3_SEP);
  return i >= 0 ? trimmed.slice(i + 1) : trimmed;
}

export function normalizePath(p: string): string {
  return p.replace(/\/$/, '');
}

export function getParentPath(path: string): string {
  const i = path.lastIndexOf(S3_SEP);
  return i >= 0 ? path.slice(0, i) : '';
}

/** All path prefixes for a given path (e.g. "a/b/c" → ["a", "a/b"]). */
export function getPathPrefixes(path: string): string[] {
  const trimmed = path;
  if (trimmed === '') return [];
  const parts = trimmed.split(S3_SEP).filter(Boolean);
  if (
    trimmed
      .split(/\/(\/)/)
      .slice(0, -1)
      .pop() === '/'
  ) {
    parts.push('/');
  } else if (trimmed.slice(-1) === '/') {
    parts.push('/');
  }
  return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join(S3_SEP));
}

export { S3_SEP };
