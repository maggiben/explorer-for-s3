import { describe, it, expect } from 'vitest';
import {
  timeStringToSeconds,
  getRandomPassword,
  getRandomRange,
  toHumanTime,
  toHumanSize,
  fromHumanSize,
  padZeroes,
  replaceFromRight,
  isArrayofArrays,
  isArrayofObjects,
  isObjectEqual,
  splitIntoTuples,
  mergeDeep,
} from './utils';

describe('timeStringToSeconds', () => {
  it('parses hh:mm:ss', () => {
    expect(timeStringToSeconds('1:30:45')).toBe(1 * 3600 + 30 * 60 + 45); // 5445
    expect(timeStringToSeconds('0:0:0')).toBe(0);
  });
  it('parses mm:ss', () => {
    expect(timeStringToSeconds('5:30')).toBe(330);
    expect(timeStringToSeconds('0:45')).toBe(45);
  });
  it('throws for invalid format', () => {
    expect(() => timeStringToSeconds('1:2:3:4')).toThrow('Invalid time format');
    expect(() => timeStringToSeconds('abc')).toThrow();
  });
});

describe('getRandomPassword', () => {
  it('returns string of given length', () => {
    const p = getRandomPassword(10);
    expect(p).toHaveLength(10);
    expect(p).toMatch(/^[A-Za-z0-9]+$/);
  });
});

describe('getRandomRange', () => {
  it('returns integer within [min, max]', () => {
    for (let i = 0; i < 50; i++) {
      const n = getRandomRange(1, 10);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(10);
    }
  });
});

describe('toHumanTime', () => {
  it('formats seconds as mm:ss by default', () => {
    expect(toHumanTime(65)).toBe('1:05');
    expect(toHumanTime(0)).toBe('0:00');
  });
  it('handles hours when zeroPadding or maxHours', () => {
    expect(toHumanTime(3661, true)).toMatch(/\d+:01:01/);
  });
});

describe('toHumanSize', () => {
  it('formats bytes with unit', () => {
    expect(toHumanSize(0)).toBe('0');
    expect(toHumanSize(1024)).toBe('1KB');
    expect(toHumanSize(1536, 2)).toBe('1.5KB');
  });
});

describe('fromHumanSize', () => {
  it('parses human size to bytes', () => {
    expect(fromHumanSize('1KB')).toBe(1024);
    expect(fromHumanSize('1MB')).toBe(1024 * 1024);
    expect(fromHumanSize('')).toBe(0);
  });
});

describe('padZeroes', () => {
  it('pads number with zeroes', () => {
    expect(padZeroes(5, 3)).toBe('005');
    expect(padZeroes(123, 3)).toBe('123');
  });
});

describe('replaceFromRight', () => {
  it('replaces from right with str2', () => {
    expect(replaceFromRight('hello', 'xy')).toBe('helxy');
  });
});

describe('isArrayofArrays', () => {
  it('returns true for array of arrays', () => {
    expect(isArrayofArrays([[1], [2]])).toBe(true);
    expect(isArrayofArrays([])).toBe(true);
  });
  it('returns false otherwise', () => {
    expect(isArrayofArrays([1, 2])).toBe(false);
    expect(isArrayofArrays([{}])).toBe(false);
  });
});

describe('isArrayofObjects', () => {
  it('returns true for array of plain objects', () => {
    expect(isArrayofObjects([{}, { a: 1 }])).toBe(true);
  });
  it('returns false for array with non-objects', () => {
    expect(isArrayofObjects([1, {}])).toBe(false);
  });
});

describe('isObjectEqual', () => {
  it('compares by JSON stringify', () => {
    expect(isObjectEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(isObjectEqual({ a: 1 }, { a: 2 })).toBe(false);
  });
});

describe('splitIntoTuples', () => {
  it('splits array into chunks', () => {
    expect(splitIntoTuples([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});

describe('mergeDeep', () => {
  it('merges objects deeply', () => {
    const a = { x: { a: 1 }, y: 1 };
    const b = { x: { b: 2 }, z: 2 };
    const out = mergeDeep(a, b) as { x: { a: number; b: number }; y: number; z: number };
    expect(out.x.a).toBe(1);
    expect(out.x.b).toBe(2);
    expect(out.y).toBe(1);
    expect(out.z).toBe(2);
  });
  it('concatenates arrays', () => {
    const a = { arr: [1, 2] };
    const b = { arr: [3] };
    const out = mergeDeep(a, b) as { arr: number[] };
    expect(out.arr).toEqual([1, 2, 3]);
  });
});
