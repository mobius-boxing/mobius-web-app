import { z } from 'zod';
import { optionalText, Translate } from '../fields';

/**
 * B8 schema for `pages/SalesOrderForm.tsx` — a VERIFY-ONLY conversion.
 *
 * This form was already validated, and its rules are NOT the ones the columns
 * alone would suggest. They are reproduced here verbatim, including their
 * existing `salesOrders.validation.*` message keys:
 *
 *   customerUuid  required, EXCEPT when editing (the control is disabled then,
 *                 and a required rule on a disabled input blocks the save)
 *   productUuid   required on the PRODUCTO path, except when editing
 *   partUuid      required on the PARTE path
 *   quantity      required, and strictly greater than zero
 *   deliveryDate  NO RULE — an untouched date is omitted from the payload
 *
 * Hence the two parameters: the shape genuinely differs by mode, and a single
 * fixed schema either blocks the parte path (no productUuid) or blocks editing
 * (disabled identity fields). Getting this wrong is not theoretical — the first
 * version of this file did exactly that and `SalesOrderForm.test.tsx` caught it.
 *
 * WHAT THIS CONVERSION ADDS, and all it adds: bounds the columns justify and
 * the form never had — text caps, and `numeric(18,4)` scale on the two money
 * fields. Nothing becomes newly required.
 *
 * BOUNDS SOURCE — one of the two places this program departs from AMENDMENT A1:
 * `sales_orders` does not exist in the database reachable from this machine
 * (the local schema stops at `20260813000002`; sales orders arrive in
 * `20260820192521`), so these come from that MIGRATION and want re-checking
 * against the live schema:
 *   sales_orders.quantity   double precision  ← not numeric, not integer
 *   sales_orders.price/paid numeric(18,4)     ← scale FOUR, not two
 *   sales_orders.notes/dispatchNotes/conversionNotes/purchaseOrder/
 *     salesSector/supplierCode  text
 *
 * `quantity` being `double precision` is deliberate (L-010: Procusto parity
 * keeps float columns float), so fractional quantities are legal and neither an
 * integer nor a decimals rule belongs on it.
 *
 * The money columns' scale of 4 is the precision `utils/money.ts` exists to
 * hide on the way OUT. The display shows 2; this must accept the 4 the column
 * stores.
 *
 * `number` is absent: the server generates it (8-digit zero-padded) and
 * `SalesOrderInputDTO` rejects a client-supplied one outright.
 */

const TEXT_MAX = 10000;
/** numeric(18,4) — 14 digits before the point. */
const MONEY_MAX = 99999999999999.9999;
const MONEY_DECIMALS = 4;

/**
 * THIS SCHEMA VALIDATES WITHOUT TRANSFORMING, and that is load-bearing.
 *
 * With a resolver attached, react-hook-form hands the PARSED data to the submit
 * handler, not the raw form values. This page then shapes its own payload with
 * a local `optionalText(value: string)` that calls `value.trim()` — so the
 * moment a numeric primitive turned `''` into `undefined`, that helper threw
 * before the API was ever called and every create test failed with "0 calls".
 *
 * The numeric fields therefore keep their STRING type through validation: the
 * rules below check the string's numeric meaning and return it unchanged, so
 * the payload-shaping code downstream sees exactly what it saw before this
 * conversion. A schema for an already-working form should change what is
 * REJECTED, never what reaches the network.
 */
const requiredPositiveNumberText = (requiredMessage: string, positiveMessage: string) =>
  z
    .string({ error: requiredMessage })
    .trim()
    .min(1, requiredMessage)
    .refine((value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0;
    }, positiveMessage);

/** numeric(18,4): optional, non-negative, within range, four decimals. */
const boundedAmountText = (t: Translate, label: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => value === undefined || value === '' || Number.isFinite(Number(value)),
      { message: t('validation.mustBeNumber', { field: label }) }
    )
    .refine(
      (value) =>
        value === undefined || value === '' || Number(value) >= 0,
      { message: t('validation.min', { field: label, min: 0 }) }
    )
    .refine(
      (value) =>
        value === undefined || value === '' || Number(value) <= MONEY_MAX,
      { message: t('validation.max', { field: label, max: MONEY_MAX }) }
    )
    .refine(
      (value) =>
        value === undefined ||
        value === '' ||
        Number(Number(value).toFixed(MONEY_DECIMALS)) === Number(value),
      {
        message: t('validation.decimals', {
          field: label,
          decimals: MONEY_DECIMALS,
        }),
      }
    );

export interface SalesOrderSchemaOptions {
  /** Identity selects are disabled while editing, so they carry no rule. */
  isEdit: boolean;
  /** 'part' swaps the required productUuid for a required partUuid. */
  orderType: 'product' | 'part';
}

export const salesOrderSchema = (
  t: Translate,
  { isEdit, orderType }: SalesOrderSchemaOptions
) => {
  const requiredRef = (message: string) =>
    z.string({ error: message }).trim().min(1, message);
  const optionalRef = () => z.string().trim().optional();

  return z.object({
    customerUuid: isEdit
      ? optionalRef()
      : requiredRef(t('salesOrders.validation.customerRequired')),
    productUuid:
      isEdit || orderType === 'part'
        ? optionalRef()
        : requiredRef(t('salesOrders.validation.productRequired')),
    partUuid:
      orderType === 'part'
        ? requiredRef(t('salesOrders.validation.partRequired'))
        : optionalRef(),
    deliveryLocationUuid: optionalRef(),
    salesUserUuid: optionalRef(),
    /*
     * Required, and strictly positive — the form's own two messages, and the
     * same rule `SalesOrderInputDTO` enforces server-side ("quantity must be
     * greater than zero", from PedidoDeProducto.cs).
     */
    quantity: requiredPositiveNumberText(
      t('salesOrders.validation.quantityRequired'),
      t('salesOrders.validation.quantityPositive')
    ),
    price: boundedAmountText(t, t('salesOrders.fields.price')),
    paid: boundedAmountText(t, t('salesOrders.fields.paid')),
    // No rule, exactly as before: an untouched date is omitted, not rejected.
    deliveryDate: z.string().trim().optional(),
    purchaseOrder: optionalText(
      t,
      t('salesOrders.fields.purchaseOrder'),
      TEXT_MAX
    ),
    supplierCode: optionalText(
      t,
      t('salesOrders.fields.supplierCode'),
      TEXT_MAX
    ),
    salesSector: optionalText(t, t('salesOrders.fields.salesSector'), TEXT_MAX),
    notes: optionalText(t, t('salesOrders.fields.notes'), TEXT_MAX),
    dispatchNotes: optionalText(
      t,
      t('salesOrders.fields.dispatchNotes'),
      TEXT_MAX
    ),
    conversionNotes: optionalText(
      t,
      t('salesOrders.fields.conversionNotes'),
      TEXT_MAX
    ),
    needsAdvanceInvoice: z.unknown().optional(),
    invoiceSent: z.unknown().optional(),
  });
};

export type SalesOrderSchema = z.infer<ReturnType<typeof salesOrderSchema>>;
