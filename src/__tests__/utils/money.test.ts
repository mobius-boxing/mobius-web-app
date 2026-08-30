import { formatMoney } from '../../utils/money';

/**
 * Trello #39: the sales-order Total printed the `numeric(18,4)` storage scale
 * (`220000.0000`). Amounts are shown es-AR: `.` groups, `,` decimals, exactly
 * two of them.
 */
describe('formatMoney', () => {
  it('formats the reported total as 220.000,00', () => {
    expect(formatMoney(220000)).toBe('220.000,00');
  });

  it('pads and groups es-AR style', () => {
    expect(formatMoney(0)).toBe('0,00');
    expect(formatMoney(1234.5)).toBe('1.234,50');
    expect(formatMoney(-1234.5)).toBe('-1.234,50');
    expect(formatMoney(1234567.891)).toBe('1.234.567,89');
  });

  /** Rounds half up; truncation would answer 2,12 / 2,99 here. */
  it('rounds the extra decimals instead of truncating them', () => {
    expect(formatMoney(2.125)).toBe('2,13');
    expect(formatMoney(2.999)).toBe('3,00');
    expect(formatMoney(2.994)).toBe('2,99');
  });

  it('falls back to the dash placeholder for non-amounts', () => {
    expect(formatMoney(null)).toBe('-');
    expect(formatMoney(undefined)).toBe('-');
    expect(formatMoney()).toBe('-');
    expect(formatMoney(NaN)).toBe('-');
    expect(formatMoney(Infinity)).toBe('-');
  });
});
