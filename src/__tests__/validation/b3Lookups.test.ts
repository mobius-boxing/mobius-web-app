import i18n from '../../i18n/config';
import type { Translate } from '../../validation/fields';
import {
  createConsumableTypeSchema,
  editConsumableTypeSchema,
} from '../../validation/schemas/consumableType';
import {
  createToolingTypeSchema,
  editToolingTypeSchema,
} from '../../validation/schemas/toolingType';
import {
  createWarehouseSchema,
  editWarehouseSchema,
} from '../../validation/schemas/warehouse';

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
 * B3's three entities. Bounds are the LIVE column widths read from
 * `information_schema.columns` (2026-08-29) EXCEPT where the sign-off keeps a
 * stricter existing UI rule — which is the whole point of this batch and is
 * asserted by name below.
 *
 * `seeded` rows are real rows from `traffic_production` (the Risk 2 guard: an
 * edit schema stricter than the data blocks users from saving a row they never
 * touched).
 *
 * `role` is NOT here: 10 of its 62 live rows carry a `profileType` neither the
 * dropdown nor the server accepts, so a templated enum would brick editing
 * them. It moved to B7 by the sign-off.
 */
describe('consumableType schema', () => {
  const seeded = {
    code: 'QD-TCN-001',
    name: 'Tinta de línea',
    autoConsumption: true,
  };

  it('accepts a real seeded row through the EDIT schema, unchanged (Risk 2)', () => {
    expect(parse(editConsumableTypeSchema(t), seeded)).toEqual(seeded);
  });

  it('accepts the same row through the CREATE schema', () => {
    expect(parse(createConsumableTypeSchema(t), seeded)).toEqual(seeded);
  });

  it('trims surrounding whitespace instead of storing it', () => {
    expect(
      parse(createConsumableTypeSchema(t), {
        ...seeded,
        code: `  ${seeded.code}  `,
        name: `  ${seeded.name}  `,
      })
    ).toEqual(seeded);
  });

  it('requires the code and the name in Spanish', () => {
    expect(
      issues(createConsumableTypeSchema(t), { code: '   ', name: '' })
    ).toEqual([
      { field: 'code', message: 'Código es obligatorio' },
      { field: 'name', message: 'Nombre es obligatorio' },
    ]);
  });

  it('KEEPS the UI cap of 50 even though the column is varchar(255)', () => {
    // Sign-off: the column width is the CEILING, not the target. Widening to
    // 255 would let the form accept a code the user could never enter before.
    expect(
      parse(createConsumableTypeSchema(t), {
        ...seeded,
        code: 'x'.repeat(50),
      }).code
    ).toHaveLength(50);
    expect(
      issues(createConsumableTypeSchema(t), { ...seeded, code: 'x'.repeat(51) })
    ).toEqual([
      { field: 'code', message: 'Código no puede superar los 50 caracteres' },
    ]);
  });

  it('caps the name at the live varchar(255)', () => {
    expect(
      parse(createConsumableTypeSchema(t), { ...seeded, name: 'x'.repeat(255) })
        .name
    ).toHaveLength(255);
    expect(
      issues(createConsumableTypeSchema(t), { ...seeded, name: 'x'.repeat(256) })
    ).toEqual([
      { field: 'name', message: 'Nombre no puede superar los 255 caracteres' },
    ]);
  });

  it('rejects a code outside the identifier character set', () => {
    expect(issues(createConsumableTypeSchema(t), { ...seeded, code: 'A+B' })).toEqual(
      [{ field: 'code', message: 'Código tiene un formato inválido' }]
    );
  });

  it('refuses to blank the code or the name on EDIT as well', () => {
    expect(
      editConsumableTypeSchema(t).safeParse({ ...seeded, code: '' }).success
    ).toBe(false);
    expect(
      editConsumableTypeSchema(t).safeParse({ ...seeded, name: '' }).success
    ).toBe(false);
  });

  it('leaves the checkbox optional and never turns "" into false', () => {
    const { autoConsumption, ...rest } = seeded;
    expect(parse(createConsumableTypeSchema(t), rest).autoConsumption).toBeUndefined();
    expect(
      parse(createConsumableTypeSchema(t), { ...rest, autoConsumption: false })
        .autoConsumption
    ).toBe(false);
  });
});

describe('toolingType schema', () => {
  const seeded = {
    code: 'QD-TTL-001',
    name: 'Troquel plano',
    description: 'Herramental troquel plano',
    automaticConsumption: true,
  };

  it('accepts a real seeded row through the EDIT schema, unchanged (Risk 2)', () => {
    expect(parse(editToolingTypeSchema(t), seeded)).toEqual(seeded);
  });

  it('accepts the same row through the CREATE schema', () => {
    expect(parse(createToolingTypeSchema(t), seeded)).toEqual(seeded);
  });

  it('bounds the code by the live varchar(50)', () => {
    expect(
      parse(createToolingTypeSchema(t), { ...seeded, code: 'x'.repeat(50) }).code
    ).toHaveLength(50);
    expect(
      issues(createToolingTypeSchema(t), { ...seeded, code: 'x'.repeat(51) })
    ).toEqual([
      { field: 'code', message: 'Código no puede superar los 50 caracteres' },
    ]);
  });

  it('caps the name at the live varchar(255)', () => {
    expect(
      issues(createToolingTypeSchema(t), { ...seeded, name: 'x'.repeat(256) })
    ).toEqual([
      { field: 'name', message: 'Nombre no puede superar los 255 caracteres' },
    ]);
  });

  it('rejects a code outside the identifier character set', () => {
    expect(issues(createToolingTypeSchema(t), { ...seeded, code: 'A+B' })).toEqual([
      { field: 'code', message: 'Código tiene un formato inválido' },
    ]);
  });

  it('adds the first rule the free textarea ever had, at 10000 chars', () => {
    // TIGHTEN: `description` is a nullable `text` column that carried NO rule
    // on either side before this batch. Longest live value is 40 chars.
    expect(
      issues(createToolingTypeSchema(t), {
        ...seeded,
        description: 'x'.repeat(10001),
      })
    ).toEqual([
      {
        field: 'description',
        message: 'Descripción no puede superar los 10000 caracteres',
      },
    ]);
  });

  it('leaves the description optional and clearable', () => {
    const { description, ...rest } = seeded;
    expect(parse(createToolingTypeSchema(t), rest).description).toBeUndefined();
    // '' stays '' so an existing description can be CLEARED; collapsing it to
    // undefined would make the update payload drop the key.
    expect(
      parse(createToolingTypeSchema(t), { ...rest, description: '' }).description
    ).toBe('');
  });

  it('refuses to blank the code or the name on EDIT as well', () => {
    expect(editToolingTypeSchema(t).safeParse({ ...seeded, code: '' }).success).toBe(
      false
    );
    expect(editToolingTypeSchema(t).safeParse({ ...seeded, name: '' }).success).toBe(
      false
    );
  });
});

