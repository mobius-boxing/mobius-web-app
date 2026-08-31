import fs from 'fs';
import path from 'path';

/**
 * Grep invariant for the schema rollout.
 *
 * SCOPE (L-019): this list is the batches COMPLETED so far, never the whole
 * modals directory. A sweep over untouched files would fail on work that has
 * not started yet, which makes the guard the defect rather than the code. Add
 * a batch's files here as that batch lands.
 */
/** B2's 14 entities (company + paperClass were moved to B7 by the sign-off). */
const B2_ENTITIES = [
  'BoxType',
  'ColorType',
  'Complement',
  'CorrugationClass',
  'CustomerCategory',
  'DeliveryZone',
  'FlapType',
  'FscType',
  'GlueType',
  'Manufacturer',
  'PaperType',
  'ProductType',
  'StrappingType',
  'TraceType',
];

/**
 * B3's 3 entities. `role` was moved to B7 by the sign-off (10 of its 62 live
 * rows carry a `profileType` neither the dropdown nor the server allows), so it
 * is deliberately NOT listed here — this is an explicit list, never a glob.
 */
const B3_ENTITIES = ['ConsumableType', 'ToolingType', 'Warehouse'];

/**
 * B4's 6 entities — the numeric-heavy lookups. `palletType` and `machineType`
 * keep their DTOs inside shared index files (`palletization/`, `machine/`),
 * which changes nothing here: this list is about the MODALS.
 */
const B4_ENTITIES = [
  'Color',
  'Corrugation',
  'FinishedGood',
  'MachineType',
  'PalletType',
  'Supplier',
];

/** B5's 8 entities — stock and supply. */
const B5_ENTITIES = [
  'ConsumableStock',
  'ConsumableSupply',
  'PaperSheet',
  'PaperStock',
  'PaperSupply',
  'SheetStock',
  'Tooling',
  'ToolingStock',
];

const MIGRATED_FILES = [
  // B1 — FluteType pilot
  'src/components/modals/CreateFluteTypeModal.tsx',
  'src/components/modals/EditFluteTypeModal.tsx',
  // B2 — trivial lookup ABMs, 14 entities x Create/Edit
  ...B2_ENTITIES.flatMap((entity) => [
    `src/components/modals/Create${entity}Modal.tsx`,
    `src/components/modals/Edit${entity}Modal.tsx`,
  ]),
  // B3 — 3-4 field lookups, 3 entities x Create/Edit
  ...B3_ENTITIES.flatMap((entity) => [
    `src/components/modals/Create${entity}Modal.tsx`,
    `src/components/modals/Edit${entity}Modal.tsx`,
  ]),
  // B4 — numeric-heavy lookups, 6 entities x Create/Edit
  ...B4_ENTITIES.flatMap((entity) => [
    `src/components/modals/Create${entity}Modal.tsx`,
    `src/components/modals/Edit${entity}Modal.tsx`,
  ]),
  // B5 — stock and supply, 8 entities x Create/Edit
  ...B5_ENTITIES.flatMap((entity) => [
    `src/components/modals/Create${entity}Modal.tsx`,
    `src/components/modals/Edit${entity}Modal.tsx`,
  ]),
  // B6 — users and auth. Not Create/Edit pairs, so listed individually; the
  // three auth PAGES use `useForm` + `zodResolver` directly rather than
  // `useModalForm`, so they are checked by the separate assertion below.
  'src/components/modals/EditUserModal.tsx',
  'src/components/modals/InviteUserModal.tsx',
  // B7 — the entities earlier batches deferred here, plus the two shared field
  // components that own Customer's and Palletization's inputs (the modals
  // themselves register nothing, so sweeping only modals would pass vacuously).
  ...['Company', 'PaperClass', 'Palletization', 'Role'].flatMap((entity) => [
    `src/components/modals/Create${entity}Modal.tsx`,
    `src/components/modals/Edit${entity}Modal.tsx`,
  ]),
  'src/components/modals/CreateCustomerModal.tsx',
  'src/components/modals/EditCustomerModal.tsx',
  'src/components/modals/MachineModals.tsx',
  // B8
  'src/components/modals/CreateProductModal.tsx',
  'src/components/modals/EditProductModal.tsx',
];

