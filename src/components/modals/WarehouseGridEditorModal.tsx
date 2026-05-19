import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Warehouse, WarehouseLocation, BatchUpdateLocation } from '../../types';
import { warehousesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ConfirmModal from '../ui/ConfirmModal';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { Package, Truck, AlertCircle, Archive, Box } from 'lucide-react';

interface WarehouseGridEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  warehouse: Warehouse | null;
}

type LocationTypeOption = 'storage' | 'receiving' | 'shipping' | 'quarantine' | 'wip';

const LOCATION_TYPE_ICONS = {
  storage: Package,
  receiving: Truck,
  shipping: Truck,
  quarantine: AlertCircle,
  wip: Archive,
};

const LOCATION_TYPE_COLORS = {
  storage: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
  receiving: 'bg-green-500 hover:bg-green-600 border-green-600',
  shipping: 'bg-purple-500 hover:bg-purple-600 border-purple-600',
  quarantine: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
  wip: 'bg-orange-500 hover:bg-orange-600 border-orange-600',
};

const WarehouseGridEditorModal: React.FC<WarehouseGridEditorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  warehouse,
}) => {
  const { t } = useTranslation();
  const confirmModal = useConfirmModal();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [changes, setChanges] = useState<Map<string, BatchUpdateLocation>>(new Map());
  const [selectedType, setSelectedType] = useState<LocationTypeOption>('storage');
  const [newGridRows, setNewGridRows] = useState<number>(10);
  const [newGridCols, setNewGridCols] = useState<number>(10);
  const [gridRows, setGridRows] = useState<number>(10); // Confirmed dimensions for rendering
  const [gridCols, setGridCols] = useState<number>(10);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<'activate' | 'deactivate' | null>(null);

  useEffect(() => {
    if (isOpen && warehouse) {
      fetchLocations();
      const rows = warehouse.gridRows || 10;
      const cols = warehouse.gridCols || 10;
      setNewGridRows(rows);
      setNewGridCols(cols);
      setGridRows(rows);
      setGridCols(cols);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, warehouse]);

  useEffect(() => {
    // Add global mouseup listener to stop dragging even if mouse leaves the grid
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragAction(null);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  const fetchLocations = async () => {
    if (!warehouse) return;

    try {
      setLoading(true);
      setError('');
      const data = await warehousesApi.getWarehouseLocations(warehouse.uuid);
      setLocations(data);
      setChanges(new Map());
    } catch (err: any) {
      console.error('Error fetching warehouse locations:', err);
      setError(err.response?.data?.message || 'Failed to load warehouse locations');
    } finally {
      setLoading(false);
    }
  };

  const getLocationKey = (row: number, col: number): string => {
    return `${row}-${col}`;
  };

  const getLocationByPosition = (row: number, col: number): WarehouseLocation | undefined => {
    return locations.find(loc => loc.row === row && loc.col === col);
  };

  const handleCellClick = (row: number, col: number) => {
    const key = getLocationKey(row, col);
    const location = getLocationByPosition(row, col);

    if (!location) return;

    const currentStatus = changes.get(key)?.status || location.status;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    const change: BatchUpdateLocation = {
      row,
      col,
      status: newStatus,
      locationType: newStatus === 'active' ? selectedType : location.locationType,
    };

    const newChanges = new Map(changes);
    newChanges.set(key, change);
    setChanges(newChanges);
  };

  const paintCell = (row: number, col: number, action: 'activate' | 'deactivate') => {
    const location = getLocationByPosition(row, col);
    if (!location) return;

    const key = getLocationKey(row, col);
    const newStatus = action === 'activate' ? 'active' : 'inactive';

    const change: BatchUpdateLocation = {
      row,
      col,
      status: newStatus,
      locationType: newStatus === 'active' ? selectedType : location.locationType,
    };

    const newChanges = new Map(changes);
    newChanges.set(key, change);
    setChanges(newChanges);
  };

  const handleMouseDown = (row: number, col: number) => {
    const location = getLocationByPosition(row, col);
    if (!location) return;

    const key = getLocationKey(row, col);
    const currentStatus = changes.get(key)?.status || location.status;

    // Determine the paint action based on current status
    const action = currentStatus === 'active' ? 'deactivate' : 'activate';

    setIsDragging(true);
    setDragAction(action);

    // Apply the action to the first cell
    paintCell(row, col, action);
  };

  const handleMouseEnter = (row: number, col: number) => {
    // Only paint if we're currently dragging
    if (!isDragging || !dragAction) return;

    paintCell(row, col, dragAction);
  };

  const handleMouseUp = () => {
    // Stop dragging
    setIsDragging(false);
    setDragAction(null);
  };

  const getCellStatus = (row: number, col: number): 'active' | 'inactive' => {
    const key = getLocationKey(row, col);
    const change = changes.get(key);
    if (change) return change.status as 'active' | 'inactive';

    const location = getLocationByPosition(row, col);
    return location?.status || 'inactive';
  };

  const getCellType = (row: number, col: number): LocationTypeOption => {
    const key = getLocationKey(row, col);
    const change = changes.get(key);
    if (change?.locationType) return change.locationType as LocationTypeOption;

    const location = getLocationByPosition(row, col);
    return (location?.locationType as LocationTypeOption) || 'storage';
  };

  const getCellLocationCode = (row: number, col: number): string => {
    const location = getLocationByPosition(row, col);
    return location?.locationCode || '';
  };

  const handleGridResize = async () => {
    if (!warehouse) return;

    // Validate dimensions
    if (newGridRows < 1 || newGridRows > 50 || newGridCols < 1 || newGridCols > 50) {
      setError(t('warehouses.grid.validation.dimensionsRange'));
      return;
    }

    // Check if dimensions actually changed
    if (newGridRows === warehouse.gridRows && newGridCols === warehouse.gridCols) {
      setError(t('warehouses.grid.validation.dimensionsUnchanged'));
      return;
    }

    // No confirmation needed - warning is already displayed in the UI

    try {
      setResizing(true);
      setError('');

      await warehousesApi.updateWarehouse(warehouse.uuid, {
        gridRows: newGridRows,
        gridCols: newGridCols,
      });

      // Update confirmed dimensions and refresh locations
      setGridRows(newGridRows);
      setGridCols(newGridCols);
      await fetchLocations();
    } catch (err: any) {
      console.error('Error resizing warehouse grid:', err);
      setError(err.response?.data?.message || t('warehouses.grid.errors.resizeFailed'));
    } finally {
      setResizing(false);
    }
  };

  const handleSave = async () => {
    if (!warehouse || changes.size === 0) return;

    try {
      setSaving(true);
      setError('');

      const updates = Array.from(changes.values());
      await warehousesApi.batchUpdateLocations(warehouse.uuid, updates);

      setChanges(new Map());
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving warehouse locations:', err);
      setError(err.response?.data?.message || t('warehouses.grid.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (changes.size > 0) {
      confirmModal.showConfirm({
        title: t('confirmModal.warningTitle'),
        message: t('warehouses.grid.unsavedChanges'),
        variant: 'warning',
        onConfirm: async () => {
          setChanges(new Map());
          setError('');
          onClose();
        },
      });
      return;
    }
    setChanges(new Map());
    setError('');
    onClose();
  };

  const renderGrid = () => {
    if (!warehouse) return null;

    const rows = gridRows;
    const cols = gridCols;
    const gridArray = [];

    for (let row = 0; row < rows; row++) {
      const rowCells = [];
      for (let col = 0; col < cols; col++) {
        const status = getCellStatus(row, col);
        const locationType = getCellType(row, col);
        const locationCode = getCellLocationCode(row, col);
        const key = getLocationKey(row, col);
        const hasChange = changes.has(key);

        const cellClasses = [
          'relative border transition-all flex flex-col items-center justify-center',
          'aspect-square',
          'hover:scale-110 hover:z-10 hover:shadow-md',
          status === 'active'
            ? LOCATION_TYPE_COLORS[locationType]
            : 'bg-gray-100 hover:bg-gray-200 border-gray-300',
          hasChange ? 'ring-2 ring-yellow-400' : '',
          'text-xs',
          isDragging ? 'cursor-grabbing' : 'cursor-pointer',
        ].join(' ');

        const Icon = status === 'active' ? LOCATION_TYPE_ICONS[locationType] : Box;

        rowCells.push(
          <div
            key={`${row}-${col}`}
            className={cellClasses}
            onMouseDown={(e) => {
              e.preventDefault();
              handleMouseDown(row, col);
            }}
            onMouseEnter={() => handleMouseEnter(row, col)}
            onMouseUp={handleMouseUp}
            onClick={() => handleCellClick(row, col)}
            title={`${locationCode} - ${status === 'active' ? locationType : 'inactive'}`}
            style={{ userSelect: 'none' }}
          >
            <Icon className={`w-3 h-3 ${status === 'active' ? 'text-white' : 'text-gray-400'}`} />
          </div>
        );
      }
      gridArray.push(
        <div key={row} className="grid gap-0" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {rowCells}
        </div>
      );
    }

    return <div className="grid gap-0">{gridArray}</div>;
  };

  if (!warehouse) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('warehouses.grid.title', { name: warehouse.name })}
      size="2xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Location Type Selector */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('warehouses.grid.selectType')}
          </label>
          <div className="flex flex-wrap gap-2">
            {(['storage', 'receiving', 'shipping', 'quarantine', 'wip'] as LocationTypeOption[]).map(type => {
              const Icon = LOCATION_TYPE_ICONS[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`
                    px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2
                    ${selectedType === type
                      ? LOCATION_TYPE_COLORS[type] + ' text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium capitalize">{type}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t('warehouses.grid.instructions')}
          </p>
        </div>

        {/* Grid */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="inline-block min-w-full">
              {renderGrid()}
            </div>
          )}
        </div>

        {/* Grid Resize Controls */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {t('warehouses.grid.resizeTitle')}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                {t('warehouses.gridRows')} *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={newGridRows}
                onChange={(e) => setNewGridRows(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={resizing || saving || loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                {t('warehouses.gridCols')} *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={newGridCols}
                onChange={(e) => setNewGridCols(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={resizing || saving || loading}
              />
            </div>
          </div>
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-yellow-700 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-700">
              {t('warehouses.grid.resizeWarning')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleGridResize}
            disabled={resizing || saving || loading}
            className={`
              w-full px-4 py-2 rounded-lg font-medium transition-colors
              ${resizing || saving || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }
            `}
          >
            {resizing ? t('warehouses.grid.resizing') : t('warehouses.grid.applyResize')}
          </button>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{t('warehouses.grid.legend')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(['storage', 'receiving', 'shipping', 'quarantine', 'wip'] as LocationTypeOption[]).map(type => {
              const Icon = LOCATION_TYPE_ICONS[type];
              return (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${LOCATION_TYPE_COLORS[type]}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm capitalize">{type}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
                <Box className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-sm">{t('warehouses.grid.inactive')}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {changes.size > 0 && (
              <span className="text-yellow-600 font-medium">
                {t('warehouses.grid.unsavedCount', { count: changes.size })}
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || changes.size === 0}
            >
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.handleClose}
        onConfirm={confirmModal.handleConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        loading={confirmModal.loading}
      />
    </Modal>
  );
};

export default WarehouseGridEditorModal;
