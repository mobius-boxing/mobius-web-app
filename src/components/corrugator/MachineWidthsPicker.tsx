import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import { Machine } from '../../types';

export type MachineWidthSelection = Record<string, number[]>;

interface MachineWidthsPickerProps {
  /** Candidate corrugator machines (`machineType.corrugated`, `width > 0`). */
  machines: Machine[];
  selected: MachineWidthSelection;
  onChange: (next: MachineWidthSelection) => void;
  disabled?: boolean;
}

/**
 * Card 2 "elegir corrugador(es) + ancho de formato/bobina" (D-23): one
 * checkbox per physical machine, a removable chip per reel width it will
 * offer this plan (pre-seeded with the machine's own width), and a free
 * input to add extra widths (e.g. 1800 + 1650). Shared by `CreatePlanModal`
 * and the plan editor's machines panel.
 */
const MachineWidthsPicker: React.FC<MachineWidthsPickerProps> = ({ machines, selected, onChange, disabled }) => {
  const { t } = useTranslation();
  const [widthDraft, setWidthDraft] = useState<Record<string, string>>({});

  const toggleMachine = (machine: Machine) => {
    const next = { ...selected };
    if (next[machine.uuid]) {
      delete next[machine.uuid];
    } else {
      next[machine.uuid] = [machine.width ?? 0];
    }
    onChange(next);
  };

  const removeWidth = (machineUuid: string, width: number) => {
    onChange({ ...selected, [machineUuid]: (selected[machineUuid] ?? []).filter((w) => w !== width) });
  };

  const addWidth = (machine: Machine) => {
    const raw = widthDraft[machine.uuid];
    const value = Number(raw);
    if (!raw || !Number.isFinite(value) || value <= 0 || value > (machine.width ?? 0)) return;
    const current = selected[machine.uuid] ?? [];
    if (!current.includes(value)) {
      onChange({ ...selected, [machine.uuid]: [...current, value].sort((a, b) => b - a) });
    }
    setWidthDraft((prev) => ({ ...prev, [machine.uuid]: '' }));
  };

  if (machines.length === 0) {
    return <p className="text-sm text-secondary-500">{t('corrugatorPool.noMachines')}</p>;
  }

  return (
    <div className="space-y-3">
      {machines.map((machine) => {
        const checked = !!selected[machine.uuid];
        const widths = selected[machine.uuid] ?? [];
        return (
          <div key={machine.uuid} className="rounded-lg border border-secondary-200 p-3" data-testid={`machine-widths-${machine.uuid}`}>
            <label className="flex items-center gap-2 text-sm font-medium text-secondary-900">
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggleMachine(machine)}
                data-testid={`machine-widths-checkbox-${machine.uuid}`}
              />
              {machine.code || machine.description || machine.uuid} — {machine.width} mm
            </label>
            {checked && (
              <div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
                {widths.map((w) => (
                  <span key={w} className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700">
                    {w} mm
                    {!disabled && (
                      <button type="button" onClick={() => removeWidth(machine.uuid, w)} aria-label={t('corrugatorPool.removeWidth', { width: w })}>
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
                {!disabled && (
                  <>
                    <input
                      type="number"
                      min={1}
                      max={machine.width ?? undefined}
                      value={widthDraft[machine.uuid] ?? ''}
                      onChange={(e) => setWidthDraft((prev) => ({ ...prev, [machine.uuid]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWidth(machine))}
                      placeholder={t('corrugatorPool.extraWidthPlaceholder')}
                      className="w-24 rounded border border-secondary-300 px-2 py-1 text-xs"
                      data-testid={`machine-widths-input-${machine.uuid}`}
                    />
                    <Button size="sm" variant="ghost" onClick={() => addWidth(machine)} data-testid={`machine-widths-add-${machine.uuid}`}>
                      {t('corrugatorPool.addWidth')}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MachineWidthsPicker;