/**
 * Files that hold registered inputs but no `useModalForm` call of their own:
 * the shared field components, which is where Customer's and Palletization's
 * rules actually lived. They get the no-inline-rules half of the invariant.
 */
const MIGRATED_FIELD_COMPONENTS = [
  'src/components/forms/CustomerForm.tsx',
  'src/components/forms/PalletizationFormFields.tsx',
];

/**
 * Pattern B: forms whose state is `useState`, so they call the schema through
 * `firstIssue` in their submit handler rather than through a resolver.
 */
const PATTERN_B_FILES = [
  'src/components/modals/ModelFormModal.tsx',
  'src/components/modals/RouteFormModal.tsx',
  'src/components/modals/WarehouseGridEditorModal.tsx',
  'src/components/modals/PartFormModal.tsx',
];

/** B6's auth pages: same "no inline rules" invariant, different wiring. */
const MIGRATED_PAGES = [
  'src/pages/Login.tsx',
  'src/pages/ForgotPassword.tsx',
  'src/pages/ResetPassword.tsx',
];

const read = (relative: string): string =>
  fs.readFileSync(path.join(process.cwd(), relative), 'utf8');

/** `register('code', { required: ... })` — a rule object as the 2nd argument. */
const INLINE_RULE = /register\(\s*['"][^'"]+['"]\s*,\s*\{/;

/** The 6 files that hardcoded English validation copy; 2 of them are B1's. */
const HARDCODED_ENGLISH = /(is required|must be at least|must be less than|must be a valid)/;

describe('migrated modals declare a schema instead of inline rules', () => {
  MIGRATED_FILES.forEach((file) => {
    describe(file, () => {
      const source = read(file);

      it('passes a schema to useModalForm', () => {
        expect(source).toMatch(/schema:\s*\w+Schema\(t\)/);
      });

      it('has no inline register() rule objects left', () => {
        expect(INLINE_RULE.test(source)).toBe(false);
      });

      it('has no hardcoded English validation copy left', () => {
        expect(HARDCODED_ENGLISH.test(source)).toBe(false);
      });

      it('no longer hand-rolls Number() coercion in the submit handler', () => {
        // The coercion block turned an empty numeric input into NaN; the
        // schema replaces it.
        expect(source).not.toMatch(/\?\s*Number\(data\./);
      });
    });
  });
});

describe('migrated auth pages resolve through a schema', () => {
  MIGRATED_PAGES.forEach((file) => {
    describe(file, () => {
      const source = read(file);

      it('passes a schema to zodResolver', () => {
        expect(source).toMatch(/zodResolver\(\w+Schema\(t\)/);
      });

      it('has no inline register() rule objects left', () => {
        expect(INLINE_RULE.test(source)).toBe(false);
      });
    });
  });
});

describe('shared field components carry no inline rules', () => {
  MIGRATED_FIELD_COMPONENTS.forEach((file) => {
    it(`${file} has no inline register() rule objects left`, () => {
      expect(INLINE_RULE.test(read(file))).toBe(false);
    });
  });
});

describe('pattern-B forms validate through a schema', () => {
  PATTERN_B_FILES.forEach((file) => {
    const source = read(file);

    it(`${file} calls firstIssue with a schema`, () => {
      expect(source).toMatch(/firstIssue\(\w+Schema\(t\)/);
    });

    it(`${file} has no inline register() rule objects left`, () => {
      expect(INLINE_RULE.test(source)).toBe(false);
    });
  });
});

/**
 * `pages/SalesOrderForm.tsx` is B8's non-modal form: react-hook-form, but wired
 * with `zodResolver` directly like the auth pages.
 */
describe('SalesOrderForm resolves through its schema', () => {
  const source = read('src/pages/SalesOrderForm.tsx');

  /**
   * Matches across the line break: this schema takes `(t, { isEdit, orderType })`
   * because the required fields differ between the producto and parte paths, so
   * the call does not fit the one-argument shape the other pages use.
   */
  it('passes salesOrderSchema to zodResolver', () => {
    expect(source).toMatch(/zodResolver\(\s*salesOrderSchema\(t,/);
  });

  it('has no inline register() rule objects left', () => {
    expect(INLINE_RULE.test(source)).toBe(false);
  });
});
