import i18n from '../../i18n/config';
import type { Translate } from '../../validation/fields';
import { createBoxTypeSchema, editBoxTypeSchema } from '../../validation/schemas/boxType';
import { createColorTypeSchema, editColorTypeSchema } from '../../validation/schemas/colorType';
import { createComplementSchema, editComplementSchema } from '../../validation/schemas/complement';
import {
  createCorrugationClassSchema,
  editCorrugationClassSchema,
} from '../../validation/schemas/corrugationClass';
import {
  createCustomerCategorySchema,
  editCustomerCategorySchema,
} from '../../validation/schemas/customerCategory';
import {
  createDeliveryZoneSchema,
  editDeliveryZoneSchema,
} from '../../validation/schemas/deliveryZone';
import { createFlapTypeSchema, editFlapTypeSchema } from '../../validation/schemas/flapType';
import { createFscTypeSchema, editFscTypeSchema } from '../../validation/schemas/fscType';
import { createGlueTypeSchema, editGlueTypeSchema } from '../../validation/schemas/glueType';
import {
  createManufacturerSchema,
  editManufacturerSchema,
} from '../../validation/schemas/manufacturer';
import { createPaperTypeSchema, editPaperTypeSchema } from '../../validation/schemas/paperType';
import {
  createProductTypeSchema,
  editProductTypeSchema,
} from '../../validation/schemas/productType';
import {
  createStrappingTypeSchema,
  editStrappingTypeSchema,
} from '../../validation/schemas/strappingType';
import { createTraceTypeSchema, editTraceTypeSchema } from '../../validation/schemas/traceType';

const t = i18n.t.bind(i18n) as unknown as Translate;

type Schema = { safeParse: (value: unknown) => { success: boolean } };
type Factory = (translate: Translate) => Schema;

/**
 * B2's 14 lookup entities. `codeMax` / `nameMax` are the LIVE column widths read
 * from `information_schema.columns` (2026-08-29), which is why they are stated
 * per entity instead of a shared constant: this one batch spans varchar(50),
 * varchar(100) (`manufacturers`) and varchar(400) (`delivery_zones`, `fsc_types`).
 *
 * `seeded` is a real row taken from `traffic_production` — the Risk 2 guard: an
 * edit schema stricter than the data blocks users from saving a row they never
 * touched.
 */
interface Entity {
  name: string;
  create: Factory;
  edit: Factory;
  /** Absent on `customer_categories` and on `color_types` (no `code` column). */
  codeMax?: number;
  /** Absent on the code+description tables. */
  nameMax?: number;
  /** Absent on `box_types`, `manufacturers`, `product_types`. */
  hasDescription: boolean;
  codeLabel?: string;
  nameLabel?: string;
  seeded: Record<string, string>;
}

const ENTITIES: Entity[] = [
  {
    name: 'boxType',
    create: createBoxTypeSchema,
    edit: editBoxTypeSchema,
    codeMax: 50,
    nameMax: 255,
    hasDescription: false,
    codeLabel: 'Código',
    nameLabel: 'Nombre',
    seeded: { code: 'QD-TCJ-001', name: 'FEFCO 0201 base' },
  },
  {
    name: 'colorType',
    create: createColorTypeSchema,
    edit: editColorTypeSchema,
    nameMax: 255,
    hasDescription: true,
    nameLabel: 'Nombre',
    seeded: {
      name: 'Flexográfica proceso',
      description: 'Familia de tintas flexográfica proceso',
    },
  },
  {
    name: 'complement',
    create: createComplementSchema,
    edit: editComplementSchema,
    codeMax: 50,
    hasDescription: true,
    codeLabel: 'Código',
    seeded: { code: 'QD-CMP-001', description: 'Manija troquelada' },
  },
  {
    name: 'corrugationClass',
    create: createCorrugationClassSchema,
    edit: editCorrugationClassSchema,
    codeMax: 50,
    hasDescription: true,
    codeLabel: 'Código',
    seeded: { code: 'QD-CLC-001', description: 'Simple liviana' },
  },
  {
    name: 'customerCategory',
    create: createCustomerCategorySchema,
    edit: editCustomerCategorySchema,
    // 100, NOT the column's 255: the stricter UI cap is kept (sign-off #2).
    nameMax: 100,
    hasDescription: false,
    nameLabel: 'Nombre de Categoría',
    seeded: { name: 'Alimenticia A' },
  },
  {
    name: 'deliveryZone',
    create: createDeliveryZoneSchema,
    edit: editDeliveryZoneSchema,
    codeMax: 400,
    hasDescription: true,
    codeLabel: 'Código',
    seeded: { code: 'QD-ZON-001', description: 'Zona Rosario' },
  },
  {
    name: 'flapType',
    create: createFlapTypeSchema,
    edit: editFlapTypeSchema,
    codeMax: 50,
    hasDescription: true,
    codeLabel: 'Código',
    seeded: { code: 'QD-SOL-001', description: 'Solapa simple' },
  },
  {
    name: 'fscType',
    create: createFscTypeSchema,
    edit: editFscTypeSchema,
    codeMax: 400,
    hasDescription: true,
    codeLabel: 'Código',
    seeded: { code: 'QD-FSC-001', description: 'FSC 100% credit' },
  },
  {
    name: 'glueType',
    create: createGlueTypeSchema,
    edit: editGlueTypeSchema,
    codeMax: 50,
    hasDescription: true,
    codeLabel: 'Código',
    seeded: { code: 'QD-PEG-001', description: 'Adhesivo vinílico' },
  },
  {
    name: 'manufacturer',
    create: createManufacturerSchema,
    edit: editManufacturerSchema,
    // varchar(100) — the third distinct code width inside this one batch.
    codeMax: 100,
    nameMax: 255,
    hasDescription: false,
    codeLabel: 'Código',
    nameLabel: 'Nombre',
    seeded: { code: 'QD-FAB-001', name: 'Papelera del Litoral' },
  },
  {
    name: 'paperType',
    create: createPaperTypeSchema,
    edit: editPaperTypeSchema,
    codeMax: 50,
    hasDescription: true,
    codeLabel: 'Código',
    seeded: { code: 'QD-PAP-001', description: 'Kraft Virgen' },
  },
  {
    name: 'productType',
    create: createProductTypeSchema,
    edit: editProductTypeSchema,
    codeMax: 50,
    nameMax: 255,
    hasDescription: false,
    codeLabel: 'Código',
    nameLabel: 'Nombre',
    seeded: { code: 'QD-TPR-001', name: 'Caja regular' },
  },
  {
    name: 'strappingType',
    create: createStrappingTypeSchema,
    edit: editStrappingTypeSchema,
    codeMax: 50,
    hasDescription: true,
    codeLabel: 'Código',
    seeded: { code: 'QD-FLJ-001', description: 'Fleje polipropileno' },
  },
  {
    name: 'traceType',
    create: createTraceTypeSchema,
    edit: editTraceTypeSchema,
    codeMax: 50,
    hasDescription: true,
    codeLabel: 'Código',
    seeded: { code: 'QD-HEN-001', description: 'Hendido simple' },
  },
];

