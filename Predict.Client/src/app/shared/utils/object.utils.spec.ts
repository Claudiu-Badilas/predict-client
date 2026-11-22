import { describe, expect, it } from 'vitest';
import { ObjectUtil } from './object.utils';

describe('ObjectUtil', () => {
  it('groups items by a selected key', () => {
    const result = ObjectUtil.groupBy(
      [
        { name: 'Rent', category: 'home' },
        { name: 'Food', category: 'daily' },
        { name: 'Power', category: 'home' },
      ],
      (item) => item.category,
    );

    expect(result).toEqual({
      home: [
        { name: 'Rent', category: 'home' },
        { name: 'Power', category: 'home' },
      ],
      daily: [{ name: 'Food', category: 'daily' }],
    });
  });

  it('returns an empty object for an empty collection', () => {
    expect(ObjectUtil.groupBy([], () => 'empty')).toEqual({});
  });
});
