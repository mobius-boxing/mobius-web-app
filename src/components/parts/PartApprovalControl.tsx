import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import Button from '../ui/Button';
import { Part, PartApprovalMachine } from '../../types';
import { partsApi } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import { logger } from '../../utils/logger';

interface Props {
  part: Part;
  machine: Exclude<PartApprovalMachine, 'sketch'>;
  onChanged: (updated: Part) => void;
}

const FIELDS: Record<string, { at: string; by: string; cAt: string; cBy: string }> = {
  dimensions: { at: 'dimensionsApprovalAt', by: 'dimensionsApprovalBy', cAt: 'dimensionsCancelledAt', cBy: 'dimensionsCancelledBy' },
  technical: { at: 'technicalApprovalAt', by: 'technicalApprovalBy', cAt: 'technicalCancelledAt', cBy: 'technicalCancelledBy' },
  part: { at: 'partApprovalAt', by: 'partApprovalBy', cAt: 'partCancelledAt', cBy: 'partCancelledBy' },
};

/**
 * One approval state machine (08-approvals.md): Pending / Approved / Cancelled
 * chip + Approve/Cancel buttons, permission-gated per machine.
 * Q-V3 = Mirror: approving never locks the form.
 */
const PartApprovalControl: React.FC<Props> = ({ part, machine, onChanged }) => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const [busy, setBusy] = useState(false);
  const f = FIELDS[machine];
  const approvedAt = part[f.at] as string | null | undefined;
  const cancelledAt = part[f.cAt] as string | null | undefined;
  const canAct = has(`parts.approve.${machine}`);

  const act = async (action: 'approve' | 'cancel') => {
    try {
      setBusy(true);
      const updated = await partsApi.setApproval(part.uuid, machine, action);
      onChanged(updated);
    } catch (err) {
      logger.error('Approval action failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const fmt = (d: string) => new Date(d).toLocaleString();

  return (
    <div className="flex items-center justify-between rounded-lg border border-secondary-200 p-3">
      <div>
        <div className="text-sm font-medium text-secondary-900">
          {t(`parts.approvals.${machine}`)}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs">
          {approvedAt ? (
            <span className="inline-flex items-center gap-1 text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {part[f.by]} – {fmt(approvedAt)}
            </span>
          ) : cancelledAt ? (
            <span className="inline-flex items-center gap-1 text-red-700">
              <XCircle className="h-3.5 w-3.5" />
              [{t('parts.approvals.cancelled')}] {part[f.cBy]} – {fmt(cancelledAt)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-secondary-500">
              <Clock className="h-3.5 w-3.5" />
              {t('parts.approvals.pending')}
            </span>
          )}
        </div>
      </div>
      {canAct && (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={busy || !!approvedAt} onClick={() => act('approve')}>
            {t('parts.approvals.approve')}
          </Button>
          <Button size="sm" variant="ghost" className="text-red-600" disabled={busy || (!approvedAt && !!cancelledAt)} onClick={() => act('cancel')}>
            {t('parts.approvals.cancel')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PartApprovalControl;
