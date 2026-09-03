import en from '../../i18n/locales/en/common.json';
import es from '../../i18n/locales/es/common.json';

/**
 * The i18n sweep guard. `es` is the shipped language and `en` the fallback, so
 * a key added to one file and forgotten in the other renders as the raw key id
 * in the UI — a defect no type checker or build catches. Both files are at full
 * parity today; this test is what keeps them there while ~200 forms migrate to
 * the shared `validation.*` namespace.
 */
const flatten = (value: unknown, prefix = ''): string[] => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key)
  );
};

describe('i18n locale parity', () => {
  const enKeys = flatten(en);
  const esKeys = flatten(es);

  it('has no key present in en but missing from es', () => {
    expect(enKeys.filter((key) => !esKeys.includes(key))).toEqual([]);
  });

  it('has no key present in es but missing from en', () => {
    expect(esKeys.filter((key) => !enKeys.includes(key))).toEqual([]);
  });

  it('ships the shared validation namespace in both languages', () => {
    const required = [
      'validation.required',
      'validation.maxLength',
      'validation.mustBeNumber',
      'validation.min',
      'validation.max',
      'validation.decimals',
      'validation.integer',
      'validation.invalidFormat',
      'validation.invalidDate',
      'validation.selectRequired',
      'validation.fields.code',
    ];

    expect(required.filter((key) => !enKeys.includes(key))).toEqual([]);
    expect(required.filter((key) => !esKeys.includes(key))).toEqual([]);
  });

  it('keeps the validation messages parameterised rather than per-entity', () => {
    // ~12 parameterised keys replace 127 duplicated entity-specific ones; a
    // message that stopped interpolating {{field}} would silently read as a
    // sentence fragment.
    expect(es.validation.required).toContain('{{field}}');
    expect(es.validation.maxLength).toContain('{{max}}');
    expect(es.validation.decimals).toContain('{{decimals}}');
    expect(en.validation.required).toContain('{{field}}');
  });

  it('labels every audited table, in both languages', () => {
    // The API audits 74 tables and returns `entityName` as the raw table name;
    // labelling is entirely the SPA's job. Parity alone would not catch this:
    // a table added to the API with no key here appears in the Auditoría filter
    // and in every history headline as `audit.entities.paper_class_papers`,
    // in both languages equally, with every existing test green.
    //
    // If this count changes, the API's audited-table set changed. Add the
    // label — do not just bump the number.
    const AUDITED_TABLES = 74;

    expect(Object.keys(es.audit.entities)).toHaveLength(AUDITED_TABLES);
    expect(Object.keys(en.audit.entities)).toHaveLength(AUDITED_TABLES);
    expect(
      Object.values(es.audit.entities).filter((label) => /_/.test(String(label))),
    ).toEqual([]);
  });
});
