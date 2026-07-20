import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { CorrugationLayerInput, FluteType, PaperClass } from '../../types';
import Button from '../ui/Button';

interface CorrugationLayersEditorProps {
  layers: CorrugationLayerInput[];
  onChange: (layers: CorrugationLayerInput[]) => void;
  paperClasses: PaperClass[];
  fluteTypes: FluteType[];
  disabled?: boolean;
}

/**
 * Capas editor — the layer stack of a Corrugation (module 05).
 * Positions are kept 1..N automatically; rows can be reordered with the
 * up/down buttons. Parity note: theoreticalGrammage is NOT derived from
 * the layers — it stays a manually-typed field on the parent form.
 */
const CorrugationLayersEditor: React.FC<CorrugationLayersEditorProps> = ({
  layers,
  onChange,
  paperClasses,
  fluteTypes,
  disabled,
}) => {
  const { t } = useTranslation();

  const renumber = (list: CorrugationLayerInput[]): CorrugationLayerInput[] =>
    list.map((layer, index) => ({ ...layer, position: index + 1 }));

  const updateLayer = (index: number, patch: Partial<CorrugationLayerInput>) => {
    const updated = [...layers];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= layers.length) return;
    const updated = [...layers];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(renumber(updated));
  };

  return (
    <div className="space-y-3 bg-secondary-50/30 rounded-lg p-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-sm font-semibold text-secondary-900">
          {t('corrugations.layers.title')}
        </h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() =>
            onChange(
              renumber([
                ...layers,
                { position: layers.length + 1, isLiner: false },
              ]),
            )
          }
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('corrugations.layers.addLayer')}
        </Button>
      </div>

      {layers.length === 0 ? (
        <p className="text-sm text-secondary-500">{t('corrugations.layers.empty')}</p>
      ) : (
        layers.map((layer, index) => (
          <div
            key={index}
            className="bg-white border border-secondary-200 rounded-lg p-3 flex flex-wrap items-center gap-3"
          >
            <span className="text-sm font-medium text-secondary-700 w-6 text-center">
              {layer.position}
            </span>

            <label className="flex items-center gap-1 text-sm text-secondary-700">
              <input
                type="checkbox"
                checked={layer.isLiner}
                disabled={disabled}
                onChange={(e) => updateLayer(index, { isLiner: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              {t('corrugations.layers.liner')}
            </label>

            <select
              value={layer.paperClassUuid || ''}
              disabled={disabled}
              onChange={(e) =>
                updateLayer(index, { paperClassUuid: e.target.value || undefined })
              }
              className="flex-1 min-w-[10rem] border border-secondary-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{t('corrugations.layers.selectPaperClass')}</option>
              {paperClasses.map((pc) => (
                <option key={pc.uuid} value={pc.uuid}>
                  {pc.code} — {pc.name}
                </option>
              ))}
            </select>

            <select
              value={layer.fluteTypeUuid || ''}
              disabled={disabled}
              onChange={(e) =>
                updateLayer(index, { fluteTypeUuid: e.target.value || undefined })
              }
              className="flex-1 min-w-[8rem] border border-secondary-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{t('corrugations.layers.selectFluteType')}</option>
              {fluteTypes.map((ft) => (
                <option key={ft.uuid} value={ft.uuid}>
                  {ft.code}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={disabled || index === 0}
                className="p-1 text-secondary-500 hover:text-secondary-800 disabled:opacity-30"
                title={t('corrugations.layers.moveUp')}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={disabled || index === layers.length - 1}
                className="p-1 text-secondary-500 hover:text-secondary-800 disabled:opacity-30"
                title={t('corrugations.layers.moveDown')}
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onChange(renumber(layers.filter((_, i) => i !== index)))}
                disabled={disabled}
                className="p-1 text-red-600 hover:text-red-800 disabled:opacity-30"
                title={t('corrugations.layers.removeLayer')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CorrugationLayersEditor;
