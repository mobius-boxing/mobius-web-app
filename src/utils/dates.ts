/**
 * A BUSINESS DATE (`deliveryDate`, `orderDate`) is a calendar day that happens
 * to be stored in a `timestamptz` column. `new Date(value).toLocaleDateString()`
 * turns it into an instant first, so every user west of UTC reads the PREVIOUS
 * day — visibly wrong on "F. entrega".
 *
 * The ISO date part is therefore taken verbatim and printed `dd/MM/yyyy`, the
 * zero-padded Procusto format this module already uses for timestamps
 * (SalesOrderApprovalControl, divergence D-6). Instants (`createdAt`) are NOT
 * business dates and keep their locale rendering.
 */
export const formatBusinessDate = (value?: string | null): string => {
  if (!value) return '-';
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

export default formatBusinessDate;
