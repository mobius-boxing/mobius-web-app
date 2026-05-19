import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Warehouse, WarehouseLocation } from '../../types';
import { warehousesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Package, Truck, AlertCircle, Archive, MapPin } from 'lucide-react';
import { logger } from '../../utils/logger';

interface WarehouseLocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: WarehouseLocation) => void;
  warehouse: Warehouse | null;
  currentLocationUuid?: string;
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

const WarehouseLocationSelectorModal: React.FC<WarehouseLocationSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  warehouse,
  currentLocationUuid,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<WarehouseLocation | null>(null);

  useEffect(() => {
    if (isOpen && warehouse) {
      fetchLocations();
      setSelectedLocation(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, warehouse]);

  const fetchLocations = async () => {
    if (!warehouse) return;

    try {
      setLoading(true);
      setError('');
      const data = await warehousesApi.getWarehouseLocations(warehouse.uuid);
      setLocations(data);

      if (currentLocationUuid) {
        const current = data.find(loc => loc.uuid === currentLocationUuid);
        if (current) {
          setSelectedLocation(current);
        }
      }
    } catch (err: any) {
      logger.error('Error fetching warehouse locations:', err);
      setError(err.response?.data?.message || t('warehouses.locationSelector.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const getLocationByPosition = (row: number, col: number): WarehouseLocation | undefined => {
    return locations.find(loc => loc.row === row && loc.col === col);
  };

  const handleCellClick = (row: number, col: number) => {
    const location = getLocationByPosition(row, col);
    if (!location || location.status !== 'active') return;

    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelect(selectedLocation);
      onClose();
    }
  };

  const renderGrid = () => {
    if (!warehouse) return null;

    const rows = warehouse.gridRows || 10;
    const cols = warehouse.gridCols || 10;
    const gridArray = [];

    for (let row = 0; row < rows; row++) {
      const rowCells = [];
      for (let col = 0; col < cols; col++) {
        const location = getLocationByPosition(row, col);
        const isActive = location?.status === 'active';
        const locationType = (location?.locationType as LocationTypeOption) || 'storage';
        const isSelected = selectedLocation?.uuid === location?.uuid;
        const isCurrent = currentLocationUuid === location?.uuid;

        const cellClasses = [
          'relative border transition-all flex flex-col items-center justify-center',
          'aspect-square',
          isActive ? 'cursor-pointer hover:scale-110 hover:z-10 hover:shadow-md' : 'cursor-not-allowed opacity-50',
          isActive
            ? LOCATION_TYPE_COLORS[locationType]
            : 'bg-gray-100 border-gray-300',
          isSelected ? 'ring-4 ring-primary-500 ring-offset-2' : '',
          isCurrent && !isSelected ? 'ring-2 ring-yellow-400' : '',
          'text-xs',
        ].join(' ');

        const Icon = isActive ? LOCATION_TYPE_ICONS[locationType] : Package;

        rowCells.push(
          <div
            key={`${row}-${col}`}
            className={cellClasses}
            onClick={() => handleCellClick(row, col)}
            title={location ? `${location.locationCode} - ${isActive ? locationType : 'inactive'}` : ''}
          >
            <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-gray-400'}`} />
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                <MapPin className="w-2.5 h-2.5 text-white" />
              </div>
            )}
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
      onClose={onClose}
      title={t('warehouses.locationSelector.title', { name: warehouse.name })}
      size="xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <p className="text-sm text-gray-600">
          {t('warehouses.locationSelector.instructions')}
        </p>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="inline-block min-w-full overflow-auto max-h-96">
              {renderGrid()}
            </div>
          )}
        </div>

        {selectedLocation && (
          <div className="bg-primary-50 border border-primary-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              <span className="font-medium text-primary-800">
                {t('warehouses.locationSelector.selected')}: {selectedLocation.locationCode}
              </span>
              <span className="text-sm text-primary-600 capitalize">
                ({selectedLocation.locationType})
              </span>
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <h3 className="text-xs font-medium text-gray-700 mb-2">{t('warehouses.grid.legend')}</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
            {(['storage', 'receiving', 'shipping', 'quarantine', 'wip'] as LocationTypeOption[]).map(type => {
              const Icon = LOCATION_TYPE_ICONS[type];
              return (
                <div key={type} className="flex items-center gap-1">
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${LOCATION_TYPE_COLORS[type]}`}>
                    <Icon className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="capitalize">{type}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded border border-gray-300 bg-gray-100"></div>
              <span>{t('warehouses.grid.inactive')}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedLocation}
          >
            {t('warehouses.locationSelector.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WarehouseLocationSelectorModal;