/** Every issue a rejected payload produced, as `{ field, message }`. */
const issues = (schema: Schema, value: unknown) => {
  const result = schema.safeParse(value) as {
    success: boolean;
    error?: { issues: Array<{ path: Array<string | number>; message: string }> };
  };
  if (result.success) throw new Error('expected the payload to be rejected');
  return (result.error as NonNullable<typeof result.error>).issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
};

const parse = (schema: Schema, value: unknown): Record<string, unknown> => {
  const result = schema.safeParse(value) as {
    success: boolean;
    data?: Record<string, unknown>;
    error?: { issues: Array<{ path: unknown[]; message: string }> };
  };
  if (!result.success) {
    throw new Error(
      'expected the payload to be accepted, got: ' +
        JSON.stringify(result.error?.issues)
    );
  }
  return result.data as Record<string, unknown>;
};

describe('B2 lookup schemas', () => {
  it('covers all 14 entities the sign-off left in the batch', () => {
    // company and paperClass were moved to B7 as bespoke; if either comes back
    // here without its DualListSelector / branding work, this count is the
    // reminder.
    expect(ENTITIES).toHaveLength(14);
  });

  ENTITIES.forEach((entity) => {
    describe(entity.name, () => {
      const create = () => entity.create(t);
      const edit = () => entity.edit(t);

      it('accepts a real seeded row through the EDIT schema, unchanged (Risk 2)', () => {
        expect(parse(edit(), entity.seeded)).toEqual(entity.seeded);
      });

      it('accepts the same row through the CREATE schema', () => {
        expect(parse(create(), entity.seeded)).toEqual(entity.seeded);
      });

      it('trims surrounding whitespace instead of storing it', () => {
        const padded = Object.fromEntries(
          Object.entries(entity.seeded).map(([key, value]) => [key, `  ${value}  `])
        );
        expect(parse(create(), padded)).toEqual(entity.seeded);
      });

      if (entity.codeMax !== undefined) {
        it(`requires the code in Spanish`, () => {
          expect(issues(create(), { ...entity.seeded, code: '   ' })).toEqual([
            { field: 'code', message: `${entity.codeLabel} es obligatorio` },
          ]);
        });

        it(`bounds the code by the live varchar(${entity.codeMax})`, () => {
          const max = entity.codeMax as number;
          expect(
            parse(create(), { ...entity.seeded, code: 'x'.repeat(max) }).code
          ).toHaveLength(max);
          expect(
            issues(create(), { ...entity.seeded, code: 'x'.repeat(max + 1) })
          ).toEqual([
            {
              field: 'code',
              message: `${entity.codeLabel} no puede superar los ${max} caracteres`,
            },
          ]);
        });

        it('rejects a code outside the identifier character set', () => {
          expect(issues(create(), { ...entity.seeded, code: 'A+B' })).toEqual([
            { field: 'code', message: `${entity.codeLabel} tiene un formato inválido` },
          ]);
        });

        it('refuses to blank the code on EDIT as well', () => {
          expect(edit().safeParse({ ...entity.seeded, code: '' }).success).toBe(false);
        });
      }

      if (entity.nameMax !== undefined) {
        it('requires the name in Spanish', () => {
          expect(issues(create(), { ...entity.seeded, name: '   ' })).toEqual(
            expect.arrayContaining([
              { field: 'name', message: `${entity.nameLabel} es obligatorio` },
            ])
          );
        });

        it(`caps the name at ${entity.nameMax}`, () => {
          const max = entity.nameMax as number;
          expect(
            parse(create(), { ...entity.seeded, name: 'x'.repeat(max) }).name
          ).toHaveLength(max);
          expect(
            issues(create(), { ...entity.seeded, name: 'x'.repeat(max + 1) })
          ).toEqual([
            {
              field: 'name',
              message: `${entity.nameLabel} no puede superar los ${max} caracteres`,
            },
          ]);
        });

        it('refuses to blank the name on EDIT as well', () => {
          expect(edit().safeParse({ ...entity.seeded, name: '' }).success).toBe(false);
        });
      }

      if (entity.hasDescription) {
        it('leaves the description optional and clearable', () => {
          const { description, ...rest } = entity.seeded;
          expect(parse(create(), rest).description).toBeUndefined();
          // '' stays '' so an existing description can be CLEARED; collapsing
          // it to undefined would make the update payload drop the key.
          expect(parse(create(), { ...rest, description: '' }).description).toBe('');
        });

        it('caps the description at the 10000-char text convention', () => {
          expect(
            issues(create(), { ...entity.seeded, description: 'x'.repeat(10001) })
          ).toEqual([
            {
              field: 'description',
              message: 'Descripción no puede superar los 10000 caracteres',
            },
          ]);
        });
      } else {
        it('has no description field, because the table has no such column', () => {
          expect(
            parse(create(), { ...entity.seeded, description: 'ignored' })
          ).not.toHaveProperty('description');
        });
      }
    });
  });
});

