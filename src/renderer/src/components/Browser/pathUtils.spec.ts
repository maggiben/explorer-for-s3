/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { basename, normalizePath, getParentPath, getPathPrefixes, S3_SEP } from './pathUtils';

describe('pathUtils', () => {
  describe('basename', () => {
    it('returns last segment without trailing slash', () => {
      expect(basename('movies/')).toBe('movies');
      expect(basename('a/b/c')).toBe('c');
      expect(basename('file.txt')).toBe('file.txt');
    });
    it('handles root-like path', () => {
      expect(basename('')).toBe('');
    });
  });

  describe('normalizePath', () => {
    it('removes trailing slash', () => {
      expect(normalizePath('foo/')).toBe('foo');
      expect(normalizePath('a/b/')).toBe('a/b');
    });
    it('leaves path without trailing slash unchanged', () => {
      expect(normalizePath('a/b')).toBe('a/b');
    });
  });

  describe('getParentPath', () => {
    it('returns parent directory path', () => {
      expect(getParentPath('a/b/c')).toBe('a/b');
      expect(getParentPath('a/b')).toBe('a');
      expect(getParentPath('a')).toBe('');
    });
    it('returns empty for single segment', () => {
      expect(getParentPath('file')).toBe('');
    });
  });

  describe('getPathPrefixes', () => {
    it('returns all path prefixes (parent before child)', () => {
      expect(getPathPrefixes('a/b/c')).toEqual(['a', 'a/b']);
      expect(getPathPrefixes('a')).toEqual([]);
      expect(getPathPrefixes('')).toEqual([]);
    });
  });

  describe('S3_SEP', () => {
    it('is /', () => {
      expect(S3_SEP).toBe('/');
    });
  });
});
