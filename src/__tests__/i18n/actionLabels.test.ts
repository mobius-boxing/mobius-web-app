import fs from 'fs';
import path from 'path';
import en from '../../i18n/locales/en/common.json';
import es from '../../i18n/locales/es/common.json';

/**
 * SCOPE (L-019): the grid-action-tooltips file set — the 40 pages with a
 * `key: 'actions'` column, the 3 grid components that render their own
 * icon-only actions, and (round 2) the 6 non-grid row-action surfaces the
 * fix brief converted. Not a sweep of every `.tsx` file: a page added later
 * with a plain native `<button title=…>` (e.g. a non-grid icon) is a
 * different feature's scope, not a regression of this one.
 */
const PAGES_DIR = path.resolve(__dirname, '../../pages');
const TARGET_FILES = [
  ...fs
    .readdirSync(PAGES_DIR)
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => path.join(PAGES_DIR, name))
    .filter((file) => /key:\s*'actions'/.test(fs.readFileSync(file, 'utf8'))),
  path.resolve(__dirname, '../../components/sales-orders/SalesOrdersGrid.tsx'),
  path.resolve(__dirname, '../../components/production-orders/ProductionOrdersGrid.tsx'),
  path.resolve(__dirname, '../../components/audit/HistoryButton.tsx'),
  path.resolve(__dirname, '../../components/sales-orders/SalesOrderLifecycleQuickActions.tsx'),
  path.resolve(__dirname, '../../components/forms/DeliveryLocationsSection.tsx'),
  path.resolve(__dirname, '../../components/forms/CorrugationLayersEditor.tsx'),
  path.resolve(__dirname, '../../components/modals/ModelFormModal.tsx'),
  path.resolve(__dirname, '../../components/modals/RouteFormModal.tsx'),
  path.resolve(__dirname, '../../components/production-orders/GenerateOrdersDialog.tsx'),
];

const findActionButtonBlocks = (src: string): string[] => {
  const blocks: string[] = [];
  const openTag = '<ActionButton';
  const closeTag = '</ActionButton>';
  let idx = 0;
  while (true) {
    const start = src.indexOf(openTag, idx);
    if (start === -1) break;
    const end = src.indexOf(closeTag, start);
    if (end === -1) break;
    blocks.push(src.slice(start, end + closeTag.length));
    idx = end + closeTag.length;
  }
  return blocks;
};

/**
 * Some labels are a ternary/conditional picking between two or more `t()`
 * calls (e.g. the fulfill/void quick actions' cancel-vs-action wording) —
 * every branch must resolve, not just the first one a single-match regex
 * would find (that would leave a broken second branch green, L-018).
 */
const extractLabelKeys = (block: string, fileSrc: string): string[] => {
  const labelMatch = block.match(/label=\{([^]*?)\}\n/) ?? block.match(/label=\{(.*?)\}/);
  if (!labelMatch) throw new Error(`ActionButton without a label prop: ${block.slice(0, 80)}`);
  const raw = labelMatch[1].trim();

  const directCalls = Array.from(raw.matchAll(/t\('([^']+)'\)/g)).map((m) => m[1]);
  if (directCalls.length > 0) return directCalls;

  const constMatch = fileSrc.match(new RegExp(`const ${raw} = t\\('([^']+)'\\)`));
  if (constMatch) return [constMatch[1]];

  throw new Error(`Could not resolve label expression "${raw}" to a t() key`);
};

/** Only `common` is registered as a namespace (i18n/config.ts), so an
 * explicit `common:` prefix on a key (e.g. `DeliveryLocationsSection`'s
 * `t('common:customerModal.editLocation')`) is the same lookup as the bare
 * key — strip it before walking the JSON. */
const NS_PREFIX = 'common:';
const resolveKey = (obj: unknown, key: string): unknown => {
  const bare = key.startsWith(NS_PREFIX) ? key.slice(NS_PREFIX.length) : key;
  return bare.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
};

describe('grid action buttons: no title=, every label resolves (AC-4, AC-5)', () => {
  const filesAndSources = TARGET_FILES.map((file) => ({
    file,
    src: fs.readFileSync(file, 'utf8'),
  }));

  it('found the expected 49 grid-action-tooltips files', () => {
    expect(filesAndSources).toHaveLength(49);
  });

  it.each(filesAndSources)('$file has no title= on an ActionButton', ({ file, src }) => {
    const blocks = findActionButtonBlocks(src);
    expect(blocks.length).toBeGreaterThan(0);
    blocks.forEach((block) => {
      expect(block).not.toMatch(/title=/);
    });
  });

  const allKeys = new Set<string>();
  filesAndSources.forEach(({ file, src }) => {
    findActionButtonBlocks(src).forEach((block) => {
      extractLabelKeys(block, src).forEach((key) => allKeys.add(key));
    });
  });

  it('collected at least one label key per file', () => {
    expect(allKeys.size).toBeGreaterThan(0);
  });

  it.each(Array.from(allKeys))('"%s" resolves in en/common.json', (key) => {
    expect(resolveKey(en, key)).toEqual(expect.any(String));
  });

  it.each(Array.from(allKeys))('"%s" resolves in es/common.json', (key) => {
    expect(resolveKey(es, key)).toEqual(expect.any(String));
  });
});
