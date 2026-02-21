import path from 'path';
import { app } from 'electron';
import { Sequelize, literal } from 'sequelize';
import { escape } from 'sequelize/lib/sql-string';
import { DATABASE_FILENAME } from '../../shared/constants/config';

export const DATABASE_PATH = path.join(app.getPath('userData'), DATABASE_FILENAME);

// Instance type, not constructor type
let sequelize: Sequelize | null = null;

export function connect({ isLogSQL = false } = {}): Sequelize {
  if (!sequelize) {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: DATABASE_PATH,
      logging: isLogSQL ? console.log : false,
    });
  }

  return sequelize;
}

export async function disconnect(): Promise<void> {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
  }
}

/**
 * Generate sequelize like syntax.
 * ref:
 * 	How to escape `$like` wildcard characters `%` and `_` in sequelize?
 * 	https://stackoverflow.com/a/44236635
 * @param {string} value
 * @param {string} start - "%" | ""
 * @param {string} end - "%" | ""
 * @returns {Literal}
 */
export function generateLikeSyntax(value: string, { start = '%', end = '%' } = {}) {
  const escapedValue = escape(value);
  const items = [
    escapedValue.slice(0, 1),
    start,
    escapedValue.slice(1, -1).replace(/(%|_)/g, '\\$1'),
    end,
    escapedValue.slice(-1),
    " ESCAPE '\\'",
  ];

  return literal(items.join(''));
}

/**
 * Parse the keyword.
 * @param {string} keyword - The keyword.
 * @returns {{plus: Array<string>, minus: Array<string>, fields: {}}} The query object.
 */
export function parseKeyword(keyword: string): {
  plus: string[];
  minus: string[];
  fields: Record<string, string>;
} {
  if (!keyword) {
    return { plus: [] as string[], minus: [] as string[], fields: {} as Record<string, string> };
  }
  const normalized = keyword.replace(/:\s/g, ':').replace(/\u200b/g, '');
  const quotationMatches = normalized.match(/["'](.*?)["']/g) ?? [];
  const quoted = quotationMatches.map((quotation) => quotation.slice(1, -1).trim()).filter(Boolean);
  const withoutQuotations = quotationMatches
    .reduce((acc, quotation) => acc.replace(quotation, ''), normalized)
    .replace(/["']/g, '');
  const unquoted = withoutQuotations
    .split(' ')
    .map((word) => word.trim())
    .filter(Boolean);
  return [...quoted, ...unquoted].reduce(
    (acc, item) => {
      if (item.includes(':')) {
        const [field, value] = item.split(':');
        acc.fields[field] = value;
      } else if (item.startsWith('-')) {
        acc.minus.push(item.slice(1));
      } else {
        acc.plus.push(item);
      }
      return acc;
    },
    {
      plus: [] as string[],
      minus: [] as string[],
      fields: {} as Record<string, string>,
    },
  );
}
