import i18n from '../../i18n/config';
import type { Translate } from '../../validation/fields';
import {
  createPaperStockSchema,
  editPaperStockSchema,
} from '../../validation/schemas/paperStock';
import {
  createSheetStockSchema,
  editSheetStockSchema,
} from '../../validation/schemas/sheetStock';
import {
  createToolingStockSchema,
} from '../../validation/schemas/toolingStock';
import {
  createConsumableStockSchema,
} from '../../validation/schemas/consumableStock';
import { createPaperSheetSchema } from '../../validation/schemas/paperSheet';
import { createPaperSupplySchema } from '../../validation/schemas/paperSupply';
import {
  createConsumableSupplySchema,
} from '../../validation/schemas/consumableSupply';
import { createToolingSchema } from '../../validation/schemas/tooling';

const t = i18n.t.bind(i18n) as unknown as Translate;

type Schema = {
  safeParse: (value: unknown) => {
    success: boolean;
    data?: Record<string, unknown>;
    error?: { issues: Array<{ path: unknown[]; message: string }> };
  };
};

const issues = (schema: Schema, value: unknown): string[] => {
  const result = schema.safeParse(value);
  if (result.success) throw new Error('expected the payload to be rejected');
  return (result.error?.issues ?? []).map((i) => String(i.path[0]));
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

const UUID = '11111111-2222-3333-4444-555555555555';

/**
 * B5 — stock and supply. The batch where FK required-ness had to come from the
 * COLUMN rather than the modal, and where three entities carry a `minimumStock`
 * of three different types.
 *
 * Same evidence gap as B4: these tables are empty on this machine, so the rows
 * below are constructed, not live.
 */
describe('stock schemas: FK required-ness follows the column', () => {
  const paperStockRow = {
    warehouseId: UUID,
    paperSupplyId: UUID,
    weight: 10.5,
    price: 99.99,
  };

  it('requires the two NOT NULL foreign keys and no others', () => {
    expect(parse(createPaperStockSchema(t), paperStockRow)).toMatchObject({
      warehouseId: UUID,
      paperSupplyId: UUID,
    });
    expect(issues(createPaperStockSchema(t), { ...paperStockRow, warehouseId: '' }))
      .toEqual(['warehouseId']);
    expect(
      issues(createPaperStockSchema(t), { ...paperStockRow, paperSupplyId: '' })
    ).toEqual(['paperSupplyId']);
  });

  it('leaves the nullable supplier and manufacturer optional', () => {
    const parsed = parse(createPaperStockSchema(t), paperStockRow);
    expect(parsed.supplierId).toBeUndefined();
    expect(parsed.manufacturerId).toBeUndefined();
  });

  /** `.partial()` alone would let a cleared select reach a NOT NULL column. */
  it('keeps both foreign keys required on the EDIT schema too', () => {
    expect(issues(editPaperStockSchema(t), { warehouseId: '', paperSupplyId: UUID }))
      .toEqual(['warehouseId']);
  });

  it('enforces numeric(10,2) on every measure', () => {
    expect(
      issues(createPaperStockSchema(t), { ...paperStockRow, weight: 1.234 })
    ).toEqual(['weight']);
    expect(
      issues(createPaperStockSchema(t), { ...paperStockRow, diameter: 100000000 })
    ).toEqual(['diameter']);
  });

  const sheetRow = {
    warehouseId: UUID,
    paperSheetId: UUID,
    quantity: 5,
  };

  /**
   * The rule the column alone would have got wrong: `quantity` is NOT NULL
   * *with a default*, so the schema-only reading makes it optional. The modal
   * has always required it, and the governing principle keeps the stricter
   * existing rule.
   */
  it('keeps quantity required despite the column default', () => {
    expect(parse(createSheetStockSchema(t), sheetRow).quantity).toBe(5);
    expect(issues(createSheetStockSchema(t), { ...sheetRow, quantity: '' }))
      .toEqual(['quantity']);
    // …and on edit, where `.partial()` would otherwise have dropped it.
    expect(issues(editSheetStockSchema(t), { ...sheetRow, quantity: '' }))
      .toEqual(['quantity']);
  });

  /** Replacing `valueAsNumber: true`, which turned an emptied box into NaN. */
  it('reports an emptied quantity as required, never as NaN', () => {
    const result = createSheetStockSchema(t).safeParse({
      ...sheetRow,
      quantity: '',
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).not.toContain('NaN');
  });

  it('rejects a fractional quantity on an integer column', () => {
    expect(issues(createSheetStockSchema(t), { ...sheetRow, quantity: 2.5 }))
      .toEqual(['quantity']);
  });

  it('applies the same rules to the uuid-named stock forms', () => {
    expect(
      issues(createToolingStockSchema(t), {
        warehouseUuid: '',
        toolingUuid: UUID,
        quantity: 1,
      })
    ).toEqual(['warehouseUuid']);
    expect(
      issues(createConsumableStockSchema(t), {
        warehouseUuid: UUID,
        consumableSupplyUuid: '',
        quantity: 1,
      })
    ).toEqual(['consumableSupplyUuid']);
  });
});

describe('supply schemas: one field name, three column types', () => {
  it('paperSheet.minimumStock is an integer', () => {
    const row = { code: 'PS-1', name: 'Lámina', minimumStock: 5 };
    expect(parse(createPaperSheetSchema(t), row).minimumStock).toBe(5);
    expect(issues(createPaperSheetSchema(t), { ...row, minimumStock: 1.5 }))
      .toEqual(['minimumStock']);
  });

  it('consumableSupply.minimumStock is numeric(14,4)', () => {
    const row = {
      code: 'CS-1',
      name: 'Insumo',
      consumableTypeUuid: UUID,
      minimumStock: 1.2345,
    };
    expect(parse(createConsumableSupplySchema(t), row).minimumStock).toBe(1.2345);
    expect(issues(createConsumableSupplySchema(t), { ...row, minimumStock: 1.23456 }))
      .toEqual(['minimumStock']);
  });

  it('paperSupply splits its jsonb minimumStock into two inputs', () => {
    const row = {
      code: 'PSUP-1',
      name: 'Papel',
      minimumStockWeightKg: 12.5,
      minimumStockDiameterMm: 900,
    };
    const parsed = parse(createPaperSupplySchema(t), row);
    expect(parsed.minimumStockWeightKg).toBe(12.5);
    expect(parsed.minimumStockDiameterMm).toBe(900);
    // There is no `minimumStock` field on the form — the modal composes it.
    expect(parsed.minimumStock).toBeUndefined();
  });

  /** numeric(12,2), two digits wider than every other price in the batch. */
  it('gives paperSupply.price its own wider ceiling', () => {
    const row = { code: 'PSUP-1', name: 'Papel', price: 9999999999.99 };
    expect(parse(createPaperSupplySchema(t), row).price).toBe(9999999999.99);
    expect(issues(createPaperSupplySchema(t), { ...row, price: 10000000000 }))
      .toEqual(['price']);
  });

  /**
   * `expiry` is a TEXT column holding free-form values. A date rule here would
   * reject what the column already stores.
   */
  it('accepts free-form text in consumableSupply.expiry', () => {
    const row = {
      code: 'CS-1',
      name: 'Insumo',
      consumableTypeUuid: UUID,
      expiry: 'Lote 2027, sin vencimiento',
    };
    expect(parse(createConsumableSupplySchema(t), row).expiry).toBe(
      'Lote 2027, sin vencimiento'
    );
  });

  /**
   * REQUIRED-NESS CONFLICT kept the B2 way: the column is nullable, the modal
   * has always required it.
   */
  it('keeps consumableSupply.consumableTypeUuid required over a nullable column', () => {
    expect(
      issues(createConsumableSupplySchema(t), {
        code: 'CS-1',
        name: 'Insumo',
        consumableTypeUuid: '',
      })
    ).toEqual(['consumableTypeUuid']);
  });

  it('requires tooling.toolingTypeUuid but leaves its nullable code optional', () => {
    const row = { name: 'Troquel', toolingTypeUuid: UUID };
    expect(parse(createToolingSchema(t), row).name).toBe('Troquel');
    expect(issues(createToolingSchema(t), { ...row, toolingTypeUuid: '' }))
      .toEqual(['toolingTypeUuid']);
  });
});
