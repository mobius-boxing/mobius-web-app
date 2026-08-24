import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import { FormulaReference } from '../../types';
import { modelsApi } from '../../services/api';
import { logger } from '../../utils/logger';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * "Campos y funciones" — read-only, filterable reference of the engine's 34
 * parameters, 20 functions and operators, fed by
 * GET /api/models/formula-reference. Parameter names/labels are API data
 * (the engine catalogue is the single source of truth) — never hardcoded.
 */
const FormulaReferenceModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [reference, setReference] = useState<FormulaReference | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFilter('');
    modelsApi
      .getFormulaReference()
      .then(setReference)
      .catch((error) => logger.error('Error loading formula reference:', error));
  }, [isOpen]);

  const needle = filter.trim().toLowerCase();
  const matches = (...parts: (string | number | undefined | null)[]) =>
    !needle || parts.some((p) => String(p ?? '').toLowerCase().includes(needle));

  const parameters = (reference?.parameters ?? []).filter((p) =>
    matches(p.name, p.label),
  );
  const functions = (reference?.functions ?? []).filter((f) =>
    matches(f.name, f.signature, f.description),
  );
  const operators = (reference?.operators ?? []).filter((o) =>
    matches(o.symbol, o.description),
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('models.reference.title')} size="lg">
      <div className="space-y-4">
        <input
          type="text"
          name="referenceFilter"
          data-testid="formula-reference-filter"
          className="input-field w-full"
          placeholder={t('models.reference.filterPlaceholder')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />

        <div data-testid="formula-reference-parameters">
          <h3 className="mb-2 text-sm font-semibold text-secondary-900">
            {t('models.reference.parameters')}
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-secondary-500">
                <th className="py-1 pr-2">{t('models.reference.name')}</th>
                <th className="py-1 pr-2">{t('models.reference.label')}</th>
                <th className="py-1">{t('models.reference.example')}</th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((p) => (
                <tr key={p.name} className="border-t border-secondary-100">
                  <td className="py-1 pr-2 font-mono">[{p.name}]</td>
                  <td className="py-1 pr-2 text-secondary-600">{p.label}</td>
                  <td className="py-1 text-secondary-600">{p.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div data-testid="formula-reference-functions">
          <h3 className="mb-2 text-sm font-semibold text-secondary-900">
            {t('models.reference.functions')}
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-secondary-500">
                <th className="py-1 pr-2">{t('models.reference.signature')}</th>
                <th className="py-1">{t('models.reference.label')}</th>
              </tr>
            </thead>
            <tbody>
              {functions.map((f) => (
                <tr key={f.name} className="border-t border-secondary-100">
                  <td className="py-1 pr-2 font-mono">{f.signature}</td>
                  <td className="py-1 text-secondary-600">{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div data-testid="formula-reference-operators">
          <h3 className="mb-2 text-sm font-semibold text-secondary-900">
            {t('models.reference.operators')}
          </h3>
          <table className="w-full text-sm">
            <tbody>
              {operators.map((o) => (
                <tr key={o.symbol} className="border-t border-secondary-100">
                  <td className="py-1 pr-2 font-mono">{o.symbol}</td>
                  <td className="py-1 text-secondary-600">{o.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default FormulaReferenceModal;
