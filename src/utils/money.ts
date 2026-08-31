/**
 * Money is stored `numeric(18,4)` because Procusto parity needs that precision
 * in the DATABASE — it is not a display format. Rendering the raw value leaks
 * the storage scale to the user (`220000.0000` on "Total", Trello #39), so
 * every displayed amount goes through here: es-AR grouping, exactly two
 * decimals, half-up rounding by `Intl.NumberFormat` (never truncation).
 *
 * Only READ-ONLY amounts. Never format the value of an editable
 * `<input type="number">`: the grouped string is not parseable as a number and
 * the field stops accepting keystrokes.
 */
const formatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** The placeholder the sales-order screens already show for a missing amount. */
export const MONEY_PLACEHOLDER = '-';

export const formatMoney = (value?: number | null): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return MONEY_PLACEHOLDER;
  }
  return formatter.format(value);
};

export default formatMoney;
