import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../../types';
import { productsApi } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import Button from '../ui/Button';
import { logger } from '../../utils/logger';

interface ProductApprovalWidgetProps {
  product: Product;
  onChanged: (updated: Product) => void;
}

/**
 * Product technical-approval control (Procusto AprobacionControl analog).
 * Pending = both timestamps null; approve clears cancellation and vice versa.
 */
const ProductApprovalWidget: React.FC<ProductApprovalWidgetProps> = ({ product, onChanged }) => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const [busy, setBusy] = useState(false);

  const canApprove = has('products.approve.technical');
  const approved = !!product.productApprovalAt;
  const cancelled = !!product.productCancellationAt;

  const act = async (action: 'approve' | 'cancel') => {
    try {
      setBusy(true);
      // 04-state-and-lifecycle: the confirm dialog drives the parts cascade —
      // OK propagates to the parts' final machine, Cancel acts on the product only.
      const cascade = window.confirm(
        t(
          action === 'approve'
            ? 'products.approval.cascadeConfirmApprove'
            : 'products.approval.cascadeConfirmCancel'
        )
      );
      const updated = await productsApi.setApproval(product.uuid, action, cascade);
      onChanged(updated);
    } catch (err) {
      logger.error('Error setting product approval:', err);
    } finally {
      setBusy(false);
    }
  };

  const chip = approved ? (
    <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2.5 py-0.5 text-xs font-medium">
      {t('products.approval.approved', {
        user: product.productApprovalBy ?? '',
        date: product.productApprovalAt ? new Date(product.productApprovalAt).toLocaleString() : '',
      })}
    </span>
  ) : cancelled ? (
    <span className="inline-flex items-center rounded-full bg-red-100 text-red-800 px-2.5 py-0.5 text-xs font-medium">
      {t('products.approval.cancelled', {
        user: product.productCancellationBy ?? '',
        date: product.productCancellationAt ? new Date(product.productCancellationAt).toLocaleString() : '',
      })}
    </span>
  ) : (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-yellow-100 text-yellow-800 px-2.5 py-0.5 text-xs font-medium">
      {t('products.approval.pending')}
    </span>
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="whitespace-nowrap text-sm font-medium text-secondary-700">{t('products.approval.label')}</span>
        {chip}
      </div>
      {canApprove && (
        <div className="flex gap-2">
          {!approved && (
            <Button type="button" size="sm" onClick={() => act('approve')} disabled={busy}>
              {t('products.approval.approveButton')}
            </Button>
          )}
          {!cancelled && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700"
              onClick={() => act('cancel')}
              disabled={busy}
            >
              {t('products.approval.cancelButton')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductApprovalWidget;
