import fs from 'fs';
import path from 'path';
import en from '../../i18n/locales/en/common.json';
import es from '../../i18n/locales/es/common.json';

/**
 * SCOPE (L-019): the grid-action-tooltips file set — the 40 pages with a
 * `key: 'actions'` column plus the 3 grid components that render their own
 * icon-only actions. Not a sweep of every `.tsx` file: a page added later
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

const extractLabelKey = (block: string, fileSrc: string): string => {
  const labelMatch = block.match(/label=\{([^]*?)\}\n/) ?? block.match(/label=\{(.*?)\}/);
  if (!labelMatch) throw new Error(`ActionButton without a label prop: ${block.slice(0, 80)}`);
  const raw = labelMatch[1].trim();

  const directCall = raw.match(/t\('([^']+)'\)/);
  if (directCall) return directCall[1];

  const constMatch = fileSrc.match(new RegExp(`const ${raw} = t\\('([^']+)'\\)`));
  if (constMatch) return constMatch[1];

  throw new Error(`Could not resolve label expression "${raw}" to a t() key`);
};

const resolveKey = (obj: unknown, key: string): unknown =>
  key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);

describe('grid action buttons: no title=, every label resolves (AC-4, AC-5)', () => {
  const filesAndSources = TARGET_FILES.map((file) => ({
    file,
    src: fs.readFileSync(file, 'utf8'),
  }));

  it('found the expected 43 grid-action-tooltips files', () => {
    expect(filesAndSources).toHaveLength(43);
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
      allKeys.add(extractLabelKey(block, src));
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
