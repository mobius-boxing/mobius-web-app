import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import ReelLabel from './ReelLabel';
import { PaperStock } from '../../types';

const printCss = `
@page { margin: 13mm 25.4mm; }
@media print {
  body { margin: 0; background: #fff; }
  body > *:not(#reel-label-print-portal) { display: none !important; }
  #reel-label-print-portal { display: block !important; }
  .reel-label { position: relative; width: 156mm; height: 212.1mm; break-after: page; font-family: Arial, sans-serif; font-size: 18pt; }
  .reel-label__table { position: absolute; left: 10.8mm; top: 15.1mm; width: 145mm; height: 110.6mm; border-collapse: collapse; table-layout: fixed; }
  .reel-label__table tr { height: 18.43mm; }
  .reel-label__table tr:first-child { border-top: 2px solid #000; }
  .reel-label__table tr:last-child { border-bottom: 2px solid #000; }
  .reel-label__table td:first-child { width: 28%; font-weight: 400; }
  .reel-label__table td:last-child { width: 72%; font-weight: 700; }
  .reel-label__measure { position: absolute; left: 38.6mm; width: 93.4mm; display: flex; align-items: center; gap: 7mm; }
  .reel-label__measure span { width: 43.2mm; }
  .reel-label__measure strong { box-sizing: border-box; display: inline-flex; width: 43.2mm; height: 9.8mm; border: 1px solid #000; align-items: center; justify-content: center; text-align: center; }
  .reel-label__measure--diameter { top: 138.8mm; }
  .reel-label__measure--width { top: 154.8mm; }
  .reel-label__measure--weight { top: 170.3mm; }
  .reel-label__barcode { position: absolute; left: 30.2mm; top: 190.4mm; width: 108.7mm; height: 21.7mm; }
}
@media screen { #reel-label-print-portal { display: none; } }
`;

export const useReelLabelPrint = () => useCallback((reels: PaperStock[]) => {
  if (!reels.length) return;
  const portal = document.createElement('div');
  portal.id = 'reel-label-print-portal';
  const style = document.createElement('style');
  style.textContent = printCss;
  document.head.appendChild(style);
  document.body.appendChild(portal);
  const root = createRoot(portal);
  // flushSync commits the labels (and their layout effects that draw the barcodes) before print() snapshots the page.
  flushSync(() => root.render(<>{reels.map((reel) => <ReelLabel key={reel.uuid} reel={reel} />)}</>));

  const cleanup = () => {
    window.removeEventListener('afterprint', cleanup);
    root.unmount();
    portal.remove();
    style.remove();
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.print()));
}, []);
