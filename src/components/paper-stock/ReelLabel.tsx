import React, { useLayoutEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { useTranslation } from 'react-i18next';
import { PaperStock } from '../../types';

interface ReelLabelProps {
  reel: PaperStock;
}

const dateInBuenosAires = (value?: string) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
};

const roundedMeasure = (value: number | undefined, unit: string) =>
  value === undefined || value === null ? '' : `${Math.round(value)} ${unit}`;

const ReelLabel: React.FC<ReelLabelProps> = ({ reel }) => {
  const { t } = useTranslation();
  const barcodeRef = useRef<SVGSVGElement>(null);
  const barcode = reel.barcode ? reel.barcode.padStart(10, '0') : '0000000000';

  useLayoutEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, barcode, {
        format: 'CODE128',
        displayValue: true,
        font: 'Arial',
        // ~5:1 viewBox so the SVG fills Procusto's 108.7 x 21.7 mm slot (AutoModule) instead of being height-bound.
        fontSize: 12,
        textMargin: 1,
        margin: 0,
        width: 2,
        height: 22,
      });
    }
  }, [barcode]);

  const rows = [
    [t('paperStock.label.reel'), reel.code || ''],
    [t('paperStock.label.paper'), reel.paperSupply?.code || ''],
    [t('paperStock.label.color'), reel.paperSupply?.color || ''],
    [t('paperStock.label.supplier'), reel.supplier?.code || ''],
    [t('paperStock.label.manufacturer'), reel.manufacturer?.name || ''],
    [t('paperStock.label.createdAt'), dateInBuenosAires(reel.createdAt)],
  ];

  return (
    <section className="reel-label" data-testid={`reel-label-${reel.uuid}`}>
      <div className="reel-label__body">
        <table className="reel-label__table">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <td>{label}</td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="reel-label__measure reel-label__measure--diameter">
          <span>{t('paperStock.label.diameter')}</span><strong>{roundedMeasure(reel.diameter, 'mm')}</strong>
        </div>
        <div className="reel-label__measure reel-label__measure--width">
          <span>{t('paperStock.label.width')}</span><strong>{roundedMeasure(reel.width, 'mm')}</strong>
        </div>
        <div className="reel-label__measure reel-label__measure--weight">
          <span>{t('paperStock.label.weight')}</span><strong>{roundedMeasure(reel.weight, 'kg')}</strong>
        </div>
        <svg ref={barcodeRef} className="reel-label__barcode" data-testid={`reel-barcode-${reel.uuid}`} />
      </div>
    </section>
  );
};

export default ReelLabel;
