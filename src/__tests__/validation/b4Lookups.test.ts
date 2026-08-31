import i18n from '../../i18n/config';
import type { Translate } from '../../validation/fields';
import {
  createPalletTypeSchema,
  editPalletTypeSchema,
} from '../../validation/schemas/palletType';
import {
  createCorrugationSchema,
  editCorrugationSchema,
} from '../../validation/schemas/corrugation';
import {
  createColorSchema,
  editColorSchema,
} from '../../validation/schemas/color';
import {
  createFinishedGoodSchema,
  editFinishedGoodSchema,
} from '../../validation/schemas/finishedGood';
import {
  createMachineTypeSchema,
  editMachineTypeSchema,
} from '../../validation/schemas/machineType';
import {
  createSupplierSchema,
  editSupplierSchema,
} from '../../validation/schemas/supplier';

const t = i18n.t.bind(i18n) as unknown as Translate;

type Schema = {
  safeParse: (value: unknown) => {
    success: boolean;
    data?: Record<string, unknown>;
    error?: { issues: Array<{ path: unknown[]; message: string }> };
  };
};

const issues = (
  schema: Schema,
  value: unknown
): Array<{ field: string; message: string }> => {
  const result = schema.safeParse(value);
  if (result.success) {
    throw new Error('expected the payload to be rejected');
  }
  return (result.error?.issues ?? []).map((issue) => ({
    field: String(issue.path[0]),
    message: issue.message,
  }));
};

const parse = (schema: Schema, value: unknown): Record<string, unknown> => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(
      'expected the payload to be accepted, got: ' +
        JSON.stringify(result.error?.issues)
    );
  }
  return result.data as Record<string, unknown>;
};

/**
 * B4 — the numeric-heavy lookups, and the first batch whose rules exercise the
 * decimal primitives for real.
 *
 * EVIDENCE GAP, stated rather than papered over: B2 and B3 asserted their
 * "accepts a real row" cases against live `traffic_production` tables of ~46
 * rows each. That database is not reachable from this machine; the local
 * `mobius` schema has `pallet_types=0`, `colors=0`, `finished_goods=0`,
 * `machine_types=0`, `suppliers=0` and exactly ONE corrugation. So:
 *   - every BOUND below is still schema-derived, read from
 *     `information_schema.columns` on the live local schema (2026-08-30);
 *   - the corrugation "real row" case uses the one genuine row (CORR1);
 *   - every other "accepts" case uses a CONSTRUCTED row, marked as such. It
 *     proves the schema accepts a plausible record, NOT that it accepts the
 *     rows that exist in production. Re-run against a populated database
 *     before trusting the Risk-2 (edit-stricter-than-data) guarantee.
 */

describe('palletType schema', () => {
  const row = {
    code: 'PAL-STD',
    description: 'Pallet estándar',
    length: 1200,
    width: 1000,
    height: 144,
    weight: 25.5,
  };

  it('accepts a constructed row through both schemas', () => {
    expect(parse(createPalletTypeSchema(t), row)).toEqual(row);
    expect(parse(editPalletTypeSchema(t), row)).toEqual(row);
  });

  it('keeps the client `required` on a NULLABLE code column (sign-off)', () => {
    expect(issues(createPalletTypeSchema(t), { ...row, code: '' })).toEqual([
      { field: 'code', message: expect.stringContaining('obligatorio') },
    ]);
  });

  it('drops a blank measure instead of sending NaN', () => {
    const parsed = parse(createPalletTypeSchema(t), { ...row, weight: '' });
    expect(parsed.weight).toBeUndefined();
    expect(Number.isNaN(parsed.weight as number)).toBe(false);
  });

  it('rejects a negative measure', () => {
    expect(issues(createPalletTypeSchema(t), { ...row, length: -1 })).toEqual([
      { field: 'length', message: expect.stringContaining('menor') },
    ]);
  });

  /**
   * THE float case (L-010). `double precision` has no scale, so a value with
   * many decimals must pass — a `decimals` rule here would reject numbers
   * Procusto stores today.
   */
  it('accepts unlimited decimals on a double precision column', () => {
    expect(
      parse(createPalletTypeSchema(t), { ...row, weight: 25.123456789 }).weight
    ).toBe(25.123456789);
  });
});

describe('corrugation schema', () => {
  /** The one genuinely live row on this machine. */
  const liveRow = { code: 'CORR1', description: 'Corrugado demo' };

  it('accepts the real CORR1 row through the EDIT schema, unchanged', () => {
    expect(parse(editCorrugationSchema(t), liveRow)).toEqual(liveRow);
  });

  it('enforces the two DIFFERENT numeric scales on one form', () => {
    // numeric(10,2): two decimals fine, three rejected.
    expect(
      parse(createCorrugationSchema(t), {
        ...liveRow,
        theoreticalGrammage: 123.45,
      }).theoreticalGrammage
    ).toBe(123.45);
    expect(
      issues(createCorrugationSchema(t), {
        ...liveRow,
        theoreticalGrammage: 1.234,
      })
    ).toEqual([
      { field: 'theoreticalGrammage', message: expect.stringContaining('2') },
    ]);
    // numeric(10,4): four decimals fine on caliper, which the grammage rule
    // would have rejected — this is why they are separate constants.
    expect(
      parse(createCorrugationSchema(t), { ...liveRow, caliper: 1.2345 }).caliper
    ).toBe(1.2345);
  });

  it('rejects a caliper above its own smaller ceiling', () => {
    // 99999999.99 is fine for grammage but out of range for numeric(10,4).
    expect(
      parse(createCorrugationSchema(t), {
        ...liveRow,
        theoreticalGrammage: 99999999.99,
      }).theoreticalGrammage
    ).toBe(99999999.99);
    expect(
      issues(createCorrugationSchema(t), { ...liveRow, caliper: 99999999.99 })
    ).toEqual([{ field: 'caliper', message: expect.stringContaining('mayor') }]);
  });

  it('caps code at the column width of 50', () => {
    expect(
      issues(createCorrugationSchema(t), { ...liveRow, code: 'x'.repeat(51) })
    ).toEqual([{ field: 'code', message: expect.stringContaining('50') }]);
  });
});

