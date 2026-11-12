import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import mobiusLogo from '../../assets/mobius-logo-text.svg';
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

const toNumber = (value: unknown) => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const roundedMeasure = (value: unknown, unit: string) => {
  const n = toNumber(value);
  return n === undefined ? '' : `${Math.round(n)} ${unit}`;
};

const grammageText = (value: unknown) => {
  const n = toNumber(value);
  if (n === undefined) return '';
  return `${Number.isInteger(n) ? n : n.toFixed(1).replace('.', ',')} g/m²`;
};

// Procusto CalculosMetrosLineales: 1e6 * peso(kg) / (gramaje(g/m²) * ancho(mm)).
const linearMeters = (weight: unknown, grammage: unknown, width: unknown) => {
  const [w, g, a] = [toNumber(weight), toNumber(grammage), toNumber(width)];
  if (!w || !g || !a) return '';
  return String(Math.round((1000000 * w) / (g * a)));
};

// The headline sits between the two top QRs (about 96mm) and shrinks only for codes too long for it at 90pt.
const headlineSize = (text: string) => Math.min(90, Math.floor(255 / (Math.max(text.length, 1) * 0.56)));

// Level H survives roughly 30% damage; four copies cover a reel whose label is torn or dirty in one place.
const ReelQr: React.FC<{ url: string; corner: string }> = ({ url, corner }) => (
  <QRCodeSVG value={url} level="H" marginSize={2} className={`reel-label__qr reel-label__qr--${corner}`} />
);

const ReelLabel: React.FC<ReelLabelProps> = ({ reel }) => {
  const { t } = useTranslation();
  const reelNumber = (reel.code || '').replace(/^0+(?=\d)/, '');
  const supplierReelCode = reel.barcode && reel.barcode !== reel.code ? reel.barcode : '';

  // The origin the label is printed from, so a label printed on dev opens dev and one printed on prod opens prod.
  const editUrl = `${window.location.origin}/paper-stock/${reel.uuid}`;

  const cells = [
    [t('paperStock.label.manufacturer'), reel.manufacturer?.name || '', 'reel-label__value--upper'],
    [t('paperStock.label.paper'), reel.paperSupply?.code || '', ''],
    [t('paperStock.label.grammage'), grammageText(reel.paperSupply?.grammage), ''],
    [t('paperStock.label.width'), roundedMeasure(reel.width, 'mm'), ''],
    [t('paperStock.label.weight'), roundedMeasure(reel.weight, 'kg'), ''],
    [t('paperStock.label.linearMeters'), linearMeters(reel.weight, reel.paperSupply?.grammage, reel.width), ''],
  ];

  const details = [
    [t('paperStock.label.receivedAt'), dateInBuenosAires(reel.createdAt), ''],
    [t('paperStock.label.supplierCode'), supplierReelCode, ''],
    [t('paperStock.label.supplier'), reel.supplier?.code || '', 'reel-label__value--upper'],
  ];

  return (
    <section className="reel-label" data-testid={`reel-label-${reel.uuid}`}>
      <div className="reel-label__body">
        <div className="reel-label__top">
          <ReelQr url={editUrl} corner="top-left" />
          <div className="reel-label__headline" style={{ fontSize: `${headlineSize(reelNumber)}pt` }}>
            {reelNumber}
          </div>
          <ReelQr url={editUrl} corner="top-right" />
        </div>
        <div className="reel-label__grid">
          {cells.map(([caption, value, modifier]) => (
            <div className="reel-label__cell" key={caption}>
              <span className="reel-label__caption">{caption}</span>
              <strong className={`reel-label__value ${modifier}`}>{value}</strong>
            </div>
          ))}
        </div>
        <div className="reel-label__details">
          <span>{t('paperStock.label.diameter')}</span>
          <strong>{roundedMeasure(reel.diameter, 'mm')}</strong>
          <span>{t('paperStock.label.deliveryNote')}</span>
          <strong>{reel.deliveryNote || ''}</strong>
          {details.map(([caption, value, modifier]) => (
            <React.Fragment key={caption}>
              <span>{caption}</span>
              <strong className={`reel-label__details-wide ${modifier}`}>{value}</strong>
            </React.Fragment>
          ))}
        </div>
        <div className="reel-label__bottom">
          <ReelQr url={editUrl} corner="bottom-left" />
          <img className="reel-label__logo" src={mobiusLogo} alt="Mobius" />
          <ReelQr url={editUrl} corner="bottom-right" />
        </div>
      </div>
    </section>
  );
};

export default ReelLabel;
