import i18n from '../../i18n/config';
import {
  boolean,
  code,
  dateDDMMYYYY,
  email,
  money,
  nonNegativeNumber,
  optionalSelect,
  optionalText,
  positiveInt,
  requiredSelect,
  requiredText,
  Translate,
} from '../../validation/fields';
import type { ZodType } from 'zod';

/**
 * The real i18n instance on purpose (lng: 'es'): these assertions double as the
 * guard that every `validation.*` key the primitives reference actually exists.
 * i18next echoes the key back when it is missing, so a typo shows up as
 * "validation.required" in the expected string.
 */
const t = i18n.t.bind(i18n) as unknown as Translate;

const firstError = (schema: ZodType<unknown>, value: unknown): string => {
  const result = schema.safeParse(value);
  if (result.success) throw new Error('expected the value to be rejected');
  return result.error.issues[0].message;
};

const accept = <T,>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `expected the value to be accepted, got: ${result.error.issues[0].message}`
    );
  }
  return result.data;
};

describe('validation/fields — text', () => {
  it('trims and accepts a value at the column limit', () => {
    expect(accept(requiredText(t, 'Código', 2), '  AB  ')).toBe('AB');
  });

  it('rejects blank required text in Spanish', () => {
    expect(firstError(requiredText(t, 'Código', 50), '   ')).toBe(
      'Código es obligatorio'
    );
  });

  it('rejects text longer than the column limit', () => {
    expect(firstError(requiredText(t, 'Código', 50), 'x'.repeat(51))).toBe(
      'Código no puede superar los 50 caracteres'
    );
  });

  it('keeps an empty optional text as "" so the field stays clearable', () => {
    // Update payloads drop undefined keys; collapsing '' to undefined would
    // make an optional field impossible to clear once set.
    expect(accept(optionalText(t, 'Descripción', 10), '')).toBe('');
    expect(accept(optionalText(t, 'Descripción', 10), undefined)).toBeUndefined();
  });

  it('bounds a code by the real column length and its character set', () => {
    expect(accept(code(t, 50, 'Código'), 'QD-ONDA-B01')).toBe('QD-ONDA-B01');
    expect(firstError(code(t, 50, 'Código'), 'onda#1')).toBe(
      'Código tiene un formato inválido'
    );
  });

  it('defaults a code label to the shared translation', () => {
    expect(firstError(code(t, 50), '')).toBe('Código es obligatorio');
  });
});

describe('validation/fields — numbers', () => {
  const largo = () =>
    nonNegativeNumber(t, 'Largo', { max: 999999.99, decimals: 2 });

  it('turns an empty number input into undefined, never NaN', () => {
    // <input type="number"> emits '' when empty. Number('') is 0 and
    // parseFloat('') is NaN — both used to reach the API.
    const parsed = accept(largo(), '');
    expect(parsed).toBeUndefined();
    expect(Number.isNaN(parsed as unknown as number)).toBe(false);
  });

  it('coerces a numeric string to a number', () => {
    expect(accept(largo(), '12.5')).toBe(12.5);
    expect(accept(largo(), 999999.99)).toBe(999999.99);
  });

  it('rejects a non-numeric value with the type message', () => {
    expect(firstError(largo(), 'abc')).toBe('Largo debe ser un número');
  });

  it('rejects negatives, over-maximum values and excess decimals', () => {
    expect(firstError(largo(), '-1')).toBe('Largo no puede ser menor que 0');
    expect(firstError(largo(), '1000000')).toBe(
      'Largo no puede ser mayor que 999999.99'
    );
    expect(firstError(largo(), '1.005')).toBe(
      'Largo admite como máximo 2 decimales'
    );
  });

  it('demands a value only when the column is notNullable', () => {
    const required = nonNegativeNumber(t, 'Cantidad', { required: true });
    expect(firstError(required, '')).toBe('Cantidad es obligatorio');
    expect(accept(required, '4')).toBe(4);
  });

  it('rejects fractions on an integer column', () => {
    expect(firstError(positiveInt(t, 'Cantidad'), '1.5')).toBe(
      'Cantidad debe ser un número entero'
    );
    expect(accept(positiveInt(t, 'Cantidad'), '7')).toBe(7);
    expect(accept(positiveInt(t, 'Cantidad'), '')).toBeUndefined();
  });

  it('defaults money to two decimals', () => {
    expect(firstError(money(t, 'Precio'), '1.234')).toBe(
      'Precio admite como máximo 2 decimales'
    );
    expect(accept(money(t, 'Precio'), '1.23')).toBe(1.23);
  });
});

describe('validation/fields — selects, booleans, email and dates', () => {
  it('requires a selection with the select-specific message', () => {
    expect(firstError(requiredSelect(t, 'Almacén'), '')).toBe(
      'Seleccione Almacén'
    );
    expect(accept(optionalSelect(), '')).toBe('');
  });

  it('never reads an unanswered checkbox as false', () => {
    expect(accept(boolean(), '')).toBeUndefined();
    expect(accept(boolean(), 'true')).toBe(true);
    expect(accept(boolean(), false)).toBe(false);
  });

  it('validates email through the existing login messages', () => {
    expect(accept(email(t), ' user@example.com ')).toBe('user@example.com');
    expect(firstError(email(t), 'nope')).toBe(
      'Por favor ingresa un correo electrónico válido'
    );
  });

  it('accepts DD/MM/YYYY and ISO, always emitting ISO', () => {
    const schema = dateDDMMYYYY(t, 'Fecha');
    expect(accept(schema, '05/02/2026')).toBe('2026-02-05');
    expect(accept(schema, '2026-02-05')).toBe('2026-02-05');
  });

  it('rejects an impossible calendar date instead of rolling it over', () => {
    const schema = dateDDMMYYYY(t, 'Fecha');
    expect(firstError(schema, '31/02/2026')).toBe('Fecha no es una fecha válida');
    expect(firstError(schema, '')).toBe('Fecha es obligatorio');
  });
});
