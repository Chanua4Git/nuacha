import { describe, it, expect } from 'vitest';
import { dueHints, shoppingSuggestions, itemKey } from './shoppingHints';
const l = (date: string) => ({ description: 'Pascual Yogurt 188ml', date, place: 'JTA' });
describe('dueHints', () => {
  it('flags an item once its usual gap has passed', () => {
    const h = dueHints([l('2026-10-01'), l('2026-10-08'), l('2026-10-15')], '2026-10-22');
    expect(h[0].avgGapDays).toBe(7);
  });
  it('does not flag before the usual gap', () => {
    expect(dueHints([l('2026-10-01'), l('2026-10-08'), l('2026-10-15')], '2026-10-20')).toHaveLength(0);
  });
  it('needs at least 3 separate shopping days', () => {
    expect(dueHints([l('2026-10-01'), l('2026-10-08')], '2026-12-01')).toHaveLength(0);
  });
});

describe('shoppingSuggestions', () => {
  it('excludes ambiguous till codes even when repeated', () => {
    expect(shoppingSuggestions(['01', '08', '15'].map(day => ({ description: '24 MISC 1', date: `2026-10-${day}`, place: 'OH FUDGE' })), '2026-11-10')).toEqual([]);
  });
  it('includes a recent single purchase without guessing cadence or stock', () => {
    const [suggestion] = shoppingSuggestions([{ description: 'Dabur Odomos 100ml', date: '2026-11-10', place: 'Pennywise' }], '2026-11-10');
    expect(suggestion).toMatchObject({ name: 'Odomos mosquito repellent', avgGapDays: null, due: false, daysSince: 0, usualStore: 'Pennywise' });
  });
  it('groups oat product variations and does not count repeats on the same day', () => {
    const lines = ['Quaker Oats 1000g', 'Rolled Oats 500g', 'Oatmeal 2kg'].map(description => ({ description, date: '2026-11-10', place: 'PriceSmart' }));
    expect(shoppingSuggestions(lines, '2026-11-10')).toHaveLength(1);
    expect(shoppingSuggestions(lines, '2026-11-10')[0].times).toBe(1);
    expect(itemKey('Quaker Oats 1000g')).toBe(itemKey('Oatmeal'));
  });
  it('excludes restaurant purchases and invalid or future dates', () => {
    expect(shoppingSuggestions([
      { description: 'Chicken', date: '2026-11-10', place: 'KFC' },
      { description: 'Eggs', date: '2026-02-30', place: 'JTA' },
      { description: 'Milk', date: '2026-11-11', place: 'JTA' },
    ], '2026-11-10')).toEqual([]);
  });
  it('chooses the usual store using separate shopping days', () => {
    const lines = ['01', '08', '15'].map(day => ({ description: 'Oats', date: `2026-10-${day}`, place: 'PriceSmart' }));
    lines.push({ description: 'Oats', date: '2026-11-10', place: 'JTA' });
    expect(shoppingSuggestions(lines, '2026-11-10')[0]).toMatchObject({ usualStore: 'PriceSmart', lastPlace: 'JTA', due: false });
  });
});
