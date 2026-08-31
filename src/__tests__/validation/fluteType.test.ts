import i18n from '../../i18n/config';
import {
  createFluteTypeSchema,
  editFluteTypeSchema,
} from '../../validation/schemas/fluteType';
import type { Translate } from '../../validation/fields';

const t = i18n.t.bind(i18n) as unknown as Translate;

/** What the DOM actually hands react-hook-form: strings, `''` when empty. */
const formValues = (overrides: Record<string, unknown> = {}) => ({
  code: 'QD-ONDA-B01',
  description: 'Onda B',
  fluteFactor: '1.36',
  length: '1.44',
  width: '1.49',
  height: '1.51',
  ...overrides,
});

const reject = (schema: ReturnType<typeof createFluteTypeSchema>, value: unknown) => {
  const result = schema.safeParse(value);
  if (result.success) throw new Error('expected the payload to be rejected');
  return result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
};

describe('createFluteTypeSchema', () => {
  it('coerces every numeric string and keeps the payload shape', () => {
    const parsed = createFluteTypeSchema(t).parse(formValues());

    expect(parsed).toEqual({
      code: 'QD-ONDA-B01',
      description: 'Onda B',
      fluteFactor: 1.36,
      length: 1.44,
      width: 1.49,
      height: 1.51,
    });
  });

  it('turns the empty numeric inputs into undefined, never NaN', () => {
    // Before: `data.x ? Number(data.x) : undefined` in the modal, and
    // `parseFloat("")` -> NaN in the DTO. This is the bug the schema closes.
    const parsed = createFluteTypeSchema(t).parse(
      formValues({ fluteFactor: '', length: '', width: '', height: '' })
    );

    expect(parsed.fluteFactor).toBeUndefined();
    expect(parsed.length).toBeUndefined();
    expect(Number.isNaN(parsed.width as unknown as number)).toBe(false);
    expect(Number.isNaN(parsed.height as unknown as number)).toBe(false);
  });

  it('requires the code in Spanish, because the column is notNullable', () => {
    expect(reject(createFluteTypeSchema(t), formValues({ code: '   ' }))).toEqual([
      { field: 'code', message: 'Código es obligatorio' },
    ]);
  });

  it('bounds the code by the real varchar(50), not the inline 50 guess', () => {
    expect(
      createFluteTypeSchema(t).parse(formValues({ code: 'x'.repeat(50) })).code
    ).toHaveLength(50);
    expect(
      reject(createFluteTypeSchema(t), formValues({ code: 'x'.repeat(51) }))
    ).toEqual([
      { field: 'code', message: 'Código no puede superar los 50 caracteres' },
    ]);
  });

  it('enforces the numeric(8,2) shape on every measure', () => {
    expect(reject(createFluteTypeSchema(t), formValues({ length: 'abc' }))).toEqual([
      { field: 'length', message: 'Largo debe ser un número' },
    ]);
    expect(reject(createFluteTypeSchema(t), formValues({ width: '-1' }))).toEqual([
      { field: 'width', message: 'Ancho no puede ser menor que 0' },
    ]);
    expect(reject(createFluteTypeSchema(t), formValues({ height: '1000000' }))).toEqual([
      { field: 'height', message: 'Alto no puede ser mayor que 999999.99' },
    ]);
    expect(
      reject(createFluteTypeSchema(t), formValues({ fluteFactor: '1.005' }))
    ).toEqual([
      { field: 'fluteFactor', message: 'Factor de Onda admite como máximo 2 decimales' },
    ]);
  });

  it('reports every bad field at once', () => {
    const issues = reject(
      createFluteTypeSchema(t),
      formValues({ code: '', length: 'abc' })
    );

    expect(issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['code', 'length'])
    );
  });
});

describe('editFluteTypeSchema', () => {
  it('saves a real seeded row unchanged (Risk 2)', () => {
    // An edit schema stricter than create blocks users from saving a row they
    // never touched. These are values that exist in flute_types today.
    const parsed = editFluteTypeSchema(t).parse({
      code: 'QD-ONDA-EB06',
      description: 'Onda EB — paso 6.1 mm',
      fluteFactor: '1.34',
      length: '1.53',
      width: '1.50',
      height: '4.78',
    });

    expect(parsed).toEqual({
      code: 'QD-ONDA-EB06',
      description: 'Onda EB — paso 6.1 mm',
      fluteFactor: 1.34,
      length: 1.53,
      width: 1.5,
      height: 4.78,
    });
  });

  it('accepts a payload carrying only the code', () => {
    expect(editFluteTypeSchema(t).parse({ code: 'QD-ONDA-B01' })).toEqual({
      code: 'QD-ONDA-B01',
    });
  });

  it('still refuses to blank the notNullable code', () => {
    const result = editFluteTypeSchema(t).safeParse({ code: '' });

    expect(result.success).toBe(false);
  });
});
