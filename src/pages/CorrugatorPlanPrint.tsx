import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { corrugatorPlansApi } from '../services/api';
import { logger } from '../utils/logger';
import { CorrugatorPlan, CorrugatorPlanCombination } from '../types';
import { machineUuidOf } from '../components/corrugator/machineKey';


/**
 * D-15: browser print, no server PDF. `@media print` hides everything but the
 * document itself and breaks the page once per physical machine (D-23:
 * `sequence` is per machine, so each machine's runs read top to bottom).
 */
const PRINT_STYLE = `
  @media print {
    .no-print { display: none !important; }
    @page { size: A4 landscape; margin: 12mm; }
    .print-machine + .print-machine { break-before: page; }
  }
`;

const CorrugatorPlanPrint: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const { t } = useTranslation();
  const [plan, setPlan] = useState<CorrugatorPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid) return;
    setLoading(true);
    corrugatorPlansApi
      .getPlan(uuid)
      .then(setPlan)
      .catch((err) => {
        logger.error('Error loading corrugator plan for print:', err);
        setError(err?.response?.data?.message || t('corrugatorPrint.loadFailed'));
      })
      .finally(() => setLoading(false));
  }, [uuid, t]);

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton lines={10} data-testid="corrugator-print-loading" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-6">
        <ErrorMessage message={error ?? t('corrugatorPrint.notFound')} />
      </div>
    );
  }

  const combosByMachine = new Map<string, CorrugatorPlanCombination[]>();
  for (const combo of plan.combinations ?? []) {
    const muid = machineUuidOf(combo.machineKey);
    if (!combosByMachine.has(muid)) combosByMachine.set(muid, []);
    combosByMachine.get(muid)!.push(combo);
  }
  Array.from(combosByMachine.values()).forEach((list) => list.sort((a, b) => a.sequence - b.sequence));

  const boardCode = plan.board.corrugations.map((c) => c.code).join(', ') || plan.board.key;

  return (
    <div className="mx-auto max-w-5xl p-6 text-secondary-900" data-testid="corrugator-plan-print">
      <style>{PRINT_STYLE}</style>

      <div className="no-print mb-4 flex justify-end">
        <Button onClick={() => window.print()} data-testid="print-now-btn">
          <Printer className="mr-2 h-4 w-4" />{t('corrugatorPrint.printButton')}
        </Button>
      </div>

      <header className="mb-6 border-b border-secondary-300 pb-3">
        <h1 className="text-xl font-bold">{t('corrugatorPrint.title')}</h1>
        <p className="text-sm text-secondary-600">
          #{plan.number} {plan.name ? `— ${plan.name}` : ''} · {boardCode}
          {plan.board.theoreticalGrammage ? ` · ${plan.board.theoreticalGrammage} g/m²` : ''}
        </p>
      </header>

      {combosByMachine.size === 0 ? (
        <p className="text-sm text-secondary-500">{t('corrugatorPrint.noCombinations')}</p>
      ) : (
        Array.from(combosByMachine.entries()).map(([machineUuid, combos]) => {
          const snapshot = plan.machines.find((m) => m.machineUuid === machineUuid);
          const machineMeters = combos.reduce((sum, c) => sum + c.meters, 0);
          return (
            <section key={machineUuid} className="print-machine mb-8" data-testid={`print-machine-${machineUuid}`}>
              <h2 className="mb-2 text-lg font-semibold">
                {snapshot?.code || snapshot?.description || machineUuid} — {t('corrugatorPrint.totalMeters')}: {machineMeters} m
              </h2>
              {combos.map((combo) => (
                <div key={combo.uuid} className="mb-4 break-inside-avoid border border-secondary-300" data-testid={`print-combination-${combo.uuid}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-secondary-50 px-3 py-1.5 text-sm">
                    <span className="font-medium">
                      {t('corrugatorPrint.sequence')} #{combo.sequence} — {combo.width} mm — {combo.meters} m — {boardCode}
                    </span>
                    <span className="text-secondary-600">
                      {t('corrugatorPrint.trim')}: {combo.trim} mm · {t('corrugatorPrint.refile')}: {combo.refile.toFixed(2)}%
                    </span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-secondary-200 text-left text-xs text-secondary-500">
                        <th className="px-3 py-1">{t('corrugatorPrint.columns.order')}</th>
                        <th className="px-3 py-1">{t('corrugatorPrint.columns.customer')}</th>
                        <th className="px-3 py-1">{t('corrugatorPrint.columns.product')}</th>
                        <th className="px-3 py-1">{t('corrugatorPrint.columns.runSize')}</th>
                        <th className="px-3 py-1">{t('corrugatorPrint.columns.count')}</th>
                        <th className="px-3 py-1">{t('corrugatorPrint.columns.plannedSheets')}</th>
                        <th className="px-3 py-1">{t('corrugatorPrint.columns.strokes')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {combo.items.map((item) => (
                        <tr key={item.uuid} className="border-b border-secondary-100">
                          <td className="px-3 py-1">{item.order.number}</td>
                          <td className="px-3 py-1">{item.order.customerName ?? '-'}</td>
                          <td className="px-3 py-1">{item.order.productCode ?? '-'}</td>
                          <td className="px-3 py-1">{item.runLength} × {item.runWidth} mm{item.rotated ? ` (${t('corrugatorPlan.rotated')})` : ''}</td>
                          <td className="px-3 py-1">{item.count}</td>
                          <td className="px-3 py-1">{item.plannedSheets}</td>
                          <td className="px-3 py-1">{item.strokes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </section>
          );
        })
      )}

      {plan.summary && (
        <footer className="mt-6 border-t border-secondary-300 pt-3 text-sm" data-testid="print-totals">
          <p>
            {t('corrugatorPrint.totalMeters')}: {plan.summary.totalMeters} m ·{' '}
            {t('corrugatorPrint.averageRefile')}: {plan.summary.averageRefile.toFixed(2)}% ·{' '}
            {t('corrugatorPrint.scrapKg')}: {plan.summary.scrapKg != null ? `${plan.summary.scrapKg.toFixed(1)} kg` : '-'}
          </p>
        </footer>
      )}
    </div>
  );
};

export default CorrugatorPlanPrint;
