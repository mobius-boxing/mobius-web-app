import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import { FormulaTestResult } from '../../types';
import { modelsApi } from '../../services/api';
import { logger } from '../../utils/logger';

interface FormulaFieldProps {
  label?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * One formula input + "Probar" button: POSTs the text to
 * /api/models/test-formula and renders the engine error or the example
 * value. The text is passed through verbatim (formulas are parity data —
 * never trimmed or normalised here).
 */
const FormulaField: React.FC<FormulaFieldProps> = ({ label, name, value, onChange }) => {
  const { t } = useTranslation();
  const [result, setResult] = useState<FormulaTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    try {
      setTesting(true);
      setResult(await modelsApi.testFormula(value ?? ''));
    } catch (error) {
      logger.error('Error testing formula:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-secondary-700">{label}</label>
      )}
      <div className="flex items-start gap-2">
        <textarea
          name={name}
          data-testid={`formula-${name}`}
          rows={1}
          className="input-field w-full font-mono text-sm"
          value={value ?? ''}
          onChange={(e) => {
            setResult(null);
            onChange(e.target.value);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={runTest}
          disabled={testing}
          data-testid={`formula-test-${name}`}
        >
          {t('models.form.test')}
        </Button>
      </div>
      {result && !result.ok && (
        <p className="mt-1 text-sm text-red-600" data-testid={`formula-error-${name}`}>
          {result.error}
        </p>
      )}
      {result?.ok && (
        <p className="mt-1 text-sm text-green-700" data-testid={`formula-result-${name}`}>
          {t('models.form.exampleValue', { value: result.exampleValueText })}
        </p>
      )}
    </div>
  );
};

export default FormulaField;