/**
 * The per-entity facts the generic loop above cannot express. Each one is a
 * decision from the signed-off rule table, so a future "let's just template it"
 * pass has to break a named test rather than a comment.
 */
describe('B2 sign-off decisions that resist templating', () => {
  it('keeps deliveryZone.code required even though the column is NULLABLE', () => {
    // Sign-off #1: 0 of 46 rows lack a code and the form never allowed one, so
    // "the migration wins" does NOT apply to required-ness.
    expect(issues(createDeliveryZoneSchema(t), { description: 'Zona Rosario' })).toEqual([
      { field: 'code', message: 'Código es obligatorio' },
    ]);
  });

  it('keeps fscType.code required even though the column is NULLABLE', () => {
    expect(issues(createFscTypeSchema(t), { description: 'FSC 100% credit' })).toEqual([
      { field: 'code', message: 'Código es obligatorio' },
    ]);
  });

  it('gives deliveryZone and fscType the varchar(400) bound, not 50', () => {
    const code = 'x'.repeat(400);
    expect(parse(createDeliveryZoneSchema(t), { code }).code).toHaveLength(400);
    expect(parse(createFscTypeSchema(t), { code }).code).toHaveLength(400);
  });

  it('gives manufacturer the varchar(100) bound — a shared 50 would be wrong', () => {
    const code = 'x'.repeat(51);
    expect(
      parse(createManufacturerSchema(t), { code, name: 'Papelera del Litoral' }).code
    ).toHaveLength(51);
    expect(
      issues(createManufacturerSchema(t), { code: 'x'.repeat(101), name: 'x' })
    ).toEqual([
      { field: 'code', message: 'Código no puede superar los 100 caracteres' },
    ]);
  });

  it('gives colorType no code field at all', () => {
    expect(parse(createColorTypeSchema(t), { name: 'UV Pantone', code: 'X' })).toEqual({
      name: 'UV Pantone',
    });
  });

  it('keeps customerCategory at the stricter UI cap of 100, not the column 255', () => {
    // Sign-off #2: the column width is the ceiling, not the target.
    expect(
      issues(createCustomerCategorySchema(t), { name: 'x'.repeat(101) })
    ).toEqual([
      {
        field: 'name',
        message: 'Nombre de Categoría no puede superar los 100 caracteres',
      },
    ]);
  });

  it('keeps customerCategory minLength 2 and does not spread it elsewhere', () => {
    // Sign-off #3: a UI-only convention, kept where it exists, added nowhere.
    expect(issues(createCustomerCategorySchema(t), { name: 'A' })).toEqual([
      {
        field: 'name',
        message: 'Nombre de Categoría debe tener al menos 2 caracteres',
      },
    ]);
    expect(createBoxTypeSchema(t).safeParse({ code: 'A', name: 'B' }).success).toBe(true);
    expect(
      createColorTypeSchema(t).safeParse({ name: 'B' }).success
    ).toBe(true);
  });
});