describe('warehouse schema', () => {
  /** All 46 live warehouses are 5x5 — the edges below are NOT covered by data. */
  const seeded = { name: 'Depósito Central 01', gridRows: 5, gridCols: 5 };

  it('accepts a real seeded row through the CREATE schema', () => {
    expect(parse(createWarehouseSchema(t), seeded)).toEqual(seeded);
  });

  it('accepts the seeded row through the EDIT schema, which renders only the name', () => {
    // Risk 2: `EditWarehouseModal` resets ONLY `name`, so this is the exact
    // payload a user saving an untouched row produces.
    expect(parse(editWarehouseSchema(t), { name: seeded.name })).toEqual({
      name: seeded.name,
    });
  });

  it('adds the name cap the form never had, at the live varchar(255)', () => {
    // TIGHTEN: both modals had `required` and no length rule at all.
    expect(
      parse(createWarehouseSchema(t), { ...seeded, name: 'x'.repeat(255) }).name
    ).toHaveLength(255);
    expect(
      issues(createWarehouseSchema(t), { ...seeded, name: 'x'.repeat(256) })
    ).toEqual([
      { field: 'name', message: 'Nombre no puede superar los 255 caracteres' },
    ]);
  });

  it('requires the name on both schemas', () => {
    expect(issues(createWarehouseSchema(t), { ...seeded, name: '  ' })).toEqual([
      { field: 'name', message: 'Nombre es obligatorio' },
    ]);
    expect(editWarehouseSchema(t).safeParse({ name: '' }).success).toBe(false);
  });

  it('KEEPS the 1..50 product bound on both grid dimensions', () => {
    // Sign-off: `grid_rows`/`grid_cols` are plain `integer` columns with ZERO
    // CHECK constraints, so the DB would take any int32. 1..50 is a product
    // rule and is NOT widened to the column's physical range.
    expect(parse(createWarehouseSchema(t), { ...seeded, gridRows: 1, gridCols: 50 })).toEqual(
      { ...seeded, gridRows: 1, gridCols: 50 }
    );
    expect(issues(createWarehouseSchema(t), { ...seeded, gridRows: 0 })).toEqual([
      { field: 'gridRows', message: 'Filas no puede ser menor que 1' },
    ]);
    expect(issues(createWarehouseSchema(t), { ...seeded, gridRows: 51 })).toEqual([
      { field: 'gridRows', message: 'Filas no puede ser mayor que 50' },
    ]);
    expect(issues(createWarehouseSchema(t), { ...seeded, gridCols: 51 })).toEqual([
      { field: 'gridCols', message: 'Columnas no puede ser mayor que 50' },
    ]);
    // The int32 ceiling a "corrected" schema would have allowed.
    expect(
      issues(createWarehouseSchema(t), { ...seeded, gridCols: 2147483647 })
    ).toEqual([
      { field: 'gridCols', message: 'Columnas no puede ser mayor que 50' },
    ]);
  });

  it('coerces the strings an <input type="number"> actually emits', () => {
    // `valueAsNumber: true` is gone from both registers; the schema does it.
    expect(parse(createWarehouseSchema(t), { ...seeded, gridRows: '7', gridCols: '8' })).toEqual(
      { ...seeded, gridRows: 7, gridCols: 8 }
    );
  });

  it('turns an emptied number input into "es obligatorio", never NaN', () => {
    // THE bug this program exists for: `''` used to become `NaN` on the way to
    // Postgres. `required` here matches the inline rule the modal had.
    expect(issues(createWarehouseSchema(t), { ...seeded, gridRows: '' })).toEqual([
      { field: 'gridRows', message: 'Filas es obligatorio' },
    ]);
    expect(issues(createWarehouseSchema(t), { ...seeded, gridCols: undefined })).toEqual(
      [{ field: 'gridCols', message: 'Columnas es obligatorio' }]
    );
  });

  it('rejects a fractional grid size', () => {
    expect(issues(createWarehouseSchema(t), { ...seeded, gridRows: 2.5 })).toEqual([
      { field: 'gridRows', message: 'Filas debe ser un número entero' },
    ]);
  });

  it('keeps the same bound on EDIT, the other door into those columns', () => {
    // `EditWarehouseModal` does not render them, but `WarehouseGridEditorModal`
    // (B7) PUTs to the same endpoint with the same 1..50 rule.
    expect(
      issues(editWarehouseSchema(t), { name: seeded.name, gridRows: 51 })
    ).toEqual([{ field: 'gridRows', message: 'Filas no puede ser mayor que 50' }]);
  });
});
