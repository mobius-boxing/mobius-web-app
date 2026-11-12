import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import ReelLabel from './ReelLabel';
import { PaperStock } from '../../types';

/* A zero page margin leaves the browser no room for its own header (date, page title) and footer
   (URL, page n/N), so the label's margins are applied inside .reel-label instead.
   .reel-label is shorter than a Letter sheet (279.4mm, the smallest one expected) and clips its
   content, so one label can never spill onto a second page. */
const printCss = `
@page { size: auto; margin: 0; }
@media print {
  html, body { margin: 0 !important; padding: 0 !important; height: auto !important; min-height: 0 !important; background: #fff !important; }
  body::before, body::after { display: none !important; }
  body > *:not(#reel-label-print-portal) { display: none !important; }
  #reel-label-print-portal { display: block !important; margin: 0; padding: 0; }
  .reel-label { position: relative; width: 100%; height: 260mm; overflow: hidden; break-inside: avoid; page-break-inside: avoid; font-family: Arial, Helvetica, sans-serif; color: #000; }
  .reel-label + .reel-label { break-before: page; page-break-before: always; }
  .reel-label__body { box-sizing: border-box; position: absolute; top: 10mm; left: 0; right: 0; margin: 0 auto; width: 186mm; height: 240mm; }
  .reel-label__body * { box-sizing: border-box; }
  .reel-label__top, .reel-label__bottom { display: grid; grid-template-columns: 42mm 1fr 42mm; column-gap: 3mm; height: 42mm; }
  .reel-label__top { margin-bottom: 3mm; }
  .reel-label__bottom { margin-top: 4mm; align-items: center; justify-items: center; }
  .reel-label__qr { display: block; width: 42mm; height: 42mm; }
  .reel-label__headline { height: 42mm; border: 0.4mm solid #000; display: flex; align-items: center; justify-content: center; font-weight: 700; line-height: 1; white-space: nowrap; overflow: hidden; }
  .reel-label__grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 40mm 28mm 28mm; border-left: 0.4mm solid #000; }
  .reel-label__cell { position: relative; display: flex; align-items: center; justify-content: center; padding: 5mm 2mm 1.5mm; border-right: 0.4mm solid #000; border-bottom: 0.4mm solid #000; overflow: hidden; text-align: center; }
  .reel-label__caption { position: absolute; top: 1mm; left: 1.5mm; font-size: 8pt; text-transform: uppercase; }
  .reel-label__value { font-size: 26pt; line-height: 1.1; overflow-wrap: anywhere; }
  .reel-label__value--upper { text-transform: uppercase; }
  .reel-label__details { margin-top: 4mm; height: 40mm; border: 0.4mm solid #000; padding: 2mm 3mm; display: grid; grid-template-columns: 42mm 1fr 22mm 1fr; align-content: space-evenly; column-gap: 2mm; font-size: 15pt; }
  .reel-label__details > * { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .reel-label__details-wide { grid-column: 2 / span 3; }
  .reel-label__logo { height: 9mm; }
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
  // flushSync commits the labels (QR codes included, they render synchronously) before print() snapshots the page.
  flushSync(() => root.render(<>{reels.map((reel) => <ReelLabel key={reel.uuid} reel={reel} />)}</>));

  const cleanup = () => {
    window.removeEventListener('afterprint', cleanup);
    root.unmount();
    portal.remove();
    style.remove();
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  // The logo is an <img>; print() before it loads would leave its box empty on the first print of a session.
  const loaded = (img: HTMLImageElement) =>
    img.complete
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        });
  Promise.all(Array.from(portal.querySelectorAll('img'), loaded)).then(() =>
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.print())),
  );
}, []);