describe('color schema', () => {
  const row = {
    code: 'COL-001',
    name: 'Rojo',
    description: 'Rojo intenso',
    observations: 'Secado lento',
    tonality: 3,
  };

  it('accepts a constructed row through both schemas', () => {
    expect(parse(createColorSchema(t), row)).toEqual(row);
    expect(parse(editColorSchema(t), row)).toEqual(row);
  });

  it('rejects a fractional tonality on an integer column', () => {
    expect(issues(createColorSchema(t), { ...row, tonality: 2.5 })).toEqual([
      { field: 'tonality', message: expect.stringContaining('entero') },
    ]);
  });

  it('turns a cleared tonality into undefined, not NaN', () => {
    expect(parse(createColorSchema(t), { ...row, tonality: '' }).tonality).toBeUndefined();
  });

  it('reports an unparseable tonality as "must be a number"', () => {
    expect(issues(createColorSchema(t), { ...row, tonality: 'abc' })).toEqual([
      { field: 'tonality', message: expect.stringContaining('número') },
    ]);
  });
});

describe('finishedGood schema', () => {
  const row = {
    code: 'FG-1',
    name: 'Producto terminado',
    description: 'Demo',
    minimumStock: 10.5,
  };

  it('accepts a constructed row through both schemas', () => {
    expect(parse(createFinishedGoodSchema(t), row)).toEqual(row);
    expect(parse(editFinishedGoodSchema(t), row)).toEqual(row);
  });

  /** The no-conflict case: nullable column AND ruleless form stay optional. */
  it('accepts a blank code, because the column is nullable too', () => {
    const parsed = parse(createFinishedGoodSchema(t), { ...row, code: '' });
    expect(parsed.code).toBe('');
    expect(parsed.name).toBe('Producto terminado');
  });

  it('requires name, which IS NOT NULL', () => {
    expect(issues(createFinishedGoodSchema(t), { ...row, name: '  ' })).toEqual([
      { field: 'name', message: expect.stringContaining('obligatorio') },
    ]);
  });

  it('allows 4 decimals on numeric(14,4) and rejects a 5th', () => {
    expect(
      parse(createFinishedGoodSchema(t), { ...row, minimumStock: 1.2345 })
        .minimumStock
    ).toBe(1.2345);
    expect(
      issues(createFinishedGoodSchema(t), { ...row, minimumStock: 1.23456 })
    ).toEqual([
      { field: 'minimumStock', message: expect.stringContaining('4') },
    ]);
  });

  /**
   * The modal's old `data.minimumStock ? Number(x)` block swallowed a
   * deliberate 0 as well as a blank. The schema keeps the 0 and drops only the
   * blank, so "minimum stock is zero" is now expressible.
   */
  it('keeps an explicit 0 but omits a blank', () => {
    expect(
      parse(createFinishedGoodSchema(t), { ...row, minimumStock: 0 })
        .minimumStock
    ).toBe(0);
    expect(
      parse(createFinishedGoodSchema(t), { ...row, minimumStock: '' })
        .minimumStock
    ).toBeUndefined();
  });
});

describe('machineType schema', () => {
  const row = {
    name: 'Corrugadora',
    attribute: 'ATR-1',
    corrugated: true,
    generatesSheets: false,
    requiresDie: false,
    requiresPlate: true,
  };

  it('accepts a constructed row through both schemas', () => {
    expect(parse(createMachineTypeSchema(t), row)).toEqual(row);
    expect(parse(editMachineTypeSchema(t), row)).toEqual(row);
  });

  it('has no code rule, because the table has no code column', () => {
    const parsed = parse(createMachineTypeSchema(t), { ...row, code: 'X' });
    expect(parsed.code).toBeUndefined();
    expect(parsed.name).toBe('Corrugadora');
  });

  it('caps name at the column width of 400', () => {
    expect(
      issues(createMachineTypeSchema(t), { ...row, name: 'x'.repeat(401) })
    ).toEqual([{ field: 'name', message: expect.stringContaining('400') }]);
  });

  it('treats an untouched checkbox as unanswered, never as false', () => {
    expect(
      parse(createMachineTypeSchema(t), { ...row, generatesSheets: '' })
        .generatesSheets
    ).toBeUndefined();
  });
});

describe('supplier schema', () => {
  const row = {
    code: 'SUP-1',
    suppliesSheets: true,
    suppliesElaborated: false,
    suppliesConsumables: false,
    suppliesPaper: true,
    suppliesTooling: false,
  };

  it('accepts a constructed row through both schemas', () => {
    expect(parse(createSupplierSchema(t), row)).toEqual(row);
    expect(parse(editSupplierSchema(t), row)).toEqual(row);
  });

  it('caps code at 100, this table’s own width', () => {
    expect(parse(createSupplierSchema(t), { ...row, code: 'x'.repeat(100) }).code)
      .toHaveLength(100);
    expect(
      issues(createSupplierSchema(t), { ...row, code: 'x'.repeat(101) })
    ).toEqual([{ field: 'code', message: expect.stringContaining('100') }]);
  });

  it('rejects a code with characters the identifier pattern excludes', () => {
    expect(issues(createSupplierSchema(t), { ...row, code: 'A+B' })).toEqual([
      { field: 'code', message: expect.stringContaining('formato') },
    ]);
  });
});
