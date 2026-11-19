import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { companiesApi, filesApi, supplierPurchaseOrdersApi } from '../services/api';
import { Company, SupplierPurchaseOrder } from '../types';
import { formatBusinessDate } from '../utils/dates';
import { logger } from '../utils/logger';

/** D-32: browser print, no PDF library; same print pattern as `CorrugatorPlanPrint`. */
const PRINT_STYLE = `
  @media print {
    .no-print { display: none !important; }
    @page { size: A4 portrait; margin: 14mm; }
  }
`;

const cell = (value: number | string | null | undefined): string => (value === null || value === undefined || value === '' ? '-' : String(value));

/**
 * Procusto's purchase-order layout: company letterhead, "ATENCIÓN SEÑORES
 * <proveedor>", the date, then Fecha · O/C · Corrugado · Cantidad · Largo ·
 * Ancho · Trazadores. Sent POs print their snapshot, drafts the live values.
 */
const SupplierPurchaseOrderPrint: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedCompany, effectiveCompanyId } = useCompany();
  const [order, setOrder] = useState<SupplierPurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const companyUuid = selectedCompany?.uuid ?? user?.companyId;

  // Branding is cosmetic: a failed read falls back to the plain company name.
  useEffect(() => {
    if (!companyUuid) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    companiesApi
      .getCompanyById(companyUuid)
      .then(async (loaded) => {
        if (cancelled) return;
        setCompany(loaded);
        const logoFileUuid = loaded.branding?.logoFileUuid;
        if (!logoFileUuid) return;
        objectUrl = await filesApi.getImageObjectUrl(logoFileUuid);
        if (cancelled) {
          if (objectUrl) window.URL.revokeObjectURL(objectUrl);
          return;
        }
        setLogoUrl(objectUrl);
      })
      .catch((err) => logger.error('Error loading company branding for print:', err));
    return () => {
      cancelled = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [companyUuid]);

  useEffect(() => {
    if (!uuid) return;
    setLoading(true);
    supplierPurchaseOrdersApi
      .getPurchaseOrder(uuid, effectiveCompanyId ? { companyId: effectiveCompanyId } : {})
      .then(setOrder)
      .catch((err) => {
        logger.error('Error loading supplier purchase order for print:', err);
        setError(err?.response?.data?.message || t('supplierPrograms.printLoadFailed'));
      })
      .finally(() => setLoading(false));
  }, [uuid, effectiveCompanyId, t]);

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton lines={10} data-testid="supplier-po-print-loading" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <ErrorMessage message={error ?? t('supplierPrograms.printNotFound')} />
      </div>
    );
  }

  const letterhead = company?.branding?.displayName || company?.name || selectedCompany?.name || user?.companyName || '';
  const printDate = formatBusinessDate((order.sentAt ?? order.createdAt).slice(0, 10));
  const lines = [...(order.lines ?? [])].sort((a, b) => a.position - b.position);

  return (
    <div className="mx-auto max-w-4xl p-6 text-secondary-900" data-testid="supplier-po-print">
      <style>{PRINT_STYLE}</style>

      <div className="no-print mb-4 flex justify-end">
        <Button onClick={() => window.print()} data-testid="print-now-btn">
          <Printer className="mr-2 h-4 w-4" />
          {t('supplierPrograms.printButton')}
        </Button>
      </div>

      <header className="mb-6 border-b-2 border-secondary-800 pb-3">
        <div className="flex items-center gap-4">
          {logoUrl && <img src={logoUrl} alt="" className="max-h-16 max-w-[160px] object-contain" data-testid="print-logo" />}
          <h1 className="text-2xl font-bold" data-testid="print-letterhead">
            {letterhead}
          </h1>
        </div>
        <p className="text-sm text-secondary-600">
          {t('supplierPrograms.printTitle', { number: order.number })}
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <p className="text-lg font-semibold" data-testid="print-attention">
          {t('supplierPrograms.attention', { supplier: order.supplier.code })}
        </p>
        <p className="text-sm" data-testid="print-date">
          {t('supplierPrograms.printDate')}: {printDate}
        </p>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-secondary-800 text-left">
            <th className="px-2 py-1">{t('supplierPrograms.lineColumns.date')}</th>
            <th className="px-2 py-1">{t('supplierPrograms.lineColumns.order')}</th>
            <th className="px-2 py-1">{t('supplierPrograms.lineColumns.board')}</th>
            <th className="px-2 py-1 text-right">{t('supplierPrograms.lineColumns.quantity')}</th>
            <th className="px-2 py-1 text-right">{t('supplierPrograms.lineColumns.length')}</th>
            <th className="px-2 py-1 text-right">{t('supplierPrograms.lineColumns.width')}</th>
            <th className="px-2 py-1">{t('supplierPrograms.lineColumns.scoreLines')}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.uuid} className="border-b border-secondary-200" data-testid="print-line">
              <td className="px-2 py-1">{formatBusinessDate(l.deliveryDate)}</td>
              <td className="px-2 py-1">{l.orderNumber}</td>
              <td className="px-2 py-1">{cell(l.boardCode)}</td>
              <td className="px-2 py-1 text-right">{l.quantity}</td>
              <td className="px-2 py-1 text-right">{cell(l.sheetLength)}</td>
              <td className="px-2 py-1 text-right">{cell(l.sheetWidth)}</td>
              <td className="px-2 py-1">{cell(l.scoreLines)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {order.notes && (
        <p className="mt-6 text-sm">
          <strong>{t('supplierPrograms.notes')}:</strong> {order.notes}
        </p>
      )}
    </div>
  );
};

export default SupplierPurchaseOrderPrint;
